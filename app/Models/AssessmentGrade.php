<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'student_id',
        'score',
        'percentage',
        'status',
        'remarks',
    ];

    protected $casts = [
        'score' => 'float',
        'percentage' => 'float',
    ];

    protected static function booted()
    {
        static::saving(function ($grade) {
            if ($grade->assessment) {
                $max = $grade->assessment->max_score > 0 ? $grade->assessment->max_score : 100;
                $grade->percentage = round(($grade->score / $max) * 100, 2);
                $grade->status = ($grade->score >= $grade->assessment->passing_score) ? 'Passed' : 'Failed';
            }
        });
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
