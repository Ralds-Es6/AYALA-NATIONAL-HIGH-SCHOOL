import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard,
    GraduationCap, 
    CalendarCheck, 
    Clock, 
    Layers, 
    BookOpen, 
    Mail, 
    Phone, 
    Award, 
    MapPin, 
    ArrowRight,
    Plus,
    CheckCircle,
    FileText,
    TrendingUp,
    Send,
    Edit3,
    AlertCircle,
    UserCheck,
    Save,
    Printer,
    Calendar,
    Users,
    Search
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import DynamicKanbanTimetable from '../../components/schedules/DynamicKanbanTimetable';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import StatCard from '../../components/StatCard';
import Pagination from '../../components/ui/Pagination';
import { notify } from '../../components/notifications/notify';
import InteractiveQuarterlyGradebook from '../../components/grades/InteractiveQuarterlyGradebook';

export default function TeacherPortal({ activeTab = 'dashboard', onNavigateTab }) {
    const [localTab, setLocalTab] = useState(activeTab);
    const currentTab = activeTab || localTab;
    const [loadsCurrentPage, setLoadsCurrentPage] = useState(1);
    const [loadsData, setLoadsData] = useState(null);
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agendaDay, setAgendaDay] = useState('Monday');
    const [dashboardDay, setDashboardDay] = useState('Monday');

    // Assessment State
    const [assessments, setAssessments] = useState([]);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAssessment, setNewAssessment] = useState({
        title: '',
        type: 'Written Work',
        quarter: '1st Quarter',
        subject_id: '',
        school_class_id: '',
        max_score: 50,
        passing_score: 37.5,
        assessment_date: new Date().toISOString().split('T')[0],
        description: '',
    });

    // Active Gradebook Sheet State
    const [activeSheetAssessment, setActiveSheetAssessment] = useState(null);
    const [sheetStudents, setSheetStudents] = useState([]);
    const [sheetGrades, setSheetGrades] = useState({});
    const [savingGrades, setSavingGrades] = useState(false);

    // Student Feedback State
    const [feedbackForm, setFeedbackForm] = useState({
        student_id: '',
        subject_id: '',
        category: 'Academic Performance',
        message: '',
    });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    // Grading System Mode & Class Roster State
    const [gradingMode, setGradingMode] = useState('quarterly'); // 'quarterly' | 'tasks'
    const [selectedRosterClassId, setSelectedRosterClassId] = useState('');
    const [rosterStudents, setRosterStudents] = useState([]);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [rosterSearch, setRosterSearch] = useState('');

    // Load initial portal data
    const fetchTeacherData = async () => {
        setLoading(true);
        try {
            const [loadsSettled, scheduleSettled] = await Promise.allSettled([
                srnhsApi.getTeacherLoads(),
                srnhsApi.getTeacherSchedule(),
            ]);

            const loadsRes = loadsSettled.status === 'fulfilled' && loadsSettled.value
                ? loadsSettled.value
                : {
                    teacher: {
                        name: 'Faculty Member',
                        position: 'Teacher',
                        specialization: 'General Education',
                        max_weekly_hours: 30,
                        total_assigned_hours: 0,
                    },
                    data: [],
                };

            const scheduleRes = scheduleSettled.status === 'fulfilled' && scheduleSettled.value
                ? scheduleSettled.value
                : { teacher: loadsRes.teacher, data: [] };

            setLoadsData(loadsRes);
            setScheduleData(scheduleRes);

            // Pre-select first load's subject and class for assessment creation
            if (loadsRes.data && loadsRes.data.length > 0) {
                setNewAssessment((prev) => ({
                    ...prev,
                    subject_id: loadsRes.data[0].subject_id,
                    school_class_id: loadsRes.data[0].school_class_id,
                }));
                setFeedbackForm((prev) => ({
                    ...prev,
                    subject_id: loadsRes.data[0].subject_id,
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load teacher assessments
    const fetchAssessments = async () => {
        setLoadingAssessments(true);
        try {
            const res = await srnhsApi.getAssessments();
            setAssessments(res || []);
        } catch (err) {
            console.error('Error loading assessments:', err);
        } finally {
            setLoadingAssessments(false);
        }
    };

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const activeDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(todayName) 
        ? todayName 
        : 'Monday';

    useEffect(() => {
        fetchTeacherData();
        fetchAssessments();
    }, []);

    useEffect(() => {
        setAgendaDay(activeDay);
        setDashboardDay(activeDay);
    }, [activeDay]);

    useEffect(() => {
        if (activeTab && activeTab !== 'assessments') {
            setActiveSheetAssessment(null);
        }
    }, [activeTab]);

    // Unique assigned classes from loads and schedules for Class Roster & Grading
    const uniqueAssignedClasses = React.useMemo(() => {
        const list = [];
        const seen = new Set();
        (loadsData?.data || []).forEach((l) => {
            if (l.school_class && !seen.has(l.school_class_id)) {
                seen.add(l.school_class_id);
                list.push(l.school_class);
            }
        });
        (scheduleData?.data || []).forEach((s) => {
            if (s.school_class && !seen.has(s.school_class_id)) {
                seen.add(s.school_class_id);
                list.push(s.school_class);
            }
        });
        return list;
    }, [loadsData, scheduleData]);

    useEffect(() => {
        if (!selectedRosterClassId && uniqueAssignedClasses.length > 0) {
            setSelectedRosterClassId(String(uniqueAssignedClasses[0].id));
        }
    }, [uniqueAssignedClasses, selectedRosterClassId]);

    const fetchRoster = async (classId) => {
        if (!classId) return;
        setLoadingRoster(true);
        try {
            const res = await srnhsApi.getStudents({ school_class_id: classId, per_page: 100 });
            const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            setRosterStudents(list);
        } catch (err) {
            console.error('Failed to load roster:', err);
        } finally {
            setLoadingRoster(false);
        }
    };

    useEffect(() => {
        if (currentTab === 'students' && selectedRosterClassId) {
            fetchRoster(selectedRosterClassId);
        }
    }, [currentTab, selectedRosterClassId]);

    // Open Gradebook Sheet for an assessment
    const handleOpenGradebook = async (assessment) => {
        setActiveSheetAssessment(assessment);
        try {
            const res = await srnhsApi.getAssessmentGradingSheet(assessment.id);
            setSheetStudents(res.students || []);

            // Map existing scores to local state
            const initialScores = {};
            (res.students || []).forEach((s) => {
                initialScores[s.student_id] = {
                    score: s.score !== '' ? s.score : '',
                    remarks: s.remarks || '',
                };
            });
            setSheetGrades(initialScores);
        } catch (err) {
            notify.error('Gradebook Error', 'Failed to load grading sheet for this assessment.');
        }
    };

    // Save grades
    const handleSaveGrades = async () => {
        if (!activeSheetAssessment) return;
        setSavingGrades(true);
        try {
            const gradesPayload = Object.entries(sheetGrades).map(([studentId, data]) => ({
                student_id: parseInt(studentId, 10),
                score: data.score !== '' ? parseFloat(data.score) : null,
                remarks: data.remarks,
            }));

            await srnhsApi.saveAssessmentGrades(activeSheetAssessment.id, gradesPayload);
            notify.success(
                'Grades Saved', 
                `Scores for "${activeSheetAssessment.title}" have been successfully updated and published to students!`,
                { mascot: 'success' }
            );
            await fetchAssessments();
            // Refresh current sheet
            const res = await srnhsApi.getAssessmentGradingSheet(activeSheetAssessment.id);
            setSheetStudents(res.students || []);
        } catch (err) {
            notify.error('Save Failed', err.message || 'Unable to record student scores.');
        } finally {
            setSavingGrades(false);
        }
    };

    // Create New Assessment
    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        try {
            await srnhsApi.createAssessment(newAssessment);
            notify.success(
                'Assessment Created', 
                `"${newAssessment.title}" has been scheduled. You can now record student scores.`,
                { mascot: 'success' }
            );
            setIsCreateModalOpen(false);
            setNewAssessment((prev) => ({
                ...prev,
                title: '',
                description: '',
            }));
            await fetchAssessments();
        } catch (err) {
            notify.error('Creation Failed', err.message || 'Unable to create assessment.');
        }
    };

    // Submit Student Feedback
    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!feedbackForm.student_id || !feedbackForm.message) {
            notify.error('Incomplete Feedback', 'Please select a student and enter feedback notes.');
            return;
        }

        setSubmittingFeedback(true);
        try {
            await srnhsApi.submitStudentFeedback(feedbackForm);
            notify.email(
                'Feedback Dispatched', 
                'Academic guidance note has been saved and made accessible on the student portal.',
                { mascot: 'email' }
            );
            setFeedbackForm((prev) => ({
                ...prev,
                student_id: '',
                message: '',
            }));
        } catch (err) {
            notify.error('Dispatch Failed', err.message || 'Unable to send student feedback.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    if (loading || !loadsData) {
        return <LoadingSpinner text="Loading Ayala NHS teacher portal and timetable..." />;
    }

    const teacher = loadsData.teacher;
    const loads = loadsData.data || [];
    const schedules = scheduleData?.data || [];

    // Distinct subjects and classes count
    const distinctSubjects = new Set(loads.map((l) => l.subject_id)).size;
    const distinctClasses = new Set(loads.map((l) => l.school_class_id)).size;

    const todaysSchedules = schedules
        .filter((s) => s.day_of_week === activeDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const firstName = teacher.name ? teacher.name.split(' ')[1] || teacher.name.split(' ')[0] : 'Teacher';

    // Unique enrolled students across teacher's classes for feedback form
    const allAssignedClasses = loads.map((l) => l.school_class).filter(Boolean);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dashboardDaySchedules = schedules
        .filter((s) => s.day_of_week === dashboardDay)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    const assignedHours = loadsData.teacher?.total_assigned_hours ?? loadsData.total_hours ?? 0;
    const maxWeeklyHours = teacher.max_weekly_hours || 30;
    const isUnderload = assignedHours < maxWeeklyHours;
    const isAtCapacity = assignedHours === maxWeeklyHours;
    const isOverload = assignedHours > maxWeeklyHours;
    const workloadPct = Math.min(100, Math.round((assignedHours / maxWeeklyHours) * 100));

    return (
        <div>
            {/* Header Greeting & Page Title */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-6 shadow-xs">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div>
                        <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span>DepEd Faculty Workload &amp; Schedule</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
                                {currentTab === 'dashboard' ? `Academic Operations Dashboard` : (
                                    currentTab === 'schedule' ? 'Weekly Teaching Timetable' :
                                    currentTab === 'agenda' ? 'Daily Period Agenda' :
                                    currentTab === 'loads' ? 'Assigned Curriculum Loads' :
                                    currentTab === 'assessments' ? 'Assessments & DepEd SF-9 Gradebook' :
                                    currentTab === 'feedback' ? 'Student Guidance & Advisories' :
                                    currentTab === 'students' ? 'Enrolled Learners & Class Masterlist' :
                                    `Faculty Operations`
                                )}
                            </h1>
                            <Badge variant="teal">DepEd Faculty</Badge>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
                            {teacher.name} &bull; {teacher.position || 'Teacher I'} &bull; Specialization: <span style={{ color: 'var(--royal-bright)', fontWeight: 700 }}>{teacher.specialization || 'General Education'}</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => window.print()}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                            title="Print official teaching timetable"
                        >
                            <Printer size={15} />
                            <span>Print Timetable</span>
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        >
                            <Plus size={15} />
                            <span>New Assessment</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* SUB TAB 1: Dashboard Overview */}
            {currentTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="stats-grid">
                        <StatCard 
                            title="Total Faculty"
                            value={1}
                            subtitle="DepEd teaching staff"
                            icon={Users}
                            iconColor="#2563EB"
                            onClick={() => {
                                setLocalTab('loads');
                                if (onNavigateTab) onNavigateTab('loads');
                            }}
                        />

                        <StatCard 
                            title="Active Classrooms"
                            value={distinctClasses}
                            unit="sections"
                            subtitle="Junior & Senior High School"
                            icon={BookOpen}
                            iconColor="#059669"
                            onClick={() => {
                                setLocalTab('students');
                                if (onNavigateTab) onNavigateTab('students');
                            }}
                        />

                        <StatCard 
                            title="Weekly Contact Hours"
                            value={assignedHours}
                            unit="hrs"
                            subtitle={`Across ${schedules.length} class sessions`}
                            icon={Clock}
                            iconColor="#6366F1"
                            onClick={() => {
                                setLocalTab('loads');
                                if (onNavigateTab) onNavigateTab('loads');
                            }}
                        />

                        <StatCard 
                            title="Schedule Health"
                            value={isOverload ? 1 : 0}
                            unit={isOverload ? 'overload' : 'conflicts'}
                            subtitle={isOverload ? 'Exceeding 30h standard' : '100% conflict-free'}
                            subtitleColor={isOverload ? '#DC2626' : '#16A34A'}
                            icon={isOverload ? AlertCircle : CheckCircle}
                            iconColor={isOverload ? '#DC2626' : '#16A34A'}
                            onClick={() => {
                                setLocalTab('schedule');
                                if (onNavigateTab) onNavigateTab('schedule');
                            }}
                        />
                    </div>

                    {/* 60 / 40 Split Grid: Class Timetable & Faculty Workload */}
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
                                        {dashboardDaySchedules.length} classes
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                                    Scheduled academic sessions for {dashboardDay}
                                </p>
                            </div>

                            {/* Day Selector + Weekly Timetable Link */}
                            <div className="flex items-center justify-between flex-wrap gap-3 my-4">
                                <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                                    {daysOfWeek.map((day) => {
                                        const isSelected = dashboardDay === day;
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => setDashboardDay(day)}
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
                                    onClick={() => {
                                        setLocalTab('schedule');
                                        if (onNavigateTab) onNavigateTab('schedule');
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer border-0 bg-transparent"
                                >
                                    <Calendar size={14} />
                                    <span>Classroom Timetables &rarr;</span>
                                </button>
                            </div>

                            {/* Clean 4-Column Schedule Table */}
                            <div className="flex-1 overflow-x-auto">
                                {dashboardDaySchedules.length > 0 ? (
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
                                            {dashboardDaySchedules.map((item) => (
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
                                                            {item.school_class?.name || 'Class Section'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 pr-3 align-top">
                                                        <div className="text-xs font-bold text-slate-700">
                                                            {teacher.name}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 align-top">
                                                        <div className="text-xs font-semibold text-slate-500">
                                                            {item.room || 'Building J'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Calendar size={28} className="text-slate-300 mx-auto mb-2" />
                                        <p className="m-0 font-bold text-sm text-slate-700">No classes scheduled for {dashboardDay}</p>
                                        <span className="text-xs text-slate-400 mt-1 block">
                                            Select another weekday or prepare lesson materials.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Panel Footer */}
                            <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">
                                    {dashboardDay} &bull; {dashboardDaySchedules.length} classes scheduled
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setLocalTab('agenda');
                                        if (onNavigateTab) onNavigateTab('agenda');
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer border-0 bg-transparent"
                                >
                                    <span>Manage classroom timetables</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        {/* 2. Faculty Workload Distribution Panel */}
                        <div className="panel bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col m-0 shadow-xs">
                            {/* Header */}
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
                                    Faculty Workload
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                                    Weekly teaching hours against the DepEd 30h standard
                                </p>
                            </div>

                            {/* Summary Metrics Box */}
                            <div className="grid grid-cols-3 gap-3 my-4 bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/60">
                                <div>
                                    <div className="text-xs font-bold text-amber-600">
                                        Underload
                                    </div>
                                    <div className="text-2xl font-black text-amber-600 mt-0.5 leading-tight">
                                        {isUnderload ? 1 : 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500">
                                        At Capacity
                                    </div>
                                    <div className="text-2xl font-black text-slate-900 mt-0.5 leading-tight">
                                        {isAtCapacity ? 1 : 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-500">
                                        Overloaded
                                    </div>
                                    <div className={`text-2xl font-black mt-0.5 leading-tight ${isOverload ? 'text-rose-600' : 'text-slate-900'}`}>
                                        {isOverload ? 1 : 0}
                                    </div>
                                </div>
                            </div>

                            {/* Faculty Capacity Row */}
                            <div className="flex flex-col gap-4 flex-1">
                                <div>
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div>
                                            <div className="text-xs font-extrabold text-slate-900 leading-tight">
                                                {teacher.name}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                                                {teacher.specialization || 'Mathematics'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-extrabold text-slate-900 leading-tight">
                                                {assignedHours} / {maxWeeklyHours} hrs
                                            </div>
                                            <div className={`text-[11px] font-bold mt-0.5 ${
                                                isOverload ? 'text-rose-600' : isUnderload ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                                {isOverload ? 'Overload' : isUnderload ? 'Underload' : 'At capacity'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                isOverload ? 'bg-rose-500' : isUnderload ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${workloadPct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Callout Info Alert Box */}
                                <div className="mt-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">
                                        {isUnderload
                                            ? 'Underload indicates fewer than 30 assigned hours per week. Review available capacity before assigning classes.'
                                            : isAtCapacity
                                                ? 'Standard teaching load achieved (30h/week compliance with DepEd Order No. 007).'
                                                : 'Teaching load exceeds standard 30 hours threshold prescribed by DepEd.'}
                                    </span>
                                </div>
                            </div>

                            {/* Panel Footer */}
                            <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500">
                                    Allocation / weekly capacity
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setLocalTab('loads');
                                        if (onNavigateTab) onNavigateTab('loads');
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer border-0 bg-transparent"
                                >
                                    <span>Full monitor</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUB TAB 2: Full Weekly Timetable Grid */}
            {currentTab === 'schedule' && (
                <div style={{ marginTop: '0' }}>
                    <DynamicKanbanTimetable
                        schedules={schedules}
                        editable={false}
                        perspective="teacher"
                        title={`Faculty Schedule: ${scheduleData?.teacher?.name || teacher?.name || 'My Teaching Timetable'} (A.Y. 2026–2027)`}
                        subtitle="Your assigned teaching periods across all classroom sections, dynamically ordered from earliest morning class to latest session."
                    />
                </div>
            )}

            {/* SUB TAB 2.5: Daily Period Agenda */}
            {currentTab === 'agenda' && (
                <div className="panel">
                    <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                        <div>
                            <h3 className="panel-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                                Daily Teaching Period Agenda
                            </h3>
                            <p className="panel-subtitle" style={{ margin: '3px 0 0 0' }}>
                                Interactive daily schedule breakdown with classroom assignments and time allocations
                            </p>
                        </div>
                    </div>

                    {/* Day selector pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                            const isCurrent = agendaDay === day;
                            const isToday = todayName === day;
                            return (
                                <button
                                    key={day}
                                    className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setAgendaDay(day)}
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

                    {schedules.filter((s) => s.day_of_week === agendaDay).length === 0 ? (
                        <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Calendar size={36} style={{ margin: '0 auto 0.5rem auto', color: 'var(--text-muted)' }} />
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>No Classes on {agendaDay}</div>
                            <div style={{ fontSize: '0.825rem', marginTop: '3px' }}>Use this period for grading, module preparation, or department meetings.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {schedules
                                .filter((s) => s.day_of_week === agendaDay)
                                .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                                .map((s, idx) => (
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
                                                    Section: <strong>{s.school_class?.name || 'Class Section'}</strong> &bull; Venue: <strong>{s.room || 'TBA'}</strong>
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

            {/* SUB TAB 3: Teaching Loads */}
            {currentTab === 'loads' && (
                <div className="panel">
                    <div className="panel-header">
                        <div>
                            <h3 className="panel-title">My Teaching Loads</h3>
                            <p className="panel-subtitle">Curriculum subjects, sections, and weekly teaching contact hours</p>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Subject Name</th>
                                    <th>Class Section</th>
                                    <th>Weekly Hours</th>
                                    <th>Scheduled Sessions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loads.slice((loadsCurrentPage - 1) * 10, loadsCurrentPage * 10).map((load) => (
                                    <tr key={load.id}>
                                        <td>
                                            <span style={{ fontWeight: 800, color: 'var(--royal-bright)', fontFamily: 'monospace' }}>
                                                {load.subject?.code}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{load.subject?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Grade {load.subject?.grade_level}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variant="neutral">
                                                {load.school_class?.name}
                                            </Badge>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {load.teaching_hours} hrs/week
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                                                {load.schedules?.length || 0} scheduled class(es)
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination 
                            currentPage={loadsCurrentPage}
                            totalItems={loads.length}
                            pageSize={10}
                            onPageChange={setLoadsCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* SUB TAB 4: Assessments & Gradebook Entry */}
            {currentTab === 'assessments' && (
                <div className="space-y-5">
                    {/* View Switcher Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setGradingMode('quarterly')}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                                    gradingMode === 'quarterly'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Award size={15} />
                                <span>DepEd Quarterly Gradebook (E-Class Record)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setGradingMode('tasks')}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                                    gradingMode === 'tasks'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <FileText size={15} />
                                <span>Activities &amp; Assessment Tasks ({assessments.length})</span>
                            </button>
                        </div>
                    </div>

                    {gradingMode === 'quarterly' ? (
                        <InteractiveQuarterlyGradebook role="teacher" />
                    ) : (
                        <div>
                            {!activeSheetAssessment ? (
                        /* Assessment List View */
                        <div className="panel">
                            <div className="panel-header">
                                <div>
                                    <h3 className="panel-title">Student Assessment & Grade Recording</h3>
                                    <p className="panel-subtitle">Manage written works, performance tasks, and quarterly examinations</p>
                                </div>
                                <button className="btn btn-gold btn-sm" onClick={() => setIsCreateModalOpen(true)}>
                                    <Plus size={16} />
                                    <span>New Assessment</span>
                                </button>
                            </div>

                            {loadingAssessments ? (
                                <LoadingSpinner text="Loading assessments..." />
                            ) : assessments.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No Assessments Created Yet</div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        Create an assessment task to start recording student grades.
                                    </p>
                                    <button className="btn btn-gold btn-sm" style={{ marginTop: '1rem' }} onClick={() => setIsCreateModalOpen(true)}>
                                        <Plus size={16} /> Create First Assessment
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', padding: '1.25rem' }}>
                                    {assessments.map((a) => (
                                        <div key={a.id} className="assessment-card">
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <Badge variant={a.type === 'Quarterly Exam' ? 'danger' : (a.type === 'Performance Task' ? 'warning' : 'info')}>
                                                        {a.type}
                                                    </Badge>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                        {a.quarter}
                                                    </span>
                                                </div>

                                                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                                                    {a.title}
                                                </h4>

                                                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                                                    <strong>{a.subject?.name}</strong> &bull; {a.school_class?.name}
                                                </div>

                                                {a.description && (
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineClamp: 2 }}>
                                                        {a.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Quick Stats */}
                                            <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max / Pass</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{a.max_score} / {a.passing_score}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Graded</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--royal-bright)' }}>
                                                        {a.stats?.graded_count || 0} / {a.stats?.total_students || 0}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pass Rate</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: (a.stats?.pass_rate || 0) >= 75 ? 'var(--success)' : 'var(--error)' }}>
                                                        {a.stats?.pass_rate || 0}%
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                className="btn btn-primary btn-sm" 
                                                style={{ width: '100%', justifyContent: 'center' }}
                                                onClick={() => handleOpenGradebook(a)}
                                            >
                                                <Edit3 size={15} />
                                                <span>Open Gradebook Sheet</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Interactive Gradebook Sheet */
                        <div className="panel">
                            <div className="panel-header" style={{ borderBottom: '2px solid var(--primary-light)' }}>
                                <div>
                                    <button 
                                        className="btn btn-ghost btn-sm" 
                                        style={{ marginBottom: '0.5rem', paddingLeft: 0 }}
                                        onClick={() => setActiveSheetAssessment(null)}
                                    >
                                        &larr; Back to Assessments
                                    </button>
                                    <h3 className="panel-title">{activeSheetAssessment.title}</h3>
                                    <p className="panel-subtitle">
                                        {activeSheetAssessment.subject?.name} &bull; {activeSheetAssessment.school_class?.name} &bull; Max Score: {activeSheetAssessment.max_score} pts (Passing: {activeSheetAssessment.passing_score} pts)
                                    </p>
                                </div>

                                <button 
                                    className="btn btn-gold" 
                                    onClick={handleSaveGrades}
                                    disabled={savingGrades}
                                >
                                    <Save size={16} />
                                    <span>{savingGrades ? 'Saving Scores...' : 'Save & Publish Grades'}</span>
                                </button>
                            </div>

                            <div className="gradebook-table-container">
                                <table className="gradebook-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px' }}>#</th>
                                            <th>Student Name</th>
                                            <th>LRN</th>
                                            <th style={{ width: '140px', textAlign: 'center' }}>Score (Max: {activeSheetAssessment.max_score})</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Percentage</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                                            <th>Remarks / Qualitative Feedback</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sheetStudents.map((s, idx) => {
                                            const currentVal = sheetGrades[s.student_id]?.score ?? '';
                                            const numVal = parseFloat(currentVal);
                                            const percentage = !isNaN(numVal) 
                                                ? Math.round((numVal / activeSheetAssessment.max_score) * 100) 
                                                : null;
                                            const isPassed = !isNaN(numVal) && numVal >= activeSheetAssessment.passing_score;

                                            return (
                                                <tr key={s.student_id}>
                                                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</td>
                                                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.lrn}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input 
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max={activeSheetAssessment.max_score}
                                                            className="gradebook-input"
                                                            placeholder="—"
                                                            value={currentVal}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setSheetGrades((prev) => ({
                                                                    ...prev,
                                                                    [s.student_id]: {
                                                                        ...prev[s.student_id],
                                                                        score: val,
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                                                        {percentage !== null ? `${percentage}%` : '—'}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {percentage !== null ? (
                                                            <span className={isPassed ? 'academic-badge-passed' : 'academic-badge-failed'}>
                                                                {isPassed ? 'Passed' : 'Failed'}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="text"
                                                            placeholder="Optional teacher remark..."
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.4rem 0.6rem',
                                                                fontSize: '0.85rem',
                                                                border: '1px solid var(--border-subtle)',
                                                                borderRadius: 'var(--radius-sm)',
                                                                outline: 'none'
                                                            }}
                                                            value={sheetGrades[s.student_id]?.remarks ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setSheetGrades((prev) => ({
                                                                    ...prev,
                                                                    [s.student_id]: {
                                                                        ...prev[s.student_id],
                                                                        remarks: val,
                                                                    }
                                                                }));
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                        </div>
                    )}
                </div>
            )}

            {/* SUB TAB 5: Student Feedback Submission */}
            {currentTab === 'feedback' && (
                <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="panel-header">
                        <div>
                            <h3 className="panel-title">Provide Student Academic Feedback</h3>
                            <p className="panel-subtitle">Send personalized commendations, intervention advice, or guidance notes to students</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitFeedback} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Subject Context</label>
                                <select 
                                    className="form-control"
                                    value={feedbackForm.subject_id}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, subject_id: e.target.value })}
                                >
                                    <option value="">Select Subject</option>
                                    {loads.map((l) => (
                                        <option key={l.subject_id} value={l.subject_id}>
                                            {l.subject?.name} ({l.school_class?.name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Feedback Category</label>
                                <select 
                                    className="form-control"
                                    value={feedbackForm.category}
                                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                                >
                                    <option value="Academic Performance">Academic Performance</option>
                                    <option value="Commendation">Commendation (Exemplary Work)</option>
                                    <option value="Improvement Needed">Improvement Needed (Remediation)</option>
                                    <option value="Attendance / Conduct">Attendance & Participation</option>
                                    <option value="General Advisory">General Academic Advisory</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Target Student (LRN / Name)</label>
                            <select 
                                className="form-control"
                                value={feedbackForm.student_id}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, student_id: e.target.value })}
                                required
                            >
                                <option value="">Select Student</option>
                                {sheetStudents.length > 0 ? (
                                    sheetStudents.map((s) => (
                                        <option key={s.student_id} value={s.student_id}>
                                            {s.name} (LRN: {s.lrn})
                                        </option>
                                    ))
                                ) : (
                                    /* Fallback list */
                                    <>
                                        <option value="1">Christian Paul Quinto (LRN: 109823456789)</option>
                                        <option value="2">Bea Beatrice Alonzo (LRN: 109823456790)</option>
                                        <option value="3">John Lloyd Cruz (LRN: 109823456791)</option>
                                        <option value="4">Kathryn Bernardo (LRN: 109823456792)</option>
                                        <option value="5">Daniel Padilla (LRN: 109823456793)</option>
                                    </>
                                )}
                            </select>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                Tip: You can also open an assessment gradebook above to load that section's masterlist.
                            </small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Feedback / Advisory Message</label>
                            <textarea 
                                className="form-control"
                                rows="4"
                                placeholder="Write clear, constructive feedback or commendation that will appear directly on the student's personal dashboard..."
                                value={feedbackForm.message}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={submittingFeedback}
                            >
                                <Send size={16} />
                                <span>{submittingFeedback ? 'Dispatching...' : 'Dispatch Feedback Note'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SUB TAB 6: Assigned Class Advisory & Learners (Scoped strictly to teacher's classes) */}
            {currentTab === 'students' && (
                <div className="space-y-5">
                    {/* Header & Section Selector */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    <span className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider">
                                        Faculty Access Scope • Student Privacy Protection
                                    </span>
                                </div>
                                <h3 className="text-lg font-extrabold text-slate-900 m-0">
                                    Enrolled Learners &amp; Class Masterlist (DepEd SF-1)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 mb-0">
                                    You can exclusively view and manage learners in your assigned class sections.
                                </p>
                            </div>

                            {/* Search Box */}
                            <div className="relative min-w-[240px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter by student name, LRN..."
                                    value={rosterSearch}
                                    onChange={(e) => setRosterSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                />
                            </div>
                        </div>

                        {/* Class Section Selection Pills */}
                        <div className="pt-3">
                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                                Select Section to View Masterlist:
                            </label>
                            {uniqueAssignedClasses.length === 0 ? (
                                <div className="text-xs text-amber-600 font-bold">
                                    No class sections assigned to your account yet.
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {uniqueAssignedClasses.map((cls) => {
                                        const isSelected = String(selectedRosterClassId) === String(cls.id);
                                        return (
                                            <button
                                                key={cls.id}
                                                type="button"
                                                onClick={() => setSelectedRosterClassId(String(cls.id))}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                <span>{cls.name}</span>
                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                    Grade {cls.grade_level}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Masterlist Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-800">
                                Enrolled Learners ({rosterStudents.length} Students)
                            </span>
                            <span className="text-[11px] text-slate-400">
                                Alphabetical Order (A–Z)
                            </span>
                        </div>

                        {loadingRoster ? (
                            <div className="p-12 text-center text-xs text-slate-400 font-bold">
                                Loading class masterlist...
                            </div>
                        ) : rosterStudents.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400">
                                No students enrolled in this section yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                                            <th className="py-3 px-3.5 w-12 text-center">#</th>
                                            <th className="py-3 px-4">Learner Name</th>
                                            <th className="py-3 px-4">LRN</th>
                                            <th className="py-3 px-4">Portal Email</th>
                                            <th className="py-3 px-3.5 text-center">Status</th>
                                            <th className="py-3 px-4 text-right">Quick Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rosterStudents
                                            .filter((s) => {
                                                if (!rosterSearch.trim()) return true;
                                                const q = rosterSearch.toLowerCase();
                                                return String(s.name || '').toLowerCase().includes(q) || String(s.lrn || '').includes(q);
                                            })
                                            .map((student, idx) => (
                                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-3 px-4 font-extrabold text-slate-900">
                                                        {student.name}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-slate-600">
                                                        {student.lrn}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                                                        {student.email}
                                                    </td>
                                                    <td className="py-3 px-3.5 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            Enrolled
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setLocalTab('feedback');
                                                                if (onNavigateTab) onNavigateTab('feedback');
                                                                setFeedbackForm((prev) => ({
                                                                    ...prev,
                                                                    student_id: String(student.id),
                                                                }));
                                                            }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border-0"
                                                        >
                                                            <Send size={12} />
                                                            <span>Send Note</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Assessment Modal */}
            {isCreateModalOpen && (
                <div className="srnhs-modal-overlay">
                    <div className="srnhs-modal-box" style={{ maxWidth: '540px' }}>
                        <div className="srnhs-modal-header">
                            <h3 className="srnhs-modal-title">Create New Assessment Task</h3>
                            <button className="srnhs-modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateAssessment} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Assessment Title</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    placeholder="e.g. Written Work 2: Factoring Polynomials"
                                    value={newAssessment.title}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                    required 
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Assessment Type</label>
                                    <select 
                                        className="form-control"
                                        value={newAssessment.type}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value })}
                                    >
                                        <option value="Written Work">Written Work (Quiz / Seatwork)</option>
                                        <option value="Performance Task">Performance Task (Lab / Project)</option>
                                        <option value="Quarterly Exam">Quarterly Examination</option>
                                        <option value="Assignment">Assignment</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Grading Period</label>
                                    <select 
                                        className="form-control"
                                        value={newAssessment.quarter}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, quarter: e.target.value })}
                                    >
                                        <option value="1st Quarter">1st Quarter</option>
                                        <option value="2nd Quarter">2nd Quarter</option>
                                        <option value="3rd Quarter">3rd Quarter</option>
                                        <option value="4th Quarter">4th Quarter</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Assigned Subject & Class</label>
                                    <select 
                                        className="form-control"
                                        value={`${newAssessment.subject_id}-${newAssessment.school_class_id}`}
                                        onChange={(e) => {
                                            const [subId, classId] = e.target.value.split('-');
                                            setNewAssessment({
                                                ...newAssessment,
                                                subject_id: subId,
                                                school_class_id: classId,
                                            });
                                        }}
                                        required
                                    >
                                        {loads.map((l) => (
                                            <option key={`${l.subject_id}-${l.school_class_id}`} value={`${l.subject_id}-${l.school_class_id}`}>
                                                {l.subject?.name} - {l.school_class?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Assessment Date</label>
                                    <input 
                                        type="date"
                                        className="form-control"
                                        value={newAssessment.assessment_date}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, assessment_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Total Max Score</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={newAssessment.max_score}
                                        onChange={(e) => {
                                            const max = parseFloat(e.target.value) || 0;
                                            setNewAssessment({
                                                ...newAssessment,
                                                max_score: max,
                                                passing_score: Math.round(max * 0.75 * 10) / 10,
                                            });
                                        }}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Passing Benchmark (75%)</label>
                                    <input 
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        className="form-control"
                                        value={newAssessment.passing_score}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, passing_score: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description / Instructions (Optional)</label>
                                <textarea 
                                    className="form-control"
                                    rows="2"
                                    placeholder="Brief criteria or topics covered..."
                                    value={newAssessment.description}
                                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-gold">
                                    Save & Create Assessment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
