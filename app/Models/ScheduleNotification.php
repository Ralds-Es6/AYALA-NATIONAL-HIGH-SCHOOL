<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_id',
        'recipient_email',
        'recipient_name',
        'recipient_role',
        'type',
        'subject',
        'message_body',
        'sent_at',
        'status',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }
}
