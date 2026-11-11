import React, { useState, useEffect, useMemo } from 'react';
import { 
    Layers, 
    Plus, 
    Trash2, 
    Search, 
    Wand2, 
    Sparkles, 
    BookOpen, 
    Users, 
    Award, 
    Activity, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    GraduationCap,
    ExternalLink,
    Info
} from 'lucide-react';
import Badge from '../../components/Badge';
import GuidedLoadWizard from '../../components/schedules/GuidedLoadWizard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/ui/Pagination';

export default function TeachingLoadsPage({ 
    loads = [], 
    teachers = [], 
    classes = [], 
    subjects = [], 
    schedules = [],
    workloadData = null,
    initialTab = 'assignments',
    loading = false, 
    onAssignLoad, 
    onDeleteLoad,
    onRefresh
}) {
    // Current Active Tab: 'assignments' | 'capacity'
    const [activeTab, setActiveTab] = useState(initialTab === 'workload' ? 'capacity' : (initialTab || 'assignments'));

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab === 'workload' ? 'capacity' : initialTab);
        }
    }, [initialTab]);

    // Tab 1: Assignments State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [expandedTeacherIds, setExpandedTeacherIds] = useState(new Set());

    // Tab 2: Capacity Monitoring State
    const [capacitySearch, setCapacitySearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // ─── Group teaching loads by Teacher (Accordion Master-Detail) ─────────
    const teacherGroups = useMemo(() => {
        const map = new Map();

        loads.forEach((load) => {
            const teacherId = load.teacher?.id || load.teacher_id || 'unassigned';
            if (!map.has(teacherId)) {
                map.set(teacherId, {
                    id: teacherId,
                    teacher: load.teacher || { 
                        name: 'Unassigned Teacher', 
                        position: 'Faculty', 
                        specialization: 'General', 
                        department: 'JHS',
                        max_weekly_hours: 30 
                    },
                    loads: [],
                    totalHours: 0,
                    uniqueClasses: new Set(),
                });
            }
            const entry = map.get(teacherId);
            entry.loads.push(load);
            entry.totalHours += Number(load.teaching_hours || 0);
            if (load.school_class?.name) {
                entry.uniqueClasses.add(load.school_class.name);
            }
        });

        return Array.from(map.values()).sort((a, b) => 
            (a.teacher.name || '').localeCompare(b.teacher.name || '')
        );
    }, [loads]);

    // Auto-expand all teachers if 5 or fewer
    useEffect(() => {
        if (teacherGroups.length > 0 && expandedTeacherIds.size === 0) {
            if (teacherGroups.length <= 5) {
                setExpandedTeacherIds(new Set(teacherGroups.map(g => g.id)));
            }
        }
    }, [teacherGroups]);

    // Filtered teacher groups
    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return teacherGroups;
        const term = searchTerm.toLowerCase();

        return teacherGroups.filter((group) => {
            const teacherMatches = 
                group.teacher.name?.toLowerCase().includes(term) ||
                group.teacher.position?.toLowerCase().includes(term) ||
                group.teacher.specialization?.toLowerCase().includes(term) ||
                group.teacher.employee_id?.toLowerCase().includes(term) ||
                group.teacher.department?.toLowerCase().includes(term);

            const hasMatchingLoad = group.loads.some((l) => 
                l.subject?.name?.toLowerCase().includes(term) ||
                l.subject?.code?.toLowerCase().includes(term) ||
                l.school_class?.name?.toLowerCase().includes(term) ||
                l.semester_or_quarter?.toLowerCase().includes(term)
            );

            return teacherMatches || hasMatchingLoad;
        });
    }, [teacherGroups, searchTerm]);

    // When searching, auto-expand matching teachers so users see the results immediately
    useEffect(() => {
        if (searchTerm.trim() && filteredGroups.length > 0) {
            setExpandedTeacherIds(new Set(filteredGroups.map(g => g.id)));
        }
    }, [searchTerm, filteredGroups]);

    const toggleTeacher = (teacherId) => {
        setExpandedTeacherIds((prev) => {
            const next = new Set(prev);
            if (next.has(teacherId)) {
                next.delete(teacherId);
            } else {
                next.add(teacherId);
            }
            return next;
        });
    };

    const allExpanded = filteredGroups.length > 0 && filteredGroups.every(g => expandedTeacherIds.has(g.id));

    const toggleAll = () => {
        if (allExpanded) {
            setExpandedTeacherIds(new Set());
        } else {
            setExpandedTeacherIds(new Set(filteredGroups.map(g => g.id)));
        }
    };

    // Filtered capacity teachers
    const capacityTeachers = workloadData?.teacher_summaries || [];
    const filteredCapacity = capacityTeachers.filter((t) => {
        const matchesSearch = 
            t.name?.toLowerCase().includes(capacitySearch.toLowerCase()) ||
            t.position?.toLowerCase().includes(capacitySearch.toLowerCase()) ||
            t.specialization?.toLowerCase().includes(capacitySearch.toLowerCase()) ||
            t.employee_id?.toLowerCase().includes(capacitySearch.toLowerCase());

        const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status) => {
        if (status === 'Overload') return 'danger';
        if (status === 'Underload') return 'warning';
        return 'success';
    };

    const normalCount = workloadData?.normal_load_teachers || capacityTeachers.filter(t => t.status === 'Normal').length;
    const overloadCount = workloadData?.overloaded_teachers || capacityTeachers.filter(t => t.status === 'Overload').length;
    const underloadCount = workloadData?.underload_teachers || capacityTeachers.filter(t => t.status === 'Underload').length;

    const pageSize = 10;
    const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6">
            {/* ─── Page Header (Matching Screenshot 5) ─────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>DepEd Workload &amp; Curriculum</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        Curriculum &amp; Faculty Loads
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        Allocate subject teaching loads to faculty and monitor DepEd Order No. 007 weekly hour compliance.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
                        onClick={() => setIsWizardOpen(true)}
                    >
                        <Plus size={15} />
                        <span>Assign Teaching Load</span>
                    </button>
                </div>
            </div>

            {/* ─── Navigation Header & Unified Tabs (Matching Screenshot 5) ───────────── */}
            <div className="flex items-center justify-between">
                <div className="inline-flex bg-slate-100/80 p-1 rounded-xl gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('assignments')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            activeTab === 'assignments'
                                ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                    >
                        Curriculum Allocations ({loads.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('capacity')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            activeTab === 'capacity'
                                ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                    >
                        DepEd Capacity &amp; Workload
                    </button>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                    Optimal
                </span>
            </div>

            {/* ─── TAB 1: 60 / 40 Split Layout (Matching Screenshot 5) ── */}
            {activeTab === 'assignments' && (
                <div className="dashboard-grid-two" style={{ marginBottom: 0 }}>
                    {/* Left Column (60%): Faculty Curriculum Allocations Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
                                    Faculty curriculum allocations
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">
                                    {loads.length} assignments across {teacherGroups.length} teacher{teacherGroups.length === 1 ? '' : 's'}
                                </p>
                            </div>

                            {filteredGroups.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer"
                                >
                                    <ChevronsUpDown size={14} />
                                    <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
                                </button>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                                placeholder="Search by teacher, subject or section"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Teacher Groups List */}
                        {loading ? (
                            <div className="p-12">
                                <LoadingSpinner text="Retrieving faculty curriculum loads..." />
                            </div>
                        ) : filteredGroups.length > 0 ? (
                            <div className="space-y-6">
                                {filteredGroups.map((group) => {
                                    const initials = group.teacher.name
                                        ? group.teacher.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                                        : 'GQ';

                                    return (
                                        <div key={group.id} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                                            {/* Teacher Summary Banner (Matching Screenshot 5) */}
                                            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-200/60">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-extrabold text-slate-900">
                                                            {group.teacher.name}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 font-medium">
                                                            {group.teacher.position || 'Teacher I'} &bull; {group.teacher.specialization || 'Mathematics'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-slate-900">
                                                            {group.totalHours} hrs/week
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">
                                                            {group.loads.length} subjects &bull; {group.uniqueClasses.size} section{group.uniqueClasses.size === 1 ? '' : 's'}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setIsWizardOpen(true)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                                                    >
                                                        <Plus size={13} />
                                                        <span>Add Load</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Section Subheader */}
                                            <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between text-[11px]">
                                                <span className="font-extrabold uppercase tracking-wider text-slate-400">
                                                    ASSIGNED CURRICULUM DETAILS ({group.loads.length})
                                                </span>
                                                <span className="text-slate-400">
                                                    Remove an assignment with the trash icon
                                                </span>
                                            </div>

                                            {/* Curriculum Load Items */}
                                            <div className="divide-y divide-slate-100">
                                                {group.loads.map((load, idx) => {
                                                    const colors = ['#8B5CF6', '#F59E0B', '#06B6D4', '#2563EB', '#10B981'];
                                                    const stripeColor = load.subject?.color || colors[idx % colors.length];

                                                    return (
                                                        <div
                                                            key={load.id}
                                                            className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                                                            style={{ borderLeft: `4px solid ${stripeColor}` }}
                                                        >
                                                            <div>
                                                                <div className="text-sm font-extrabold text-slate-900">
                                                                    {load.subject?.name}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/70">
                                                                        {load.subject?.code || 'SUBJ'}
                                                                    </span>
                                                                    <span className="text-xs text-slate-500">
                                                                        Grade {load.subject?.grade_level || '7'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-5">
                                                                <div className="text-right">
                                                                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                                                        {load.school_class?.name || 'Class Section'}
                                                                    </span>
                                                                    <div className="text-[11px] text-slate-400 mt-1">
                                                                        1st Quarter (2026–2027)
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs font-black text-slate-900 min-w-[55px] text-right">
                                                                    {load.teaching_hours || 4} hrs/wk
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => onDeleteLoad(load.id)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-0 bg-transparent cursor-pointer"
                                                                    title="Remove teaching load"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <Layers size={40} className="mx-auto mb-3 opacity-30" />
                                <h4 className="text-sm font-bold text-slate-700">No Teaching Loads Found</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    {searchTerm 
                                        ? `No teacher or subject assignments matched "${searchTerm}".`
                                        : 'Click "Assign Teaching Load" above to allocate curriculum subjects using the guided wizard.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column (40%): Weekly Hour Compliance Card (Matching Screenshot 5) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between sticky top-4">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight m-0">
                                Weekly hour compliance
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 mb-5">
                                DepEd Order No. 007 &bull; 30h cap
                            </p>

                            <div className="mb-4">
                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                    {(workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)) > 30 ? 'Overload' : (workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)) === 30 ? 'At capacity' : 'Underload'}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-3xl font-black text-slate-900 tracking-tight">
                                    {workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    / 30 hours
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div 
                                    className="h-full bg-amber-600 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, Math.round(((workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)) / 30) * 100))}%` }}
                                />
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                                {Math.min(100, Math.round(((workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)) / 30) * 100))}% of weekly teaching capacity
                            </div>

                            {/* Available Capacity Row */}
                            <div className="flex items-center justify-between text-xs font-bold py-4 mt-4 border-t border-slate-100">
                                <span className="text-slate-500 font-semibold">Available capacity</span>
                                <span className="text-slate-900 font-black">
                                    {Math.max(0, 30 - (workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)))} hrs/week
                                </span>
                            </div>
                        </div>

                        {/* Info Callout Box (Matching Screenshot 5) */}
                        <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">
                                Curriculum allocations total {workloadData?.total_teaching_hours || loads.reduce((acc, l) => acc + Number(l.teaching_hours || 0), 0)} hours per week. Timetable sessions are tracked separately; the current schedule contains {schedules?.length || 15} sessions.
                            </span>
                        </div>
                    </div>
                </div>
            )}


            {/* ─── TAB 2: DepEd Workload & Capacity Monitoring ────────────────── */}
            {activeTab === 'capacity' && (
                <div className="space-y-6">
                    {/* KPI Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Normal Load (18–30h)</span>
                                <CheckCircle2 size={16} className="text-emerald-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900">{normalCount} Faculty</div>
                            <div className="text-[11px] font-semibold text-emerald-600 mt-1">Within standard DepEd workload bounds</div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Overloaded (&gt;30h)</span>
                                <AlertTriangle size={16} className={overloadCount > 0 ? 'text-rose-600' : 'text-slate-400'} />
                            </div>
                            <div className={`text-2xl font-black ${overloadCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                {overloadCount} Faculty
                            </div>
                            <div className="text-[11px] font-medium text-slate-400 mt-1">Requires load rebalancing</div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Underload (&lt;18h)</span>
                                <Clock size={16} className="text-amber-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900">{underloadCount} Faculty</div>
                            <div className="text-[11px] font-medium text-slate-400 mt-1">Has capacity for additional subjects</div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Faculty Workload Capacity Meter</h3>
                                <p className="panel-subtitle">
                                    DepEd Order No. 007, s. 2024 compliance tracking (Limit: 30 teaching hours/week)
                                </p>
                            </div>
                        </div>

                        {/* Search & Filter controls */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <div style={{ flex: '1 1 240px', position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by teacher name, position, specialization..."
                                    value={capacitySearch}
                                    onChange={(e) => setCapacitySearch(e.target.value)}
                                    style={{ paddingLeft: '2.4rem' }}
                                />
                            </div>

                            <div style={{ width: '190px' }}>
                                <select
                                    className="form-select"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All">All Load Statuses</option>
                                    <option value="Normal">Normal Load (18-30h)</option>
                                    <option value="Underload">Underload (&lt;18h)</option>
                                    <option value="Overload">Overload (&gt;30h)</option>
                                </select>
                            </div>
                        </div>

                        {/* Teacher Cards Grid */}
                        {loading || !workloadData ? (
                            <LoadingSpinner text="Computing teacher workload statistics..." />
                        ) : filteredCapacity.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                                {filteredCapacity.map((teacher) => {
                                    const assigned = teacher.assigned_hours;
                                    const max = teacher.max_weekly_hours || 30;
                                    const percentage = Math.min(Math.round((assigned / max) * 100), 100);
                                    const isOverloaded = assigned > max;

                                    let progressColor = 'var(--accent-emerald)';
                                    if (percentage > 85) progressColor = 'var(--accent-amber)';
                                    if (isOverloaded) progressColor = 'var(--accent-rose)';

                                    return (
                                        <div 
                                            key={teacher.teacher_id} 
                                            className="stat-card"
                                            style={{
                                                border: isOverloaded ? '1px solid rgba(244, 63, 94, 0.4)' : undefined,
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {teacher.name}
                                                    </h4>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                                                        {teacher.employee_id} &bull; {teacher.position}
                                                    </div>
                                                </div>
                                                <Badge variant={getStatusVariant(teacher.status)}>
                                                    {teacher.status}
                                                </Badge>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                                <Award size={13} color="var(--primary)" />
                                                <span>{teacher.specialization} Department</span>
                                            </div>

                                            {/* Load Progress Meter */}
                                            <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>Teaching Hours</span>
                                                    <span style={{ color: isOverloaded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                                                        {assigned} / {max} hrs ({percentage}%)
                                                    </span>
                                                </div>

                                                <div className="progress-bar-bg">
                                                    <div 
                                                        className="progress-bar-fill"
                                                        style={{ width: `${percentage}%`, background: progressColor }}
                                                    ></div>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                                    <span>{teacher.sections_count} Section(s)</span>
                                                    <span>{teacher.subjects_count} Subject(s)</span>
                                                    <span>{max - assigned > 0 ? `${max - assigned}h capacity left` : 'Limit reached'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Users size={42} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                <p>No faculty matching the selected workload filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modern Guided 4-Step Load Wizard */}
            <GuidedLoadWizard
                isOpen={isWizardOpen}
                teachers={teachers}
                subjects={subjects}
                classes={classes}
                onClose={() => setIsWizardOpen(false)}
                onComplete={onRefresh}
            />
        </div>
    );
}
