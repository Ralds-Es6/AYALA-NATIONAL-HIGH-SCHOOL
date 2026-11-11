<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentQuarterlyGrade extends Model
{
    use HasFactory;

    protected $table = 'student_quarterly_grades';

    protected $fillable = [
        'student_id',
        'school_class_id',
        'subject_id',
        'teacher_id',
        'academic_year',
        'q1',
        'q2',
        'q3',
        'q4',
        'final_rating',
        'descriptor',
        'remarks',
        'is_locked',
    ];

    protected $casts = [
        'q1' => 'float',
        'q2' => 'float',
        'q3' => 'float',
        'q4' => 'float',
        'final_rating' => 'float',
        'is_locked' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Compute DepEd descriptor from numerical grade.
     */
    public static function getDepEdDescriptor(?float $grade): ?string
    {
        if ($grade === null) return null;
        if ($grade >= 90) return 'Outstanding';
        if ($grade >= 85) return 'Very Satisfactory';
        if ($grade >= 80) return 'Satisfactory';
        if ($grade >= 75) return 'Fairly Satisfactory';
        return 'Did Not Meet Expectations';
    }

    /**
     * Compute DepEd remarks / status.
     */
    public static function getDepEdRemarks(?float $grade, bool $isFinal = true): ?string
    {
        if ($grade === null) return null;
        if ($grade >= 75) return 'PASSED';
        return $isFinal ? 'FAILED' : 'AT-RISK';
    }
}

