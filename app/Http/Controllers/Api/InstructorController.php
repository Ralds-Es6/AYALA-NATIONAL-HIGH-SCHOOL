<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInstructorRequest;
use App\Models\Instructor;
use App\Services\TeachingLoadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function __construct(
        protected TeachingLoadService $teachingLoadService
    ) {}

    /**
     * Display a listing of instructors.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Instructor::query();

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        $academicYear = $request->query('academic_year', '2026-2027');
        $semester = $request->query('semester', '1st Semester');

        $instructors = $this->teachingLoadService->getInstructorWorkloadSummary($academicYear, $semester);

        return response()->json([
            'success' => true,
            'data' => $instructors,
        ]);
    }

    /**
     * Store a newly created instructor.
     */
    public function store(StoreInstructorRequest $request): JsonResponse
    {
        $instructor = Instructor::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Instructor created successfully.',
            'data' => $instructor,
        ], 201);
    }

    /**
     * Display the specified instructor.
     */
    public function show(Instructor $instructor): JsonResponse
    {
        $instructor->load(['teachingLoads.course']);

        return response()->json([
            'success' => true,
            'data' => $instructor,
        ]);
    }

    /**
     * Update the specified instructor.
     */
    public function update(Request $request, Instructor $instructor): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:instructors,email,' . $instructor->id],
            'department' => ['sometimes', 'string', 'max:100'],
            'employment_type' => ['sometimes', 'string', 'in:Full-Time,Part-Time,Adjunct'],
            'max_units' => ['sometimes', 'integer', 'min:3', 'max:36'],
        ]);

        $instructor->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Instructor updated successfully.',
            'data' => $instructor,
        ]);
    }

    /**
     * Remove the specified instructor.
     */
    public function destroy(Instructor $instructor): JsonResponse
    {
        $instructor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Instructor deleted successfully.',
        ]);
    }
}
