<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentGrade;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentFeedback;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssessmentController extends Controller
{
    /**
     * List assessments with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $query = Assessment::with(['teacher', 'subject', 'schoolClass', 'grades.student']);

        // If teacher, default to own assessments unless specified
        if ($user && $user->role === 'teacher') {
            $teacher = Teacher::where('user_id', $user->id)->first()
                ?? Teacher::where('email', $user->email)->first();
            if ($teacher) {
                $query->where('teacher_id', $teacher->id);
            }
        } elseif ($teacherId = $request->query('teacher_id')) {
            $query->where('teacher_id', $teacherId);
        }

        if ($classId = $request->query('school_class_id')) {
            $query->where('school_class_id', $classId);
        }

        if ($subjectId = $request->query('subject_id')) {
            $query->where('subject_id', $subjectId);
        }

        if ($quarter = $request->query('quarter')) {
            $query->where('quarter', $quarter);
        }

        $assessments = $query->latest('assessment_date')->get();

        // Attach quick stats (submitted count, average score, pass rate)
        $assessments->transform(function ($assessment) {
            $totalStudents = $assessment->schoolClass ? $assessment->schoolClass->students()->count() : 0;
            $gradedCount = $assessment->grades->count();
            $avgScore = $gradedCount > 0 ? round($assessment->grades->avg('score'), 1) : 0;
            $passedCount = $assessment->grades->where('status', 'Passed')->count();
            $passRate = $gradedCount > 0 ? round(($passedCount / $gradedCount) * 100, 1) : 0;

            $assessment->stats = [
                'total_students' => $totalStudents,
                'graded_count' => $gradedCount,
                'average_score' => $avgScore,
                'passed_count' => $passedCount,
                'pass_rate' => $passRate,
            ];

            return $assessment;
        });

        return response()->json([
            'success' => true,
            'data' => $assessments,
        ]);
    }

    /**
     * Store a newly created assessment.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $teacherId = $request->input('teacher_id');

        if ($user && $user->role === 'teacher') {
            $teacher = Teacher::where('user_id', $user->id)->first()
                ?? Teacher::where('email', $user->email)->firstOrFail();
            $teacherId = $teacher->id;
        }

        $validated = $request->validate([
            'teacher_id' => [$user && $user->role === 'admin' ? 'required' : 'nullable', 'exists:teachers,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'academic_year' => ['nullable', 'string'],
            'quarter' => ['required', 'string'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'max_score' => ['required', 'numeric', 'min:1'],
            'passing_score' => ['required', 'numeric', 'min:0', 'lte:max_score'],
            'assessment_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        $validated['teacher_id'] = $teacherId;

        $assessment = Assessment::create($validated);
        $assessment->load(['teacher', 'subject', 'schoolClass']);

        return response()->json([
            'success' => true,
            'message' => 'Assessment task successfully created.',
            'data' => $assessment,
        ], 201);
    }

    /**
     * Get grading sheet with all students in class and current scores.
     */
    public function getGradingSheet(Assessment $assessment): JsonResponse
    {
        $assessment->load(['teacher', 'subject', 'schoolClass']);
        
        $students = Student::where('school_class_id', $assessment->school_class_id)
            ->orderBy('name')
            ->get();

        $existingGrades = AssessmentGrade::where('assessment_id', $assessment->id)
            ->get()
            ->keyBy('student_id');

        $sheetData = $students->map(function ($student) use ($existingGrades, $assessment) {
            $grade = $existingGrades->get($student->id);

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'lrn' => $student->lrn,
                'score' => $grade ? $grade->score : '',
                'percentage' => $grade ? $grade->percentage : null,
                'status' => $grade ? $grade->status : 'Not Graded',
                'remarks' => $grade ? $grade->remarks : '',
                'updated_at' => $grade ? $grade->updated_at : null,
            ];
        });

        return response()->json([
            'success' => true,
            'assessment' => $assessment,
            'students' => $sheetData,
        ]);
    }

    /**
     * Batch save student grades for an assessment.
     */
    public function saveGrades(Request $request, Assessment $assessment): JsonResponse
    {
        $validated = $request->validate([
            'grades' => ['required', 'array'],
            'grades.*.student_id' => ['required', 'exists:students,id'],
            'grades.*.score' => ['nullable', 'numeric', 'min:0', 'lte:' . $assessment->max_score],
            'grades.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $assessment) {
            foreach ($validated['grades'] as $item) {
                if ($item['score'] === null || $item['score'] === '') {
                    continue;
                }

                $score = (float) $item['score'];
                $percentage = round(($score / $assessment->max_score) * 100, 2);
                $status = ($score >= $assessment->passing_score) ? 'Passed' : 'Failed';

                AssessmentGrade::updateOrCreate(
                    [
                        'assessment_id' => $assessment->id,
                        'student_id' => $item['student_id'],
                    ],
                    [
                        'score' => $score,
                        'percentage' => $percentage,
                        'status' => $status,
                        'remarks' => $item['remarks'] ?? null,
                    ]
                );
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Assessment grades have been successfully recorded and recalculated.',
        ]);
    }

    /**
     * Submit personalized feedback to a student.
     */
    public function storeFeedback(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $teacher = Teacher::where('user_id', $user?->id)->first()
            ?? Teacher::where('email', $user?->email)->firstOrFail();

        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'assessment_id' => ['nullable', 'exists:assessments,id'],
            'category' => ['required', 'string'],
            'message' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $validated['teacher_id'] = $teacher->id;

        $feedback = StudentFeedback::create($validated);
        $feedback->load(['student', 'subject', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'Academic guidance & feedback dispatched to student.',
            'data' => $feedback,
        ], 201);
    }

    /**
     * Student view: Personal grades, quarter performance breakdown, and overall average.
     */
    public function myAssessments(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $student = $user
            ? (Student::with(['schoolClass'])->where('user_id', $user->id)->first()
                ?? Student::with(['schoolClass'])->where('email', $user->email)->first())
            : null;

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student record not found.',
            ], 404);
        }

        $grades = AssessmentGrade::with(['assessment.subject', 'assessment.teacher'])
            ->where('student_id', $student->id)
            ->get();

        // Group grades by subject and quarter
        $bySubject = [];
        foreach ($grades as $grade) {
            $assessment = $grade->assessment;
            if (!$assessment || !$assessment->subject) continue;

            $subCode = $assessment->subject->code;
            if (!isset($bySubject[$subCode])) {
                $bySubject[$subCode] = [
                    'code' => $subCode,
                    'name' => $assessment->subject->name,
                    'color' => $assessment->subject->color,
                    'assessments' => [],
                    'total_score' => 0,
                    'total_max' => 0,
                    'quarters' => [],
                ];
            }

            $q = $assessment->quarter;
            if (!isset($bySubject[$subCode]['quarters'][$q])) {
                $bySubject[$subCode]['quarters'][$q] = [
                    'quarter' => $q,
                    'scores' => [],
                    'total_score' => 0,
                    'total_max' => 0,
                ];
            }

            $bySubject[$subCode]['quarters'][$q]['scores'][] = [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'type' => $assessment->type,
                'score' => $grade->score,
                'max_score' => $assessment->max_score,
                'percentage' => $grade->percentage,
                'status' => $grade->status,
                'remarks' => $grade->remarks,
                'date' => $assessment->assessment_date?->format('M d, Y'),
                'teacher' => $assessment->teacher?->name,
            ];

            $bySubject[$subCode]['quarters'][$q]['total_score'] += $grade->score;
            $bySubject[$subCode]['quarters'][$q]['total_max'] += $assessment->max_score;

            $bySubject[$subCode]['total_score'] += $grade->score;
            $bySubject[$subCode]['total_max'] += $assessment->max_score;
        }

        // Calculate average percentages
        $overallPercentages = [];
        foreach ($bySubject as &$sub) {
            $sub['average_percentage'] = $sub['total_max'] > 0 
                ? round(($sub['total_score'] / $sub['total_max']) * 100, 1) 
                : 0;
            $sub['status'] = $sub['average_percentage'] >= 75 ? 'Passed' : 'Needs Improvement';
            $overallPercentages[] = $sub['average_percentage'];

            foreach ($sub['quarters'] as &$qData) {
                $qData['average_percentage'] = $qData['total_max'] > 0 
                    ? round(($qData['total_score'] / $qData['total_max']) * 100, 1) 
                    : 0;
            }
        }
        unset($sub);

        $generalAverage = count($overallPercentages) > 0 
            ? round(array_sum($overallPercentages) / count($overallPercentages), 1) 
            : 0;

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'lrn' => $student->lrn,
                'class' => $student->schoolClass?->name,
            ],
            'general_average' => $generalAverage,
            'academic_standing' => $generalAverage >= 90 ? 'With Honors' : ($generalAverage >= 75 ? 'Regular Standing' : 'Academic Warning'),
            'subjects' => array_values($bySubject),
        ]);
    }

    /**
     * Student view: My feedback history.
     */
    public function myFeedback(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $student = $user
            ? (Student::where('user_id', $user->id)->first()
                ?? Student::where('email', $user->email)->first())
            : null;

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student record not found.',
            ], 404);
        }

        $feedbacks = StudentFeedback::with(['teacher', 'subject', 'assessment'])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $feedbacks,
        ]);
    }

    /**
     * Admin view: School-wide assessment monitoring & performance indicators.
     */
    public function monitoring(): JsonResponse
    {
        $totalAssessments = Assessment::count();
        $totalGrades = AssessmentGrade::count();
        $passedGrades = AssessmentGrade::where('status', 'Passed')->count();
        $overallPassRate = $totalGrades > 0 ? round(($passedGrades / $totalGrades) * 100, 1) : 0;

        // Breakdown by subject
        $subjects = DB::table('subjects')
            ->leftJoin('assessments', 'subjects.id', '=', 'assessments.subject_id')
            ->leftJoin('assessment_grades', 'assessments.id', '=', 'assessment_grades.assessment_id')
            ->select(
                'subjects.id',
                'subjects.code',
                'subjects.name',
                'subjects.color',
                DB::raw('COUNT(DISTINCT assessments.id) as assessment_count'),
                DB::raw('COUNT(assessment_grades.id) as total_graded'),
                DB::raw('AVG(assessment_grades.percentage) as avg_percentage'),
                DB::raw("SUM(CASE WHEN assessment_grades.status = 'Passed' THEN 1 ELSE 0 END) as passed_count")
            )
            ->groupBy('subjects.id', 'subjects.code', 'subjects.name', 'subjects.color')
            ->get()
            ->map(function ($row) {
                $row->avg_percentage = $row->avg_percentage ? round($row->avg_percentage, 1) : 0;
                $row->pass_rate = $row->total_graded > 0 ? round(($row->passed_count / $row->total_graded) * 100, 1) : 0;
                return $row;
            });

        // Class summaries
        $classes = SchoolClass::withCount(['students', 'assessments'])->get()->map(function ($c) {
            $grades = AssessmentGrade::whereHas('assessment', fn($q) => $q->where('school_class_id', $c->id))->get();
            $c->avg_percentage = $grades->count() > 0 ? round($grades->avg('percentage'), 1) : 0;
            $c->pass_rate = $grades->count() > 0 ? round(($grades->where('status', 'Passed')->count() / $grades->count()) * 100, 1) : 0;
            return $c;
        });

        // Students needing improvement (average score < 75%)
        $studentsNeedingHelp = Student::with(['schoolClass', 'assessmentGrades.assessment.subject'])
            ->get()
            ->map(function ($student) {
                $grades = $student->assessmentGrades;
                $avg = $grades->count() > 0 ? round($grades->avg('percentage'), 1) : null;
                $failedCount = $grades->where('status', 'Failed')->count();
                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'lrn' => $student->lrn,
                    'class' => $student->schoolClass?->name,
                    'average' => $avg,
                    'failed_assessments' => $failedCount,
                    'needs_intervention' => $avg !== null && $avg < 75,
                ];
            })
            ->filter(fn($s) => $s['needs_intervention'])
            ->values();

        return response()->json([
            'success' => true,
            'summary' => [
                'total_assessments' => $totalAssessments,
                'total_graded' => $totalGrades,
                'overall_pass_rate' => $overallPassRate,
                'at_risk_count' => $studentsNeedingHelp->count(),
            ],
            'subjects' => $subjects,
            'classes' => $classes,
            'at_risk_students' => $studentsNeedingHelp,
        ]);
    }

    /**
     * Delete an assessment.
     */
    public function destroy(Assessment $assessment): JsonResponse
    {
        $assessment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assessment and related grades removed.',
        ]);
    }
}
