<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WorkloadMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkloadMonitoringController extends Controller
{
    public function __construct(
        protected WorkloadMonitoringService $workloadService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $ay = $request->query('academic_year', '2026-2027');
        $term = $request->query('term', '1st Quarter');

        $data = $this->workloadService->getWorkloadOverview($ay, $term);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
