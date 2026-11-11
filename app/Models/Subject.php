<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'grade_level',
        'strand',
        'weekly_hours',
        'color',
    ];

    protected $casts = [
        'grade_level' => 'integer',
        'weekly_hours' => 'integer',
    ];

    public function teachingLoads(): HasMany
    {
        return $this->hasMany(TeachingLoad::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }
}
