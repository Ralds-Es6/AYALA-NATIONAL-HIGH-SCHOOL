<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subject::query();

        if ($grade = $request->query('grade_level')) {
            $query->where('grade_level', $grade);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $subjects = $query->orderBy('grade_level')->orderBy('code')->get();

        return response()->json([
            'success' => true,
            'data' => $subjects,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:subjects,code'],
            'name' => ['required', 'string', 'max:255'],
            'grade_level' => ['required', 'integer', 'min:7', 'max:12'],
            'weekly_hours' => ['required', 'integer', 'min:1', 'max:10'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $subject = Subject::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subject created successfully.',
            'data' => $subject,
        ], 201);
    }

    public function show(Subject $subject): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $subject,
        ]);
    }

    public function update(Request $request, Subject $subject): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:20', 'unique:subjects,code,' . $subject->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'grade_level' => ['sometimes', 'integer', 'min:7', 'max:12'],
            'weekly_hours' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $subject->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subject updated successfully.',
            'data' => $subject,
        ]);
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subject removed successfully.',
        ]);
    }
}
