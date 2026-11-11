<?php

namespace App\Services;

use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use App\Models\Schedule;

class WorkloadMonitoringService
{
    /**
     * Get aggregate statistics and workload summaries for all teachers.
     */
    public function getWorkloadOverview(?string $academicYear = '2026-2027', ?string $term = '1st Quarter'): array
    {
        $teachers = Teacher::with(['teachingLoads' => function ($q) use ($academicYear, $term) {
            $q->where('academic_year', $academicYear)
              ->where('semester_or_quarter', $term)
              ->with(['subject', 'schoolClass']);
        }])->get();

        $summaries = [];
        $overloadedCount = 0;
        $normalCount = 0;
        $underloadCount = 0;
        $totalTeachingHours = 0;

        foreach ($teachers as $teacher) {
            $assignedHours = $teacher->teachingLoads->sum('teaching_hours');
            $distinctClassesCount = $teacher->teachingLoads->pluck('school_class_id')->unique()->count();
            $distinctSubjectsCount = $teacher->teachingLoads->pluck('subject_id')->unique()->count();
            $maxHours = $teacher->max_weekly_hours ?: 30;

            $status = 'Normal';
            if ($assignedHours > $maxHours) {
                $status = 'Overload';
                $overloadedCount++;
            } elseif ($assignedHours < 18 && $assignedHours > 0) {
                $status = 'Underload';
                $underloadCount++;
            } elseif ($assignedHours === 0) {
                $status = 'Unassigned';
                $underloadCount++;
            } else {
                $normalCount++;
            }

            $totalTeachingHours += $assignedHours;
            $utilization = round(($assignedHours / $maxHours) * 100, 1);

            $summaries[] = [
                'teacher_id' => $teacher->id,
                'name' => $teacher->name,
                'employee_id' => $teacher->employee_id,
                'email' => $teacher->email,
                'contact_number' => $teacher->contact_number,
                'position' => $teacher->position,
                'specialization' => $teacher->specialization,
                'max_weekly_hours' => $maxHours,
                'assigned_hours' => $assignedHours,
                'utilization_percentage' => $utilization,
                'status' => $status,
                'sections_count' => $distinctClassesCount,
                'subjects_count' => $distinctSubjectsCount,
                'teaching_loads' => $teacher->teachingLoads,
            ];
        }

        return [
            'academic_year' => $academicYear,
            'term' => $term,
            'total_teachers' => $teachers->count(),
            'total_classes' => SchoolClass::count(),
            'total_subjects' => Subject::count(),
            'total_schedules' => Schedule::count(),
            'total_teaching_hours' => $totalTeachingHours,
            'overloaded_teachers' => $overloadedCount,
            'normal_load_teachers' => $normalCount,
            'underload_teachers' => $underloadCount,
            'teacher_summaries' => $summaries,
        ];
    }
}
