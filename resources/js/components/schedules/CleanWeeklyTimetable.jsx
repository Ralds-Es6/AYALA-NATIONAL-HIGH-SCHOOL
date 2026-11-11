import React, { useState, useMemo } from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    User,
    GraduationCap,
    Plus,
    Printer,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Filter,
    ChevronLeft,
    ChevronRight,
    Building2,
    Layers
} from 'lucide-react';
import { to12Hour, toMinutes, calcDuration } from './InteractiveScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Baseline Continuous School Bell Schedule (07:30 AM – 05:00 PM)
const STANDARD_BELL_PERIODS = [
    { id: 'p1', timeRange12: '7:30 AM – 8:30 AM', start: '07:30', end: '08:30', duration: '1h' },
    { id: 'p2', timeRange12: '8:30 AM – 9:30 AM', start: '08:30', end: '09:30', duration: '1h' },
    { id: 'p3', timeRange12: '9:30 AM – 10:30 AM', start: '09:30', end: '10:30', duration: '1h' },
    { id: 'p4', timeRange12: '10:30 AM – 11:30 AM', start: '10:30', end: '11:30', duration: '1h' },
    { id: 'p5', timeRange12: '11:30 AM – 12:30 PM', start: '11:30', end: '12:30', duration: '1h' },
    { id: 'p6', timeRange12: '1:00 PM – 2:00 PM', start: '13:00', end: '14:00', duration: '1h' },
    { id: 'p7', timeRange12: '2:00 PM – 3:00 PM', start: '14:00', end: '15:00', duration: '1h' },
    { id: 'p8', timeRange12: '3:00 PM – 4:00 PM', start: '15:00', end: '16:00', duration: '1h' },
    { id: 'p9', timeRange12: '4:00 PM – 5:00 PM', start: '16:00', end: '17:00', duration: '1h' },
];

const doesPeriodOverlap = (period, item) => {
    const pStart = toMinutes(period.start);
    const pEnd = toMinutes(period.end);
    const iStart = toMinutes(item.start_time || item.start);
    const iEnd = toMinutes(item.end_time || item.end);
    return Math.max(pStart, iStart) < Math.min(pEnd, iEnd);
};

export default function CleanWeeklyTimetable({
    mode = 'classroom', // 'classroom' | 'teacher' | 'room'
    selectedClassroom = null,
    selectedTeacher = null,
    selectedRoom = null,
    schedules = [],
    teachers = [],
    classes = [],
    onBackToDirectory,
    onAddSchedule,
    onEditSchedule,
    onDeleteSchedule,
    onSelectTeacher,
    isAdmin = true,
}) {
    const [selectedDetailSchedule, setSelectedDetailSchedule] = useState(null);

    // Filter schedules for the current focus
    const focusedSchedules = useMemo(() => {
        if (mode === 'classroom' && selectedClassroom) {
            return schedules.filter(s => String(s.school_class_id) === String(selectedClassroom.id));
        }
        if (mode === 'teacher' && selectedTeacher) {
            return schedules.filter(s => String(s.teacher_id) === String(selectedTeacher.id));
        }
        if (mode === 'room' && selectedRoom) {
            return schedules.filter(s => (s.room || '').trim().toLowerCase() === selectedRoom.trim().toLowerCase());
        }
        return schedules;
    }, [schedules, mode, selectedClassroom, selectedTeacher, selectedRoom]);

    // Workload calculation for teacher mode
    const teacherStats = useMemo(() => {
        if (mode !== 'teacher' || !selectedTeacher) return null;
        let totalMinutes = 0;
        focusedSchedules.forEach(s => {
            const dur = toMinutes(s.end_time) - toMinutes(s.start_time);
            if (dur > 0) totalMinutes += dur;
        });
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const depEdMax = 30;
        const pct = Math.min(100, Math.round((totalHours / depEdMax) * 100));
        return { totalHours, depEdMax, pct, totalSessions: focusedSchedules.length };
    }, [mode, selectedTeacher, focusedSchedules]);

    // Handle print
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* ─── Header & Breadcrumbs ────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Identity info */}
                    <div>
                        {onBackToDirectory && (
                            <button
                                type="button"
                                onClick={onBackToDirectory}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mb-2"
                            >
                                <ArrowLeft size={14} />
                                <span>← Back to Classrooms Directory</span>
                            </button>
                        )}

                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {mode === 'classroom' && (selectedClassroom?.name || 'Classroom Timetable')}
                                {mode === 'teacher' && (selectedTeacher ? `${selectedTeacher.name}'s Weekly Timetable` : 'Faculty Timetable')}
                                {mode === 'room' && `Classroom Venue: ${selectedRoom || 'All Rooms'}`}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                S.Y. 2026–2027 • Term 1
                            </span>
                        </div>

                        {/* Meta information tags */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 font-semibold flex-wrap">
                            {mode === 'classroom' && selectedClassroom && (
                                <>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={13} className="text-slate-400" />
                                        <span>Primary Room: <strong className="text-slate-900">{selectedClassroom.room || 'TBA'}</strong></span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User size={13} className="text-slate-400" />
                                        <span>Class Adviser: </span>
                                        {selectedClassroom.adviser ? (
                                            <strong className="text-emerald-700">{selectedClassroom.adviser.name}</strong>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                                                TBA (To Be Announced)
                                            </span>
                                        )}
                                    </span>
                                    <span className="flex items-center gap-1 text-blue-600">
                                        <GraduationCap size={13} />
                                        <span>{focusedSchedules.length} Scheduled Classes</span>
                                    </span>
                                </>
                            )}

                            {mode === 'teacher' && teacherStats && (
                                <>
                                    <span className="text-slate-500 font-medium">
                                        Department: <strong className="text-slate-800">{selectedTeacher.department || 'General Faculty'}</strong>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span>Workload:</span>
                                        <strong className={`font-bold ${teacherStats.totalHours > teacherStats.depEdMax ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {teacherStats.totalHours} hrs / {teacherStats.depEdMax}h max
                                        </strong>
                                    </span>
                                    <span className="text-slate-500">
                                        {teacherStats.totalSessions} class sessions
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            <Printer size={14} />
                            <span>Print</span>
                        </button>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onAddSchedule) {
                                        onAddSchedule({
                                            school_class_id: selectedClassroom?.id,
                                            teacher_id: selectedTeacher?.id,
                                            room: selectedClassroom?.room || selectedRoom || 'Room 201',
                                            day: 'Monday'
                                        });
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all"
                            >
                                <Plus size={15} />
                                <span>+ Assign Class Period</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── The Clean Weekly Timetable Grid ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-black">
                                <th className="py-3 px-4 w-36 uppercase tracking-wider text-slate-300 border-r border-slate-800">
                                    Bell Schedule
                                </th>
                                {DAYS_OF_WEEK.map(day => (
                                    <th key={day} className="py-3 px-3 uppercase tracking-wider text-center border-r border-slate-800 last:border-r-0">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                            {STANDARD_BELL_PERIODS.map(period => (
                                <tr key={period.id} className="hover:bg-slate-50/50 transition-colors">
                                    {/* Left Time Column (12-Hour) */}
                                    <td className="py-3 px-4 border-r border-slate-200 bg-slate-50/80 align-top">
                                        <div className="font-mono text-xs font-extrabold text-slate-900 whitespace-nowrap">
                                            {period.timeRange12}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                            {period.duration} period
                                        </div>
                                    </td>

                                    {/* Monday - Friday Columns */}
                                    {DAYS_OF_WEEK.map(day => {
                                        const slotClasses = focusedSchedules.filter(s => 
                                            s.day_of_week === day && doesPeriodOverlap(period, s)
                                        );

                                        return (
                                            <td 
                                                key={day} 
                                                className="p-1.5 border-r border-slate-200 last:border-r-0 align-top w-[17%]"
                                            >
                                                {slotClasses.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {slotClasses.map(session => {
                                                            const isContinuation = session.start_time && toMinutes(session.start_time) < toMinutes(period.start);

                                                            if (isContinuation) {
                                                                return (
                                                                    <div
                                                                        key={`cont-${session.id}`}
                                                                        onClick={() => setSelectedDetailSchedule(session)}
                                                                        className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                                                                        title="Multi-hour session continuation • Click to inspect"
                                                                    >
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock size={11} className="text-emerald-600" />
                                                                            <span className="truncate">↳ {session.subject?.name || session.subject?.code}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <div
                                                                    key={session.id}
                                                                    onClick={() => setSelectedDetailSchedule(session)}
                                                                    className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                                                                >
                                                                    {/* Subject Name */}
                                                                    <div className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                                        {session.subject?.name || session.subject?.code || 'Academic Subject'}
                                                                    </div>

                                                                    {/* Teacher / Section Subtitle */}
                                                                    <div className="text-[11px] font-semibold text-slate-600 mt-1 flex items-center gap-1 truncate">
                                                                        {mode === 'teacher' ? (
                                                                            <>
                                                                                <GraduationCap size={11} className="text-blue-600 flex-shrink-0" />
                                                                                <span className="truncate">{session.school_class?.name || 'Class Section'}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <User size={11} className="text-blue-600 flex-shrink-0" />
                                                                                <span className="truncate">{session.teacher?.name || 'Teacher TBA'}</span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Room & Duration Pill */}
                                                                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                                                        <span className="flex items-center gap-0.5 truncate">
                                                                            <MapPin size={10} className="text-slate-400" />
                                                                            <span>{session.room || 'Room TBA'}</span>
                                                                        </span>
                                                                        <span className="px-1.5 py-0.5 bg-blue-100/80 text-blue-700 rounded font-black text-[9px]">
                                                                            {calcDuration(session.start_time, session.end_time)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    // Clean Clickable Empty Slot
                                                    <div
                                                        onClick={() => {
                                                            if (isAdmin && onAddSchedule) {
                                                                onAddSchedule({
                                                                    school_class_id: selectedClassroom?.id,
                                                                    teacher_id: selectedTeacher?.id,
                                                                    room: selectedClassroom?.room || selectedRoom || 'Room 201',
                                                                    day,
                                                                    start_time: period.start,
                                                                    end_time: period.end
                                                                });
                                                            }
                                                        }}
                                                        className={`h-full min-h-[64px] rounded-lg border border-dashed border-slate-200 p-2 flex flex-col items-center justify-center text-center transition-all ${
                                                            isAdmin ? 'cursor-pointer hover:bg-blue-50/40 hover:border-blue-300' : ''
                                                        }`}
                                                    >
                                                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-600">
                                                            + Free
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Note */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                    <span>Click any schedule block to inspect, edit, or delete its complete details.</span>
                    <span className="font-semibold text-slate-700">Ayala National High School</span>
                </div>
            </div>

            {/* ─── Schedule Detail Modal ────────────────────────────────────────── */}
            <ScheduleDetailModal
                isOpen={Boolean(selectedDetailSchedule)}
                schedule={selectedDetailSchedule}
                onClose={() => setSelectedDetailSchedule(null)}
                onEdit={(sched) => {
                    setSelectedDetailSchedule(null);
                    if (onEditSchedule) onEditSchedule(sched);
                }}
                onDelete={onDeleteSchedule ? (schedId) => {
                    setSelectedDetailSchedule(null);
                    onDeleteSchedule(schedId);
                } : undefined}
                isAdmin={isAdmin}
            />
        </div>
    );
}
