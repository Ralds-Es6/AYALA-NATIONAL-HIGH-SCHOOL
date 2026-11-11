<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeachingLoad;
use App\Models\Schedule;
use App\Models\TeacherRbacLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    /**
     * Display a listing of teachers with their workload, RBAC permissions, qualified subjects, and schedules.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::with([
            'user',
            'teachingLoads.subject',
            'teachingLoads.schoolClass',
            'schedules.subject',
            'schedules.schoolClass',
            'rbacLogs',
        ]);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%")
                  ->orWhere('specialization', 'like', "%{$search}%");
            });
        }

        if ($specialization = $request->query('specialization')) {
            $query->where('specialization', $specialization);
        }

        if ($department = $request->query('department')) {
            $deptUpper = strtoupper($department);
            $query->where(function ($q) use ($deptUpper) {
                $q->where('department', $deptUpper)
                  ->orWhereJsonContains('departments', $deptUpper);
            });
        }

        $allSubjectsById = Subject::all()->keyBy('id');

        $teachers = $query->orderBy('name')->get()->map(function ($teacher) use ($allSubjectsById) {
            return $this->enrichTeacherPayload($teacher, $allSubjectsById);
        });

        return response()->json([
            'success' => true,
            'data' => $teachers,
        ]);
    }

    /**
     * Store a newly created teacher record with full RBAC, Department, Qualified Subjects, and Login Credentials.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'max:50', 'unique:teachers,employee_id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:teachers,email'],
            'password' => ['nullable', 'string', 'min:4', 'max:100'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'position' => ['nullable', 'string', 'max:100'],
            'specialization' => ['required', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'in:JHS,SHS'],
            'departments' => ['nullable', 'array'],
            'assigned_grade_level' => ['nullable', 'integer', 'min:7', 'max:12'],
            'qualified_subject_ids' => ['nullable', 'array'],
            'permissions' => ['nullable', 'array'],
            'max_weekly_hours' => ['nullable', 'integer', 'min:1', 'max:45'],
            'max_classes_per_day' => ['nullable', 'integer', 'min:1', 'max:9'],
        ]);

        $plainPassword = !empty($validated['password']) ? $validated['password'] : 'password123';
        $primaryDept = strtoupper($validated['department'] ?? ((int) ($validated['assigned_grade_level'] ?? 7) >= 11 ? 'SHS' : 'JHS'));
        $departmentsList = !empty($validated['departments']) && is_array($validated['departments'])
            ? array_values(array_unique(array_map('strtoupper', $validated['departments'])))
            : [$primaryDept];

        if (!in_array($primaryDept, $departmentsList, true)) {
            array_unshift($departmentsList, $primaryDept);
        }

        $defaultGrade = $validated['assigned_grade_level'] ?? ($primaryDept === 'SHS' ? 11 : 7);
        $qualifiedIds = isset($validated['qualified_subject_ids']) && is_array($validated['qualified_subject_ids'])
            ? array_values(array_unique(array_map('intval', $validated['qualified_subject_ids'])))
            : [];

        $permissions = array_merge([
            'can_encode_grades' => true,
            'is_adviser_eligible' => true,
            'is_department_head' => false,
        ], is_array($validated['permissions'] ?? null) ? $validated['permissions'] : []);

        // Create or update associated User account for Teacher Portal login
        $user = User::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'password' => Hash::make($plainPassword),
                'role' => 'teacher',
                'account_status' => 'active',
            ]
        );

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'employee_id' => $validated['employee_id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'] ?? null,
            'position' => !empty($validated['position']) ? $validated['position'] : 'Teacher I',
            'specialization' => $validated['specialization'],
            'department' => $primaryDept,
            'departments' => $departmentsList,
            'assigned_grade_level' => $defaultGrade,
            'qualified_subject_ids' => $qualifiedIds,
            'permissions' => $permissions,
            'max_weekly_hours' => $validated['max_weekly_hours'] ?? 30,
            'max_classes_per_day' => min(9, (int) ($validated['max_classes_per_day'] ?? 9)),
            'temporary_password' => $plainPassword,
        ]);

        $subjectNames = Subject::whereIn('id', $qualifiedIds)->pluck('name')->toArray();

        TeacherRbacLog::create([
            'teacher_id' => $teacher->id,
            'action_type' => 'account_created',
            'summary' => sprintf(
                'Created faculty account assigned to %s Department (%s) with %d authorized subject(s).',
                implode(' + ', $departmentsList),
                'Grade ' . $defaultGrade,
                count($qualifiedIds)
            ),
            'previous_state' => null,
            'new_state' => [
                'department' => $primaryDept,
                'departments' => $departmentsList,
                'assigned_grade_level' => $defaultGrade,
                'subjects' => $subjectNames,
                'permissions' => $permissions,
            ],
            'performed_by' => $request->user()?->name ?? 'System Administrator',
        ]);

        $teacher->load(['user', 'teachingLoads.subject', 'teachingLoads.schoolClass', 'schedules.subject', 'schedules.schoolClass', 'rbacLogs']);
        $allSubjectsById = Subject::all()->keyBy('id');

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Faculty profile, RBAC permissions, and login credentials created successfully.',
            'data' => $this->enrichTeacherPayload($teacher, $allSubjectsById),
        ], 201);
    }

    /**
     * Display the specified teacher.
     */
    public function show(Teacher $teacher): JsonResponse
    {
        $teacher->load([
            'user',
            'teachingLoads.subject',
            'teachingLoads.schoolClass',
            'schedules.subject',
            'schedules.schoolClass',
            'rbacLogs',
        ]);

        $allSubjectsById = Subject::all()->keyBy('id');

        return response()->json([
            'success' => true,
            'data' => $this->enrichTeacherPayload($teacher, $allSubjectsById),
        ]);
    }

    /**
     * Update teacher details, department transfer, qualified subjects, or RBAC permissions.
     */
    public function update(Request $request, Teacher $teacher): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['sometimes', 'string', 'max:50', 'unique:teachers,employee_id,' . $teacher->id],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:teachers,email,' . $teacher->id],
            'password' => ['nullable', 'string', 'min:4', 'max:100'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'position' => ['sometimes', 'string', 'max:100'],
            'specialization' => ['sometimes', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'in:JHS,SHS'],
            'departments' => ['nullable', 'array'],
            'assigned_grade_level' => ['nullable', 'integer', 'min:7', 'max:12'],
            'qualified_subject_ids' => ['nullable', 'array'],
            'permissions' => ['nullable', 'array'],
            'max_weekly_hours' => ['nullable', 'integer', 'min:1', 'max:45'],
            'max_classes_per_day' => ['nullable', 'integer', 'min:1', 'max:9'],
        ]);

        $oldDepts = $teacher->normalized_departments;
        $oldGrade = $teacher->assigned_grade_level;
        $oldSubjectIds = is_array($teacher->qualified_subject_ids) ? array_map('intval', $teacher->qualified_subject_ids) : [];
        $oldPerms = $teacher->normalized_permissions;

        if (isset($validated['department']) || isset($validated['departments'])) {
            $primaryDept = strtoupper($validated['department'] ?? $teacher->department ?? 'JHS');
            $depts = isset($validated['departments']) && is_array($validated['departments'])
                ? array_values(array_unique(array_map('strtoupper', $validated['departments'])))
                : [$primaryDept];
            if (!in_array($primaryDept, $depts, true)) {
                array_unshift($depts, $primaryDept);
            }
            $validated['department'] = $primaryDept;
            $validated['departments'] = $depts;
        }

        if (isset($validated['qualified_subject_ids']) && is_array($validated['qualified_subject_ids'])) {
            $newSubjectIds = array_values(array_unique(array_map('intval', $validated['qualified_subject_ids'])));
            $validated['qualified_subject_ids'] = $newSubjectIds;

            // DYNAMIC CASCADE: If subjects were revoked from this teacher,
            // automatically deallocate any teaching loads and associated timetable schedules
            $revokedLoads = TeachingLoad::where('teacher_id', $teacher->id)
                ->whereNotIn('subject_id', $newSubjectIds)
                ->get();

            foreach ($revokedLoads as $rLoad) {
                Schedule::where('teaching_load_id', $rLoad->id)->delete();
                $rLoad->delete();
            }
        }

        if (isset($validated['permissions']) && is_array($validated['permissions'])) {
            $validated['permissions'] = array_merge($oldPerms, $validated['permissions']);
        }

        if (isset($validated['max_classes_per_day'])) {
            $validated['max_classes_per_day'] = min(9, max(1, (int) $validated['max_classes_per_day']));
        }

        if (!empty($validated['password'])) {
            $validated['temporary_password'] = $validated['password'];
        }

        $updateData = collect($validated)->except(['password'])->toArray();
        $teacher->update($updateData);

        if ($teacher->user) {
            $userUpdate = [
                'name' => $teacher->name,
                'email' => $teacher->email,
            ];
            if (!empty($validated['password'])) {
                $userUpdate['password'] = Hash::make($validated['password']);
            }
            $teacher->user->update($userUpdate);
        }

        $actor = $request->user()?->name ?? 'System Administrator';
        $newDepts = $teacher->fresh()->normalized_departments;
        $newGrade = $teacher->fresh()->assigned_grade_level;
        $newSubjectIds = is_array($teacher->fresh()->qualified_subject_ids) ? array_map('intval', $teacher->fresh()->qualified_subject_ids) : [];
        $newPerms = $teacher->fresh()->normalized_permissions;

        // 1. Audit Department / Grade Transfer
        if ($oldDepts !== $newDepts || (int) $oldGrade !== (int) $newGrade) {
            TeacherRbacLog::create([
                'teacher_id' => $teacher->id,
                'action_type' => 'department_transfer',
                'summary' => sprintf(
                    'Department/Grade updated from [%s • Grade %s] to [%s • Grade %s].',
                    implode(', ', $oldDepts),
                    $oldGrade ?: 'N/A',
                    implode(', ', $newDepts),
                    $newGrade ?: 'N/A'
                ),
                'previous_state' => ['departments' => $oldDepts, 'grade_level' => $oldGrade],
                'new_state' => ['departments' => $newDepts, 'grade_level' => $newGrade],
                'performed_by' => $actor,
            ]);
        }

        // 2. Audit Qualified Subject Assignment Changes
        $oldSorted = $oldSubjectIds;
        $newSorted = $newSubjectIds;
        sort($oldSorted);
        sort($newSorted);
        if ($oldSorted !== $newSorted) {
            $oldNames = Subject::whereIn('id', $oldSorted)->pluck('name')->toArray();
            $newNames = Subject::whereIn('id', $newSorted)->pluck('name')->toArray();
            TeacherRbacLog::create([
                'teacher_id' => $teacher->id,
                'action_type' => 'subject_assignment',
                'summary' => sprintf(
                    'Updated qualified subject allocations (%d authorized subject(s): %s).',
                    count($newNames),
                    count($newNames) > 0 ? implode(', ', array_slice($newNames, 0, 4)) . (count($newNames) > 4 ? '...' : '') : 'None'
                ),
                'previous_state' => ['subjects' => $oldNames],
                'new_state' => ['subjects' => $newNames],
                'performed_by' => $actor,
            ]);
        }

        // 3. Audit Permission Changes
        if ($oldPerms !== $newPerms) {
            TeacherRbacLog::create([
                'teacher_id' => $teacher->id,
                'action_type' => 'permission_update',
                'summary' => 'Updated RBAC access permissions and faculty role privileges.',
                'previous_state' => $oldPerms,
                'new_state' => $newPerms,
                'performed_by' => $actor,
            ]);
        }

        $teacher->load(['user', 'teachingLoads.subject', 'teachingLoads.schoolClass', 'schedules.subject', 'schedules.schoolClass', 'rbacLogs']);
        $allSubjectsById = Subject::all()->keyBy('id');

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => 'Faculty RBAC profile and assignments updated successfully.',
            'data' => $this->enrichTeacherPayload($teacher, $allSubjectsById),
        ]);
    }

    /**
     * Remove the specified teacher.
     */
    public function destroy(Teacher $teacher): JsonResponse
    {
        if ($teacher->user) {
            $teacher->user->delete();
        }
        $teacher->delete();

        return response()->json([
            'success' => true,
            'status' => 'delete_success',
            'message' => 'Teacher record removed.',
        ]);
    }

    /**
     * Helper to attach computed RBAC, daily class counts, and qualified subject models.
     */
    private function enrichTeacherPayload(Teacher $teacher, $allSubjectsById): Teacher
    {
        $schedules = $teacher->schedules ?? collect();
        $loads = $teacher->teachingLoads ?? collect();

        // Calculate hours from both schedules and teachingLoads
        $scheduledCount = $schedules->count();
        $assignedHours = max($loads->sum('teaching_hours'), $scheduledCount);
        $maxHours = $teacher->max_weekly_hours ?: 30;

        $teacher->assigned_hours = $assignedHours;
        $teacher->utilization_percentage = round(($assignedHours / $maxHours) * 100, 1);
        $teacher->is_overloaded = $assignedHours > $maxHours;

        // Daily session counts (Monday - Friday) to monitor the 9 classes/day limit
        $dailyCounts = [
            'Monday' => 0,
            'Tuesday' => 0,
            'Wednesday' => 0,
            'Thursday' => 0,
            'Friday' => 0,
        ];
        foreach ($schedules as $s) {
            if (isset($dailyCounts[$s->day_of_week])) {
                $dailyCounts[$s->day_of_week]++;
            }
        }
        $teacher->daily_schedule_counts = $dailyCounts;
        $teacher->max_daily_count = max($dailyCounts);

        // Resolve qualified subjects array
        $qIds = is_array($teacher->qualified_subject_ids) ? $teacher->qualified_subject_ids : [];
        $teacher->qualified_subjects = collect($qIds)
            ->map(fn ($id) => $allSubjectsById->get((int) $id))
            ->filter()
            ->values();

        return $teacher;
    }
}
