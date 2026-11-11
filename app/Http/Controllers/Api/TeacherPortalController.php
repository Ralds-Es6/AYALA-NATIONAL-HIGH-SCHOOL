<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeacherPortalController extends Controller
{
    /**
     * Strictly resolve the authenticated teacher's own record.
     * Prevents Teacher A from viewing Teacher B's records.
     */
    protected function getActiveTeacher(Request $request): ?Teacher
    {
        $user = Auth::user();

        if ($user && $user->role === 'teacher') {
            return Teacher::where('user_id', $user->id)->first() 
                ?? Teacher::where('email', $user->email)->first();
        }

        return null;
    }

    /**
     * View "My Teaching Loads" - Scoped strictly to authenticated teacher.
     */
    public function myLoads(Request $request): JsonResponse
    {
        $teacher = $this->getActiveTeacher($request);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => 'Teacher profile not linked or found for this account.',
                'character' => [
                    'expression' => 'confused',
                    'motion' => 'look_around'
                ]
            ], 404);
        }

        $loads = TeachingLoad::with(['subject', 'schoolClass', 'schedules'])
            ->where('teacher_id', $teacher->id)
            ->get();

        $totalHours = $loads->sum('teaching_hours');

        return response()->json([
            'success' => true,
            'status' => 'success',
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'employee_id' => $teacher->employee_id,
                'position' => $teacher->position,
                'specialization' => $teacher->specialization,
                'email' => $teacher->email,
                'contact_number' => $teacher->contact_number,
                'max_weekly_hours' => $teacher->max_weekly_hours ?: 30,
                'total_assigned_hours' => $totalHours,
            ],
            'data' => $loads,
        ]);
    }

    /**
     * View "My Schedule" (Weekly Timetable) - Scoped strictly to authenticated teacher.
     */
    public function mySchedule(Request $request): JsonResponse
    {
        $teacher = $this->getActiveTeacher($request);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'status' => 'not_found',
                'message' => 'Teacher profile not linked or found for this account.',
                'character' => [
                    'expression' => 'confused',
                    'motion' => 'look_around'
                ]
            ], 404);
        }

        $schedules = Schedule::with(['subject', 'schoolClass'])
            ->where('teacher_id', $teacher->id)
            ->orderByRaw("CASE day_of_week 
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
            'status' => 'success',
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'position' => $teacher->position,
                'specialization' => $teacher->specialization,
            ],
            'data' => $schedules,
        ]);
    }
}
