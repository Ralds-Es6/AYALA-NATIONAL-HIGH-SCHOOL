<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'school_class_id',
        'track',
        'strand',
        'lrn',
        'name',
        'email',
        'verification_status', // verified, pending, rejected
        'document_type',
        'document_reference',
        'verified_by',
        'verified_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function assessmentGrades()
    {
        return $this->hasMany(AssessmentGrade::class);
    }

    public function quarterlyGrades()
    {
        return $this->hasMany(StudentQuarterlyGrade::class);
    }

    public function feedbacks()
    {
        return $this->hasMany(StudentFeedback::class);
    }
}
