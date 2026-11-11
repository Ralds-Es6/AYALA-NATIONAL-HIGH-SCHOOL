<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScheduleNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationLogController extends Controller
{
    /**
     * Display a listing of Gmail schedule notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ScheduleNotification::with('schedule.schoolClass', 'schedule.subject');

        if ($role = $request->query('role')) {
            $query->where('recipient_role', $role);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $logs = $query->latest()->take(100)->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
