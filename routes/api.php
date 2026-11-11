<?php

use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationLogController;
use App\Http\Controllers\Api\PublicLandingController;
use App\Http\Controllers\Api\QuarterlyGradeController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SectionBreakController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\StudentProvisioningController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\TeacherPortalController;
use App\Http\Controllers\Api\TeachingLoadController;
use App\Http\Controllers\Api\WorkloadMonitoringController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Ayala National High School Automated Scheduling & Assessment Tracker API
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 0. Public Landing Page & Sandbox Endpoints
    Route::prefix('public')->group(function () {
        Route::get('/landing-data', [PublicLandingController::class, 'index']);
        Route::post('/check-conflict', [PublicLandingController::class, 'checkConflict']);
        Route::get('/lookup-lrn', [PublicLandingController::class, 'lookupLrn']);
    });

    // 1. Public / Shared Authentication Endpoints
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/switch-demo-user', [AuthController::class, 'switchDemoUser']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // 2. Administrator Management Endpoints (Strictly role:admin)
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('teachers', TeacherController::class);
        Route::apiResource('classes', SchoolClassController::class);
        Route::apiResource('subjects', SubjectController::class);
        Route::apiResource('teaching-loads', TeachingLoadController::class);

        // Schedule Management, Conflict Detection & Automated Generation
        Route::post('schedules/check-conflict', [ScheduleController::class, 'checkConflict']);
        Route::post('schedules/auto-generate', [ScheduleController::class, 'autoGenerate']);
        Route::apiResource('schedules', ScheduleController::class);
        Route::apiResource('section-breaks', SectionBreakController::class);

        // Student Account Management & Schedule Verification
        Route::post('students/check-duplicate', [StudentProvisioningController::class, 'checkDuplicate']);
        Route::post('students/provision', [StudentProvisioningController::class, 'provision']);
        Route::put('students/{student}', [StudentProvisioningController::class, 'update']);
        Route::put('students/{student}/status', [StudentProvisioningController::class, 'updateStatus']);
        Route::post('students/{student}/reset-credentials', [StudentProvisioningController::class, 'resetCredentials']);
        Route::get('students/{student}/schedule', [StudentProvisioningController::class, 'getStudentSchedule']);

        // Assessment Tracking & Monitoring
        Route::get('assessments/monitoring', [AssessmentController::class, 'monitoring']);
        Route::apiResource('assessments', AssessmentController::class);

        // Academic Reports
        Route::get('reports/schedules', [ReportController::class, 'schedulesReport']);
        Route::get('reports/assessments', [ReportController::class, 'assessmentsReport']);
        Route::get('reports/performance-summary', [ReportController::class, 'performanceSummary']);

        // Workload Monitoring & Notification Logs
        Route::get('workload-monitoring', [WorkloadMonitoringController::class, 'index']);
        Route::get('notifications', [NotificationLogController::class, 'index']);
    });

    // Shared Student Directory Endpoint (Admin views all, Teachers view their managed class sections)
    Route::middleware(['role:admin,teacher'])->group(function () {
        Route::get('students', [StudentProvisioningController::class, 'index']);
    });

    // Shared / Role-Scoped Quarterly Grading System (Teachers & Admin Oversight)
    Route::middleware(['role:admin,teacher'])->prefix('quarterly-grades')->group(function () {
        Route::get('/contexts', [QuarterlyGradeController::class, 'getTeacherManagedContexts']);
        Route::get('/matrix', [QuarterlyGradeController::class, 'getGradeMatrix']);
        Route::post('/batch-save', [QuarterlyGradeController::class, 'batchSaveGrades']);
    });

    // 3. Teacher Portal Endpoints (Strictly role:teacher)
    Route::middleware(['role:teacher'])->prefix('teacher-portal')->group(function () {
        Route::get('/my-loads', [TeacherPortalController::class, 'myLoads']);
        Route::get('/my-schedule', [TeacherPortalController::class, 'mySchedule']);

        // Assessment & Gradebook
        Route::get('/assessments', [AssessmentController::class, 'index']);
        Route::post('/assessments', [AssessmentController::class, 'store']);
        Route::get('/assessments/{assessment}/sheet', [AssessmentController::class, 'getGradingSheet']);
        Route::post('/assessments/{assessment}/grades', [AssessmentController::class, 'saveGrades']);
        Route::delete('/assessments/{assessment}', [AssessmentController::class, 'destroy']);
        Route::post('/feedback', [AssessmentController::class, 'storeFeedback']);
    });

    // 4. Student Portal Endpoints (Strictly role:student)
    Route::middleware(['role:student'])->prefix('student-portal')->group(function () {
        Route::get('/my-schedule', [StudentPortalController::class, 'mySchedule']);
        Route::get('/my-report-card', [QuarterlyGradeController::class, 'myReportCard']);
        Route::get('/my-assessments', [AssessmentController::class, 'myAssessments']);
        Route::get('/my-feedback', [AssessmentController::class, 'myFeedback']);
    });
});
