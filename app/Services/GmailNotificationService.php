<?php

namespace App\Services;

use App\Models\Schedule;
use App\Models\ScheduleNotification;
use App\Models\Student;
use Illuminate\Support\Facades\Log;

class GmailNotificationService
{
    /**
     * Dispatch Gmail notifications when a schedule is created, updated, or changed.
     *
     * @param Schedule $schedule
     * @param string $actionType ('assigned', 'updated', 'changed', 'cancelled')
     * @return array
     */
    public function notifyScheduleChange(Schedule $schedule, string $actionType = 'assigned'): array
    {
        $schedule->load(['teacher', 'subject', 'schoolClass']);
        $notificationsCreated = [];

        $subjectTitle = match ($actionType) {
            'assigned' => 'New Class Schedule Assignment - San Roque NHS',
            'updated', 'changed' => 'Schedule Update Notification - San Roque NHS',
            'cancelled' => 'Schedule Cancellation Notice - San Roque NHS',
            default => 'Schedule Notification - San Roque NHS',
        };

        $timeRange = substr($schedule->start_time, 0, 5) . ' - ' . substr($schedule->end_time, 0, 5);

        // 1. Notify the Assigned Teacher
        if ($schedule->teacher && $schedule->teacher->email) {
            $teacherMessage = sprintf(
                "Dear %s,\n\nA schedule for %s (%s) has been %s.\nDay: %s\nTime: %s\nRoom: %s\n\nPlease check your SRNHS Teacher Portal for details.",
                $schedule->teacher->name,
                $schedule->subject->name,
                $schedule->schoolClass->name,
                $actionType,
                $schedule->day_of_week,
                $timeRange,
                $schedule->room
            );

            $notification = ScheduleNotification::create([
                'schedule_id' => $schedule->id,
                'recipient_email' => $schedule->teacher->email,
                'recipient_name' => $schedule->teacher->name,
                'recipient_role' => 'teacher',
                'type' => $actionType,
                'subject' => $subjectTitle,
                'message_body' => $teacherMessage,
                'sent_at' => now(),
                'status' => 'sent',
            ]);

            Log::info("Gmail notification dispatched to teacher: {$schedule->teacher->email} ({$subjectTitle})");
            $notificationsCreated[] = $notification;
        }

        // 2. Notify Students in the Class Section
        $students = Student::where('school_class_id', $schedule->school_class_id)->get();

        foreach ($students as $student) {
            if (!$student->email) continue;

            $studentMessage = sprintf(
                "Dear %s,\n\nYour class schedule for %s has been %s.\nTeacher: %s\nDay: %s\nTime: %s\nRoom: %s\n\nPlease log in to the SRNHS Student Portal to view your complete schedule.",
                $student->name,
                $schedule->subject->name,
                $actionType,
                $schedule->teacher->name,
                $schedule->day_of_week,
                $timeRange,
                $schedule->room
            );

            $notification = ScheduleNotification::create([
                'schedule_id' => $schedule->id,
                'recipient_email' => $student->email,
                'recipient_name' => $student->name,
                'recipient_role' => 'student',
                'type' => $actionType,
                'subject' => $subjectTitle,
                'message_body' => $studentMessage,
                'sent_at' => now(),
                'status' => 'sent',
            ]);

            Log::info("Gmail notification dispatched to student: {$student->email} ({$subjectTitle})");
            $notificationsCreated[] = $notification;
        }

        return $notificationsCreated;
    }
}
