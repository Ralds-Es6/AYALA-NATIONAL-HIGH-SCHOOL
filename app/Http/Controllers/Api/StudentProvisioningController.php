<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StudentProvisioningController extends Controller
{
    /**
     * Supported official school documentation types physically presented during registration.
     */
    public const SUPPORTED_DOCUMENT_TYPES = [
        'Certificate of Registration (COR)',
        'School-issued identification',
        'Enrollment-related document',
        'Other valid school-approved supporting documentation',
    ];

    /**
     * List all provisioned students with search, section filter, and metadata.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user() ?? $request->user();
        $query = Student::with(['schoolClass', 'user', 'verifiedBy']);

        // Strict RBAC: If authenticated user is a teacher, restrict view exclusively to students in their managed classes
        if ($user && $user->role === 'teacher') {
            $teacher = Teacher::where('user_id', $user->id)->first()
                ?? Teacher::where('email', $user->email)->first();

            if ($teacher) {
                $teachingClassIds = Schedule::where('teacher_id', $teacher->id)->pluck('school_class_id')->toArray();
                $loadClassIds = TeachingLoad::where('teacher_id', $teacher->id)->pluck('school_class_id')->toArray();
                $advisingClassIds = SchoolClass::where('adviser_id', $teacher->id)->pluck('id')->toArray();
                $managedClassIds = array_values(array_unique(array_merge($teachingClassIds, $loadClassIds, $advisingClassIds)));

                $query->whereIn('school_class_id', $managedClassIds);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // 1. Text Search (Name, LRN, Email, Document Ref)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('lrn', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('document_reference', 'like', "%{$search}%");
            });
        }

        // 2. Filter by Class Section
        if ($classId = $request->input('school_class_id')) {
            $query->where('school_class_id', $classId);
        }

        // 3. Filter by Strand (e.g. STEM, HUMSS, ABM, GAS, TVL-ICT)
        if ($strand = $request->input('strand')) {
            $query->where(function ($q) use ($strand) {
                $q->where('strand', $strand)
                  ->orWhereHas('schoolClass', fn($cq) => $cq->where('strand', $strand));
            });
        }

        // 4. Filter by Grade Level (e.g. 11, 12)
        if ($grade = $request->input('grade_level')) {
            $query->whereHas('schoolClass', fn($cq) => $cq->where('grade_level', $grade));
        }

        // 5. Filter by Account Status (Active vs Suspended)
        if ($accStatus = $request->input('account_status')) {
            $query->whereHas('user', function ($q) use ($accStatus) {
                $q->where('account_status', $accStatus);
            });
        }

        $perPage = (int) $request->input('per_page', 20);
        $students = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Meaningful statistics for the admin dashboard
        $stats = [
            'total_students' => Student::count(),
            'active_accounts' => Student::whereHas('user', fn($q) => $q->where('account_status', 'active'))->count(),
            'suspended_accounts' => Student::whereHas('user', fn($q) => $q->where('account_status', 'suspended'))->count(),
            'sections_covered' => Student::distinct('school_class_id')->count('school_class_id'),
            'senior_high_students' => Student::whereHas('schoolClass', fn($q) => $q->whereIn('grade_level', [11, 12]))->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $students->items(),
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
            'stats' => $stats,
            'supported_document_types' => self::SUPPORTED_DOCUMENT_TYPES,
            'academic_tracks' => [
                'Academic Track' => ['STEM', 'HUMSS', 'ABM', 'GAS'],
                'TVL Track' => ['TVL-ICT', 'TVL-HE', 'TVL-IA'],
            ],
        ]);
    }

    /**
     * Real-time pre-submit duplicate account check.
     * Prevents duplicate registration attempts by LRN or Email.
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $lrn = trim($request->input('lrn', ''));
        $email = trim($request->input('email', ''));

        if (!$lrn && !$email) {
            return response()->json([
                'exists' => false,
                'message' => 'No lookup parameters provided.',
            ]);
        }

        // Check LRN duplicate in students table
        if ($lrn) {
            $existingByLrn = Student::with(['schoolClass', 'user'])->where('lrn', $lrn)->first();
            if ($existingByLrn) {
                return response()->json([
                    'exists' => true,
                    'conflict_field' => 'lrn',
                    'message' => "An account with LRN '{$lrn}' is already registered for {$existingByLrn->name}.",
                    'existing_student' => [
                        'id' => $existingByLrn->id,
                        'name' => $existingByLrn->name,
                        'lrn' => $existingByLrn->lrn,
                        'email' => $existingByLrn->email,
                        'class_name' => $existingByLrn->schoolClass?->name ?? 'Unassigned',
                        'account_status' => $existingByLrn->user?->account_status ?? 'active',
                    ],
                ]);
            }
        }

        // Check Email duplicate in users and students table
        if ($email) {
            $existingUser = User::where('email', $email)->first();
            $existingStudent = Student::with(['schoolClass'])->where('email', $email)->first();

            if ($existingUser || $existingStudent) {
                $name = $existingStudent?->name ?? $existingUser?->name ?? 'Existing User';
                $role = $existingUser?->role ?? 'student';

                return response()->json([
                    'exists' => true,
                    'conflict_field' => 'email',
                    'message' => "The email '{$email}' is already in use by {$name} (Role: {$role}).",
                    'existing_student' => [
                        'id' => $existingStudent?->id,
                        'name' => $name,
                        'email' => $email,
                        'class_name' => $existingStudent?->schoolClass?->name ?? 'N/A',
                        'role' => $role,
                    ],
                ]);
            }
        }

        return response()->json([
            'exists' => false,
            'message' => 'Unique reference. Ready for immediate account creation.',
        ]);
    }

    /**
     * Create fresh student account immediately upon admin save.
     * The student physically presents requirements during registration,
     * so saving immediately activates the new student account and generates credentials.
     */
    public function provision(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lrn' => ['required', 'string', 'max:50', 'unique:students,lrn'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email', 'unique:students,email'],
            'school_class_id' => ['required', 'exists:school_classes,id'],
            'track' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:50'],
            'document_type' => ['required', 'string', Rule::in(self::SUPPORTED_DOCUMENT_TYPES)],
            'document_reference' => ['nullable', 'string', 'max:100'],
            'custom_temp_password' => ['nullable', 'string', 'min:6', 'max:50'],
        ]);

        $adminUser = Auth::user();
        $schoolClass = SchoolClass::find($validated['school_class_id']);
        
        // Enforce Section Max Capacity
        if ($schoolClass) {
            $currentEnrolled = $schoolClass->students()->count();
            $maxCap = $schoolClass->max_capacity ?? 45;
            if ($currentEnrolled >= $maxCap) {
                return response()->json([
                    'success' => false,
                    'message' => "Section '{$schoolClass->name}' has reached its maximum capacity of {$maxCap} students ({$currentEnrolled}/{$maxCap} enrolled). Cannot enroll additional students. Please select an open section or create a new section.",
                ], 422);
            }
        }

        $track = $validated['track'] ?? $schoolClass?->track;
        $strand = $validated['strand'] ?? $schoolClass?->strand;

        return DB::transaction(function () use ($validated, $adminUser, $track, $strand, $schoolClass) {
            // Generate secure temporary password
            $tempPassword = !empty($validated['custom_temp_password'])
                ? $validated['custom_temp_password']
                : 'SRNHS-' . date('Y') . '!' . rand(100, 999);

            // Create fresh active User account immediately
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($tempPassword),
                'role' => 'student',
                'must_change_password' => true,
                'account_status' => 'active',
            ]);

            // Create Student record with verified documentation audit
            $student = Student::create([
                'user_id' => $user->id,
                'school_class_id' => $validated['school_class_id'],
                'track' => $track,
                'strand' => $strand,
                'lrn' => $validated['lrn'],
                'name' => $validated['name'],
                'email' => $validated['email'],
                'verification_status' => 'verified',
                'document_type' => $validated['document_type'],
                'document_reference' => $validated['document_reference'] ?? null,
                'verified_by' => $adminUser?->id,
                'verified_at' => now(),
            ]);

            $student->load(['schoolClass', 'user', 'verifiedBy']);

            return response()->json([
                'success' => true,
                'status' => 'success',
                'message' => "Fresh student account for {$student->name} successfully created.",
                'student' => $student,
                'credentials' => [
                    'name' => $student->name,
                    'lrn' => $student->lrn,
                    'email' => $student->email,
                    'temporary_password' => $tempPassword,
                    'must_change_password' => true,
                    'class_name' => $student->schoolClass?->name,
                    'track' => $student->track,
                    'strand' => $student->strand,
                ],
            ], 201);
        });
    }

    /**
     * Update account status (e.g. Active vs Suspended).
     */
    public function updateStatus(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'account_status' => ['required', 'string', 'in:active,suspended'],
        ]);

        if ($student->user) {
            $student->user->account_status = $validated['account_status'];
            $student->user->save();
        }

        $student->load(['schoolClass', 'user', 'verifiedBy']);

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Student account for {$student->name} is now {$validated['account_status']}.",
            'student' => $student,
        ]);
    }

    /**
     * Update student details (including section transfer).
     */
    public function update(Request $request, Student $student): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'lrn' => ['sometimes', 'string', 'max:50'],
            'email' => ['sometimes', 'email', 'max:255'],
            'school_class_id' => ['sometimes', 'exists:school_classes,id'],
            'track' => ['nullable', 'string', 'max:100'],
            'strand' => ['nullable', 'string', 'max:50'],
            'account_status' => ['nullable', 'string', 'in:active,transferred,dropped,suspended'],
        ]);

        if (!empty($validated['school_class_id']) && $validated['school_class_id'] != $student->school_class_id) {
            $targetClass = SchoolClass::find($validated['school_class_id']);
            if ($targetClass) {
                $currentEnrolled = $targetClass->students()->count();
                $maxCap = $targetClass->max_capacity ?? 45;
                if ($currentEnrolled >= $maxCap) {
                    return response()->json([
                        'success' => false,
                        'message' => "Section '{$targetClass->name}' has reached its maximum capacity of {$maxCap} students ({$currentEnrolled}/{$maxCap} enrolled). Cannot transfer student to a full section.",
                    ], 422);
                }
            }
        }

        $student->update($validated);

        if (isset($validated['name']) && $student->user) {
            $student->user->name = $validated['name'];
        }
        if (isset($validated['email']) && $student->user) {
            $student->user->email = $validated['email'];
        }
        if (isset($validated['account_status']) && $student->user) {
            $student->user->account_status = $validated['account_status'];
        }
        if ($student->user && $student->user->isDirty()) {
            $student->user->save();
        }

        $student->load(['schoolClass', 'user']);

        return response()->json([
            'success' => true,
            'message' => "Student {$student->name} updated successfully.",
            'student' => $student,
        ]);
    }

    /**
     * Get timetable schedule for a specific student's enrolled section.
     */
    public function getStudentSchedule(Student $student): JsonResponse
    {
        $classId = $student->school_class_id;
        $schoolClass = $student->schoolClass;

        if (!$classId) {
            return response()->json([
                'success' => true,
                'student' => $student,
                'class_info' => null,
                'schedules' => [],
            ]);
        }

        $schedules = \App\Models\Schedule::with(['subject', 'teacher', 'schoolClass'])
            ->where('school_class_id', $classId)
            ->get();

        return response()->json([
            'success' => true,
            'student' => $student,
            'class_info' => $schoolClass,
            'schedules' => $schedules,
        ]);
    }
}
