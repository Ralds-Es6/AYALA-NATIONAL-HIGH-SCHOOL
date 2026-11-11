<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentGrade;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Generate printable faculty or class timetable schedule report.
     */
    public function schedulesReport(Request $request): JsonResponse
    {
        $type = $request->query('type', 'class'); // 'class' or 'teacher'
        $id = $request->query('id');

        $query = Schedule::with(['teacher', 'subject', 'schoolClass']);

        if ($type === 'teacher' && $id) {
            $query->where('teacher_id', $id);
            $target = Teacher::find($id);
            $targetName = $target ? $target->name . ' (' . $target->position . ')' : 'All Teachers';
        } elseif ($type === 'class' && $id) {
            $query->where('school_class_id', $id);
            $target = SchoolClass::find($id);
            $targetName = $target ? $target->name . ' (Room: ' . $target->room . ')' : 'All Classes';
        } else {
            $targetName = 'Institutional Master Schedule';
        }

        $schedules = $query->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'report_title' => 'Official Class / Faculty Timetable Schedule Report',
            'school_name' => 'Ayala National High School',
            'academic_year' => '2026-2027',
            'term' => '1st Quarter',
            'target_name' => $targetName,
            'generated_at' => now()->format('F d, Y h:i A'),
            'total_sessions' => $schedules->count(),
            'data' => $schedules,
        ]);
    }

    /**
     * Generate printable class assessment & grade master sheet report.
     */
    public function assessmentsReport(Request $request): JsonResponse
    {
        $classId = $request->query('school_class_id');
        $subjectId = $request->query('subject_id');
        $quarter = $request->query('quarter', '1st Quarter');

        $class = SchoolClass::with('adviser')->find($classId);
        $subject = Subject::find($subjectId);

        $assessmentsQuery = Assessment::with('teacher')->where('quarter', $quarter);
        if ($classId) $assessmentsQuery->where('school_class_id', $classId);
        if ($subjectId) $assessmentsQuery->where('subject_id', $subjectId);
        $assessments = $assessmentsQuery->orderBy('assessment_date')->get();

        $studentsQuery = Student::query();
        if ($classId) $studentsQuery->where('school_class_id', $classId);
        $students = $studentsQuery->orderBy('name')->get();

        $assessmentIds = $assessments->pluck('id');
        $grades = AssessmentGrade::whereIn('assessment_id', $assessmentIds)
            ->get()
            ->groupBy('student_id');

        $rows = $students->map(function ($student) use ($assessments, $grades) {
            $studentGrades = $grades->get($student->id, collect());
            $scoresMap = [];
            $totalPointsEarned = 0;
            $totalMaxPoints = 0;

            foreach ($assessments as $a) {
                $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                $score = $grade ? $grade->score : null;
                $scoresMap[$a->id] = $score;
                if ($score !== null) {
                    $totalPointsEarned += $score;
                    $totalMaxPoints += $a->max_score;
                }
            }

            $finalAvg = $totalMaxPoints > 0 ? round(($totalPointsEarned / $totalMaxPoints) * 100, 1) : 0;

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'lrn' => $student->lrn,
                'scores' => $scoresMap,
                'total_earned' => $totalPointsEarned,
                'total_max' => $totalMaxPoints,
                'percentage' => $finalAvg,
                'status' => $finalAvg >= 75 ? 'Passed' : 'Failed',
            ];
        });

        return response()->json([
            'success' => true,
            'report_title' => 'Official DepEd Assessment & Grading Master Sheet',
            'school_name' => 'Ayala National High School',
            'academic_year' => '2026-2027',
            'quarter' => $quarter,
            'class_name' => $class ? $class->name : 'All Sections',
            'adviser' => $class && $class->adviser ? $class->adviser->name : 'N/A',
            'subject_name' => $subject ? $subject->name . ' (' . $subject->code . ')' : 'All Subjects',
            'generated_at' => now()->format('F d, Y h:i A'),
            'assessments' => $assessments,
            'students' => $rows,
        ]);
    }

    /**
     * Institutional performance summary report.
     */
    public function performanceSummary(): JsonResponse
    {
        $classes = SchoolClass::withCount('students')->get();
        $classMetrics = $classes->map(function ($c) {
            $grades = AssessmentGrade::whereHas('assessment', fn($q) => $q->where('school_class_id', $c->id))->get();
            $avg = $grades->count() > 0 ? round($grades->avg('percentage'), 1) : 0;
            $passed = $grades->where('status', 'Passed')->count();
            $passRate = $grades->count() > 0 ? round(($passed / $grades->count()) * 100, 1) : 0;

            return [
                'class_id' => $c->id,
                'name' => $c->name,
                'grade_level' => $c->grade_level,
                'students_count' => $c->students_count,
                'average_score' => $avg,
                'pass_rate' => $passRate,
                'academic_status' => $passRate >= 80 ? 'Exemplary' : ($passRate >= 70 ? 'Satisfactory' : 'Needs Intervention'),
            ];
        });

        $subjects = Subject::withCount('teachingLoads')->get()->map(function ($s) {
            $grades = AssessmentGrade::whereHas('assessment', fn($q) => $q->where('subject_id', $s->id))->get();
            $avg = $grades->count() > 0 ? round($grades->avg('percentage'), 1) : 0;
            $passRate = $grades->count() > 0 ? round(($grades->where('status', 'Passed')->count() / $grades->count()) * 100, 1) : 0;

            return [
                'subject_id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'average' => $avg,
                'pass_rate' => $passRate,
            ];
        });

        return response()->json([
            'success' => true,
            'report_title' => 'Ayala NHS Institutional Academic Performance & Scheduling Summary',
            'school_name' => 'Ayala National High School',
            'academic_year' => '2026-2027',
            'generated_at' => now()->format('F d, Y h:i A'),
            'total_students' => Student::count(),
            'total_teachers' => Teacher::count(),
            'total_classes' => SchoolClass::count(),
            'total_schedules' => Schedule::count(),
            'classes' => $classMetrics,
            'subjects' => $subjects,
        ]);
    }
}
