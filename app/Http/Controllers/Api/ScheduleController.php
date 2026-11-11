<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\TeachingLoad;
use App\Services\ConflictDetectionService;
use App\Services\GmailNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(
        protected ConflictDetectionService $conflictService,
        protected GmailNotificationService $notificationService
    ) {}

    /**
     * Display a listing of schedules.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::with(['teacher', 'subject', 'schoolClass', 'teachingLoad']);

        if ($teacherId = $request->query('teacher_id')) {
            $query->where('teacher_id', $teacherId);
        }

        if ($classId = $request->query('school_class_id')) {
            $query->where('school_class_id', $classId);
        }

        if ($day = $request->query('day_of_week')) {
            $query->where('day_of_week', $day);
        }

        if ($room = $request->query('room')) {
            $query->where('room', $room);
        }

        $schedules = $query->orderByRaw("CASE day_of_week 
                WHEN 'Monday' THEN 1 
                WHEN 'Tuesday' THEN 2 
                WHEN 'Wednesday' THEN 3 
                WHEN 'Thursday' THEN 4 
                WHEN 'Friday' THEN 5 
                ELSE 6 END")
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Pre-check for conflicts without saving.
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teacher_id' => ['required', 'exists:teachers,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'day_of_week' => ['required', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'room' => ['nullable', 'string'],
            'exclude_schedule_id' => ['nullable', 'integer'],
        ]);

        $result = $this->conflictService->checkConflict(
            (int) $validated['teacher_id'],
            (int) $validated['school_class_id'],
            $validated['day_of_week'],
            $validated['start_time'],
            $validated['end_time'],
            $validated['room'] ?? null,
            $validated['exclude_schedule_id'] ?? null
        );

        $hasConflict = (bool) ($result['has_conflict'] ?? false);
        return response()->json([
            'success' => true,
            'status' => $hasConflict ? 'conflict' : 'success',
            'has_conflict' => $hasConflict,
            'character' => $hasConflict ? [
                'expression' => 'worried',
                'motion' => 'panic',
            ] : [
                'expression' => 'happy',
                'motion' => 'celebrate',
            ],
            'conflicts' => $result['conflicts'] ?? [],
            'data' => $result,
        ]);
    }

    /**
     * Store a newly created schedule with conflict checking and Gmail notification.
     * Fully dynamic: Supports either explicit teaching_load_id OR direct (school_class_id, subject_id, teacher_id).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teaching_load_id' => ['nullable', 'exists:teaching_loads,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'school_class_id' => ['nullable', 'exists:school_classes,id'],
            'day_of_week' => ['required', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
            'start_time' => ['required'],
            'end_time' => ['required'],
            'room' => ['required', 'string', 'max:50'],
            'session_type' => ['nullable', 'string', 'in:lecture,laboratory,practical,remedial'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        // Normalize time format to HH:MM
        $startTime = substr(trim($validated['start_time']), 0, 5);
        $endTime = substr(trim($validated['end_time']), 0, 5);

        if ($endTime <= $startTime) {
            return response()->json([
                'success' => false,
                'message' => 'The end time must be later than the start time.',
            ], 422);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $startTime, $endTime) {
            $teacherId = $validated['teacher_id'] ?? null;
            $subjectId = $validated['subject_id'] ?? null;
            $schoolClassId = $validated['school_class_id'] ?? null;

            if (!empty($validated['teaching_load_id'])) {
                $load = TeachingLoad::findOrFail($validated['teaching_load_id']);
                $teacherId = $teacherId ?: $load->teacher_id;
                $subjectId = $subjectId ?: $load->subject_id;
                $schoolClassId = $schoolClassId ?: $load->school_class_id;
            } else {
                if (!$teacherId || !$subjectId || !$schoolClassId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Teacher, subject, and class section are required to create a schedule entry.',
                    ], 422);
                }
            }

            // Enforce Grade-Level & Department RBAC Isolation
            $classModel = \App\Models\SchoolClass::find($schoolClassId);
            $subjectModel = \App\Models\Subject::find($subjectId);
            $teacherModel = \App\Models\Teacher::find($teacherId);

            if ($classModel && $subjectModel && (int) $subjectModel->grade_level !== (int) $classModel->grade_level) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'message' => "RBAC Grade Isolation Error: {$subjectModel->name} (Grade {$subjectModel->grade_level}) cannot be assigned to {$classModel->name} (Grade {$classModel->grade_level}).",
                ], 422);
            }

            if ($classModel && $teacherModel && !$teacherModel->isAuthorizedForGrade((int) $classModel->grade_level)) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'message' => "Grade-Level Constraint Error: {$teacherModel->name} is assigned to Grade {$teacherModel->assigned_grade_level} for this academic year and cannot teach Grade {$classModel->grade_level} classes. Reassign their grade level in Faculty Management first.",
                ], 422);
            }

            if ($subjectModel && $teacherModel && !$teacherModel->isAuthorizedForSubject((int) $subjectModel->id)) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'message' => "RBAC Subject Authorization Error: {$teacherModel->name} is not authorized to handle {$subjectModel->name}. Add this subject to their Qualified Subjects in Faculty RBAC first.",
                ], 422);
            }

            if (empty($validated['teaching_load_id'])) {
                // Automatically link or create the TeachingLoad record
                $load = TeachingLoad::firstOrCreate(
                    [
                        'teacher_id' => $teacherId,
                        'subject_id' => $subjectId,
                        'school_class_id' => $schoolClassId,
                    ],
                    [
                        'academic_year' => '2026-2027',
                        'semester_or_quarter' => '1st Quarter',
                        'teaching_hours' => 4,
                    ]
                );
            }

            // 1. Check for Conflicts (Teacher, Section, Room, and Breaks)
            $conflictCheck = $this->conflictService->checkConflict(
                (int) $teacherId,
                (int) $schoolClassId,
                $validated['day_of_week'],
                $startTime,
                $endTime,
                $validated['room']
            );

            if ($conflictCheck['has_conflict']) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'character' => [
                        'expression' => 'worried',
                        'motion' => 'panic',
                    ],
                    'message' => $conflictCheck['conflicts'][0]['message'] ?? 'Schedule conflict detected.',
                    'conflicts' => $conflictCheck['conflicts'],
                ], 422);
            }

            // 2. Save Schedule Entry
            $schedule = Schedule::create([
                'teaching_load_id' => $load->id,
                'teacher_id' => $teacherId,
                'subject_id' => $subjectId,
                'school_class_id' => $schoolClassId,
                'day_of_week' => $validated['day_of_week'],
                'start_time' => $startTime,
                'end_time' => $endTime,
                'room' => $validated['room'],
                'session_type' => $validated['session_type'] ?? 'lecture',
                'notes' => $validated['notes'] ?? null,
            ]);

            // 3. Dispatch Gmail notifications
            $notifications = [];
            try {
                $notifications = $this->notificationService->notifyScheduleChange($schedule, 'assigned');
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Schedule notification dispatch failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'status' => 'email',
                'character' => [
                    'expression' => 'happy',
                    'motion' => 'mail_reaction',
                ],
                'message' => 'Schedule created successfully.',
                'notifications_count' => count($notifications),
                'data' => $schedule->load(['teacher', 'subject', 'schoolClass']),
            ], 201);
        });
    }

    /**
     * Display the specified schedule.
     */
    public function show(Schedule $schedule): JsonResponse
    {
        $schedule->load(['teacher', 'subject', 'schoolClass', 'teachingLoad', 'notifications']);

        return response()->json([
            'success' => true,
            'data' => $schedule,
        ]);
    }

    /**
     * Update the specified schedule with conflict checking and Gmail notification.
     * Fully dynamic: Supports changing time, day, room, teacher, subject, and section.
     */
    public function update(Request $request, Schedule $schedule): JsonResponse
    {
        $validated = $request->validate([
            'day_of_week' => ['sometimes', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
            'start_time' => ['sometimes'],
            'end_time' => ['sometimes'],
            'room' => ['sometimes', 'string', 'max:50'],
            'teacher_id' => ['sometimes', 'nullable', 'exists:teachers,id'],
            'subject_id' => ['sometimes', 'nullable', 'exists:subjects,id'],
            'school_class_id' => ['sometimes', 'nullable', 'exists:school_classes,id'],
            'session_type' => ['nullable', 'string', 'in:lecture,laboratory,practical,remedial'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $dayOfWeek = $validated['day_of_week'] ?? $schedule->day_of_week;
        $startTime = isset($validated['start_time']) ? substr(trim($validated['start_time']), 0, 5) : substr($schedule->start_time, 0, 5);
        $endTime = isset($validated['end_time']) ? substr(trim($validated['end_time']), 0, 5) : substr($schedule->end_time, 0, 5);
        $room = $validated['room'] ?? $schedule->room;
        $teacherId = $validated['teacher_id'] ?? $schedule->teacher_id;
        $subjectId = $validated['subject_id'] ?? $schedule->subject_id;
        $schoolClassId = $validated['school_class_id'] ?? $schedule->school_class_id;
        $sessionType = array_key_exists('session_type', $validated) ? $validated['session_type'] : $schedule->session_type;
        $notes = array_key_exists('notes', $validated) ? $validated['notes'] : $schedule->notes;

        if ($endTime <= $startTime) {
            return response()->json([
                'success' => false,
                'message' => 'The end time must be later than the start time.',
            ], 422);
        }

        return \Illuminate\Support\Facades\DB::transaction(function () use (
            $schedule, $teacherId, $subjectId, $schoolClassId, $dayOfWeek, $startTime, $endTime, $room, $sessionType, $notes
        ) {
            $classModel = \App\Models\SchoolClass::find($schoolClassId);
            $subjectModel = \App\Models\Subject::find($subjectId);
            $teacherModel = \App\Models\Teacher::find($teacherId);

            if ($classModel && $subjectModel && (int) $subjectModel->grade_level !== (int) $classModel->grade_level) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'message' => "RBAC Grade Isolation Error: {$subjectModel->name} (Grade {$subjectModel->grade_level}) cannot be assigned to {$classModel->name} (Grade {$classModel->grade_level}).",
                ], 422);
            }

            if ($classModel && $teacherModel && !$teacherModel->isAuthorizedForGrade((int) $classModel->grade_level)) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'message' => "Grade-Level Constraint Error: {$teacherModel->name} is assigned to Grade {$teacherModel->assigned_grade_level} for this academic year and cannot teach Grade {$classModel->grade_level} classes. Reassign their grade level in Faculty Management first.",
                ], 422);
            }

            if ($subjectModel && $teacherModel && !$teacherModel->isAuthorizedForSubject((int) $subjectModel->id)) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'message' => "RBAC Subject Authorization Error: {$teacherModel->name} is not authorized to handle {$subjectModel->name}.",
                ], 422);
            }

            $conflictCheck = $this->conflictService->checkConflict(
                (int) $teacherId,
                (int) $schoolClassId,
                $dayOfWeek,
                $startTime,
                $endTime,
                $room,
                $schedule->id
            );

            if ($conflictCheck['has_conflict']) {
                return response()->json([
                    'success' => false,
                    'status' => 'conflict',
                    'character' => [
                        'expression' => 'worried',
                        'motion' => 'panic',
                    ],
                    'message' => $conflictCheck['conflicts'][0]['message'] ?? 'Schedule conflict detected.',
                    'conflicts' => $conflictCheck['conflicts'],
                ], 422);
            }

            // Ensure TeachingLoad matches teacher, subject, class
            $teachingLoad = TeachingLoad::firstOrCreate(
                [
                    'teacher_id' => $teacherId,
                    'subject_id' => $subjectId,
                    'school_class_id' => $schoolClassId,
                ],
                [
                    'academic_year' => '2026-2027',
                    'semester_or_quarter' => '1st Quarter',
                    'teaching_hours' => 4,
                ]
            );

            $schedule->update([
                'teaching_load_id' => $teachingLoad->id,
                'teacher_id' => $teacherId,
                'subject_id' => $subjectId,
                'school_class_id' => $schoolClassId,
                'day_of_week' => $dayOfWeek,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'room' => $room,
                'session_type' => $sessionType,
                'notes' => $notes,
            ]);

            $notifications = [];
            try {
                $notifications = $this->notificationService->notifyScheduleChange($schedule, 'updated');
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Schedule notification dispatch failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'status' => 'email',
                'character' => [
                    'expression' => 'happy',
                    'motion' => 'mail_reaction',
                ],
                'message' => 'Schedule updated successfully.',
                'notifications_count' => count($notifications),
                'data' => $schedule->fresh(['teacher', 'subject', 'schoolClass']),
            ]);
        });
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(Schedule $schedule): JsonResponse
    {
        $this->notificationService->notifyScheduleChange($schedule, 'cancelled');
        $schedule->delete();

        return response()->json([
            'success' => true,
            'status' => 'delete_success',
            'operation' => 'delete',
            'character' => [
                'expression' => 'crying',
                'motion' => 'cry',
            ],
            'message' => 'Schedule removed and cancellation notices dispatched.',
        ]);
    }

    /**
     * Automated Conflict-Free Timetable Generator.
     * Generates timetable slots for all assigned teaching loads respecting constraints.
     */
    public function autoGenerate(Request $request): JsonResponse
    {
        $academicYear = $request->input('academic_year', '2026-2027');
        $semester = $request->input('semester', '1st Quarter');
        $classId = $request->input('school_class_id');

        $query = TeachingLoad::with(['teacher', 'subject', 'schoolClass'])
            ->where('academic_year', $academicYear)
            ->where('semester_or_quarter', $semester);

        if ($classId) {
            $query->where('school_class_id', $classId);
        }

        $loads = $query->get();

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $timeSlots = [
            ['start' => '07:30:00', 'end' => '08:30:00'],
            ['start' => '08:30:00', 'end' => '09:30:00'],
            ['start' => '09:45:00', 'end' => '10:45:00'],
            ['start' => '10:45:00', 'end' => '11:45:00'],
            ['start' => '13:00:00', 'end' => '14:00:00'],
            ['start' => '14:00:00', 'end' => '15:00:00'],
            ['start' => '15:00:00', 'end' => '16:00:00'],
        ];

        $generatedCount = 0;
        $unresolvedLoads = [];

        foreach ($loads as $load) {
            // Check existing hours already scheduled for this load
            $existingSchedules = Schedule::where('teaching_load_id', $load->id)->get();
            $existingHours = $existingSchedules->count(); // each session is 1 hour
            $neededHours = max(0, $load->teaching_hours - $existingHours);

            if ($neededHours <= 0) {
                continue;
            }

            $room = $load->schoolClass->room ?: 'Room ' . $load->school_class_id;
            $scheduledForThisLoad = 0;

            // Attempt to place each needed hour across days
            foreach ($days as $day) {
                if ($scheduledForThisLoad >= $neededHours) break;

                // Check if this class already has this subject on this day
                $alreadyHasSubjectToday = Schedule::where('school_class_id', $load->school_class_id)
                    ->where('subject_id', $load->subject_id)
                    ->where('day_of_week', $day)
                    ->exists();

                if ($alreadyHasSubjectToday && $neededHours < 5) {
                    continue; // Spread across different days
                }

                foreach ($timeSlots as $slot) {
                    if ($scheduledForThisLoad >= $neededHours) break;

                    $check = $this->conflictService->checkConflict(
                        $load->teacher_id,
                        $load->school_class_id,
                        $day,
                        $slot['start'],
                        $slot['end'],
                        $room
                    );

                    if (!$check['has_conflict']) {
                        Schedule::create([
                            'teaching_load_id' => $load->id,
                            'teacher_id' => $load->teacher_id,
                            'subject_id' => $load->subject_id,
                            'school_class_id' => $load->school_class_id,
                            'day_of_week' => $day,
                            'start_time' => $slot['start'],
                            'end_time' => $slot['end'],
                            'room' => $room,
                        ]);

                        $generatedCount++;
                        $scheduledForThisLoad++;
                    }
                }
            }

            if ($scheduledForThisLoad < $neededHours) {
                $unresolvedLoads[] = [
                    'load_id' => $load->id,
                    'subject' => $load->subject->name,
                    'class' => $load->schoolClass->name,
                    'teacher' => $load->teacher->name,
                    'missing_hours' => $neededHours - $scheduledForThisLoad,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Automated timetable generation completed: {$generatedCount} timetable sessions successfully placed without conflicts.",
            'generated_sessions' => $generatedCount,
            'unresolved' => $unresolvedLoads,
        ]);
    }
}
