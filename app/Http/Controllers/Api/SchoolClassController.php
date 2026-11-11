<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SchoolClass::with(['adviser', 'students'])->withCount(['students', 'schedules']);

        if ($grade = $request->query('grade_level')) {
            $query->where('grade_level', $grade);
        }

        $classes = $query->orderBy('grade_level')->orderBy('section')->get();

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:school_classes,name'],
            'grade_level' => ['required', 'integer', 'min:7', 'max:12'],
            'section' => ['required', 'string', 'max:80'],
            'adviser_id' => ['nullable', 'exists:teachers,id'],
            'room' => ['nullable', 'string', 'max:150'],
            'track' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:50'],
            'max_capacity' => ['nullable', 'integer', 'min:1', 'max:120'],
            'shift' => ['nullable', 'string', 'max:60'],
            'operating_days' => ['nullable', 'array'],
        ]);

        if (empty($validated['max_capacity'])) {
            $validated['max_capacity'] = 45;
        }
        if (empty($validated['shift'])) {
            $validated['shift'] = 'Whole Day Shift';
        }

        // DepEd Policy Constraint: 1 Teacher can advise at most 1 Classroom Section
        if (!empty($validated['adviser_id'])) {
            $existingClass = SchoolClass::where('adviser_id', $validated['adviser_id'])->first();
            if ($existingClass) {
                return response()->json([
                    'success' => false,
                    'message' => "This teacher is already assigned as Class Adviser to \"{$existingClass->name}\". Under DepEd regulations, a teacher can advise at most one class section.",
                ], 422);
            }
        }

        $class = SchoolClass::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Classroom section created successfully.',
            'data' => $class->load('adviser')->loadCount(['students', 'schedules']),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $schoolClass = SchoolClass::with([
            'adviser',
            'students.user',
            'teachingLoads.teacher',
            'teachingLoads.subject',
            'schedules.teacher',
            'schedules.subject',
        ])->withCount(['students', 'schedules'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $schoolClass,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $schoolClass = SchoolClass::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120', 'unique:school_classes,name,' . $schoolClass->id],
            'grade_level' => ['sometimes', 'integer', 'min:7', 'max:12'],
            'section' => ['sometimes', 'string', 'max:80'],
            'adviser_id' => ['nullable', 'exists:teachers,id'],
            'room' => ['nullable', 'string', 'max:150'],
            'track' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:50'],
            'max_capacity' => ['nullable', 'integer', 'min:1', 'max:120'],
            'shift' => ['nullable', 'string', 'max:60'],
            'operating_days' => ['nullable', 'array'],
        ]);

        // DepEd Policy Constraint: 1 Teacher can advise at most 1 Classroom Section
        if (array_key_exists('adviser_id', $validated) && !empty($validated['adviser_id'])) {
            $existingClass = SchoolClass::where('adviser_id', $validated['adviser_id'])
                ->where('id', '!=', $id)
                ->first();
            if ($existingClass) {
                return response()->json([
                    'success' => false,
                    'message' => "This teacher is already assigned as Class Adviser to \"{$existingClass->name}\". Under DepEd regulations, a teacher can advise at most one class section.",
                ], 422);
            }
        }

        $schoolClass->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Classroom settings updated successfully.',
            'data' => $schoolClass->fresh(['adviser', 'students'])->loadCount(['students', 'schedules']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $schoolClass = SchoolClass::findOrFail($id);
        $schoolClass->delete();

        return response()->json([
            'success' => true,
            'message' => 'Classroom section removed successfully.',
        ]);
    }
}
