<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\TeachingLoad;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class TeachingLoadService
{
    /**
     * Get aggregate statistics for the dashboard.
     */
    public function getDashboardStats(?string $academicYear = '2026-2027', ?string $semester = '1st Semester'): array
    {
        $totalInstructors = Instructor::count();
        $totalCourses = Course::count();
        
        $termLoads = TeachingLoad::with('course', 'instructor')
            ->forTerm($academicYear, $semester)
            ->get();

        $assignedLoadsCount = $termLoads->count();
        $totalAssignedUnits = $termLoads->sum(fn ($load) => $load->course->units ?? 0);

        // Calculate overloaded instructors
        $instructorsWithLoads = Instructor::with(['teachingLoads' => function ($query) use ($academicYear, $semester) {
            $query->forTerm($academicYear, $semester)->with('course');
        }])->get();

        $overloadedCount = 0;
        $totalCapacity = 0;
        $totalUsedCapacity = 0;

        foreach ($instructorsWithLoads as $instructor) {
            $units = $instructor->teachingLoads->sum(fn ($load) => $load->course->units ?? 0);
            $totalCapacity += $instructor->max_units;
            $totalUsedCapacity += $units;

            if ($units > $instructor->max_units) {
                $overloadedCount++;
            }
        }

        $capacityUtilization = $totalCapacity > 0 
            ? round(($totalUsedCapacity / $totalCapacity) * 100, 1) 
            : 0;

        return [
            'academic_year' => $academicYear,
            'semester' => $semester,
            'total_instructors' => $totalInstructors,
            'total_courses' => $totalCourses,
            'total_assigned_loads' => $assignedLoadsCount,
            'total_assigned_units' => $totalAssignedUnits,
            'overloaded_instructors' => $overloadedCount,
            'capacity_utilization_percentage' => $capacityUtilization,
            'recent_assignments' => TeachingLoad::with(['instructor', 'course'])
                ->latest()
                ->take(5)
                ->get(),
        ];
    }

    /**
     * Calculate current assigned units for an instructor in a given term.
     */
    public function getInstructorUnits(int $instructorId, string $academicYear, string $semester, ?int $excludeLoadId = null): int
    {
        $query = TeachingLoad::where('instructor_id', $instructorId)
            ->where('academic_year', $academicYear)
            ->where('semester', $semester);

        if ($excludeLoadId) {
            $query->where('id', '!=', $excludeLoadId);
        }

        return (int) $query->with('course')->get()->sum(fn ($load) => $load->course->units ?? 0);
    }

    /**
     * Assign a teaching load after verifying capacity rules.
     */
    public function assignLoad(array $data): TeachingLoad
    {
        $instructor = Instructor::findOrFail($data['instructor_id']);
        $course = Course::findOrFail($data['course_id']);

        $academicYear = $data['academic_year'] ?? '2026-2027';
        $semester = $data['semester'] ?? '1st Semester';

        $currentUnits = $this->getInstructorUnits($instructor->id, $academicYear, $semester);
        $projectedUnits = $currentUnits + $course->units;

        // If strict overload check is requested or note warning
        $isOverload = $projectedUnits > $instructor->max_units;

        $load = TeachingLoad::create([
            'instructor_id' => $instructor->id,
            'course_id' => $course->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
            'section' => $data['section'],
            'schedule' => $data['schedule'],
            'room' => $data['room'],
            'status' => $data['status'] ?? ($isOverload ? 'Overload' : 'Assigned'),
        ]);

        return $load->load(['instructor', 'course']);
    }

    /**
     * Update an existing teaching load.
     */
    public function updateLoad(TeachingLoad $load, array $data): TeachingLoad
    {
        $instructorId = $data['instructor_id'] ?? $load->instructor_id;
        $courseId = $data['course_id'] ?? $load->course_id;
        $academicYear = $data['academic_year'] ?? $load->academic_year;
        $semester = $data['semester'] ?? $load->semester;

        $instructor = Instructor::findOrFail($instructorId);
        $course = Course::findOrFail($courseId);

        $currentUnits = $this->getInstructorUnits($instructor->id, $academicYear, $semester, $load->id);
        $projectedUnits = $currentUnits + $course->units;
        $isOverload = $projectedUnits > $instructor->max_units;

        $data['status'] = $data['status'] ?? ($isOverload ? 'Overload' : 'Assigned');

        $load->update($data);

        return $load->fresh(['instructor', 'course']);
    }

    /**
     * Get instructors along with their assigned units and workload capacity summary.
     */
    public function getInstructorWorkloadSummary(?string $academicYear = '2026-2027', ?string $semester = '1st Semester'): Collection
    {
        $instructors = Instructor::with(['teachingLoads' => function ($query) use ($academicYear, $semester) {
            $query->forTerm($academicYear, $semester)->with('course');
        }])->get();

        return $instructors->map(function ($instructor) {
            $assignedUnits = $instructor->teachingLoads->sum(fn ($load) => $load->course->units ?? 0);
            $loadCount = $instructor->teachingLoads->count();
            $utilization = $instructor->max_units > 0 
                ? round(($assignedUnits / $instructor->max_units) * 100, 1) 
                : 0;

            $instructor->current_assigned_units = $assignedUnits;
            $instructor->loads_count = $loadCount;
            $instructor->utilization_percentage = $utilization;
            $instructor->is_overloaded = $assignedUnits > $instructor->max_units;

            return $instructor;
        });
    }
}
