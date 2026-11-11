import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    User, 
    MapPin, 
    CalendarCheck, 
    Clock, 
    GraduationCap, 
    Calendar,
    Printer,
    Layers,
    Info,
    ChevronRight,
    ArrowRight,
    School,
    Award,
    FileText,
    Mail,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    UserCheck,
    TrendingUp
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import DynamicKanbanTimetable from '../../components/schedules/DynamicKanbanTimetable';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import StatCard from '../../components/StatCard';

export default function StudentPortal({ activeTab = 'dashboard', onNavigateTab }) {
    const [data, setData] = useState(null);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Assessments & Feedback Data
    const [assessmentsData, setAssessmentsData] = useState(null);
    const [reportCardData, setReportCardData] = useState(null);
    const [feedbackData, setFeedbackData] = useState([]);
    const [loadingExtras, setLoadingExtras] = useState(false);

    // Day filter for Day Agenda view
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const defaultDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(todayName) 
        ? todayName 
        : 'Monday';
    const [selectedDay, setSelectedDay] = useState(defaultDay);

    const fetchSchedule = async (classId = null) => {
        setLoading(true);
        try {
            const res = await srnhsApi.getStudentSchedule(classId);
            setData(res || { class_info: null, student: null, data: [] });
            if (!classId && res?.class_info) {
                setSelectedClassId(res.class_info.id);
            }
        } catch (err) {
            console.error('Error fetching student schedule:', err);
            setData((prev) => prev || { class_info: null, student: null, data: [] });
        } finally {
            setLoading(false);
        }
    };

    const fetchExtras = async () => {
        setLoadingExtras(true);
        try {
            const [assRes, fbRes, rcRes] = await Promise.allSettled([
                srnhsApi.getMyAssessments(),
                srnhsApi.getMyFeedback(),
                srnhsApi.getMyReportCard(),
            ]);
            if (assRes.status === 'fulfilled' && assRes.value) {
                setAssessmentsData(assRes.value);
            }
            if (fbRes.status === 'fulfilled' && fbRes.value) {
                setFeedbackData(fbRes.value || []);
            }
            if (rcRes.status === 'fulfilled' && rcRes.value) {
                setReportCardData(rcRes.value);
            }
        } catch (err) {
            console.error('Extras error:', err);
        } finally {
            setLoadingExtras(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
        fetchExtras();
    }, []);

    if (loading && !data) {
        return <LoadingSpinner text="Loading official Ayala NHS student timetable & academic records..." />;
    }

    const classInfo = data?.class_info;
    const student = data?.student;
    const schedules = data?.data || [];

    const dailySchedules = schedules
        .filter((s) => s.day_of_week === selectedDay)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    const todaySchedules = schedules
        .filter((s) => s.day_of_week === (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(todayName) ? todayName : 'Monday'))
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    // Deduplicate subjects: Authoritative curriculum enrolled subjects from Admin loads, with timetable fallback
    const distinctSubjects = data?.enrolled_subjects && data.enrolled_subjects.length > 0
        ? data.enrolled_subjects
        : (() => {
            const list = [];
            const seen = new Set();
            schedules.forEach((s) => {
                if (s.subject && !seen.has(s.subject.id)) {
                    seen.add(s.subject.id);
                    list.push({
                        ...s.subject,
                        teacher: s.teacher,
                        room: s.room,
                        is_scheduled: true,
                    });
                }
            });
            return list;
        })();

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
        <div>
            {/* Header & Student Profile Banner */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-6 shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                        <div style={{ 
                            width: '52px', 
                            height: '52px', 
                            borderRadius: '16px', 
                            background: '#2563EB', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                            flexShrink: 0
                        }}>
                            <GraduationCap size={26} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
                                    {student ? student.name : (classInfo ? classInfo.name : 'Learner Timetable')}
                                </h1>
                                <Badge variant="success">Enrolled Learner</Badge>
                                {(student?.strand || classInfo?.strand) && (
                                    <Badge variant="teal">
                                        {student?.strand || classInfo?.strand} &bull; {student?.track || classInfo?.track || 'SHS'}
                                    </Badge>
                                )}
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
                                {student?.lrn ? <span>LRN: <strong style={{ color: 'var(--royal-blue)' }}>{student.lrn}</strong> &bull; </span> : null}
                                Ayala National High School &bull; S.Y. 2026–2027 &bull; Quarter 1
                            </p>

                            {classInfo && (
                                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.825rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <BookOpen size={14} style={{ color: 'var(--royal-bright)' }} />
                                        <span><strong>Section:</strong> {classInfo.name} (Grade {classInfo.grade_level}{classInfo.strand ? ` • ${classInfo.strand}` : ''})</span>
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} style={{ color: 'var(--royal-bright)' }} />
                                        <span><strong>Room:</strong> {classInfo.room || 'DepEd Academic Wing'}</span>
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={14} style={{ color: 'var(--royal-bright)' }} />
                                        <span><strong>Class Adviser:</strong> {classInfo.adviser?.name || 'TBA (Unassigned)'}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Print Action */}
                    <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => window.print()}
                        title="Print official class timetable"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                    >
                        <Printer size={15} />
                        <span>Print Timetable</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: Learner Overview & Profile Dashboard */}
            {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {/* Stat Cards */}
                    <div className="stats-grid">
                        <StatCard 
                            title="Enrolled Subjects"
                            value={distinctSubjects.length}
                            subtitle="DepEd Curriculum Core & Applied"
                            icon={BookOpen}
                            color="var(--royal-bright)"
                            badge="Quarter 1"
                            badgeVariant="info"
                            onClick={() => onNavigateTab ? onNavigateTab('subjects') : null}
                        />

                        <StatCard 
                            title="Weekly Periods"
                            value={schedules.length}
                            subtitle="Scheduled contact sessions"
                            icon={CalendarCheck}
                            color="#10B981"
                            badge="Active"
                            badgeVariant="success"
                            onClick={() => onNavigateTab ? onNavigateTab('schedule') : null}
                        />

                        <StatCard 
                            title="Academic Standing"
                            value={assessmentsData?.academic_standing || 'Regular'}
                            subtitle={`Gen. Avg: ${assessmentsData?.general_average ? `${assessmentsData.general_average}%` : 'Evaluating'}`}
                            icon={Award}
                            color="#F59E0B"
                            badge="DepEd Standard"
                            badgeVariant="warning"
                            onClick={() => onNavigateTab ? onNavigateTab('assessments') : null}
                        />

                        <StatCard 
                            title="Today's Class Load"
                            value={`${todaySchedules.length} Classes`}
                            subtitle={`Scheduled for ${todayName}`}
                            icon={Clock}
                            color="#0284C7"
                            badge="Today"
                            badgeVariant="teal"
                            onClick={() => onNavigateTab ? onNavigateTab('agenda') : null}
                        />
                    </div>

                    {/* 60 / 40 Split Grid: Class Timetable & Section Placement */}
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
                                        {dailySchedules.length} classes
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                                    Scheduled academic sessions for {selectedDay}
                                </p>
                            </div>

                            {/* Day Selector + Weekly Timetable Link */}
                            <div className="flex items-center justify-between flex-wrap gap-3 my-4">
                                <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                                    {days.map((day) => {
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
                                    onClick={() => onNavigateTab ? onNavigateTab('schedule') : null}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer border-0 bg-transparent"
                                >
                                    <Calendar size={14} />
                                    <span>Classroom Timetables &rarr;</span>
                                </button>
                            </div>

                            {/* Clean 4-Column Schedule Table */}
                            <div className="flex-1 overflow-x-auto">
                                {dailySchedules.length > 0 ? (
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
                                            {dailySchedules.map((item) => (
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
                                                            {classInfo?.name || 'Class Section'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 pr-3 align-top">
                                                        <div className="text-xs font-bold text-slate-700">
                                                            {item.teacher?.name || 'Assigned Faculty'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 align-top">
                                                        <div className="text-xs font-semibold text-slate-500">
                                                            {item.room || classInfo?.room || 'Building J'}
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
                                            Select another weekday or check your curriculum subjects.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Panel Footer */}
                            <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">
                                    {selectedDay} &bull; {dailySchedules.length} classes scheduled
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => onNavigateTab ? onNavigateTab('agenda') : null}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer border-0 bg-transparent"
                                >
                                    <span>Full daily agenda</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* 2. Enrollment & Section Overview Panel */}
                        <div className="panel bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col m-0 shadow-xs">
                            {/* Header */}
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
                                    Enrollment Overview
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                                    Current academic placement directory
                                </p>
                            </div>

                            {/* Details Key-Value Cards */}
                            <div className="flex flex-col gap-3 my-4 flex-1">
                                <div className="bg-slate-50/80 rounded-xl border border-slate-200/70 p-4 space-y-3">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                                        <span className="text-xs font-semibold text-slate-500">Active section</span>
                                        <span className="text-xs font-extrabold text-slate-900">{classInfo?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                                        <span className="text-xs font-semibold text-slate-500">Level</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {classInfo?.grade_level >= 11 ? 'Senior High School' : 'Junior High School'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                                        <span className="text-xs font-semibold text-slate-500">Designated Venue</span>
                                        <span className="text-xs font-bold text-blue-700">{classInfo?.room || 'Main Academic Wing'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                                        <span className="text-xs font-semibold text-slate-500">Class Adviser</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {classInfo?.adviser?.name || 'TBA (Unassigned)'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-xs font-semibold text-slate-500">Enrolled Subjects</span>
                                        <span className="text-xs font-extrabold text-blue-600">{distinctSubjects.length} Core Subjects</span>
                                    </div>
                                </div>

                                {/* Callout Info Alert Box */}
                                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2.5">
                                    <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">
                                        All enrolled subjects reflect official DepEd K-12 academic loads assigned by school administration.
                                    </span>
                                </div>
                            </div>

                            {/* Panel Footer */}
                            <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">
                                    Quarter 1 Academic Standing
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => onNavigateTab ? onNavigateTab('subjects') : null}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer border-0 bg-transparent"
                                >
                                    <span>Subject curriculum</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Weekly Class Timetable Matrix */}
            {activeTab === 'schedule' && (
                <div style={{ marginTop: '0' }}>
                    <DynamicKanbanTimetable
                        schedules={schedules}
                        classroom={classInfo}
                        editable={false}
                        perspective="student"
                        title={
                            classInfo
                                ? `${classInfo.name} • Weekly Class Timetable (A.Y. 2026–2027)`
                                : 'My Weekly Class Timetable (A.Y. 2026–2027)'
                        }
                        subtitle="Automatically synced from your enrolled classroom and dynamically sorted from earliest morning class to latest session."
                    />
                </div>
            )}

            {/* TAB 3: Daily Period Agenda */}
            {activeTab === 'agenda' && (
                <div className="panel">
                    <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 className="panel-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                Daily Period Agenda
                            </h3>
                            <p className="panel-subtitle" style={{ margin: '3px 0 0 0' }}>
                                Filter class periods by day with start/finish times, subject teachers, and room numbers
                            </p>
                        </div>
                    </div>

                    {/* Day Selector Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {days.map((day) => {
                            const isCurrent = selectedDay === day;
                            const isToday = todayName === day;
                            return (
                                <button
                                    key={day}
                                    className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedDay(day)}
                                    style={{ 
                                        position: 'relative',
                                        fontWeight: isCurrent ? 700 : 500,
                                        background: isCurrent ? 'var(--royal-blue)' : undefined
                                    }}
                                >
                                    <span>{day}</span>
                                    {isToday && (
                                        <span style={{ fontSize: '0.65rem', marginLeft: '4px', opacity: 0.9 }}>
                                            (Today)
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {dailySchedules.length === 0 ? (
                        <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Calendar size={36} style={{ margin: '0 auto 0.5rem auto', color: 'var(--text-muted)' }} />
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>No Classes on {selectedDay}</div>
                            <div style={{ fontSize: '0.825rem', marginTop: '3px' }}>Enjoy your vacant study period or weekend break!</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {dailySchedules.map((s, idx) => (
                                <div 
                                    key={s.id || idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1.1rem 1.35rem',
                                        background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-subtle)',
                                        borderLeft: `5px solid ${s.subject?.color || 'var(--royal-bright)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ 
                                            width: '36px', 
                                            height: '36px', 
                                            borderRadius: '50%', 
                                            background: `${s.subject?.color || '#2563EB'}15`, 
                                            color: s.subject?.color || '#2563EB', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.85rem'
                                        }}>
                                            {idx + 1}
                                        </div>

                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                {s.subject?.name}
                                            </div>
                                            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                Teacher: <strong>{s.teacher?.name || 'Unassigned'}</strong> &bull; Venue: <strong>{s.room || 'TBA'}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <Badge variant="neutral">
                                        <Clock size={13} />
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                                            {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                                        </span>
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: Enrolled Subjects & Faculty Directory */}
            {activeTab === 'subjects' && (
                <div className="panel">
                    <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 className="panel-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                Enrolled Subjects & Faculty Directory
                            </h3>
                            <p className="panel-subtitle" style={{ margin: '3px 0 0 0' }}>
                                Official curriculum subject list, weekly unit contact hours, and assigned teachers
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {distinctSubjects.map((sub) => (
                            <div 
                                key={sub.id}
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border-subtle)',
                                    borderTop: `4px solid ${sub.color || 'var(--royal-bright)'}`,
                                    background: 'var(--bg-surface)',
                                    boxShadow: 'var(--shadow-sm)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {sub.code || 'DEPED'}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {sub.is_scheduled === false ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    Pending Timetable
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {sub.scheduled_periods_count || 1} session(s)/wk
                                                </span>
                                            )}
                                            <Badge variant="neutral">{sub.hours_per_week || 4} hrs/week</Badge>
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        {sub.name}
                                    </h4>

                                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <User size={14} style={{ color: 'var(--royal-bright)' }} />
                                            Faculty: <strong>{sub.teacher?.name || 'Department Faculty'}</strong>
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <MapPin size={14} style={{ color: 'var(--royal-bright)' }} />
                                            Room: <strong>{sub.room || classInfo?.room || 'TBD'}</strong>
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>Ayala NHS Core Curriculum</span>
                                    <CheckCircle2 size={14} color="#10B981" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: Classroom & Advisory */}
            {activeTab === 'classroom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="panel">
                        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 className="panel-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                    Section Placement & Classroom Advisory
                                </h3>
                                <p className="panel-subtitle" style={{ margin: '3px 0 0 0' }}>
                                    Academic Section details and adviser advisory hours for Ayala National High School
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            <div style={{ padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Class Section</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--royal-bright)', marginTop: '4px' }}>
                                    {classInfo?.name}
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Grade Level: <strong>Grade {classInfo?.grade_level}</strong>
                                </div>
                                {classInfo?.strand && (
                                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        Strand/Track: <strong>{classInfo.strand} &bull; {classInfo.track || 'Academic'}</strong>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Classroom Venue</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {classInfo?.room || 'DepEd Academic Wing'}
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Ayala National High School Campus
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Division of Zamboanga City, Region IX
                                </div>
                            </div>

                            <div style={{ padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Class Adviser</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {classInfo?.adviser?.name || 'TBA (To Be Assigned)'}
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Email: <strong>{classInfo?.adviser?.email || 'N/A (TBA)'}</strong>
                                </div>
                                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Specialization: {classInfo?.adviser?.specialization || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: DepEd Form 138 (SF-9) Official Report Card & Academic Grades */}
            {activeTab === 'assessments' && (
                <div className="space-y-6">
                    {/* Official Report Card Container */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                        {/* School Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider">
                                        DepEd Form 138 (SF-9) • Official Learner Progress Report
                                    </span>
                                </div>
                                <h2 className="text-xl font-extrabold text-slate-900 m-0">
                                    Ayala National High School
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 mb-0">
                                    Academic Year 2026–2027 &bull; DepEd Order No. 8, s. 2015 Grading Standard
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                                >
                                    <Printer size={15} />
                                    <span>Print Report Card</span>
                                </button>
                            </div>
                        </div>

                        {/* Learner Identity Banner */}
                        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-400 font-bold block text-[10px] uppercase">Learner Name</span>
                                <strong className="text-slate-900 text-sm">{reportCardData?.student?.name || data?.student?.name || 'Enrolled Student'}</strong>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold block text-[10px] uppercase">Learner Reference No. (LRN)</span>
                                <span className="text-slate-800 font-mono font-bold text-xs">{reportCardData?.student?.lrn || data?.student?.lrn || '—'}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold block text-[10px] uppercase">Grade &amp; Section</span>
                                <strong className="text-slate-900">
                                    {reportCardData?.class_info?.name || data?.class_info?.name || '—'}
                                </strong>
                            </div>
                            <div>
                                <span className="text-slate-400 font-bold block text-[10px] uppercase">Homeroom Class Adviser</span>
                                <span className="text-slate-800 font-medium">
                                    {reportCardData?.class_info?.adviser_name || data?.class_info?.adviser_name || 'TBA'}
                                </span>
                            </div>
                        </div>

                        {/* General Average & Standing Card */}
                        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <span className="text-[11px] font-extrabold uppercase text-blue-800 tracking-wider">
                                    Overall General Average
                                </span>
                                <div className="text-3xl font-extrabold text-blue-900 mt-0.5">
                                    {reportCardData?.general_average ? `${reportCardData.general_average}%` : 'Evaluating'}
                                </div>
                                <div className="text-xs text-blue-700/80 mt-1">
                                    Promotional Status:{' '}
                                    <strong>
                                        {reportCardData?.general_average && reportCardData.general_average >= 75
                                            ? 'Promoted to Next Grade Level'
                                            : 'Continuous Evaluation'}
                                    </strong>
                                </div>
                            </div>

                            <div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                                    (reportCardData?.general_average || 0) >= 90
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : (reportCardData?.general_average || 0) >= 75
                                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                                          : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                    <Award size={14} />
                                    <span>{reportCardData?.academic_standing || 'Regular Standing'}</span>
                                </span>
                            </div>
                        </div>

                        {/* Official Subjects Table */}
                        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                                            <th className="py-3.5 px-4 min-w-[200px]">Learning Area (Subject)</th>
                                            <th className="py-3.5 px-3 w-20 text-center">Q1</th>
                                            <th className="py-3.5 px-3 w-20 text-center">Q2</th>
                                            <th className="py-3.5 px-3 w-20 text-center">Q3</th>
                                            <th className="py-3.5 px-3 w-20 text-center">Q4</th>
                                            <th className="py-3.5 px-3.5 w-24 text-center bg-blue-50/60 font-black">Final</th>
                                            <th className="py-3.5 px-4 min-w-[150px]">DepEd Descriptor</th>
                                            <th className="py-3.5 px-3.5 w-24 text-center">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(!reportCardData?.subjects || reportCardData.subjects.length === 0) ? (
                                            <tr>
                                                <td colSpan="8" className="py-8 text-center text-slate-400">
                                                    No subject grades encoded yet for this academic year. Your subject teachers will encode quarterly ratings here.
                                                </td>
                                            </tr>
                                        ) : (
                                            reportCardData.subjects.map((sub, idx) => {
                                                const isPassed = sub.final_rating !== null && sub.final_rating >= 75;
                                                const isFailed = sub.final_rating !== null && sub.final_rating < 75;
                                                return (
                                                    <tr key={sub.subject_id || idx} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3.5 px-4">
                                                            <div className="font-extrabold text-slate-900">{sub.subject_name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">{sub.subject_code}</div>
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                            {sub.q1 !== null ? sub.q1 : '—'}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                            {sub.q2 !== null ? sub.q2 : '—'}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                            {sub.q3 !== null ? sub.q3 : '—'}
                                                        </td>
                                                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                                            {sub.q4 !== null ? sub.q4 : '—'}
                                                        </td>
                                                        <td className="py-3.5 px-3.5 text-center font-black bg-blue-50/40 text-sm text-slate-900">
                                                            {sub.final_rating !== null ? sub.final_rating : '—'}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            {sub.descriptor ? (
                                                                <span className="font-semibold text-slate-700">
                                                                    {sub.descriptor}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-3.5 text-center">
                                                            {sub.remarks ? (
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                                    isPassed
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : isFailed
                                                                          ? 'bg-red-100 text-red-800'
                                                                          : 'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {sub.remarks}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        {/* General Average Summary Footer Row */}
                                        {reportCardData?.general_average && (
                                            <tr className="bg-slate-50/90 font-extrabold border-t-2 border-slate-200">
                                                <td colSpan="5" className="py-3.5 px-4 text-right uppercase text-[11px] text-slate-600">
                                                    General Average (Final Rating):
                                                </td>
                                                <td className="py-3.5 px-3.5 text-center text-sm font-black text-blue-900 bg-blue-100/60">
                                                    {reportCardData.general_average}%
                                                </td>
                                                <td colSpan="2" className="py-3.5 px-4 font-bold text-emerald-700">
                                                    {reportCardData.academic_standing}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* DepEd Grading Scale Reference Legend */}
                        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-slate-500">
                            <div><strong>90–100:</strong> Outstanding</div>
                            <div><strong>85–89:</strong> Very Satisfactory</div>
                            <div><strong>80–84:</strong> Satisfactory</div>
                            <div><strong>75–79:</strong> Fairly Satisfactory</div>
                            <div><strong>Below 75:</strong> Did Not Meet Expectations</div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 7: Teacher Guidance Notes & Feedback */}
            {activeTab === 'feedback' && (
                <div className="panel">
                    <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 className="panel-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                Teacher Guidance Notes & Feedback
                            </h3>
                            <p className="panel-subtitle" style={{ margin: '3px 0 0 0' }}>
                                Developmental feedback and official advisories dispatched by your subject teachers
                            </p>
                        </div>
                    </div>

                    {(!feedbackData || feedbackData.length === 0) ? (
                        <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <FileText size={36} style={{ margin: '0 auto 0.5rem auto', color: '#CBD5E1' }} />
                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>No Teacher Guidance Notes Dispatched</div>
                            <div style={{ fontSize: '0.825rem', marginTop: '3px' }}>Feedback on your academic performance or attendance will appear here.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {feedbackData.map((fb) => (
                                <div 
                                    key={fb.id}
                                    style={{
                                        padding: '1.15rem 1.25rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        background: 'var(--bg-elevated)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Badge variant="teal">{fb.category || 'Academic Guidance'}</Badge>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                {fb.subject?.name || 'Class Subject'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Teacher: <strong style={{ color: 'var(--text-secondary)' }}>{fb.teacher?.name}</strong> &bull; {new Date(fb.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {fb.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
