<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'subject_id',
        'school_class_id',
        'academic_year',
        'quarter',
        'title',
        'type',
        'max_score',
        'passing_score',
        'assessment_date',
        'description',
    ];

    protected $casts = [
        'max_score' => 'float',
        'passing_score' => 'float',
        'assessment_date' => 'date',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function grades(): HasMany
    {
        return $this->hasMany(AssessmentGrade::class);
    }

    public function feedbacks(): HasMany
    {
        return $this->hasMany(StudentFeedback::class);
    }
}
