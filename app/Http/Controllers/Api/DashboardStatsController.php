<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TeachingLoadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardStatsController extends Controller
{
    public function __construct(
        protected TeachingLoadService $teachingLoadService
    ) {}

    /**
     * Get aggregate statistics and summary for the dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $academicYear = $request->query('academic_year', '2026-2027');
        $semester = $request->query('semester', '1st Semester');

        $stats = $this->teachingLoadService->getDashboardStats($academicYear, $semester);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
