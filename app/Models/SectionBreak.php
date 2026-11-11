<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SectionBreak extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_class_id',
        'name',
        'break_type',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    /**
     * If school_class_id is null, this break applies globally to all sections.
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class);
    }
}
