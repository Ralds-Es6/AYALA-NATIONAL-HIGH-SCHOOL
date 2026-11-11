import React, { useState } from 'react';
import { 
    Users, 
    BookOpen, 
    AlertOctagon, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    Calendar, 
    Info,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard({ 
    workloadData, 
    schedules = [], 
    loading, 
    onNavigate, 
    notifications = [] 
}) {
    // IMPORTANT: Keep all React Hooks at the top of the component before any early return
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const initialDay = daysOfWeek.includes(todayName) ? todayName : 'Wednesday';
    const [selectedDay, setSelectedDay] = useState(initialDay);

    if (loading || !workloadData) {
        return <LoadingSpinner text="Computing Ayala NHS academic operations & analytics..." />;
    }

    const teachers = workloadData.teacher_summaries || [];

    // Filter schedules for the selected day
    const daySchedules = schedules
        .filter((s) => s.day_of_week === selectedDay)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    const hasOverloads = (workloadData.overloaded_teachers || 0) > 0;
    const overloadCount = workloadData.overloaded_teachers ?? teachers.filter(t => (t.assigned_hours || 0) > (t.max_weekly_hours || 30)).length;
    const underloadCount = workloadData.underload_teachers ?? teachers.filter(t => (t.assigned_hours || 0) < (t.max_weekly_hours || 30)).length;
    const normalCount = workloadData.normal_load_teachers ?? Math.max(0, teachers.length - overloadCount - underloadCount);

    // Show top sessions in the dashboard table (with full view accessible via footer)
    const visibleDaySchedules = daySchedules.slice(0, 6);

    return (
        <div>
            {/* ── Top Operations Header (60-30-10 Hierarchy) ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>Live Academic Operations Monitoring</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        Academic Operations Dashboard
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        Automated timetable engine, classroom enrollment directory and DepEd workload analytics.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button 
                        type="button"
                        onClick={() => onNavigate('loads')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                    >
                        <BookOpen size={15} className="text-blue-600" />
                        <span>Curriculum &amp; Loads</span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => onNavigate('students')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                    >
                        <Calendar size={15} />
                        <span>Classrooms &amp; Timetables</span>
                    </button>
                </div>
            </div>

            {/* ── Top Primary KPI Grid (Matching Screenshot 1) ── */}
            <div className="stats-grid">
                <StatCard 
                    title="Total faculty"
                    value={workloadData.total_teachers || 0}
                    subtitle="DepEd teaching staff"
                    icon={Users}
                    iconColor="#2563EB"
                    onClick={() => onNavigate('teachers')}
                />
                <StatCard 
                    title="Active classrooms"
                    value={workloadData.total_classes || 0}
                    subtitle="Junior & Senior High School sections"
                    icon={BookOpen}
                    iconColor="#059669"
                    onClick={() => onNavigate('students')}
                />
                <StatCard 
                    title="Weekly contact hours"
                    value={`${workloadData.total_teaching_hours || 0} hrs`}
                    subtitle={`Across ${workloadData.total_schedules || schedules.length} class sessions`}
                    icon={Clock}
                    iconColor="#8B5CF6"
                    onClick={() => onNavigate('students')}
                />
                <StatCard 
                    title="Schedule health"
                    value={hasOverloads ? `${workloadData.overloaded_teachers} conflicts` : '0 conflicts'}
                    subtitle={hasOverloads ? 'Faculty exceeding 30h limit' : '100% conflict-free'}
                    subtitleColor={hasOverloads ? '#DC2626' : undefined}
                    icon={hasOverloads ? AlertOctagon : CheckCircle2}
                    iconColor={hasOverloads ? '#DC2626' : '#10B981'}
                    onClick={() => onNavigate('loads')}
                />
            </div>

            {/* ── Core Two-Column Section: Class Timetable & Faculty Workload Distribution ── */}
            <div className="dashboard-grid-two" style={{ marginBottom: 0 }}>
                {/* 1. Class Timetable Panel */}
                <div className="panel bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col m-0 shadow-xs">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
                                Class Timetable
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                                {daySchedules.length} classes
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                            Scheduled academic sessions for {selectedDay}
                        </p>
                    </div>

                    {/* Day Selector + Weekly Timetable Link */}
                    <div className="flex items-center justify-between flex-wrap gap-3 my-4">
                        <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                            {daysOfWeek.map((day) => {
                                const isSelected = selectedDay === day;
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setSelectedDay(day)}
                                        className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                                                : 'text-slate-500 font-bold hover:text-slate-900'
                                        }`}
                                        title={`View schedule for ${day}`}
                                    >
                                        {day.substring(0, 3)}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate('students')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                            <Calendar size={14} />
                            <span>Classroom Timetables</span>
                        </button>
                    </div>

                    {/* Clean 4-Column Schedule Table */}
                    <div className="flex-1 overflow-x-auto">
                        {visibleDaySchedules.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        <th className="pb-2.5 pr-3 w-24">Time</th>
                                        <th className="pb-2.5 pr-3">Subject / Section</th>
                                        <th className="pb-2.5 pr-3">Faculty</th>
                                        <th className="pb-2.5 w-28">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleDaySchedules.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 pr-3 align-top">
                                                <div className="text-xs font-extrabold text-slate-800">
                                                    {item.start_time?.substring(0, 5)}
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                    – {item.end_time?.substring(0, 5)}
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-3 align-top">
                                                <div className="text-xs font-extrabold text-slate-900">
                                                    {item.subject?.name}
                                                </div>
                                                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                    {item.school_class?.name || item.schoolClass?.name}
                                                </div>
                                            </td>
                                            <td className="py-3.5 pr-3 align-top">
                                                <div className="text-xs font-bold text-slate-700">
                                                    {item.teacher?.name || 'TBA'}
                                                </div>
                                            </td>
                                            <td className="py-3.5 align-top">
                                                <div className="text-xs font-semibold text-slate-500">
                                                    {item.room}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <Calendar size={28} className="text-slate-300 mx-auto mb-2" />
                                <p className="m-0 font-bold text-sm text-slate-700">No classes scheduled for {selectedDay}</p>
                                <span className="text-xs text-slate-400 mt-1 block">
                                    Select another weekday or assign loads to this day.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Panel Footer */}
                    <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            {selectedDay} · {daySchedules.length} classes scheduled
                        </span>
                        <button 
                            type="button"
                            onClick={() => onNavigate('students')}
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                            <span>Manage classroom timetables</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* 2. Faculty Workload Panel (Matching Screenshot 1) */}
                <div className="panel bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col m-0 shadow-xs">
                    {/* Header */}
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
                            Faculty workload
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                            Weekly teaching hours against the DepEd 30h standard
                        </p>
                    </div>

                    {/* Summary Box */}
                    <div className="grid grid-cols-3 gap-3 my-4 bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/60">
                        <div>
                            <div className="text-xs font-bold text-amber-600">
                                Underload
                            </div>
                            <div className="text-2xl font-black text-amber-600 mt-0.5 leading-tight">
                                {underloadCount}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500">
                                At Capacity
                            </div>
                            <div className="text-2xl font-black text-slate-900 mt-0.5 leading-tight">
                                {normalCount}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500">
                                Overloaded
                            </div>
                            <div className={`text-2xl font-black mt-0.5 leading-tight ${overloadCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                {overloadCount}
                            </div>
                        </div>
                    </div>

                    {/* Faculty Capacity Rows */}
                    <div className="flex flex-col gap-4 flex-1">
                        {teachers.slice(0, 4).map((t) => {
                            const assigned = t.assigned_hours || 0;
                            const max = t.max_weekly_hours || 30;
                            const pct = Math.min(Math.round((assigned / max) * 100), 100);
                            const isOver = assigned > max;
                            const isUnder = assigned < max;

                            let statusLabel = 'At capacity';
                            let statusClass = 'text-emerald-600';
                            let barColor = 'bg-emerald-500';

                            if (isOver) {
                                statusLabel = 'Overload';
                                statusClass = 'text-rose-600';
                                barColor = 'bg-rose-500';
                            } else if (isUnder) {
                                statusLabel = 'Underload';
                                statusClass = 'text-amber-600';
                                barColor = 'bg-amber-500';
                            }

                            return (
                                <div key={t.teacher_id}>
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div>
                                            <div className="text-xs font-extrabold text-slate-900 leading-tight">
                                                {t.name}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                                                {t.specialization}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-extrabold text-slate-900 leading-tight">
                                                {assigned} / {max} hrs
                                            </div>
                                            <div className="mt-1">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                                    isOver
                                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                        : isUnder
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                isOver ? 'bg-rose-500' : isUnder ? 'bg-amber-600' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Info Callout Box */}
                    <div className="mt-5 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                        <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-amber-800 leading-relaxed">
                            Underload indicates fewer than 30 assigned hours per week. Review available capacity before assigning classes.
                        </span>
                    </div>

                    {/* Panel Footer */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            Allocation / weekly capacity
                        </span>
                        <button 
                            type="button"
                            onClick={() => onNavigate('loads')}
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                            <span>Full monitor</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
