import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, 
    FileText, 
    CheckCircle2, 
    AlertTriangle, 
    TrendingUp, 
    BookOpen, 
    GraduationCap, 
    Layers,
    Search,
    Filter,
    Award,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import InteractiveQuarterlyGradebook from '../../components/grades/InteractiveQuarterlyGradebook';

export default function AssessmentTrackingPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (['subjects', 'classes', 'at_risk', 'gradebook'].includes(tabParam)) {
                return tabParam;
            }
            if (window.location.hash === '#gradebook') {
                return 'gradebook';
            }
        }
        return 'subjects';
    });

    const fetchMonitoringData = async () => {
        setLoading(true);
        try {
            const res = await srnhsApi.getAssessmentMonitoring();
            setData(res);
        } catch (err) {
            console.error('Error fetching assessment monitoring:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitoringData();
    }, []);

    // Reset pagination when switching tabs or modifying search
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    const subjects = data?.subjects || [];
    const classes = data?.classes || [];
    const at_risk_students = data?.at_risk_students || [];
    const summary = data?.summary || { total_assessments: 0, total_graded: 0, overall_pass_rate: 0, at_risk_count: 0 };

    // 1. Filtered and Paginated Subjects
    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];
        if (!searchTerm.trim()) return subjects;
        const q = searchTerm.toLowerCase();
        return subjects.filter(s => 
            s.name?.toLowerCase().includes(q) || 
            s.code?.toLowerCase().includes(q)
        );
    }, [subjects, searchTerm]);

    const paginatedSubjects = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredSubjects.slice(start, start + PAGE_SIZE);
    }, [filteredSubjects, currentPage]);

    // 2. Filtered and Paginated Classes
    const filteredClasses = useMemo(() => {
        if (!classes) return [];
        if (!searchTerm.trim()) return classes;
        const q = searchTerm.toLowerCase();
        return classes.filter(c => 
            c.name?.toLowerCase().includes(q) || 
            String(c.grade_level).includes(q)
        );
    }, [classes, searchTerm]);

    const paginatedClasses = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredClasses.slice(start, start + PAGE_SIZE);
    }, [filteredClasses, currentPage]);

    // 3. Filtered and Paginated At-Risk Students
    const filteredAtRisk = useMemo(() => {
        if (!at_risk_students) return [];
        if (!searchTerm.trim()) return at_risk_students;
        const q = searchTerm.toLowerCase();
        return at_risk_students.filter(stu => 
            stu.name?.toLowerCase().includes(q) || 
            stu.lrn?.toLowerCase().includes(q) || 
            stu.class?.toLowerCase().includes(q)
        );
    }, [at_risk_students, searchTerm]);

    const paginatedAtRisk = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredAtRisk.slice(start, start + PAGE_SIZE);
    }, [filteredAtRisk, currentPage]);

    // Reusable pagination bar for analytics tables
    const renderPagination = (totalItems) => {
        if (totalItems <= PAGE_SIZE) return null;
        const totalPages = Math.ceil(totalItems / PAGE_SIZE);

        return (
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                <div className="text-xs font-semibold text-slate-500">
                    Showing <strong className="text-slate-900 font-extrabold">{(currentPage - 1) * PAGE_SIZE + 1}</strong> to{' '}
                    <strong className="text-slate-900 font-extrabold">{Math.min(totalItems, currentPage * PAGE_SIZE)}</strong> of{' '}
                    <strong className="text-slate-900 font-extrabold">{totalItems}</strong> records
                </div>

                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                    >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                                    currentPage === pageNum
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                    >
                        <span>Next</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        );
    };

    if (loading || !data) {
        return <LoadingSpinner text="Analyzing school-wide assessment and performance data..." />;
    }

    return (
        <div className="space-y-6">
            {/* ─── Level 1: Page Header (60-30-10 Hierarchy) ─────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span>DepEd Mastery &amp; Academic Analytics</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        Student Assessment &amp; Performance Tracking
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        School-wide monitoring of learner assessment results, subject mastery rates, and academic intervention watchlists.
                    </p>
                </div>
            </div>

            {/* ─── KPI Summary Row (Lively Elevated Cards with Hover Lift) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Assessments Defined</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50/90 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">{summary.total_assessments} Tasks</div>
                    <div className="text-[11px] font-medium text-slate-400 mt-1">Quizzes, exams, performance tasks</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Scores Recorded</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50/90 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Activity size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">{summary.total_graded} Grades</div>
                    <div className="text-[11px] font-medium text-slate-400 mt-1">Student submissions evaluated</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Institutional Pass Rate</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50/90 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 tracking-tight">{summary.overall_pass_rate}%</div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-1">&ge;75% DepEd mastery benchmark</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">Academic Watchlist</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50/90 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <div className={`text-2xl font-black tracking-tight ${summary.at_risk_count > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {summary.at_risk_count} Students
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-1">Requiring remedial intervention</div>
                </div>
            </div>

            {/* ─── Unified Tab Switcher & Search Bar ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 flex-wrap">
                    <button 
                        type="button"
                        onClick={() => setActiveTab('subjects')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-0 ${
                            activeTab === 'subjects'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <BookOpen size={14} />
                        <span>Subject Breakdown</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('classes')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-0 ${
                            activeTab === 'classes'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Layers size={14} />
                        <span>Classrooms &amp; Sections</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('at_risk')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-0 ${
                            activeTab === 'at_risk'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <AlertTriangle size={14} />
                        <span>Academic Watchlist ({at_risk_students.length})</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveTab('gradebook')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer border-0 ${
                            activeTab === 'gradebook'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Award size={14} />
                        <span>Quarterly Gradebook (SF-9) Inspection</span>
                    </button>
                </div>

                {activeTab !== 'gradebook' && (
                    <div className="relative min-w-[280px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={
                                activeTab === 'subjects' 
                                    ? "Search subject code or name..." 
                                    : activeTab === 'classes' 
                                    ? "Search section or grade level..." 
                                    : "Search student name, LRN or section..."
                            }
                            className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-400"
                        />
                    </div>
                )}
            </div>

            {/* TAB 0: Admin Gradebook Inspection (Read-Only) */}
            {activeTab === 'gradebook' && (
                <InteractiveQuarterlyGradebook role="admin" readOnly={true} />
            )}

            {/* TAB 1: Subjects Performance */}
            {activeTab === 'subjects' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 m-0">Curriculum Subject Performance</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">Assessment counts, average ratings, and pass rates by subject</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                            {filteredSubjects.length} subjects
                        </span>
                    </div>

                    {filteredSubjects.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3.5 px-5">Subject Code</th>
                                            <th className="py-3.5 px-4">Subject Name</th>
                                            <th className="py-3.5 px-4 text-center">Assessments</th>
                                            <th className="py-3.5 px-4 text-center">Graded Items</th>
                                            <th className="py-3.5 px-4 text-center">Avg Percentage</th>
                                            <th className="py-3.5 px-5 text-center">Pass Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {paginatedSubjects.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-5 font-mono font-extrabold text-blue-600">
                                                    {sub.code}
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                                    {sub.name}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                                    {sub.assessment_count}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                                    {sub.total_graded}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-black text-slate-900">
                                                    {sub.avg_percentage}%
                                                </td>
                                                <td className="py-3.5 px-5 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                                        sub.pass_rate >= 75
                                                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {sub.pass_rate}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(filteredSubjects.length)}
                        </>
                    ) : (
                        <div className="py-16 text-center text-slate-400">
                            <Search size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700 m-0">No subjects found</p>
                            <p className="text-xs text-slate-400 mt-1">Try modifying your search query.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Class Section Performance */}
            {activeTab === 'classes' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 m-0">Class Section Performance Overview</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">Average ratings and academic status per grade and section</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                            {filteredClasses.length} classrooms
                        </span>
                    </div>

                    {filteredClasses.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3.5 px-5">Section Name</th>
                                            <th className="py-3.5 px-4">Grade Level</th>
                                            <th className="py-3.5 px-4 text-center">Enrolled Students</th>
                                            <th className="py-3.5 px-4 text-center">Section Average</th>
                                            <th className="py-3.5 px-4 text-center">Pass Rate</th>
                                            <th className="py-3.5 px-5 text-center">Standing</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {paginatedClasses.map((c) => (
                                            <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-5 font-bold text-slate-900">
                                                    {c.name}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                                        Grade {c.grade_level}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                                    {c.students_count}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-black text-slate-900">
                                                    {c.avg_percentage}%
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                                        c.pass_rate >= 75
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {c.pass_rate}%
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                                                        c.pass_rate >= 80 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                            : c.pass_rate >= 70 
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {c.pass_rate >= 80 ? 'Exemplary' : c.pass_rate >= 70 ? 'Satisfactory' : 'Needs Review'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(filteredClasses.length)}
                        </>
                    ) : (
                        <div className="py-16 text-center text-slate-400">
                            <Search size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700 m-0">No classrooms found</p>
                            <p className="text-xs text-slate-400 mt-1">Try modifying your search query.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Academic Watchlist */}
            {activeTab === 'at_risk' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 border-l-4 border-l-rose-500 flex items-center justify-between flex-wrap gap-2">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 m-0">Academic Intervention Watchlist</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-0">Learners whose cumulative average falls below the 75% DepEd passing threshold</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80">
                            {filteredAtRisk.length} at risk
                        </span>
                    </div>

                    {at_risk_students.length === 0 ? (
                        <div className="py-16 text-center text-emerald-600">
                            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                            <div className="text-sm font-bold text-slate-900">All Students Meeting Benchmark!</div>
                            <p className="text-xs text-slate-400 mt-1">No students currently below the 75% passing threshold.</p>
                        </div>
                    ) : filteredAtRisk.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3.5 px-5">Student Name</th>
                                            <th className="py-3.5 px-4">LRN</th>
                                            <th className="py-3.5 px-4">Class Section</th>
                                            <th className="py-3.5 px-4 text-center">Current Average</th>
                                            <th className="py-3.5 px-4 text-center">Failed Tasks</th>
                                            <th className="py-3.5 px-5">Recommended Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {paginatedAtRisk.map((stu) => (
                                            <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-5 font-bold text-slate-900">
                                                    {stu.name}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-slate-500">
                                                    {stu.lrn}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                                        {stu.class}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-black text-rose-600">
                                                    {stu.average !== null ? `${stu.average}%` : 'N/A'}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-black text-rose-600">
                                                    {stu.failed_assessments}
                                                </td>
                                                <td className="py-3.5 px-5 text-slate-500 font-medium">
                                                    Schedule remedial session with class adviser
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(filteredAtRisk.length)}
                        </>
                    ) : (
                        <div className="py-16 text-center text-slate-400">
                            <Search size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700 m-0">No learners found</p>
                            <p className="text-xs text-slate-400 mt-1">Try modifying your search query.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
