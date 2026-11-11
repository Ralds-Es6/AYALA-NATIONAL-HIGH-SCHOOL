<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SectionBreak;
use App\Services\ConflictDetectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionBreakController extends Controller
{
    public function __construct(
        protected ConflictDetectionService $conflictService
    ) {}

    /**
     * Display a listing of section / school breaks.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SectionBreak::with('schoolClass');

        if ($classId = $request->query('school_class_id')) {
            $query->where(function ($q) use ($classId) {
                $q->where('school_class_id', $classId)
                  ->orWhereNull('school_class_id');
            });
        }

        if ($day = $request->query('day_of_week')) {
            $query->where('day_of_week', $day);
        }

        $breaks = $query->orderByRaw("CASE day_of_week 
                WHEN 'Monday' THEN 1 
                WHEN 'Tuesday' THEN 2 
                WHEN 'Wednesday' THEN 3 
                WHEN 'Thursday' THEN 4 
                WHEN 'Friday' THEN 5 
                ELSE 6 END")
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $breaks,
        ]);
    }

    /**
     * Store a newly created break or breaks across multiple days.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'break_type' => ['required', 'string', 'in:lunch,morning,afternoon,custom'],
            'days' => ['nullable', 'array'],
            'days.*' => ['string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
            'day_of_week' => ['nullable', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'school_class_id' => ['nullable', 'exists:school_classes,id'],
        ]);

        $daysToApply = !empty($validated['days']) ? $validated['days'] : [$validated['day_of_week'] ?? 'Monday'];
        $classId = $validated['school_class_id'] ?? null;
        $startTime = $validated['start_time'];
        $endTime = $validated['end_time'];

        // 1. Check conflicts across each targeted day
        $conflicts = [];
        foreach ($daysToApply as $day) {
            $check = $this->conflictService->checkBreakConflict($classId, $day, $startTime, $endTime);
            if ($check['has_conflict']) {
                $conflicts = array_merge($conflicts, $check['conflicts']);
            }
        }

        if (!empty($conflicts)) {
            return response()->json([
                'success' => false,
                'status' => 'conflict',
                'message' => 'Break cannot be scheduled due to overlapping classes or breaks.',
                'conflicts' => $conflicts,
            ], 422);
        }

        // 2. Persist break for each day
        $createdBreaks = [];
        foreach ($daysToApply as $day) {
            $createdBreaks[] = SectionBreak::create([
                'school_class_id' => $classId,
                'name' => $validated['name'],
                'break_type' => $validated['break_type'],
                'day_of_week' => $day,
                'start_time' => $startTime,
                'end_time' => $endTime,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($createdBreaks) > 1 
                ? 'Break scheduled across ' . count($createdBreaks) . ' days successfully.' 
                : 'Break scheduled successfully.',
            'data' => $createdBreaks,
        ], 201);
    }

    /**
     * Update the specified break.
     */
    public function update(Request $request, SectionBreak $sectionBreak): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'break_type' => ['sometimes', 'string', 'in:lunch,morning,afternoon,custom'],
            'day_of_week' => ['sometimes', 'string', 'in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'school_class_id' => ['nullable', 'exists:school_classes,id'],
        ]);

        $dayOfWeek = $validated['day_of_week'] ?? $sectionBreak->day_of_week;
        $startTime = $validated['start_time'] ?? substr($sectionBreak->start_time, 0, 5);
        $endTime = $validated['end_time'] ?? substr($sectionBreak->end_time, 0, 5);
        $classId = array_key_exists('school_class_id', $validated) ? $validated['school_class_id'] : $sectionBreak->school_class_id;

        $check = $this->conflictService->checkBreakConflict($classId, $dayOfWeek, $startTime, $endTime, $sectionBreak->id);
        if ($check['has_conflict']) {
            return response()->json([
                'success' => false,
                'status' => 'conflict',
                'message' => 'Break cannot be updated due to conflict.',
                'conflicts' => $check['conflicts'],
            ], 422);
        }

        $sectionBreak->update([
            'name' => $validated['name'] ?? $sectionBreak->name,
            'break_type' => $validated['break_type'] ?? $sectionBreak->break_type,
            'day_of_week' => $dayOfWeek,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'school_class_id' => $classId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Break updated successfully.',
            'data' => $sectionBreak->fresh(['schoolClass']),
        ]);
    }

    /**
     * Remove the specified break.
     */
    public function destroy(SectionBreak $sectionBreak): JsonResponse
    {
        $sectionBreak->delete();

        return response()->json([
            'success' => true,
            'message' => 'Break removed successfully.',
        ]);
    }
}
