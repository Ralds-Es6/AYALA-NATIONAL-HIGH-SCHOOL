import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Award,
    CheckCircle2,
    AlertCircle,
    Save,
    Printer,
    Search,
    BookOpen,
    Users,
    TrendingUp,
    ShieldCheck,
    Lock,
    Sparkles,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Download,
    AlertTriangle,
    MapPin,
    User,
    Check,
    Layers,
    Grid,
    SlidersHorizontal,
    Clock,
    ArrowRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import { notify } from '../notifications/notify';
import Pagination from '../ui/Pagination';

const DEPED_DESCRIPTORS = [
    { min: 90, max: 100, label: 'Outstanding', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { min: 85, max: 89.99, label: 'Very Satisfactory', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
    { min: 80, max: 84.99, label: 'Satisfactory', badge: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    { min: 75, max: 79.99, label: 'Fairly Satisfactory', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
    { min: 0, max: 74.99, label: 'Did Not Meet Expectations', badge: 'bg-red-50 text-red-800 border-red-200' },
];

export const getDepEdDescriptorInfo = (grade) => {
    if (grade === null || grade === undefined || isNaN(grade) || grade === '') return null;
    const g = Number(grade);
    return DEPED_DESCRIPTORS.find((d) => g >= d.min && g <= d.max) || null;
};

export default function InteractiveQuarterlyGradebook({
    role = 'teacher',
    initialClassId = null,
    initialSubjectId = null,
    readOnly = false,
}) {
    const isTeacher = role === 'teacher';
    const isAdmin = role === 'admin';

    // Managed Contexts State
    const [contexts, setContexts] = useState([]);
    const [loadingContexts, setLoadingContexts] = useState(true);

    // Selected Classroom & Subject
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState(null);

    // View Options
    const [viewMode, setViewMode] = useState('studio'); // 'studio' | 'directory'
    const [columnDesignation, setColumnDesignation] = useState('full'); // 'full' | 'q1' | 'q2' | 'q3' | 'q4' | 'outcome_only'
    const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'lrn_asc' | 'final_desc' | 'final_asc' | 'at_risk_first'
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    // Search and Dropdown Controls
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [classSearch, setClassSearch] = useState('');
    const dropdownRef = useRef(null);

    // Matrix State
    const [matrixData, setMatrixData] = useState(null);
    const [loadingMatrix, setLoadingMatrix] = useState(false);

    // Active editable grades in memory: { [student_id]: { q1, q2, q3, q4 } }
    const [localGrades, setLocalGrades] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

    // Close classroom selector dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset pagination to page 1 on filter/sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, columnDesignation, selectedClassId, selectedSubjectId]);

    // Load Teacher's / Admin's Authorized Contexts
    useEffect(() => {
        let isMounted = true;
        const loadContexts = async () => {
            setLoadingContexts(true);
            try {
                const res = await srnhsApi.getQuarterlyGradeContexts();
                if (!isMounted) return;

                const loaded = res.contexts || [];
                setContexts(loaded);

                if (loaded.length > 0) {
                    if (initialClassId && initialSubjectId) {
                        setSelectedClassId(Number(initialClassId));
                        setSelectedSubjectId(Number(initialSubjectId));
                    } else {
                        const advisoryCtx = loaded.find((c) => Boolean(c.is_adviser));
                        const defaultCtx = advisoryCtx || loaded[0];
                        setSelectedClassId(Number(defaultCtx.school_class_id));
                        setSelectedSubjectId(Number(defaultCtx.subject_id));
                    }
                }
            } catch (err) {
                console.error('Failed to load grade contexts:', err);
                notify.error('Failed to Load Classes', 'Could not load your assigned classes and subjects.');
            } finally {
                if (isMounted) setLoadingContexts(false);
            }
        };

        loadContexts();
        return () => {
            isMounted = false;
        };
    }, [initialClassId, initialSubjectId]);

    // Group all contexts into distinct, isolated classrooms with their subjects
    const classrooms = useMemo(() => {
        const map = new Map();
        contexts.forEach((ctx) => {
            const cId = Number(ctx.school_class_id);
            if (!map.has(cId)) {
                map.set(cId, {
                    id: cId,
                    name: ctx.class_name,
                    grade_level: ctx.grade_level,
                    section: ctx.section,
                    room: ctx.room || 'Room TBA',
                    shift: ctx.shift || 'Whole Day Shift',
                    students_count: Number(ctx.students_count || 0),
                    is_adviser: Boolean(ctx.is_adviser),
                    adviser_name: ctx.adviser_name || 'TBA (Unassigned)',
                    subjects: [],
                });
            }
            const cls = map.get(cId);
            if (!cls.subjects.some((s) => Number(s.subject_id) === Number(ctx.subject_id))) {
                cls.subjects.push({
                    subject_id: Number(ctx.subject_id),
                    subject_name: ctx.subject_name,
                    subject_code: ctx.subject_code,
                    schedule_time: ctx.schedule_time,
                    teacher_id: ctx.teacher_id,
                    teacher_name: ctx.teacher_name,
                });
            }
        });

        // DepEd Sorting: Advisory class pinned first, then by Grade Level, then Section Name
        return Array.from(map.values()).sort((a, b) => {
            if (a.is_adviser && !b.is_adviser) return -1;
            if (!a.is_adviser && b.is_adviser) return 1;
            if (a.grade_level !== b.grade_level) return a.grade_level - b.grade_level;
            return String(a.section).localeCompare(String(b.section));
        });
    }, [contexts]);

    // Active classroom object
    const activeClassroom = useMemo(() => {
        if (!selectedClassId || classrooms.length === 0) return classrooms[0] || null;
        return classrooms.find((c) => c.id === selectedClassId) || classrooms[0] || null;
    }, [classrooms, selectedClassId]);

    // Active subject object within the active classroom
    const activeSubject = useMemo(() => {
        if (!activeClassroom || !activeClassroom.subjects.length) return null;
        if (!selectedSubjectId) return activeClassroom.subjects[0];
        return (
            activeClassroom.subjects.find((s) => s.subject_id === selectedSubjectId) ||
            activeClassroom.subjects[0]
        );
    }, [activeClassroom, selectedSubjectId]);

    // Synchronize selected ids if active classroom changes
    useEffect(() => {
        if (activeClassroom && activeSubject) {
            if (selectedSubjectId !== activeSubject.subject_id) {
                setSelectedSubjectId(activeSubject.subject_id);
            }
            if (selectedClassId !== activeClassroom.id) {
                setSelectedClassId(activeClassroom.id);
            }
        }
    }, [activeClassroom, activeSubject]);

    // Stepper Navigation indices (Prev / Next Room)
    const currentClassIndex = useMemo(() => {
        if (!activeClassroom) return -1;
        return classrooms.findIndex((c) => c.id === activeClassroom.id);
    }, [classrooms, activeClassroom]);

    const hasPrev = currentClassIndex > 0;
    const hasNext = currentClassIndex >= 0 && currentClassIndex < classrooms.length - 1;

    const handlePrevClass = () => {
        if (!hasPrev) return;
        if (hasUnsavedChanges) {
            if (!window.confirm('You have unsaved grade changes in this section. Discard changes and switch room?')) {
                return;
            }
        }
        const target = classrooms[currentClassIndex - 1];
        setSelectedClassId(target.id);
        setSelectedSubjectId(target.subjects[0]?.subject_id || null);
        setIsDropdownOpen(false);
    };

    const handleNextClass = () => {
        if (!hasNext) return;
        if (hasUnsavedChanges) {
            if (!window.confirm('You have unsaved grade changes in this section. Discard changes and switch room?')) {
                return;
            }
        }
        const target = classrooms[currentClassIndex + 1];
        setSelectedClassId(target.id);
        setSelectedSubjectId(target.subjects[0]?.subject_id || null);
        setIsDropdownOpen(false);
    };

    const handleSelectClass = (cId) => {
        if (Number(cId) === Number(activeClassroom?.id)) {
            setIsDropdownOpen(false);
            return;
        }
        if (hasUnsavedChanges) {
            if (!window.confirm('You have unsaved grade changes in this section. Discard changes and switch room?')) {
                return;
            }
        }
        const target = classrooms.find((c) => c.id === Number(cId));
        if (target) {
            setSelectedClassId(target.id);
            setSelectedSubjectId(target.subjects[0]?.subject_id || null);
        }
        setIsDropdownOpen(false);
    };

    // Filtered classrooms inside dropdown search
    const filteredDropdownClassrooms = useMemo(() => {
        if (!classSearch.trim()) return classrooms;
        const q = classSearch.toLowerCase();
        return classrooms.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.room.toLowerCase().includes(q) ||
                c.section.toLowerCase().includes(q) ||
                c.subjects.some((s) => s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q))
        );
    }, [classrooms, classSearch]);

    // Fetch Grade Matrix whenever selected classroom or subject changes
    const fetchMatrix = async () => {
        if (!activeClassroom || !activeSubject) return;
        setLoadingMatrix(true);
        try {
            const res = await srnhsApi.getQuarterlyGradeMatrix({
                school_class_id: activeClassroom.id,
                subject_id: activeSubject.subject_id,
            });
            setMatrixData(res);

            // Populate local editable state
            const initialMap = {};
            (res.students || []).forEach((s) => {
                initialMap[s.student_id] = {
                    q1: s.q1 !== null && s.q1 !== undefined ? String(s.q1) : '',
                    q2: s.q2 !== null && s.q2 !== undefined ? String(s.q2) : '',
                    q3: s.q3 !== null && s.q3 !== undefined ? String(s.q3) : '',
                    q4: s.q4 !== null && s.q4 !== undefined ? String(s.q4) : '',
                };
            });
            setLocalGrades(initialMap);
            setHasUnsavedChanges(false);
            setSaveStatus('idle');
        } catch (err) {
            console.error('Failed to load matrix:', err);
            notify.error('Matrix Error', err.response?.data?.message || 'Could not load class grade sheet.');
        } finally {
            setLoadingMatrix(false);
        }
    };

    useEffect(() => {
        if (activeClassroom && activeSubject) {
            fetchMatrix();
        }
    }, [activeClassroom?.id, activeSubject?.subject_id]);

    // Cell input change handler
    const handleCellChange = (studentId, quarter, value) => {
        if (readOnly || matrixData?.read_only) return;

        // Allow blank or numeric 0-100
        if (value !== '') {
            const num = Number(value);
            if (isNaN(num) || num < 0 || num > 100) return;
        }

        setLocalGrades((prev) => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [quarter]: value,
            },
        }));
        setHasUnsavedChanges(true);
        setSaveStatus('idle');
    };

    // Calculate real-time final grade & descriptor for a student row
    const isShs = Boolean(matrixData?.class_info?.is_shs || (activeClassroom && activeClassroom.grade_level >= 11));
    const getComputedRowStats = (studentId) => {
        const row = localGrades[studentId] || {};
        const q1 = row.q1 !== '' && row.q1 !== undefined ? Number(row.q1) : null;
        const q2 = row.q2 !== '' && row.q2 !== undefined ? Number(row.q2) : null;
        const q3 = row.q3 !== '' && row.q3 !== undefined ? Number(row.q3) : null;
        const q4 = row.q4 !== '' && row.q4 !== undefined ? Number(row.q4) : null;

        const presentValues = [q1, q2, q3, q4].filter((v) => v !== null);
        if (presentValues.length === 0) {
            return {
                final: null,
                descriptor: null,
                badgeClass: '',
                status: 'Not Graded',
                statusClass: 'bg-slate-100 text-slate-500',
                isComplete: false,
            };
        }

        let finalVal = null;
        let isComplete = false;

        if (isShs) {
            // Senior High: 2 semesters
            if (q3 !== null || q4 !== null) {
                const s2 = [q3, q4].filter((v) => v !== null);
                finalVal = Math.round(s2.reduce((a, b) => a + b, 0) / s2.length);
                isComplete = q3 !== null && q4 !== null;
            } else {
                const s1 = [q1, q2].filter((v) => v !== null);
                finalVal = Math.round(s1.reduce((a, b) => a + b, 0) / s1.length);
                isComplete = q1 !== null && q2 !== null;
            }
        } else {
            // Junior High: 4 Quarters average
            isComplete = q1 !== null && q2 !== null && q3 !== null && q4 !== null;
            if (isComplete) {
                finalVal = Math.round((q1 + q2 + q3 + q4) / 4);
            } else {
                finalVal = Math.round(presentValues.reduce((a, b) => a + b, 0) / presentValues.length);
            }
        }

        const descInfo = getDepEdDescriptorInfo(finalVal);
        const isPassed = finalVal >= 75;
        let status = isPassed ? 'PASSED' : isComplete ? 'FAILED' : 'AT-RISK';
        let statusClass = isPassed
            ? 'bg-emerald-100 text-emerald-800'
            : isComplete
              ? 'bg-red-100 text-red-800'
              : 'bg-amber-100 text-amber-800';

        return {
            final: finalVal,
            descriptor: descInfo?.label || 'Incomplete',
            badgeClass: descInfo?.badge || 'bg-slate-100 text-slate-600',
            status,
            statusClass,
            isComplete,
        };
    };

    // Filtered & Sorted student list across whole class
    const processedStudents = useMemo(() => {
        if (!matrixData?.students) return [];
        let list = [...matrixData.students];

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (s) =>
                    String(s.name || '').toLowerCase().includes(q) ||
                    String(s.lrn || '').toLowerCase().includes(q)
            );
        }

        // Sorting
        list.sort((a, b) => {
            const statsA = getComputedRowStats(a.student_id);
            const statsB = getComputedRowStats(b.student_id);

            switch (sortBy) {
                case 'name_asc':
                    return String(a.name || '').localeCompare(String(b.name || ''));
                case 'name_desc':
                    return String(b.name || '').localeCompare(String(a.name || ''));
                case 'lrn_asc':
                    return String(a.lrn || '').localeCompare(String(b.lrn || ''));
                case 'final_desc': {
                    const valA = statsA.final ?? -1;
                    const valB = statsB.final ?? -1;
                    return valB - valA;
                }
                case 'final_asc': {
                    const valA = statsA.final ?? 999;
                    const valB = statsB.final ?? 999;
                    return valA - valB;
                }
                case 'at_risk_first': {
                    const isAtRiskA = statsA.final !== null && statsA.final < 75 ? 1 : 0;
                    const isAtRiskB = statsB.final !== null && statsB.final < 75 ? 1 : 0;
                    if (isAtRiskA !== isAtRiskB) return isAtRiskB - isAtRiskA;
                    return String(a.name || '').localeCompare(String(b.name || ''));
                }
                default:
                    return 0;
            }
        });

        return list;
    }, [matrixData, searchQuery, sortBy, localGrades]);

    // Paginated students for current page (strictly 10 data items per page)
    const totalStudents = processedStudents.length;
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedStudents = useMemo(() => {
        return processedStudents.slice(startIndex, startIndex + PAGE_SIZE);
    }, [processedStudents, startIndex]);

    // Live KPI Metrics computed dynamically from localGrades (100% ISOLATED to active section & subject)
    const liveMetrics = useMemo(() => {
        const studentList = matrixData?.students || [];
        if (studentList.length === 0) {
            return { classMean: null, passingRate: 0, honorCount: 0, atRiskCount: 0, totalGraded: 0 };
        }

        let totalFinals = 0;
        let countGraded = 0;
        let passed = 0;
        let honors = 0;
        let atRisk = 0;

        studentList.forEach((s) => {
            const stats = getComputedRowStats(s.student_id);
            if (stats.final !== null) {
                totalFinals += stats.final;
                countGraded += 1;
                if (stats.final >= 75) passed += 1;
                if (stats.final >= 90) honors += 1;
                if (stats.final < 75) atRisk += 1;
            }
        });

        return {
            totalGraded: countGraded,
            classMean: countGraded > 0 ? (totalFinals / countGraded).toFixed(1) : null,
            passingRate: countGraded > 0 ? Math.round((passed / countGraded) * 100) : 0,
            honorCount: honors,
            atRiskCount: atRisk,
        };
    }, [matrixData, localGrades]);

    // Quarter-by-Quarter Class Means for the Aggregated Summary Footer
    const classQuarterMeans = useMemo(() => {
        const students = matrixData?.students || [];
        if (students.length === 0) return { q1: '—', q2: '—', q3: '—', q4: '—', final: '—' };

        const sums = { q1: 0, q2: 0, q3: 0, q4: 0, final: 0 };
        const counts = { q1: 0, q2: 0, q3: 0, q4: 0, final: 0 };

        students.forEach((s) => {
            const row = localGrades[s.student_id] || {};
            ['q1', 'q2', 'q3', 'q4'].forEach((q) => {
                if (row[q] !== '' && row[q] !== undefined && !isNaN(Number(row[q]))) {
                    sums[q] += Number(row[q]);
                    counts[q] += 1;
                }
            });
            const stats = getComputedRowStats(s.student_id);
            if (stats.final !== null) {
                sums.final += stats.final;
                counts.final += 1;
            }
        });

        return {
            q1: counts.q1 > 0 ? (sums.q1 / counts.q1).toFixed(1) : '—',
            q2: counts.q2 > 0 ? (sums.q2 / counts.q2).toFixed(1) : '—',
            q3: counts.q3 > 0 ? (sums.q3 / counts.q3).toFixed(1) : '—',
            q4: counts.q4 > 0 ? (sums.q4 / counts.q4).toFixed(1) : '—',
            final: counts.final > 0 ? (sums.final / counts.final).toFixed(1) : '—',
        };
    }, [matrixData, localGrades]);

    // Save quarterly grades payload
    const handleSaveGrades = async () => {
        if (!activeClassroom || !activeSubject || readOnly || matrixData?.read_only) return;
        setSaving(true);
        setSaveStatus('saving');

        try {
            const gradesPayload = Object.entries(localGrades).map(([studentId, vals]) => ({
                student_id: Number(studentId),
                q1: vals.q1 !== '' ? Number(vals.q1) : null,
                q2: vals.q2 !== '' ? Number(vals.q2) : null,
                q3: vals.q3 !== '' ? Number(vals.q3) : null,
                q4: vals.q4 !== '' ? Number(vals.q4) : null,
            }));

            await srnhsApi.saveQuarterlyGrades({
                school_class_id: activeClassroom.id,
                subject_id: activeSubject.subject_id,
                academic_year: '2026-2027',
                grades: gradesPayload,
            });

            setHasUnsavedChanges(false);
            setSaveStatus('saved');
            notify.success(
                'Grades Published Successfully',
                `Official quarterly grades for ${activeSubject.subject_name} (${activeClassroom.name}) have been synchronized.`
            );
            fetchMatrix();
        } catch (err) {
            console.error('Save grades failed:', err);
            notify.error('Save Failed', err.response?.data?.message || 'Could not publish quarterly grades.');
            setSaveStatus('idle');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* ========================================================================= */}
            {/* TIER 1: SCALABLE CLASSROOM COMMAND BAR (Supports 1 to 9+ rooms)           */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-card">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Stepper + Searchable Classroom Dropdown */}
                    <div className="flex items-center gap-2 flex-1 min-w-0" ref={dropdownRef}>
                        {/* Prev Room Button */}
                        <button
                            type="button"
                            onClick={handlePrevClass}
                            disabled={!hasPrev}
                            title={hasPrev ? `Previous: ${classrooms[currentClassIndex - 1]?.name}` : 'No previous room'}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                                hasPrev
                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                    : 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {/* Active Classroom Trigger Card / Dropdown Trigger */}
                        <div className="relative flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen((prev) => !prev)}
                                className="w-full text-left p-2.5 sm:px-4 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-sm">
                                        {activeClassroom ? `G${activeClassroom.grade_level}` : '—'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-black text-slate-900 truncate">
                                                {activeClassroom ? activeClassroom.name : 'Select Classroom Section'}
                                            </span>
                                            {activeClassroom?.is_adviser && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                    ★ My Advisory Section
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} className="text-blue-500 shrink-0" />
                                                <span>{activeClassroom?.room || 'Room TBA'}</span>
                                            </span>
                                            <span>&bull;</span>
                                            <span className="flex items-center gap-1">
                                                <Users size={12} className="text-slate-400 shrink-0" />
                                                <span>{activeClassroom?.students_count || 0} Learners</span>
                                            </span>
                                            <span>&bull;</span>
                                            <span className="text-slate-400">
                                                {activeClassroom?.subjects?.length || 0} Subject{activeClassroom?.subjects?.length === 1 ? '' : 's'} Handled
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="hidden sm:inline-block text-[11px] font-bold text-slate-400 group-hover:text-blue-600">
                                        {currentClassIndex + 1} of {classrooms.length} Rooms
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </button>

                            {/* DROPDOWN MENU DRAWER (Searchable, Scales smoothly to 9+ rooms) */}
                            {isDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[460px] flex flex-col">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Filter classroom, room venue, or subject..."
                                                value={classSearch}
                                                onChange={(e) => setClassSearch(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto p-2 divide-y divide-slate-100">
                                        {filteredDropdownClassrooms.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-slate-400">
                                                No matching classrooms found.
                                            </div>
                                        ) : (
                                            filteredDropdownClassrooms.map((c) => {
                                                const isCurrent = Number(c.id) === Number(activeClassroom?.id);
                                                return (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectClass(c.id)}
                                                        className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                            isCurrent
                                                                ? 'bg-blue-50/80 text-blue-900 border border-blue-200'
                                                                : 'hover:bg-slate-50 text-slate-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                                                    c.is_adviser
                                                                        ? 'bg-amber-100 text-amber-800'
                                                                        : isCurrent
                                                                          ? 'bg-blue-600 text-white'
                                                                          : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                            >
                                                                G{c.grade_level}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-extrabold text-xs text-slate-900 truncate">
                                                                        {c.name}
                                                                    </span>
                                                                    {c.is_adviser && (
                                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                                                                            ★ Advisory
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                                    <span>{c.room}</span>
                                                                    <span>&bull;</span>
                                                                    <span>{c.students_count} students</span>
                                                                    <span>&bull;</span>
                                                                    <span className="text-slate-500">
                                                                        {c.subjects.map((s) => s.subject_code).join(', ')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isCurrent && <Check size={16} className="text-blue-600 shrink-0" />}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center text-[11px] text-slate-400 font-medium">
                                        Total {classrooms.length} Teaching Classroom{classrooms.length === 1 ? '' : 's'} Assigned by Administration
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Next Room Button */}
                        <button
                            type="button"
                            onClick={handleNextClass}
                            disabled={!hasNext}
                            title={hasNext ? `Next: ${classrooms[currentClassIndex + 1]?.name}` : 'No next room'}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                                hasNext
                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                    : 'bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* View Switcher: Studio Mode vs All Rooms Directory */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
                            <button
                                type="button"
                                onClick={() => setViewMode('studio')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                                    viewMode === 'studio'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'bg-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <SlidersHorizontal size={13} />
                                <span>Grading Studio</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('directory')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                                    viewMode === 'directory'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'bg-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Grid size={13} />
                                <span>All Rooms ({classrooms.length})</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* TIER 2: SUBJECT SELECTOR FOR ACTIVE ROOM                                  */}
                {/* ========================================================================= */}
                {viewMode === 'studio' && activeClassroom && activeClassroom.subjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                                <BookOpen size={13} className="text-blue-500" />
                                <span>Subjects in {activeClassroom.name}:</span>
                            </span>
                            {activeClassroom.subjects.map((subj) => {
                                const isSubjActive = Number(subj.subject_id) === Number(activeSubject?.subject_id);
                                return (
                                    <button
                                        key={subj.subject_id}
                                        type="button"
                                        onClick={() => {
                                            if (hasUnsavedChanges) {
                                                if (!window.confirm('You have unsaved changes. Discard and switch subject?')) {
                                                    return;
                                                }
                                            }
                                            setSelectedSubjectId(subj.subject_id);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                            isSubjActive
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        <span>{subj.subject_name}</span>
                                        <span
                                            className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                                isSubjActive ? 'bg-blue-500 text-blue-100' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {subj.subject_code}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {activeSubject?.schedule_time && (
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                                <Clock size={12} className="text-blue-500" />
                                <span>{activeSubject.schedule_time}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* VIEW MODE: BIRD'S-EYE DIRECTORY (Grid of All Handled Classrooms)          */}
            {/* ========================================================================= */}
            {viewMode === 'directory' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900 m-0">
                                My Handled Teaching Rooms Directory
                            </h3>
                            <p className="text-xs text-slate-500 m-0 mt-0.5">
                                Select any classroom to inspect students and encode quarterly grades.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classrooms.map((cls) => {
                            const isCurrent = Number(cls.id) === Number(activeClassroom?.id);
                            return (
                                <div
                                    key={cls.id}
                                    className={`bg-white rounded-2xl border p-5 shadow-card transition-all flex flex-col justify-between ${
                                        isCurrent ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/90 hover:border-slate-300'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    Grade {cls.grade_level} Section
                                                </div>
                                                <h4 className="text-base font-black text-slate-900 m-0 mt-0.5">
                                                    {cls.name}
                                                </h4>
                                            </div>
                                            {cls.is_adviser ? (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                    ★ Advisory
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                                    Subject Class
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="text-slate-400 font-medium">Room Venue:</span>
                                                <span className="font-bold text-slate-800">{cls.room}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="text-slate-400 font-medium">Enrolled Students:</span>
                                                <span className="font-bold text-slate-800">{cls.students_count} Learners</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="text-slate-400 font-medium">Class Shift:</span>
                                                <span className="font-bold text-slate-800">{cls.shift}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                                                Subjects Handled ({cls.subjects.length}):
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {cls.subjects.map((s) => (
                                                    <span
                                                        key={s.subject_id}
                                                        className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-100"
                                                    >
                                                        {s.subject_name} ({s.subject_code})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                handleSelectClass(cls.id);
                                                setViewMode('studio');
                                            }}
                                            className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 border-0 cursor-pointer shadow-xs"
                                        >
                                            <span>Open Gradebook Studio</span>
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW MODE: STUDIO (Focused Interactive Gradebook with Modular Table)     */}
            {/* ========================================================================= */}
            {viewMode === 'studio' && (
                <>
                    {/* ========================================================================= */}
                    {/* MODULAR CONTROLS TOOLBAR: Compact View Dropdown, Sort Dropdown & Search   */}
                    {/* ========================================================================= */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-card">
                        <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
                            {/* 1. Modular Table Designation Dropdown Menu (Replaces sprawling button pills!) */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Table Designation:
                                </span>
                                <select
                                    value={columnDesignation}
                                    onChange={(e) => setColumnDesignation(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-extrabold bg-slate-50 hover:bg-slate-100/80 text-slate-800 border border-slate-200 rounded-xl outline-none focus:border-blue-600 cursor-pointer transition-colors"
                                >
                                    <option value="full">Full DepEd Matrix (Q1–Q4)</option>
                                    <option value="q1">1st Quarter Focus Grid</option>
                                    <option value="q2">2nd Quarter Focus Grid</option>
                                    <option value="q3">3rd Quarter Focus Grid</option>
                                    <option value="q4">4th Quarter Focus Grid</option>
                                    <option value="outcome_only">Academic Standing &amp; Final Outcome Only</option>
                                </select>
                            </div>

                            {/* 2. Modular Sort Query Selector Dropdown */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Sort:
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-extrabold bg-slate-50 hover:bg-slate-100/80 text-slate-800 border border-slate-200 rounded-xl outline-none focus:border-blue-600 cursor-pointer transition-colors"
                                >
                                    <option value="name_asc">Learner Name (A → Z)</option>
                                    <option value="name_desc">Learner Name (Z → A)</option>
                                    <option value="lrn_asc">LRN Order</option>
                                    <option value="final_desc">Final Rating (Highest → Lowest)</option>
                                    <option value="final_asc">Final Rating (Lowest → Highest)</option>
                                    <option value="at_risk_first">At-Risk / Watchlist First (&lt; 75)</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Bar & Action Buttons */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Search in student roster */}
                            <div className="relative min-w-[190px]">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search student or LRN..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                />
                            </div>

                            {/* Print Report Card Sheet */}
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Print official grading sheet"
                            >
                                <Printer size={14} />
                                <span>Print Sheet</span>
                            </button>

                            {/* Save Button */}
                            {!readOnly && !matrixData?.read_only && (
                                <button
                                    type="button"
                                    onClick={handleSaveGrades}
                                    disabled={saving || !hasUnsavedChanges}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold rounded-xl transition-all border-0 cursor-pointer ${
                                        hasUnsavedChanges
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Save size={14} />
                                    <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* STATUS BANNER */}
                    <div className="flex items-center justify-between flex-wrap gap-2 px-1 text-[11px]">
                        <div className="flex items-center gap-2">
                            {readOnly || matrixData?.read_only ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Lock size={12} />
                                    <span>{isAdmin ? 'Read-Only Academic Oversight' : 'View-Only Mode'}</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Sparkles size={12} />
                                    <span>Faculty Authorized Grade Encoder • Auto-synchronizes to student portal</span>
                                </span>
                            )}
                        </div>

                        {hasUnsavedChanges ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                                <AlertCircle size={13} />
                                <span>Unsaved grades in matrix — click Save to publish</span>
                            </span>
                        ) : saveStatus === 'saved' ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 size={13} />
                                <span>All grades published &amp; saved!</span>
                            </span>
                        ) : (
                            <span className="text-slate-400">Press Tab / Enter to navigate cells</span>
                        )}
                    </div>

                    {/* ========================================================================= */}
                    {/* LEVEL 2: 100% ISOLATED SECTION & SUBJECT METRICS STRIP                     */}
                    {/* ========================================================================= */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Quarterly Subject Mean */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover transition-all">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Quarterly Subject Mean</span>
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <TrendingUp size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {liveMetrics.classMean ? `${liveMetrics.classMean}%` : '—'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 truncate">
                                {activeSubject?.subject_code} &bull; {activeClassroom?.name} ({liveMetrics.totalGraded} of{' '}
                                {matrixData?.students?.length || 0} evaluated)
                            </div>
                        </div>

                        {/* 2. Passing Rate */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover transition-all">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Passing Rate</span>
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {liveMetrics.totalGraded > 0 ? `${liveMetrics.passingRate}%` : '—'}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                                Passing benchmark: &ge;75%
                            </div>
                        </div>

                        {/* 3. Honor Roll Candidates */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover transition-all">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Honor Roll Candidates</span>
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Award size={16} />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {liveMetrics.honorCount}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                                Standing in this subject: &ge;90%
                            </div>
                        </div>

                        {/* 4. Intervention Watchlist */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover transition-all">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Intervention Watchlist</span>
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        liveMetrics.atRiskCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                                    }`}
                                >
                                    <AlertTriangle size={16} />
                                </div>
                            </div>
                            <div
                                className={`text-2xl font-black tracking-tight ${
                                    liveMetrics.atRiskCount > 0 ? 'text-rose-600' : 'text-slate-900'
                                }`}
                            >
                                {liveMetrics.atRiskCount}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                                Learners currently below 75%
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* LEVEL 3: MODULAR SPREADSHEET MATRIX (Multi-Tier Grouped Headers & Modules) */}
                    {/* ========================================================================= */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
                        {/* Table Header Identity */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 m-0">
                                    Subject E-Class Record (Grading Sheet)
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 mb-0">
                                    Official DepEd quarterly encoding matrix for{' '}
                                    <strong className="text-slate-800">{activeSubject?.subject_name}</strong> in{' '}
                                    <strong className="text-slate-800">{activeClassroom?.name}</strong> ({activeClassroom?.room})
                                </p>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Pass (75+)</span>
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span>Fail (&lt; 75)</span>
                                </span>
                                <span className="text-slate-300">&bull;</span>
                                <span className="text-slate-400 font-medium">
                                    10 Rows / Page
                                </span>
                            </div>
                        </div>

                        {loadingMatrix ? (
                            <div className="p-12 text-center text-xs text-slate-400 font-bold">
                                Loading class gradebook matrix...
                            </div>
                        ) : !matrixData || totalStudents === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400">
                                {searchQuery ? 'No students match your search criteria.' : 'No students enrolled in this section yet.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    {/* TIER 1: MODULAR SUPER-HEADERS (Designated Functional Blocks) */}
                                    <thead>
                                        <tr className="border-b border-slate-200 text-[10px] font-black tracking-wider uppercase">
                                            {/* MODULE 1: Learner Identification */}
                                            <th
                                                colSpan={2}
                                                className="py-2.5 px-4 bg-slate-100 text-slate-600 border-r border-slate-200 text-left"
                                            >
                                                MODULE 1: LEARNER IDENTIFICATION
                                            </th>

                                            {/* MODULE 2: Quarterly Evaluation Ratings */}
                                            {columnDesignation !== 'outcome_only' && (
                                                <th
                                                    colSpan={
                                                        columnDesignation === 'full'
                                                            ? 4
                                                            : 1
                                                    }
                                                    className="py-2.5 px-3 bg-blue-50/70 text-blue-900 border-r border-slate-200 text-center"
                                                >
                                                    MODULE 2: DEPED QUARTERLY RATINGS
                                                </th>
                                            )}

                                            {/* MODULE 3: Final Academic Outcome */}
                                            <th
                                                colSpan={3}
                                                className="py-2.5 px-4 bg-indigo-50/60 text-indigo-900 text-center"
                                            >
                                                MODULE 3: FINAL ACADEMIC OUTCOME
                                            </th>
                                        </tr>

                                        {/* TIER 2: SUB-HEADERS (Columns with Clickable Sorting) */}
                                        <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                                            <th className="py-2.5 px-3.5 w-12 text-center">#</th>
                                            <th
                                                onClick={() => setSortBy((prev) => (prev === 'name_asc' ? 'name_desc' : 'name_asc'))}
                                                className="py-2.5 px-4 min-w-[220px] cursor-pointer hover:bg-slate-100 transition-colors select-none border-r border-slate-200"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Learner Name &amp; LRN</span>
                                                    <span className="text-slate-400">
                                                        {sortBy === 'name_asc' ? (
                                                            <ArrowUp size={13} className="text-blue-600" />
                                                        ) : sortBy === 'name_desc' ? (
                                                            <ArrowDown size={13} className="text-blue-600" />
                                                        ) : (
                                                            <ArrowUpDown size={13} />
                                                        )}
                                                    </span>
                                                </div>
                                            </th>

                                            {/* Columns adapt based on columnDesignation */}
                                            {(columnDesignation === 'full' || columnDesignation === 'q1') && (
                                                <th className="py-2.5 px-3 w-28 text-center bg-blue-50/20">1st Quarter</th>
                                            )}
                                            {(columnDesignation === 'full' || columnDesignation === 'q2') && (
                                                <th className="py-2.5 px-3 w-28 text-center bg-blue-50/20">2nd Quarter</th>
                                            )}
                                            {(columnDesignation === 'full' || columnDesignation === 'q3') && (
                                                <th className="py-2.5 px-3 w-28 text-center bg-blue-50/20">3rd Quarter</th>
                                            )}
                                            {(columnDesignation === 'full' || columnDesignation === 'q4') && (
                                                <th className="py-2.5 px-3 w-28 text-center bg-blue-50/20 border-r border-slate-200">
                                                    4th Quarter
                                                </th>
                                            )}

                                            <th
                                                onClick={() => setSortBy((prev) => (prev === 'final_desc' ? 'final_asc' : 'final_desc'))}
                                                className="py-2.5 px-3.5 w-28 text-center bg-indigo-50/30 cursor-pointer hover:bg-indigo-100/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>Final Rating</span>
                                                    <span className="text-slate-400">
                                                        {sortBy === 'final_desc' ? (
                                                            <ArrowDown size={13} className="text-blue-600" />
                                                        ) : sortBy === 'final_asc' ? (
                                                            <ArrowUp size={13} className="text-blue-600" />
                                                        ) : (
                                                            <ArrowUpDown size={13} />
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="py-2.5 px-3.5 min-w-[160px] bg-indigo-50/30">DepEd Descriptor</th>
                                            <th
                                                onClick={() => setSortBy((prev) => (prev === 'at_risk_first' ? 'name_asc' : 'at_risk_first'))}
                                                className="py-2.5 px-3.5 w-24 text-center bg-indigo-50/30 cursor-pointer hover:bg-indigo-100/50 transition-colors select-none"
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>Status</span>
                                                    <span className="text-slate-400">
                                                        {sortBy === 'at_risk_first' ? (
                                                            <ArrowDown size={13} className="text-rose-600" />
                                                        ) : (
                                                            <ArrowUpDown size={13} />
                                                        )}
                                                    </span>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>

                                    {/* TABLE BODY (Strictly 10 items per page) */}
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedStudents.map((student, idx) => {
                                            const globalIndex = startIndex + idx + 1;
                                            const rowVals = localGrades[student.student_id] || {
                                                q1: '',
                                                q2: '',
                                                q3: '',
                                                q4: '',
                                            };
                                            const stats = getComputedRowStats(student.student_id);
                                            const isRowReadOnly = readOnly || matrixData.read_only;

                                            return (
                                                <tr
                                                    key={student.student_id}
                                                    className="hover:bg-slate-50/80 transition-colors"
                                                >
                                                    {/* Row Number */}
                                                    <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                                                        {globalIndex}
                                                    </td>

                                                    {/* Module 1: Student Identity */}
                                                    <td className="py-3 px-4 border-r border-slate-200/80">
                                                        <div className="font-extrabold text-slate-900">
                                                            {student.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            LRN: {student.lrn}
                                                        </div>
                                                    </td>

                                                    {/* Module 2: Quarterly Inputs */}
                                                    {(columnDesignation === 'full' || columnDesignation === 'q1') && (
                                                        <td className="py-2 px-2 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                disabled={isRowReadOnly}
                                                                value={rowVals.q1}
                                                                placeholder="—"
                                                                onChange={(e) =>
                                                                    handleCellChange(student.student_id, 'q1', e.target.value)
                                                                }
                                                                className={`w-20 text-center py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all outline-none ${
                                                                    isRowReadOnly
                                                                        ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                                                                        : rowVals.q1 !== '' && Number(rowVals.q1) < 75
                                                                          ? 'bg-red-50 border-red-300 text-red-700 focus:bg-white'
                                                                          : rowVals.q1 !== '' && Number(rowVals.q1) >= 85
                                                                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 focus:bg-white'
                                                                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                                }`}
                                                            />
                                                        </td>
                                                    )}

                                                    {(columnDesignation === 'full' || columnDesignation === 'q2') && (
                                                        <td className="py-2 px-2 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                disabled={isRowReadOnly}
                                                                value={rowVals.q2}
                                                                placeholder="—"
                                                                onChange={(e) =>
                                                                    handleCellChange(student.student_id, 'q2', e.target.value)
                                                                }
                                                                className={`w-20 text-center py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all outline-none ${
                                                                    isRowReadOnly
                                                                        ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                                                                        : rowVals.q2 !== '' && Number(rowVals.q2) < 75
                                                                          ? 'bg-red-50 border-red-300 text-red-700 focus:bg-white'
                                                                          : rowVals.q2 !== '' && Number(rowVals.q2) >= 85
                                                                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 focus:bg-white'
                                                                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                                }`}
                                                            />
                                                        </td>
                                                    )}

                                                    {(columnDesignation === 'full' || columnDesignation === 'q3') && (
                                                        <td className="py-2 px-2 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                disabled={isRowReadOnly}
                                                                value={rowVals.q3}
                                                                placeholder="—"
                                                                onChange={(e) =>
                                                                    handleCellChange(student.student_id, 'q3', e.target.value)
                                                                }
                                                                className={`w-20 text-center py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all outline-none ${
                                                                    isRowReadOnly
                                                                        ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                                                                        : rowVals.q3 !== '' && Number(rowVals.q3) < 75
                                                                          ? 'bg-red-50 border-red-300 text-red-700 focus:bg-white'
                                                                          : rowVals.q3 !== '' && Number(rowVals.q3) >= 85
                                                                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 focus:bg-white'
                                                                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                                }`}
                                                            />
                                                        </td>
                                                    )}

                                                    {(columnDesignation === 'full' || columnDesignation === 'q4') && (
                                                        <td className="py-2 px-2 text-center border-r border-slate-200/80">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                disabled={isRowReadOnly}
                                                                value={rowVals.q4}
                                                                placeholder="—"
                                                                onChange={(e) =>
                                                                    handleCellChange(student.student_id, 'q4', e.target.value)
                                                                }
                                                                className={`w-20 text-center py-1.5 px-2 rounded-lg text-xs font-extrabold border transition-all outline-none ${
                                                                    isRowReadOnly
                                                                        ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                                                                        : rowVals.q4 !== '' && Number(rowVals.q4) < 75
                                                                          ? 'bg-red-50 border-red-300 text-red-700 focus:bg-white'
                                                                          : rowVals.q4 !== '' && Number(rowVals.q4) >= 85
                                                                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 focus:bg-white'
                                                                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                                                                }`}
                                                            />
                                                        </td>
                                                    )}

                                                    {/* Module 3: Final Rating & Descriptors */}
                                                    <td className="py-3 px-3.5 text-center bg-indigo-50/20">
                                                        <span
                                                            className={`text-sm font-extrabold ${
                                                                stats.final !== null && stats.final < 75
                                                                    ? 'text-red-600'
                                                                    : 'text-slate-900'
                                                            }`}
                                                        >
                                                            {stats.final !== null ? stats.final : '—'}
                                                        </span>
                                                        {!stats.isComplete && stats.final !== null && (
                                                            <span className="block text-[9px] text-slate-400 font-semibold">
                                                                Running
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-3.5 bg-indigo-50/20">
                                                        {stats.descriptor ? (
                                                            <span
                                                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${stats.badgeClass}`}
                                                            >
                                                                {stats.descriptor}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px]">—</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-3.5 text-center bg-indigo-50/20">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${stats.statusClass}`}
                                                        >
                                                            {stats.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                    {/* TIER 3: MODULAR AGGREGATE SUMMARY FOOTER (Class MPS Calculation) */}
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-300 bg-slate-100/90 text-xs font-black text-slate-800">
                                            <td className="py-3 px-3.5 text-center text-slate-400">∑</td>
                                            <td className="py-3 px-4 border-r border-slate-200">
                                                <div className="font-black text-slate-900">
                                                    Section Aggregate Mean (MPS)
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium">
                                                    Computed across all {matrixData?.students?.length || 0} enrolled learners
                                                </div>
                                            </td>

                                            {(columnDesignation === 'full' || columnDesignation === 'q1') && (
                                                <td className="py-3 px-2 text-center text-blue-900 bg-blue-50/60 font-black">
                                                    {classQuarterMeans.q1}
                                                </td>
                                            )}
                                            {(columnDesignation === 'full' || columnDesignation === 'q2') && (
                                                <td className="py-3 px-2 text-center text-blue-900 bg-blue-50/60 font-black">
                                                    {classQuarterMeans.q2}
                                                </td>
                                            )}
                                            {(columnDesignation === 'full' || columnDesignation === 'q3') && (
                                                <td className="py-3 px-2 text-center text-blue-900 bg-blue-50/60 font-black">
                                                    {classQuarterMeans.q3}
                                                </td>
                                            )}
                                            {(columnDesignation === 'full' || columnDesignation === 'q4') && (
                                                <td className="py-3 px-2 text-center text-blue-900 bg-blue-50/60 font-black border-r border-slate-200">
                                                    {classQuarterMeans.q4}
                                                </td>
                                            )}

                                            <td className="py-3 px-3.5 text-center bg-indigo-50/60 text-indigo-950 font-black text-sm">
                                                {classQuarterMeans.final}
                                            </td>
                                            <td className="py-3 px-3.5 bg-indigo-50/60 text-slate-600 text-[11px] font-bold">
                                                Passing Rate: {liveMetrics.passingRate}%
                                            </td>
                                            <td className="py-3 px-3.5 text-center bg-indigo-50/60">
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                                                    {liveMetrics.atRiskCount} At-Risk
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* MODULAR PAGINATION BAR: Strictly 10 items per page                        */}
                        {/* ========================================================================= */}
                        {totalStudents > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalStudents}
                                pageSize={PAGE_SIZE}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
