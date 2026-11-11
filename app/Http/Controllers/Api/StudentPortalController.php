<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\TeachingLoad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StudentPortalController extends Controller
{
    /**
     * View "My Class Schedule" - Strictly sanitized and scoped to the student's assigned class.
     */
    public function mySchedule(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'student') {
            return response()->json([
                'success' => false,
                'status' => 'forbidden',
                'message' => 'Access Denied. Student privileges required.',
                'character' => [
                    'expression' => 'sad',
                    'motion' => 'disappointed'
                ]
            ], 403);
        }

        $student = Student::with('schoolClass')->where('user_id', $user->id)->first()
            ?? Student::with('schoolClass')->where('email', $user->email)->first();

        if (!$student || !$student->school_class_id) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => 'Student enrollment record or class section was not found.',
                'character' => [
                    'expression' => 'confused',
                    'motion' => 'look_around'
                ]
            ], 404);
        }

        $schoolClass = SchoolClass::with('adviser')->find($student->school_class_id);

        if (!$schoolClass) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => 'Class section not found.',
                'character' => [
                    'expression' => 'confused',
                    'motion' => 'look_around'
                ]
            ], 404);
        }

        $loads = TeachingLoad::with(['subject', 'teacher', 'schedules'])
            ->where('school_class_id', $schoolClass->id)
            ->get();

        $schedules = Schedule::with(['subject', 'teacher'])
            ->where('school_class_id', $schoolClass->id)
            ->orderByRaw("CASE day_of_week 
                WHEN 'Monday' THEN 1 
                WHEN 'Tuesday' THEN 2 
                WHEN 'Wednesday' THEN 3 
                WHEN 'Thursday' THEN 4 
                WHEN 'Friday' THEN 5 
                ELSE 6 END")
            ->orderBy('start_time')
            ->get();

        // Sanitize teacher info (protect personal contacts/IDs from student view)
        $sanitizedSchedules = $schedules->map(function ($sched) {
            return [
                'id' => $sched->id,
                'day_of_week' => $sched->day_of_week,
                'start_time' => $sched->start_time,
                'end_time' => $sched->end_time,
                'room' => $sched->room,
                'subject' => $sched->subject ? [
                    'id' => $sched->subject->id,
                    'code' => $sched->subject->code,
                    'name' => $sched->subject->name,
                    'color' => $sched->subject->color,
                ] : null,
                'teacher' => $sched->teacher ? [
                    'id' => $sched->teacher->id,
                    'name' => $sched->teacher->name,
                    'position' => $sched->teacher->position,
                ] : null,
            ];
        });

        // Compute authoritative Enrolled Subjects from section's curriculum loads
        $enrolledSubjects = $loads->map(function ($load) use ($schedules, $schoolClass) {
            $matchingSchedules = $schedules->where('subject_id', $load->subject_id);
            $primaryRoom = $matchingSchedules->first()?->room ?? $schoolClass->room ?? 'Building J';
            return [
                'id' => $load->subject?->id,
                'code' => $load->subject?->code,
                'name' => $load->subject?->name,
                'color' => $load->subject?->color,
                'hours_per_week' => $load->teaching_hours,
                'teacher' => $load->teacher ? [
                    'id' => $load->teacher->id,
                    'name' => $load->teacher->name,
                    'position' => $load->teacher->position,
                ] : null,
                'room' => $primaryRoom,
                'scheduled_periods_count' => $matchingSchedules->count(),
                'is_scheduled' => $matchingSchedules->count() > 0,
            ];
        });

        // Ensure any timetable subject without a direct load record is also captured
        $seenSubjectIds = $loads->pluck('subject_id')->filter()->all();
        foreach ($schedules as $sched) {
            if ($sched->subject && !in_array($sched->subject->id, $seenSubjectIds, true)) {
                $seenSubjectIds[] = $sched->subject->id;
                $matchingCount = $schedules->where('subject_id', $sched->subject->id)->count();
                $enrolledSubjects->push([
                    'id' => $sched->subject->id,
                    'code' => $sched->subject->code,
                    'name' => $sched->subject->name,
                    'color' => $sched->subject->color,
                    'hours_per_week' => 4,
                    'teacher' => $sched->teacher ? [
                        'id' => $sched->teacher->id,
                        'name' => $sched->teacher->name,
                        'position' => $sched->teacher->position,
                    ] : null,
                    'room' => $sched->room,
                    'scheduled_periods_count' => $matchingCount,
                    'is_scheduled' => true,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'student' => [
                'name' => $student->name,
                'lrn' => $student->lrn,
                'email' => $student->email,
                'strand' => $student->strand ?? $schoolClass->strand ?? null,
                'track' => $student->track ?? $schoolClass->track ?? null,
            ],
            'class_info' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'grade_level' => $schoolClass->grade_level,
                'section' => $schoolClass->section,
                'strand' => $schoolClass->strand ?? null,
                'track' => $schoolClass->track ?? null,
                'room' => $schoolClass->room,
                'adviser_name' => $schoolClass->adviser?->name ?? 'None Assigned',
                'adviser' => $schoolClass->adviser ? [
                    'id' => $schoolClass->adviser->id,
                    'name' => $schoolClass->adviser->name,
                    'email' => $schoolClass->adviser->email,
                    'specialization' => $schoolClass->adviser->specialization,
                ] : null,
            ],
            'enrolled_subjects' => $enrolledSubjects->values(),
            'data' => $sanitizedSchedules,
        ]);
    }
}
