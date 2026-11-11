<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_id',
        'name',
        'email',
        'contact_number',
        'position',
        'specialization',
        'department',
        'departments',
        'assigned_grade_level',
        'qualified_subject_ids',
        'permissions',
        'max_weekly_hours',
        'max_classes_per_day',
        'temporary_password',
    ];

    protected $casts = [
        'departments' => 'array',
        'assigned_grade_level' => 'integer',
        'qualified_subject_ids' => 'array',
        'permissions' => 'array',
        'max_weekly_hours' => 'integer',
        'max_classes_per_day' => 'integer',
    ];

    protected $appends = [
        'department_stage',
        'normalized_departments',
        'normalized_permissions',
    ];

    public function getDepartmentStageAttribute(): string
    {
        $dept = strtoupper(trim((string) ($this->department ?: '')));
        if ($dept === 'SHS') {
            return 'Senior High School';
        }
        if ($dept === 'JHS') {
            return 'Junior High School';
        }
        $grade = (int) ($this->assigned_grade_level ?: 7);
        return $grade >= 11 ? 'Senior High School' : 'Junior High School';
    }

    public function getNormalizedDepartmentsAttribute(): array
    {
        $list = is_array($this->departments) && count($this->departments) > 0
            ? $this->departments
            : [$this->department ?: ((int) ($this->assigned_grade_level ?: 7) >= 11 ? 'SHS' : 'JHS')];

        return array_values(array_unique(array_map('strtoupper', $list)));
    }

    public function getNormalizedPermissionsAttribute(): array
    {
        $defaults = [
            'can_encode_grades' => true,
            'is_adviser_eligible' => true,
            'is_department_head' => false,
        ];

        return array_merge($defaults, is_array($this->permissions) ? $this->permissions : []);
    }

    public function isAuthorizedForGrade(int $gradeLevel): bool
    {
        // Strict DepEd Modular Constraint: Teacher teaches strictly in their designated grade level for the school year (Grades 7 to 12)
        if (!empty($this->assigned_grade_level)) {
            return (int) $this->assigned_grade_level === (int) $gradeLevel;
        }

        $targetDept = $gradeLevel >= 11 ? 'SHS' : 'JHS';
        $depts = $this->normalized_departments;

        return in_array($targetDept, $depts, true);
    }

    public function isAuthorizedForSubject(int $subjectId): bool
    {
        $ids = is_array($this->qualified_subject_ids) ? array_map('intval', $this->qualified_subject_ids) : [];
        if (empty($ids)) {
            return true;
        }
        return in_array((int) $subjectId, $ids, true);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function teachingLoads(): HasMany
    {
        return $this->hasMany(TeachingLoad::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function advisedClasses(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'adviser_id');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(StudentFeedback::class);
    }

    public function rbacLogs(): HasMany
    {
        return $this->hasMany(TeacherRbacLog::class)->latest();
    }
}
