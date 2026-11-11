<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeachingLoadController extends Controller
{
    /**
     * Display a listing of teaching loads with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = TeachingLoad::with(['teacher', 'subject', 'schoolClass', 'schedules']);

        if ($teacherId = $request->query('teacher_id')) {
            $query->where('teacher_id', $teacherId);
        }

        if ($classId = $request->query('school_class_id')) {
            $query->where('school_class_id', $classId);
        }

        if ($ay = $request->query('academic_year')) {
            $query->where('academic_year', $ay);
        }

        if ($term = $request->query('term')) {
            $query->where('semester_or_quarter', $term);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('teacher', fn ($tq) => $tq->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('subject', fn ($sq) => $sq->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
                  ->orWhereHas('schoolClass', fn ($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        $loads = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $loads,
        ]);
    }

    /**
     * Store a newly created teaching load.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'teacher_id' => ['required', 'exists:teachers,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'semester_or_quarter' => ['nullable', 'string', 'max:50'],
            'teaching_hours' => ['required', 'integer', 'min:1', 'max:15'],
        ]);

        $ay = $validated['academic_year'] ?? '2026-2027';
        $term = $validated['semester_or_quarter'] ?? '1st Quarter';

        $teacher = Teacher::findOrFail($validated['teacher_id']);
        $schoolClass = SchoolClass::findOrFail($validated['school_class_id']);

        if (!$teacher->isAuthorizedForGrade((int) $schoolClass->grade_level)) {
            return response()->json([
                'success' => false,
                'status' => 'conflict',
                'message' => "Grade-Level Constraint Error: {$teacher->name} is assigned to Grade {$teacher->assigned_grade_level} for this academic year and cannot teach {$schoolClass->name} (Grade {$schoolClass->grade_level}).",
            ], 422);
        }

        // Check if exact assignment already exists
        $exists = TeachingLoad::where('teacher_id', $validated['teacher_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('school_class_id', $validated['school_class_id'])
            ->where('academic_year', $ay)
            ->where('semester_or_quarter', $term)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'status' => 'conflict',
                'character' => [
                    'expression' => 'worried',
                    'motion' => 'panic',
                ],
                'message' => 'This teacher is already assigned to this subject and class for the selected term.',
            ], 422);
        }

        $load = TeachingLoad::create([
            ...$validated,
            'academic_year' => $ay,
            'semester_or_quarter' => $term,
        ]);

        // Check if teacher reaches/exceeds workload capacity
        $teacher = Teacher::find($validated['teacher_id']);
        $totalHours = TeachingLoad::where('teacher_id', $teacher->id)
            ->where('academic_year', $ay)
            ->where('semester_or_quarter', $term)
            ->sum('teaching_hours');

        $isOverload = $totalHours > ($teacher->max_weekly_hours ?: 30);

        return response()->json([
            'success' => true,
            'status' => $isOverload ? 'warning' : 'success',
            'character' => $isOverload ? [
                'expression' => 'concerned',
                'motion' => 'concerned',
            ] : [
                'expression' => 'happy',
                'motion' => 'celebrate',
            ],
            'message' => $isOverload 
                ? "Teaching load assigned. Warning: Teacher now has {$totalHours} hrs (Overload limit is {$teacher->max_weekly_hours} hrs)."
                : 'Teaching load assigned successfully.',
            'warning' => $isOverload,
            'data' => $load->load(['teacher', 'subject', 'schoolClass']),
        ], 201);
    }

    /**
     * Display the specified teaching load.
     */
    public function show(TeachingLoad $teachingLoad): JsonResponse
    {
        $teachingLoad->load(['teacher', 'subject', 'schoolClass', 'schedules']);

        return response()->json([
            'success' => true,
            'data' => $teachingLoad,
        ]);
    }

    /**
     * Update the teaching load.
     */
    public function update(Request $request, TeachingLoad $teachingLoad): JsonResponse
    {
        $validated = $request->validate([
            'teacher_id' => ['sometimes', 'exists:teachers,id'],
            'subject_id' => ['sometimes', 'exists:subjects,id'],
            'school_class_id' => ['sometimes', 'exists:school_classes,id'],
            'academic_year' => ['sometimes', 'string', 'max:20'],
            'semester_or_quarter' => ['sometimes', 'string', 'max:50'],
            'teaching_hours' => ['sometimes', 'integer', 'min:1', 'max:15'],
        ]);

        $teachingLoad->update($validated);

        // DYNAMIC SCHEDULE SYNC:
        // If teacher_id, subject_id, or school_class_id was modified on this teaching load,
        // automatically propagate changes to all associated room timetable schedules!
        $scheduleUpdates = [];
        if (isset($validated['teacher_id'])) {
            $scheduleUpdates['teacher_id'] = $validated['teacher_id'];
        }
        if (isset($validated['subject_id'])) {
            $scheduleUpdates['subject_id'] = $validated['subject_id'];
        }
        if (isset($validated['school_class_id'])) {
            $scheduleUpdates['school_class_id'] = $validated['school_class_id'];
        }
        if (!empty($scheduleUpdates)) {
            Schedule::where('teaching_load_id', $teachingLoad->id)->update($scheduleUpdates);
        }

        return response()->json([
            'success' => true,
            'message' => 'Teaching load updated successfully.',
            'data' => $teachingLoad->fresh(['teacher', 'subject', 'schoolClass']),
        ]);
    }

    /**
     * Remove the teaching load.
     */
    public function destroy(TeachingLoad $teachingLoad): JsonResponse
    {
        // Explicitly clear associated room timetable slots for this load
        Schedule::where('teaching_load_id', $teachingLoad->id)->delete();
        $teachingLoad->delete();

        return response()->json([
            'success' => true,
            'status' => 'delete_success',
            'operation' => 'delete',
            'character' => [
                'expression' => 'crying',
                'motion' => 'cry',
            ],
            'message' => 'Teaching load allocation removed successfully.',
        ]);
    }
}
