<?php

namespace App\Services;

use App\Models\Schedule;

class ConflictDetectionService
{
    /**
     * Check for scheduling conflicts across Teacher, Class (Section), and Room.
     *
     * @param int $teacherId
     * @param int $schoolClassId
     * @param string $dayOfWeek
     * @param string $startTime (format: HH:MM)
     * @param string $endTime   (format: HH:MM)
     * @param string|null $room
     * @param int|null $excludeScheduleId (for updates)
     * @return array
     */
    public function checkConflict(
        int $teacherId,
        int $schoolClassId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        ?string $room = null,
        ?int $excludeScheduleId = null
    ): array {
        $conflicts = [];

        $normStart = substr(trim($startTime), 0, 5);
        $normEnd = substr(trim($endTime), 0, 5);

        $format12h = function (string $timeStr): string {
            $clean = substr(trim($timeStr), 0, 5);
            $parts = explode(':', $clean);
            $h = (int) ($parts[0] ?? 0);
            $m = (int) ($parts[1] ?? 0);
            $period = $h >= 12 ? 'PM' : 'AM';
            $h12 = $h % 12 ?: 12;
            return sprintf('%02d:%02d %s', $h12, $m, $period);
        };

        // Base query for time overlap on the same day
        // Overlap formula: (existing.start < proposed.end) AND (existing.end > proposed.start)
        $baseQuery = function () use ($dayOfWeek, $normStart, $normEnd, $excludeScheduleId) {
            $q = Schedule::with(['teacher', 'subject', 'schoolClass'])
                ->where('day_of_week', $dayOfWeek)
                ->whereRaw('SUBSTR(start_time, 1, 5) < ?', [$normEnd])
                ->whereRaw('SUBSTR(end_time, 1, 5) > ?', [$normStart]);

            if ($excludeScheduleId) {
                $q->where('id', '!=', $excludeScheduleId);
            }

            return $q;
        };

        // 1. Class Conflict: A classroom cannot have two overlapping subjects on the same day
        if ($schoolClassId > 0) {
            $classConflict = $baseQuery()
                ->where('school_class_id', $schoolClassId)
                ->first();

            if ($classConflict) {
                $conflicts[] = [
                    'type' => 'class',
                    'title' => 'Classroom Time Overlap',
                    'message' => sprintf(
                        'Time overlap in %s: "%s" is already scheduled on %s from %s to %s (%s).',
                        $classConflict->schoolClass->name ?? 'this classroom',
                        $classConflict->subject->name ?? 'Another subject',
                        $classConflict->day_of_week,
                        $format12h($classConflict->start_time),
                        $format12h($classConflict->end_time),
                        $classConflict->teacher->name ?? 'Assigned Teacher'
                    ),
                    'conflicting_schedule' => $classConflict,
                ];
            }
        }

        // 2. Teacher Conflict: Teacher cannot teach two classes at overlapping times on the same day
        //    AND cannot exceed their daily teaching cap (Max 9 classes per day)
        if ($teacherId > 0) {
            $teacherModel = \App\Models\Teacher::find($teacherId);
            $maxDailyClasses = (int) ($teacherModel?->max_classes_per_day ?: 9);

            $dailyCountQuery = Schedule::where('teacher_id', $teacherId)
                ->where('day_of_week', $dayOfWeek);

            if ($excludeScheduleId) {
                $dailyCountQuery->where('id', '!=', $excludeScheduleId);
            }

            $currentDailyCount = $dailyCountQuery->count();
            if ($currentDailyCount >= $maxDailyClasses) {
                $conflicts[] = [
                    'type' => 'daily_limit',
                    'title' => 'Max Daily Teaching Classes Reached',
                    'message' => sprintf(
                        '%s already has %d/%d classes scheduled on %s. Faculty are limited to a maximum of %d teaching classes per day.',
                        $teacherModel?->name ?? 'Selected teacher',
                        $currentDailyCount,
                        $maxDailyClasses,
                        $dayOfWeek,
                        $maxDailyClasses
                    ),
                ];
            }

            $teacherConflict = $baseQuery()
                ->where('teacher_id', $teacherId)
                ->first();

            if ($teacherConflict) {
                $conflicts[] = [
                    'type' => 'teacher',
                    'title' => 'Teacher Schedule Overlap',
                    'message' => sprintf(
                        'Teacher %s is already teaching "%s" for %s on %s from %s to %s (Room %s).',
                        $teacherConflict->teacher->name ?? 'Selected teacher',
                        $teacherConflict->subject->name ?? 'another subject',
                        $teacherConflict->schoolClass->name ?? 'another section',
                        $teacherConflict->day_of_week,
                        $format12h($teacherConflict->start_time),
                        $format12h($teacherConflict->end_time),
                        $teacherConflict->room ?? 'TBA'
                    ),
                    'conflicting_schedule' => $teacherConflict,
                ];
            }
        }

        // 3. Room Conflict: Room cannot host two different classes simultaneously
        if (!empty($room)) {
            $roomConflict = $baseQuery()
                ->where('room', $room)
                ->where('school_class_id', '!=', $schoolClassId)
                ->first();

            if ($roomConflict) {
                $conflicts[] = [
                    'type' => 'room',
                    'title' => 'Room Occupancy Overlap',
                    'message' => sprintf(
                        'Room "%s" is already occupied by %s (%s) on %s from %s to %s.',
                        $room,
                        $roomConflict->schoolClass->name ?? 'another class',
                        $roomConflict->subject->name ?? 'Subject',
                        $roomConflict->day_of_week,
                        $format12h($roomConflict->start_time),
                        $format12h($roomConflict->end_time)
                    ),
                    'conflicting_schedule' => $roomConflict,
                ];
            }
        }

        return [
            'has_conflict' => count($conflicts) > 0,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Check if a proposed break overlaps with any existing scheduled class or existing break.
     */
    public function checkBreakConflict(
        ?int $schoolClassId,
        string $dayOfWeek,
        string $startTime,
        string $endTime,
        ?int $excludeBreakId = null
    ): array {
        $conflicts = [];

        // 1. Check existing classes that would overlap with this break
        $classQuery = Schedule::with(['schoolClass', 'subject', 'teacher'])
            ->where('day_of_week', $dayOfWeek)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);

        if ($schoolClassId) {
            $classQuery->where('school_class_id', $schoolClassId);
        }

        $conflictingClass = $classQuery->first();
        if ($conflictingClass) {
            $conflicts[] = [
                'type' => 'class',
                'title' => 'Existing Class Overlap',
                'message' => sprintf(
                    'Break overlaps with scheduled class %s (%s) for %s on %s from %s to %s.',
                    $conflictingClass->subject->name,
                    $conflictingClass->teacher->name,
                    $conflictingClass->schoolClass->name,
                    $conflictingClass->day_of_week,
                    substr($conflictingClass->start_time, 0, 5),
                    substr($conflictingClass->end_time, 0, 5)
                ),
                'conflicting_schedule' => $conflictingClass,
            ];
        }

        // 2. Check overlap with other breaks
        $breakQuery = \App\Models\SectionBreak::where('day_of_week', $dayOfWeek)
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);

        if ($schoolClassId) {
            $breakQuery->where(function ($q) use ($schoolClassId) {
                $q->whereNull('school_class_id')->orWhere('school_class_id', $schoolClassId);
            });
        }

        if ($excludeBreakId) {
            $breakQuery->where('id', '!=', $excludeBreakId);
        }

        $otherBreak = $breakQuery->first();
        if ($otherBreak) {
            $conflicts[] = [
                'type' => 'break',
                'title' => 'Existing Break Overlap',
                'message' => sprintf(
                    'Break overlaps with another break "%s" on %s from %s to %s.',
                    $otherBreak->name,
                    $otherBreak->day_of_week,
                    substr($otherBreak->start_time, 0, 5),
                    substr($otherBreak->end_time, 0, 5)
                ),
                'conflicting_break' => $otherBreak,
            ];
        }

        return [
            'has_conflict' => count($conflicts) > 0,
            'conflicts' => $conflicts,
        ];
    }
}
