<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'teaching_load_id',
        'teacher_id',
        'subject_id',
        'school_class_id',
        'day_of_week',
        'start_time',
        'end_time',
        'room',
        'session_type',
        'notes',
    ];

    public function teachingLoad(): BelongsTo
    {
        return $this->belongsTo(TeachingLoad::class);
    }

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
        return $this->belongsTo(SchoolClass::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(ScheduleNotification::class);
    }
}
