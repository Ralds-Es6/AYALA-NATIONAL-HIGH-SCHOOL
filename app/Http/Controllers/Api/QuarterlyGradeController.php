<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentQuarterlyGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuarterlyGradeController extends Controller
{
    /**
     * Resolve the active teacher if authenticated user is teacher.
     */
    protected function getActiveTeacher(Request $request): ?Teacher
    {
        $user = Auth::user() ?? $request->user();
        if ($user && $user->role === 'teacher') {
            return Teacher::where('user_id', $user->id)->first()
                ?? Teacher::where('email', $user->email)->first();
        }
        return null;
    }

    /**
     * Retrieve all classes and subjects managed by the teacher for gradebook selector.
     */
    public function getTeacherManagedContexts(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();

        if ($user && $user->role === 'admin') {
            // Admin can inspect all classes and their curriculum subjects
            $classes = SchoolClass::with('adviser')->withCount('students')->orderBy('grade_level')->orderBy('section')->get();
            $subjects = Subject::orderBy('grade_level')->orderBy('name')->get();
            $loads = TeachingLoad::with(['teacher'])->get()->keyBy(fn($l) => "{$l->school_class_id}-{$l->subject_id}");
            $schedules = Schedule::with(['teacher'])->get()->keyBy(fn($s) => "{$s->school_class_id}-{$s->subject_id}");

            // Generate contexts for every classroom section and its applicable grade-level subjects
            $contexts = collect();
            foreach ($classes as $cls) {
                $clsSubjects = $subjects->filter(function ($subj) use ($cls) {
                    if ((int)$subj->grade_level !== (int)$cls->grade_level) {
                        return false;
                    }
                    if ($cls->grade_level >= 11 && $cls->strand && $subj->strand) {
                        return $subj->strand === $cls->strand;
                    }
                    return true;
                });

                foreach ($clsSubjects as $subj) {
                    $key = "{$cls->id}-{$subj->id}";
                    $sched = $schedules->get($key);
                    $load = $loads->get($key);
                    $assignedTeacher = $load?->teacher ?? $sched?->teacher;

                    $scheduleTime = null;
                    if ($sched && $sched->day_of_week) {
                        $startTime = substr($sched->start_time, 0, 5);
                        $endTime = substr($sched->end_time, 0, 5);
                        $scheduleTime = "{$sched->day_of_week} {$startTime}-{$endTime}";
                    }

                    $contexts->push([
                        'school_class_id' => $cls->id,
                        'class_name' => $cls->name,
                        'grade_level' => $cls->grade_level,
                        'section' => $cls->section,
                        'room' => $cls->room ?? $sched?->room ?? 'Room TBA',
                        'shift' => $cls->shift ?? 'Whole Day Shift',
                        'students_count' => (int) ($cls->students_count ?? 0),
                        'is_adviser' => false,
                        'adviser_name' => $cls->adviser?->name ?? 'TBA (Unassigned)',
                        'subject_id' => $subj->id,
                        'subject_name' => $subj->name,
                        'subject_code' => $subj->code,
                        'schedule_time' => $scheduleTime,
                        'teacher_id' => $assignedTeacher?->id,
                        'teacher_name' => $assignedTeacher?->name ?? 'Unassigned Faculty',
                        'role' => 'Administrator Oversight',
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'role' => 'admin',
                'is_admin' => true,
                'classes' => $classes,
                'subjects' => $subjects,
                'contexts' => $contexts,
            ]);
        }

        $teacher = $this->getActiveTeacher($request);
        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher profile not linked to this session.',
            ], 403);
        }

        // 1. Gather all class+subject pairs from active schedules
        $schedContexts = Schedule::where('teacher_id', $teacher->id)
            ->with(['schoolClass.adviser', 'schoolClass.students', 'subject'])
            ->get()
            ->map(function ($s) use ($teacher) {
                $cls = $s->schoolClass;
                $scheduleTime = null;
                if ($s->day_of_week) {
                    $startTime = substr($s->start_time, 0, 5);
                    $endTime = substr($s->end_time, 0, 5);
                    $scheduleTime = "{$s->day_of_week} {$startTime}-{$endTime}";
                }

                return [
                    'school_class_id' => $s->school_class_id,
                    'class_name' => $cls?->name,
                    'grade_level' => $cls?->grade_level,
                    'section' => $cls?->section,
                    'room' => $cls?->room ?? $s->room ?? 'Room TBA',
                    'shift' => $cls?->shift ?? 'Whole Day Shift',
                    'students_count' => $cls?->students ? $cls->students->count() : 0,
                    'is_adviser' => (int) ($cls?->adviser_id) === (int) $teacher->id,
                    'adviser_name' => $cls?->adviser?->name ?? 'TBA (Unassigned)',
                    'subject_id' => $s->subject_id,
                    'subject_name' => $s->subject?->name,
                    'subject_code' => $s->subject?->code,
                    'schedule_time' => $scheduleTime,
                    'teacher_id' => $teacher->id,
                    'teacher_name' => $teacher->name,
                    'role' => 'Subject Teacher',
                ];
            });

        // 2. Gather from teaching loads
        $loadContexts = TeachingLoad::where('teacher_id', $teacher->id)
            ->with(['schoolClass.adviser', 'schoolClass.students', 'subject'])
            ->get()
            ->map(function ($l) use ($teacher) {
                $cls = $l->schoolClass;
                return [
                    'school_class_id' => $l->school_class_id,
                    'class_name' => $cls?->name,
                    'grade_level' => $cls?->grade_level,
                    'section' => $cls?->section,
                    'room' => $cls?->room ?? 'Room TBA',
                    'shift' => $cls?->shift ?? 'Whole Day Shift',
                    'students_count' => $cls?->students ? $cls->students->count() : 0,
                    'is_adviser' => (int) ($cls?->adviser_id) === (int) $teacher->id,
                    'adviser_name' => $cls?->adviser?->name ?? 'TBA (Unassigned)',
                    'subject_id' => $l->subject_id,
                    'subject_name' => $l->subject?->name,
                    'subject_code' => $l->subject?->code,
                    'schedule_time' => null,
                    'teacher_id' => $teacher->id,
                    'teacher_name' => $teacher->name,
                    'role' => 'Subject Teacher',
                ];
            });

        $merged = $schedContexts->concat($loadContexts)->unique(function ($item) {
            return "{$item['school_class_id']}-{$item['subject_id']}";
        })->values();

        // 3. Also check if teacher is an adviser
        $advisoryClasses = SchoolClass::where('adviser_id', $teacher->id)->withCount('students')->get();

        return response()->json([
            'success' => true,
            'role' => 'teacher',
            'is_admin' => false,
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'specialization' => $teacher->specialization,
                'can_encode_grades' => (bool) ($teacher->permissions['can_encode_grades'] ?? true),
            ],
            'contexts' => $merged,
            'advisory_classes' => $advisoryClasses,
        ]);
    }

    /**
     * Get spreadsheet grade matrix for a specific section and subject.
     */
    public function getGradeMatrix(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_year' => ['nullable', 'string'],
        ]);

        $user = Auth::user() ?? $request->user();
        $classId = (int) $validated['school_class_id'];
        $subjectId = (int) $validated['subject_id'];
        $academicYear = $validated['academic_year'] ?? '2026-2027';

        $schoolClass = SchoolClass::with('adviser')->findOrFail($classId);
        $subject = Subject::findOrFail($subjectId);

        // Security check for teacher
        $isTeacher = $user && $user->role === 'teacher';
        $isAdmin = $user && $user->role === 'admin';
        $readOnly = $isAdmin; // Admin has View-Only access

        if ($isTeacher) {
            $teacher = $this->getActiveTeacher($request);
            if (!$teacher) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Verify teacher teaches this class+subject OR is the class adviser
            $teachesClass = Schedule::where('teacher_id', $teacher->id)
                ->where('school_class_id', $classId)
                ->where('subject_id', $subjectId)
                ->exists()
                || TeachingLoad::where('teacher_id', $teacher->id)
                ->where('school_class_id', $classId)
                ->where('subject_id', $subjectId)
                ->exists();

            $isAdviser = (int) $schoolClass->adviser_id === (int) $teacher->id;

            if (!$teachesClass && !$isAdviser) {
                return response()->json([
                    'success' => false,
                    'message' => "Access Restricted: You are not assigned to teach {$subject->name} in {$schoolClass->name}.",
                ], 403);
            }

            // If teacher is adviser but doesn't teach this subject, they have View-Only
            if ($isAdviser && !$teachesClass) {
                $readOnly = true;
            }

            // Check if teacher has can_encode_grades permission
            if (!($teacher->permissions['can_encode_grades'] ?? true)) {
                $readOnly = true;
            }
        }

        // Fetch all students enrolled in this section
        $students = Student::where('school_class_id', $classId)
            ->orderBy('name')
            ->get();

        // Fetch existing quarterly grades for this subject and class
        $existingGrades = StudentQuarterlyGrade::where('school_class_id', $classId)
            ->where('subject_id', $subjectId)
            ->where('academic_year', $academicYear)
            ->get()
            ->keyBy('student_id');

        $isShs = (int) $schoolClass->grade_level >= 11;

        $rows = $students->map(function ($student) use ($existingGrades, $isShs) {
            $record = $existingGrades->get($student->id);

            $q1 = $record?->q1 !== null ? (float) $record->q1 : null;
            $q2 = $record?->q2 !== null ? (float) $record->q2 : null;
            $q3 = $record?->q3 !== null ? (float) $record->q3 : null;
            $q4 = $record?->q4 !== null ? (float) $record->q4 : null;

            // Compute final or running grade
            $calc = $this->computeFinalAndRemarks($q1, $q2, $q3, $q4, $isShs);

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'lrn' => $student->lrn,
                'email' => $student->email,
                'q1' => $q1 !== null ? $q1 : '',
                'q2' => $q2 !== null ? $q2 : '',
                'q3' => $q3 !== null ? $q3 : '',
                'q4' => $q4 !== null ? $q4 : '',
                'final_rating' => $calc['final_rating'],
                'descriptor' => $calc['descriptor'],
                'remarks' => $calc['remarks'],
                'is_complete' => $calc['is_complete'],
                'is_locked' => (bool) ($record?->is_locked ?? false),
            ];
        });

        // Compute class KPI health metrics
        $allFinals = $rows->pluck('final_rating')->filter(fn($v) => $v !== null)->values();
        $totalGraded = $allFinals->count();
        $classMean = $totalGraded > 0 ? round($allFinals->avg(), 1) : null;
        $passedCount = $rows->filter(fn($r) => in_array($r['remarks'], ['PASSED']))->count();
        $atRiskCount = $rows->filter(fn($r) => in_array($r['remarks'], ['AT-RISK', 'FAILED']))->count();
        $honorCount = $rows->filter(fn($r) => $r['final_rating'] !== null && $r['final_rating'] >= 90)->count();
        $passingRate = $totalGraded > 0 ? round(($passedCount / $totalGraded) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'read_only' => $readOnly,
            'class_info' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'grade_level' => $schoolClass->grade_level,
                'section' => $schoolClass->section,
                'strand' => $schoolClass->strand,
                'room' => $schoolClass->room,
                'is_shs' => $isShs,
                'adviser_name' => $schoolClass->adviser?->name ?? 'TBA',
            ],
            'subject_info' => [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code,
                'grade_level' => $subject->grade_level,
            ],
            'metrics' => [
                'total_enrolled' => $students->count(),
                'total_graded' => $totalGraded,
                'class_mean' => $classMean,
                'passing_rate' => $passingRate,
                'honor_count' => $honorCount,
                'at_risk_count' => $atRiskCount,
            ],
            'students' => $rows,
        ]);
    }

    /**
     * Batch save student quarterly grades for a class and subject.
     */
    public function batchSaveGrades(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
            'academic_year' => ['nullable', 'string'],
            'grades' => ['required', 'array'],
            'grades.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'grades.*.q1' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.q2' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.q3' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.q4' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $user = Auth::user() ?? $request->user();
        $classId = (int) $validated['school_class_id'];
        $subjectId = (int) $validated['subject_id'];
        $academicYear = $validated['academic_year'] ?? '2026-2027';

        $schoolClass = SchoolClass::findOrFail($classId);
        $subject = Subject::findOrFail($subjectId);
        $isShs = (int) $schoolClass->grade_level >= 11;

        $teacher = $this->getActiveTeacher($request);
        $teacherId = $teacher ? $teacher->id : null;

        // If teacher, strictly verify permission and assignment
        if ($user && $user->role === 'teacher') {
            if (!$teacher) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            if (!($teacher->permissions['can_encode_grades'] ?? true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission Denied: Your account does not have grade encoding privileges.',
                ], 403);
            }

            $authorized = Schedule::where('teacher_id', $teacher->id)
                ->where('school_class_id', $classId)
                ->where('subject_id', $subjectId)
                ->exists()
                || TeachingLoad::where('teacher_id', $teacher->id)
                ->where('school_class_id', $classId)
                ->where('subject_id', $subjectId)
                ->exists();

            if (!$authorized) {
                return response()->json([
                    'success' => false,
                    'message' => "Forbidden: You are not authorized to encode grades for {$subject->name} in {$schoolClass->name}.",
                ], 403);
            }
        }

        // Verify all students belong to this section
        $validStudentIds = Student::where('school_class_id', $classId)->pluck('id')->toArray();

        foreach ($validated['grades'] as $item) {
            $studentId = (int) $item['student_id'];
            if (!in_array($studentId, $validStudentIds, true)) {
                continue; // Skip any student not enrolled in this section
            }

            $q1 = isset($item['q1']) && $item['q1'] !== '' ? (float) $item['q1'] : null;
            $q2 = isset($item['q2']) && $item['q2'] !== '' ? (float) $item['q2'] : null;
            $q3 = isset($item['q3']) && $item['q3'] !== '' ? (float) $item['q3'] : null;
            $q4 = isset($item['q4']) && $item['q4'] !== '' ? (float) $item['q4'] : null;

            $calc = $this->computeFinalAndRemarks($q1, $q2, $q3, $q4, $isShs);

            StudentQuarterlyGrade::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'subject_id' => $subjectId,
                    'school_class_id' => $classId,
                    'academic_year' => $academicYear,
                ],
                [
                    'teacher_id' => $teacherId,
                    'q1' => $q1,
                    'q2' => $q2,
                    'q3' => $q3,
                    'q4' => $q4,
                    'final_rating' => $calc['final_rating'],
                    'descriptor' => $calc['descriptor'],
                    'remarks' => $calc['remarks'],
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Quarterly grades for {$subject->name} ({$schoolClass->name}) saved successfully and published to student dashboards.",
        ]);
    }

    /**
     * Student View: Digital DepEd Form 138 (SF-9) Report Card.
     */
    public function myReportCard(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();

        if (!$user || $user->role !== 'student') {
            return response()->json(['success' => false, 'message' => 'Student privileges required.'], 403);
        }

        $student = Student::with(['schoolClass.adviser'])
            ->where('user_id', $user->id)
            ->first()
            ?? Student::with(['schoolClass.adviser'])
            ->where('email', $user->email)
            ->first();

        if (!$student || !$student->school_class_id) {
            return response()->json([
                'success' => false,
                'message' => 'Learner enrollment record not found.',
            ], 404);
        }

        $schoolClass = $student->schoolClass;
        $isShs = (int) $schoolClass->grade_level >= 11;
        $academicYear = '2026-2027';

        // Get all subjects taught in this classroom (from schedules or catalog for this grade level)
        $scheduledSubjectIds = Schedule::where('school_class_id', $schoolClass->id)
            ->pluck('subject_id')
            ->toArray();

        $loadSubjectIds = TeachingLoad::where('school_class_id', $schoolClass->id)
            ->pluck('subject_id')
            ->toArray();

        $subjectIds = array_values(array_unique(array_merge($scheduledSubjectIds, $loadSubjectIds)));

        if (empty($subjectIds)) {
            // Fallback: DepEd catalog for this grade level
            $subjectIds = Subject::where('grade_level', $schoolClass->grade_level)->pluck('id')->toArray();
        }

        $subjects = Subject::whereIn('id', $subjectIds)->orderBy('id')->get();

        // Get student's quarterly grades
        $grades = StudentQuarterlyGrade::where('student_id', $student->id)
            ->where('school_class_id', $schoolClass->id)
            ->where('academic_year', $academicYear)
            ->get()
            ->keyBy('subject_id');

        $rows = [];
        $finalRatings = [];

        foreach ($subjects as $subj) {
            $rec = $grades->get($subj->id);

            $q1 = $rec?->q1 !== null ? (float) $rec->q1 : null;
            $q2 = $rec?->q2 !== null ? (float) $rec->q2 : null;
            $q3 = $rec?->q3 !== null ? (float) $rec->q3 : null;
            $q4 = $rec?->q4 !== null ? (float) $rec->q4 : null;

            $calc = $this->computeFinalAndRemarks($q1, $q2, $q3, $q4, $isShs);

            if ($calc['final_rating'] !== null) {
                $finalRatings[] = $calc['final_rating'];
            }

            $rows[] = [
                'subject_id' => $subj->id,
                'subject_name' => $subj->name,
                'subject_code' => $subj->code,
                'q1' => $q1,
                'q2' => $q2,
                'q3' => $q3,
                'q4' => $q4,
                'final_rating' => $calc['final_rating'],
                'descriptor' => $calc['descriptor'],
                'remarks' => $calc['remarks'],
            ];
        }

        $generalAverage = count($finalRatings) > 0 ? round(array_sum($finalRatings) / count($finalRatings), 1) : null;
        $academicStanding = $generalAverage !== null
            ? ($generalAverage >= 90 ? 'With Honors' : ($generalAverage >= 75 ? 'Promoted (Regular)' : 'Academic Warning'))
            : 'Evaluating';

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'lrn' => $student->lrn,
                'email' => $student->email,
                'track' => $student->track ?? $schoolClass->track,
                'strand' => $student->strand ?? $schoolClass->strand,
                'academic_year' => $academicYear,
            ],
            'class_info' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'grade_level' => $schoolClass->grade_level,
                'section' => $schoolClass->section,
                'room' => $schoolClass->room,
                'adviser_name' => $schoolClass->adviser?->name ?? 'TBA',
            ],
            'general_average' => $generalAverage,
            'academic_standing' => $academicStanding,
            'subjects' => $rows,
        ]);
    }

    /**
     * Compute Final Rating, DepEd Descriptor, and Remarks based on Grade Level.
     */
    protected function computeFinalAndRemarks(?float $q1, ?float $q2, ?float $q3, ?float $q4, bool $isShs): array
    {
        $values = array_filter([$q1, $q2, $q3, $q4], fn($v) => $v !== null);
        $count = count($values);

        if ($count === 0) {
            return [
                'final_rating' => null,
                'descriptor' => null,
                'remarks' => 'Not Graded',
                'is_complete' => false,
            ];
        }

        if ($isShs) {
            // Senior High: Semestral calculation
            // If Q3 or Q4 exists, use 2nd sem; otherwise use 1st sem
            if ($q3 !== null || $q4 !== null) {
                $sem2Values = array_filter([$q3, $q4], fn($v) => $v !== null);
                $final = round(array_sum($sem2Values) / count($sem2Values));
                $isComplete = ($q3 !== null && $q4 !== null);
            } else {
                $sem1Values = array_filter([$q1, $q2], fn($v) => $v !== null);
                $final = round(array_sum($sem1Values) / count($sem1Values));
                $isComplete = ($q1 !== null && $q2 !== null);
            }
        } else {
            // Junior High: 4 Quarters average
            $isComplete = ($q1 !== null && $q2 !== null && $q3 !== null && $q4 !== null);
            if ($isComplete) {
                $final = round(($q1 + $q2 + $q3 + $q4) / 4);
            } else {
                // Running Mean
                $final = round(array_sum($values) / $count);
            }
        }

        $descriptor = StudentQuarterlyGrade::getDepEdDescriptor($final);
        $remarks = StudentQuarterlyGrade::getDepEdRemarks($final, $isComplete);

        return [
            'final_rating' => $final,
            'descriptor' => $descriptor,
            'remarks' => $remarks,
            'is_complete' => $isComplete,
        ];
    }
}

