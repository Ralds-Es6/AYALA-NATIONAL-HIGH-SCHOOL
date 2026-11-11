import React, { useState, useMemo, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    Edit,
    Mail,
    Award,
    Clock,
    CheckCircle2,
    AlertTriangle,
    X,
    BookOpen,
    ShieldCheck,
    ArrowLeft,
    CalendarCheck,
    Layers,
    Key,
    Copy,
    Check,
    RefreshCw,
    ArrowRightLeft,
    History,
    SlidersHorizontal,
    Lock,
    Unlock,
    Sparkles,
    Building2,
    GraduationCap,
    ChevronRight,
    FileCheck2,
    Eye,
    EyeOff,
} from 'lucide-react';
import DynamicKanbanTimetable from '../../components/schedules/DynamicKanbanTimetable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const DEPED_POSITIONS = [
    'Teacher I',
    'Teacher II',
    'Teacher III',
    'Master Teacher I',
    'Master Teacher II',
    'Head Teacher I',
    'Head Teacher II',
    'Head Teacher III',
    'Special Education Teacher',
    'Faculty Member',
];

const SPECIALIZATIONS = [
    'Mathematics',
    'Science',
    'English',
    'Filipino',
    'Araling Panlipunan',
    'MAPEH',
    'TLE / TVL',
    'Edukasyon sa Pagpapakatao (EsP)',
    'STEM Specialized',
    'ABM Specialized',
    'HUMSS Specialized',
];

const DEFAULT_PERMISSIONS = {
    can_encode_grades: true,
    is_adviser_eligible: true,
    is_department_head: false,
    can_view_department_schedules: true,
};

const getTeacherDepartments = (teacher) => {
    if (Array.isArray(teacher?.departments) && teacher.departments.length > 0) {
        return teacher.departments.map((d) => String(d).toUpperCase());
    }
    if (teacher?.department) {
        return [String(teacher.department).toUpperCase()];
    }
    const gl = Number(teacher?.assigned_grade_level || 0);
    if (gl >= 11) return ['SHS'];
    return ['JHS'];
};

const getTeacherPermissions = (teacher) => ({
    ...DEFAULT_PERMISSIONS,
    ...(teacher?.permissions || {}),
});

const getDailyClassCounts = (teacherId, allSchedules = []) => {
    const counts = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    (allSchedules || []).forEach((s) => {
        if (Number(s.teacher_id) === Number(teacherId) && counts[s.day_of_week] !== undefined) {
            counts[s.day_of_week] += 1;
        }
    });
    return counts;
};

export default function TeacherManagement({
    teachers = [],
    classes = [],
    subjects = [],
    schedules = [],
    loading = false,
    initialView = 'directory',
    onSaveTeacher,
    onRefresh,
}) {
    // Top-level mode: 'directory' (cards + timetable) | 'rbac' (RBAC matrix) | 'logs' (audit trail)
    const [viewMode, setViewMode] = useState(initialView === 'rbac' ? 'rbac' : 'directory');
    useEffect(() => {
        setViewMode(initialView === 'rbac' ? 'rbac' : 'directory');
        if (initialView === 'rbac') {
            setWorkspaceTab('allocations');
        }
    }, [initialView]);

    // Selected Teacher for Dedicated Workspace
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [workspaceTab, setWorkspaceTab] = useState('allocations'); // 'allocations' | 'schedule' | 'rbac' | 'logs'
    const [allocSearch, setAllocSearch] = useState('');
    const [allocGradeFilter, setAllocGradeFilter] = useState('ALL');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('ALL'); // 'ALL' | 'JHS' | 'SHS' | 'DUAL'
    const [gradeFilter, setGradeFilter] = useState('ALL'); // 'ALL' | 7..12

    // Clipboard feedback
    const [copiedKey, setCopiedKey] = useState(null);

    // Create / Edit Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [subjectSearch, setSubjectSearch] = useState('');

    const [formData, setFormData] = useState({
        employee_id: '',
        name: '',
        email: '',
        password: 'password123',
        position: 'Teacher I',
        specialization: 'Mathematics',
        department: 'JHS',
        departments: ['JHS'],
        assigned_grade_level: 7,
        qualified_subject_ids: [],
        permissions: { ...DEFAULT_PERMISSIONS },
        max_weekly_hours: 30,
        max_classes_per_day: 9,
        status: 'active',
        is_dual_department: false,
    });

    // Workspace inline RBAC editor state
    const [workspaceRbacForm, setWorkspaceRbacForm] = useState(null);
    const [savingWorkspaceRbac, setSavingWorkspaceRbac] = useState(false);
    const [workspaceSavedBanner, setWorkspaceSavedBanner] = useState('');

    // Active teacher object
    const activeTeacher = useMemo(() => {
        if (!selectedTeacherId) return null;
        return teachers.find((t) => Number(t.id) === Number(selectedTeacherId)) || null;
    }, [teachers, selectedTeacherId]);

    // Sync workspace RBAC form whenever activeTeacher changes
    useEffect(() => {
        if (!activeTeacher) {
            setWorkspaceRbacForm(null);
            return;
        }
        const depts = getTeacherDepartments(activeTeacher);
        const primaryDept = activeTeacher.department || depts[0] || 'JHS';
        setWorkspaceRbacForm({
            department: primaryDept,
            departments: depts,
            is_dual_department: depts.includes('JHS') && depts.includes('SHS'),
            assigned_grade_level:
                Number(activeTeacher.assigned_grade_level) || (primaryDept === 'SHS' ? 11 : 7),
            qualified_subject_ids: Array.isArray(activeTeacher.qualified_subject_ids)
                ? activeTeacher.qualified_subject_ids.map((id) => Number(id))
                : [],
            permissions: getTeacherPermissions(activeTeacher),
            max_classes_per_day: Number(activeTeacher.max_classes_per_day || 9),
            max_weekly_hours: Number(activeTeacher.max_weekly_hours || 30),
        });
    }, [activeTeacher]);

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard?.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1800);
    };

    // Filtered teachers for directory / RBAC matrix
    const filteredTeachers = useMemo(() => {
        return teachers.filter((t) => {
            const depts = getTeacherDepartments(t);
            const isDual = depts.includes('JHS') && depts.includes('SHS');

            if (departmentFilter === 'JHS' && !depts.includes('JHS')) return false;
            if (departmentFilter === 'SHS' && !depts.includes('SHS')) return false;
            if (departmentFilter === 'DUAL' && !isDual) return false;

            if (gradeFilter !== 'ALL') {
                const gl = Number(gradeFilter);
                const tGrade = Number(t.assigned_grade_level || 0);
                // Match if primary grade matches OR teacher has qualified subjects in that grade
                const hasSubjectInGrade = (t.qualified_subject_ids || []).some((sid) => {
                    const subj = subjects.find((s) => Number(s.id) === Number(sid));
                    return Number(subj?.grade_level) === gl;
                });
                if (tGrade !== gl && !hasSubjectInGrade) return false;
            }

            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchName = (t.name || '').toLowerCase().includes(q);
                const matchId = (t.employee_id || '').toLowerCase().includes(q);
                const matchSpec = (t.specialization || '').toLowerCase().includes(q);
                const matchEmail = (t.email || '').toLowerCase().includes(q);
                return matchName || matchId || matchSpec || matchEmail;
            }

            return true;
        });
    }, [teachers, departmentFilter, gradeFilter, searchQuery, subjects]);

    // Aggregate KPI stats
    const kpiStats = useMemo(() => {
        let jhsCount = 0;
        let shsCount = 0;
        let dualCount = 0;
        let totalScheduledClasses = 0;

        teachers.forEach((t) => {
            const depts = getTeacherDepartments(t);
            if (depts.includes('JHS')) jhsCount += 1;
            if (depts.includes('SHS')) shsCount += 1;
            if (depts.includes('JHS') && depts.includes('SHS')) dualCount += 1;
            const tScheds = schedules.filter((s) => Number(s.teacher_id) === Number(t.id));
            totalScheduledClasses += tScheds.length;
        });

        return {
            total: teachers.length,
            jhsCount,
            shsCount,
            dualCount,
            totalScheduledClasses,
        };
    }, [teachers, schedules]);

    // Aggregate global audit logs across all teachers
    const globalAuditLogs = useMemo(() => {
        const list = [];
        teachers.forEach((t) => {
            (t.rbac_logs || []).forEach((log) => {
                list.push({
                    ...log,
                    teacher_name: t.name,
                    teacher_employee_id: t.employee_id,
                    teacher_department: t.department,
                });
            });
        });
        return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [teachers]);

    // Subjects allowed by current modal form's selected department(s)
    const modalAllowedSubjects = useMemo(() => {
        const depts = formData.is_dual_department
            ? ['JHS', 'SHS']
            : [formData.department || 'JHS'];

        return subjects
            .filter((s) => {
                const gl = Number(s.grade_level);
                if (gl >= 7 && gl <= 10 && depts.includes('JHS')) return true;
                if (gl >= 11 && gl <= 12 && depts.includes('SHS')) return true;
                return false;
            })
            .filter((s) => {
                if (!subjectSearch.trim()) return true;
                const q = subjectSearch.toLowerCase();
                return (
                    (s.name || '').toLowerCase().includes(q) ||
                    (s.code || '').toLowerCase().includes(q) ||
                    `grade ${s.grade_level}`.includes(q)
                );
            })
            .sort((a, b) => Number(a.grade_level) - Number(b.grade_level) || a.name.localeCompare(b.name));
    }, [subjects, formData.department, formData.is_dual_department, subjectSearch]);

    // Open Modal for Create
    const handleOpenCreate = () => {
        const nextNum = String(teachers.length + 1).padStart(3, '0');
        const defaultGrade = 7;
        // Pre-select Mathematics Grade 7 subject if available
        const defaultSubjIds = subjects
            .filter(
                (s) =>
                    Number(s.grade_level) === defaultGrade &&
                    (s.name || '').toLowerCase().includes('math')
            )
            .map((s) => Number(s.id));

        setEditingTeacher(null);
        setFormError('');
        setSubjectSearch('');
        setFormData({
            employee_id: `ANHS-T-2026-${nextNum}`,
            name: '',
            email: '',
            password: 'password123',
            position: 'Teacher I',
            specialization: 'Mathematics',
            department: 'JHS',
            departments: ['JHS'],
            assigned_grade_level: defaultGrade,
            qualified_subject_ids: defaultSubjIds,
            permissions: { ...DEFAULT_PERMISSIONS },
            max_weekly_hours: 30,
            max_classes_per_day: 9,
            status: 'active',
            is_dual_department: false,
        });
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEdit = (teacher) => {
        const depts = getTeacherDepartments(teacher);
        const isDual = depts.includes('JHS') && depts.includes('SHS');
        const primaryDept = teacher.department || depts[0] || 'JHS';
        const defaultGrade =
            Number(teacher.assigned_grade_level) || (primaryDept === 'SHS' ? 11 : 7);

        setEditingTeacher(teacher);
        setFormError('');
        setSubjectSearch('');
        setFormData({
            employee_id: teacher.employee_id || '',
            name: teacher.name || '',
            email: teacher.email || '',
            password: '',
            position: teacher.position || 'Teacher I',
            specialization: teacher.specialization || 'Mathematics',
            department: primaryDept,
            departments: isDual ? ['JHS', 'SHS'] : [primaryDept],
            assigned_grade_level: defaultGrade,
            qualified_subject_ids: Array.isArray(teacher.qualified_subject_ids)
                ? teacher.qualified_subject_ids.map((id) => Number(id))
                : [],
            permissions: getTeacherPermissions(teacher),
            max_weekly_hours: Number(teacher.max_weekly_hours || 30),
            max_classes_per_day: Number(teacher.max_classes_per_day || 9),
            status: teacher.status || 'active',
            is_dual_department: isDual,
        });
        setIsModalOpen(true);
    };

    const handleDepartmentSwitchInForm = (newDept, isDual = formData.is_dual_department) => {
        const nextDepts = isDual ? ['JHS', 'SHS'] : [newDept];
        const nextGrade =
            newDept === 'SHS'
                ? formData.assigned_grade_level >= 11
                    ? formData.assigned_grade_level
                    : 11
                : formData.assigned_grade_level >= 7 && formData.assigned_grade_level <= 10
                  ? formData.assigned_grade_level
                  : 7;

        // Filter out qualified subjects that don't belong to the allowed departments
        const filteredQualified = (formData.qualified_subject_ids || []).filter((sid) => {
            const subj = subjects.find((s) => Number(s.id) === Number(sid));
            if (!subj) return false;
            const gl = Number(subj.grade_level);
            if (gl >= 7 && gl <= 10 && nextDepts.includes('JHS')) return true;
            if (gl >= 11 && gl <= 12 && nextDepts.includes('SHS')) return true;
            return false;
        });

        setFormData((prev) => ({
            ...prev,
            department: newDept,
            departments: nextDepts,
            is_dual_department: isDual,
            assigned_grade_level: nextGrade,
            qualified_subject_ids: filteredQualified,
        }));
    };

    const toggleFormSubject = (subjectId) => {
        const idNum = Number(subjectId);
        setFormData((prev) => {
            const exists = prev.qualified_subject_ids.includes(idNum);
            return {
                ...prev,
                qualified_subject_ids: exists
                    ? prev.qualified_subject_ids.filter((id) => id !== idNum)
                    : [...prev.qualified_subject_ids, idNum],
            };
        });
    };

    const selectAllSubjectsByGrade = (gradeLevel) => {
        const gradeSubjIds = modalAllowedSubjects
            .filter((s) => Number(s.grade_level) === Number(gradeLevel))
            .map((s) => Number(s.id));

        setFormData((prev) => {
            const allSelected = gradeSubjIds.every((id) => prev.qualified_subject_ids.includes(id));
            if (allSelected) {
                return {
                    ...prev,
                    qualified_subject_ids: prev.qualified_subject_ids.filter(
                        (id) => !gradeSubjIds.includes(id)
                    ),
                };
            }
            const merged = Array.from(new Set([...prev.qualified_subject_ids, ...gradeSubjIds]));
            return {
                ...prev,
                qualified_subject_ids: merged,
            };
        });
    };

    const handleSubmitModal = async (e) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        try {
            const depts = formData.is_dual_department
                ? ['JHS', 'SHS']
                : [formData.department];

            const payload = {
                employee_id: formData.employee_id.trim(),
                name: formData.name.trim(),
                email: formData.email.trim(),
                position: formData.position || 'Teacher I',
                specialization: formData.specialization,
                department: formData.department,
                departments: depts,
                assigned_grade_level: Number(formData.assigned_grade_level),
                qualified_subject_ids: formData.qualified_subject_ids.map((id) => Number(id)),
                permissions: formData.permissions,
                max_weekly_hours: Number(formData.max_weekly_hours || 30),
                max_classes_per_day: Math.min(9, Math.max(1, Number(formData.max_classes_per_day || 9))),
                status: formData.status,
            };

            if (formData.password && formData.password.trim() !== '') {
                payload.password = formData.password.trim();
            }

            await onSaveTeacher(payload, editingTeacher?.id);
            if (onRefresh) await onRefresh();
            setIsModalOpen(false);
        } catch (err) {
            setFormError(
                err?.response?.data?.message ||
                    err?.message ||
                    'Failed to save teacher RBAC configuration.'
            );
        } finally {
            setSaving(false);
        }
    };

    // Save inline RBAC changes inside the Dedicated Teacher Workspace
    const handleSaveWorkspaceRbac = async () => {
        if (!activeTeacher || !workspaceRbacForm) return;
        setSavingWorkspaceRbac(true);
        setWorkspaceSavedBanner('');

        try {
            const depts = workspaceRbacForm.is_dual_department
                ? ['JHS', 'SHS']
                : [workspaceRbacForm.department];

            await onSaveTeacher(
                {
                    employee_id: activeTeacher.employee_id,
                    name: activeTeacher.name,
                    email: activeTeacher.email,
                    position: activeTeacher.position || 'Teacher I',
                    specialization: activeTeacher.specialization,
                    department: workspaceRbacForm.department,
                    departments: depts,
                    assigned_grade_level: Number(workspaceRbacForm.assigned_grade_level),
                    qualified_subject_ids: workspaceRbacForm.qualified_subject_ids,
                    permissions: workspaceRbacForm.permissions,
                    max_classes_per_day: Number(workspaceRbacForm.max_classes_per_day || 9),
                    max_weekly_hours: Number(workspaceRbacForm.max_weekly_hours || 30),
                    status: activeTeacher.status || 'active',
                },
                activeTeacher.id
            );

            if (onRefresh) await onRefresh();
            setWorkspaceSavedBanner(
                'RBAC permissions, department assignment, and qualified subjects updated & logged!'
            );
            setTimeout(() => setWorkspaceSavedBanner(''), 4000);
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    err?.message ||
                    'Failed to update teacher RBAC settings.'
            );
        } finally {
            setSavingWorkspaceRbac(false);
        }
    };

    /* =========================================================================
       DEDICATED TEACHER WORKSPACE (TIMETABLE BUILDER + RBAC + AUDIT TRAIL)
       ========================================================================= */
    if (activeTeacher) {
        const depts = getTeacherDepartments(activeTeacher);
        const isDual = depts.includes('JHS') && depts.includes('SHS');
        const perms = getTeacherPermissions(activeTeacher);
        const teacherSchedules = schedules.filter(
            (s) => Number(s.teacher_id) === Number(activeTeacher.id)
        );
        const dailyCounts = getDailyClassCounts(activeTeacher.id, schedules);
        const peakDaily = Math.max(0, ...Object.values(dailyCounts));
        const dailyCap = Number(activeTeacher.max_classes_per_day || 9);

        const qualifiedSubjectsObjects = (activeTeacher.qualified_subject_ids || [])
            .map((sid) => subjects.find((s) => Number(s.id) === Number(sid)))
            .filter(Boolean);

        const allDeptWorkspaceSubjects = subjects
            .filter((s) => {
                if (!workspaceRbacForm) return true;
                const targetDepts = workspaceRbacForm.is_dual_department
                    ? ['JHS', 'SHS']
                    : [workspaceRbacForm.department];
                const gl = Number(s.grade_level);
                if (gl >= 7 && gl <= 10 && targetDepts.includes('JHS')) return true;
                if (gl >= 11 && gl <= 12 && targetDepts.includes('SHS')) return true;
                return false;
            })
            .sort((a, b) => Number(a.grade_level) - Number(b.grade_level) || a.name.localeCompare(b.name));

        const allowedWorkspaceSubjects = allDeptWorkspaceSubjects.filter((s) => {
            if (allocGradeFilter !== 'ALL' && Number(s.grade_level) !== Number(allocGradeFilter)) {
                return false;
            }
            if (!allocSearch.trim()) return true;
            const q = allocSearch.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.code || '').toLowerCase().includes(q) ||
                `grade ${s.grade_level}`.includes(q)
            );
        });

        const handleSelectAllFiltered = () => {
            const idsToAdd = allowedWorkspaceSubjects.map((s) => Number(s.id));
            setWorkspaceRbacForm((prev) => ({
                ...prev,
                qualified_subject_ids: Array.from(
                    new Set([...(prev?.qualified_subject_ids || []), ...idsToAdd])
                ),
            }));
        };

        const handleDeselectAllFiltered = () => {
            const idsToRemove = new Set(allowedWorkspaceSubjects.map((s) => Number(s.id)));
            setWorkspaceRbacForm((prev) => ({
                ...prev,
                qualified_subject_ids: (prev?.qualified_subject_ids || []).filter(
                    (id) => !idsToRemove.has(id)
                ),
            }));
        };

        return (
            <div className="space-y-6">
                {/* LEVEL 1: WORKSPACE HEADER & BREADCRUMB */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <button
                                type="button"
                                onClick={() => setSelectedTeacherId(null)}
                                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-0 shrink-0"
                            >
                                <ArrowLeft size={15} />
                                <span>Back to Faculty</span>
                            </button>

                            <div>
                                <div className="flex items-center flex-wrap gap-2">
                                    <span className="text-xs font-bold text-slate-400">
                                        Faculty &amp; RBAC Directory
                                    </span>
                                    <span className="text-slate-300">/</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                                        {activeTeacher.employee_id}
                                    </span>
                                    {depts.includes('JHS') && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                            JHS Department (Grades 7–10)
                                        </span>
                                    )}
                                    {depts.includes('SHS') && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                                            SHS Department (Grades 11–12)
                                        </span>
                                    )}
                                    {isDual && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Dual-Department Access
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5 mb-0">
                                    {activeTeacher.name}
                                </h1>

                                <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1.5 font-medium">
                                        <Award size={14} className="text-blue-600" />
                                        <span>
                                            Specialization:{' '}
                                            <strong className="text-slate-900">
                                                {activeTeacher.specialization || 'General Education'}
                                            </strong>
                                        </span>
                                    </span>
                                    <span className="text-slate-300">&bull;</span>
                                    <span className="inline-flex items-center gap-1.5 font-medium">
                                        <GraduationCap size={14} className="text-blue-600" />
                                        <span>
                                            Primary Grade:{' '}
                                            <strong className="text-slate-900">
                                                Grade {activeTeacher.assigned_grade_level || (depts.includes('SHS') ? 11 : 7)}
                                            </strong>
                                        </span>
                                    </span>
                                    <span className="text-slate-300">&bull;</span>
                                    <span className="inline-flex items-center gap-1.5 font-medium">
                                        <Mail size={14} className="text-blue-600" />
                                        <span className="font-mono text-slate-800">{activeTeacher.email}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(activeTeacher.email, `ws-email-${activeTeacher.id}`)}
                                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 cursor-pointer"
                                            title="Copy Teacher Email"
                                        >
                                            {copiedKey === `ws-email-${activeTeacher.id}` ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </span>
                                    {activeTeacher.temporary_password && (
                                        <>
                                            <span className="text-slate-300">&bull;</span>
                                            <span className="inline-flex items-center gap-1.5 font-medium">
                                                <Key size={13} className="text-amber-600" />
                                                <span>
                                                    Temp Password:{' '}
                                                    <code className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px]">
                                                        {activeTeacher.temporary_password}
                                                    </code>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopy(
                                                            activeTeacher.temporary_password,
                                                            `ws-pass-${activeTeacher.id}`
                                                        )
                                                    }
                                                    className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 cursor-pointer"
                                                    title="Copy Password"
                                                >
                                                    {copiedKey === `ws-pass-${activeTeacher.id}` ? (
                                                        <Check size={12} />
                                                    ) : (
                                                        <Copy size={12} />
                                                    )}
                                                </button>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2.5">
                            <button
                                type="button"
                                onClick={() => setWorkspaceTab('schedule')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    workspaceTab === 'schedule'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <CalendarCheck size={14} />
                                <span>Weekly Timetable</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setWorkspaceTab('rbac')}
                                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    workspaceTab === 'rbac'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <ArrowRightLeft size={14} />
                                <span>Transfer Dept / Settings</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOpenEdit(activeTeacher)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                            >
                                <Edit size={14} />
                                <span>Edit Profile Modal</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* LEVEL 2: 4-CARD TEACHER RBAC & WORKLOAD SNAPSHOT STRIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Department & Advisory Scope */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Assigned Department (RBAC)</span>
                            <Building2 size={16} className="text-blue-600" />
                        </div>
                        <div className="text-lg font-extrabold text-slate-900">
                            {isDual
                                ? 'JHS + SHS (Dual Dept)'
                                : depts.includes('SHS')
                                  ? 'Senior High School (SHS)'
                                  : 'Junior High School (JHS)'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Authorized for{' '}
                            {isDual
                                ? 'Grades 7–12'
                                : depts.includes('SHS')
                                  ? 'Grades 11–12 only'
                                  : 'Grades 7–10 only'}
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            {perms.can_encode_grades && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Grade Encoder
                                </span>
                            )}
                            {perms.is_adviser_eligible && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Adviser Eligible
                                </span>
                            )}
                            {perms.is_department_head && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Dept Coordinator
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Qualified Subjects */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Qualified Subjects</span>
                            <BookOpen size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                                {qualifiedSubjectsObjects.length}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                                authorized subjects
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2 truncate">
                            {qualifiedSubjectsObjects.length > 0
                                ? qualifiedSubjectsObjects.map((s) => s.code).join(', ')
                                : `All ${activeTeacher.specialization || 'Department'} subjects in scope`}
                        </div>
                        <button
                            type="button"
                            onClick={() => setWorkspaceTab('allocations')}
                            className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1"
                        >
                            <span>Manage Subject Allocations</span>
                            <ChevronRight size={12} />
                        </button>
                    </div>

                    {/* Card 3: Daily Class Cap (Max 9 Classes/Day) */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Daily Teaching Cap</span>
                            <CalendarCheck size={16} className="text-emerald-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                                {peakDaily} / {dailyCap}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                                peak classes/day
                            </span>
                        </div>
                        <div className="flex items-center gap-1 mt-2.5">
                            {DAYS.map((d) => {
                                const c = dailyCounts[d] || 0;
                                const isFull = c >= dailyCap;
                                return (
                                    <span
                                        key={d}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                            isFull
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : c > 0
                                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                                        }`}
                                        title={`${d}: ${c}/${dailyCap} classes`}
                                    >
                                        {d.slice(0, 3)} {c}/{dailyCap}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Card 4: Total Weekly Scheduled Sessions */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                            <span>Weekly Timetable Sync</span>
                            <Clock size={16} className="text-amber-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                                {teacherSchedules.length}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                                weekly periods
                            </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            <span>Live-synced to Teacher &amp; Student Portals</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setWorkspaceTab('schedule')}
                            className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1"
                        >
                            <span>View Full Timetable</span>
                            <ChevronRight size={12} />
                        </button>
                    </div>
                </div>

                {/* LEVEL 3: SEGMENTED WORKSPACE TABS */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                            {
                                id: 'allocations',
                                label: 'Subject Allocations',
                                badge: `${workspaceRbacForm?.qualified_subject_ids?.length || 0} subjects`,
                                icon: BookOpen,
                            },
                            {
                                id: 'schedule',
                                label: 'Weekly Timetable',
                                badge: `${teacherSchedules.length} periods`,
                                icon: CalendarCheck,
                            },
                            {
                                id: 'rbac',
                                label: 'Department & Role Settings',
                                badge: isDual ? 'JHS+SHS' : depts[0],
                                icon: ShieldCheck,
                            },
                            {
                                id: 'logs',
                                label: 'Audit Trail',
                                badge: (activeTeacher.rbac_logs || []).length,
                                icon: History,
                            },
                        ].map(({ id, label, badge, icon: Icon }) => {
                            const isActive = workspaceTab === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setWorkspaceTab(id)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon size={15} />
                                    <span>{label}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {badge}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* TAB 1: DEDICATED SUBJECT ALLOCATIONS */}
                {workspaceTab === 'allocations' && workspaceRbacForm && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
                        {workspaceSavedBanner && (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span>{workspaceSavedBanner}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                                        Authorized Subject Allocations
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                        {workspaceRbacForm.qualified_subject_ids.length} of {allDeptWorkspaceSubjects.length} Designated
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
                                    Designate and authorize the specific subjects <strong>{activeTeacher.name}</strong> is certified to teach. When building schedules in <strong>Class Sections &amp; Schedules</strong>, only allocated subjects will be available for this teacher.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveWorkspaceRbac}
                                disabled={savingWorkspaceRbac}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0 shrink-0"
                            >
                                <Check size={15} />
                                <span>
                                    {savingWorkspaceRbac
                                        ? 'Saving Allocations...'
                                        : 'Save Subject Allocations'}
                                </span>
                            </button>
                        </div>

                        {/* Search, Grade Level Filters & Bulk Actions */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                                {/* Search */}
                                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search subject name or code..."
                                        value={allocSearch}
                                        onChange={(e) => setAllocSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                                    />
                                </div>

                                {/* Grade Level Pills */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    {['ALL', ...(workspaceRbacForm.is_dual_department ? [7, 8, 9, 10, 11, 12] : workspaceRbacForm.department === 'SHS' ? [11, 12] : [7, 8, 9, 10])].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setAllocGradeFilter(String(g))}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                                allocGradeFilter === String(g)
                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {g === 'ALL' ? 'All Grades' : `Grade ${g}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Select Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSelectAllFiltered}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                                >
                                    Select All Filtered
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeselectAllFiltered}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>

                        {/* Subject Cards Grid */}
                        {allowedWorkspaceSubjects.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs font-bold">
                                No subjects found matching your filter criteria.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {allowedWorkspaceSubjects.map((subj) => {
                                    const isChecked = workspaceRbacForm.qualified_subject_ids.includes(
                                        Number(subj.id)
                                    );
                                    return (
                                        <label
                                            key={subj.id}
                                            className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                                isChecked
                                                    ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-2xs'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        const sid = Number(subj.id);
                                                        setWorkspaceRbacForm((prev) => ({
                                                            ...prev,
                                                            qualified_subject_ids:
                                                                prev.qualified_subject_ids.includes(sid)
                                                                    ? prev.qualified_subject_ids.filter((id) => id !== sid)
                                                                    : [...prev.qualified_subject_ids, sid],
                                                        }));
                                                    }}
                                                    className="w-4 h-4 mt-0.5 accent-blue-600 shrink-0"
                                                />
                                                <div className="truncate">
                                                    <div className="truncate font-bold text-slate-900 leading-snug">
                                                        {subj.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                        {subj.code}
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                                                    Number(subj.grade_level) >= 11
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                Grade {subj.grade_level}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <span className="text-xs font-semibold text-slate-500">
                                {workspaceRbacForm.qualified_subject_ids.length} of {allDeptWorkspaceSubjects.length} subjects authorized
                            </span>
                            <button
                                type="button"
                                onClick={handleSaveWorkspaceRbac}
                                disabled={savingWorkspaceRbac}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                            >
                                <Check size={15} />
                                <span>{savingWorkspaceRbac ? 'Saving...' : 'Save Subject Allocations'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: DEDICATED READ-ONLY WEEKLY TIMETABLE */}
                {workspaceTab === 'schedule' && (
                    <div className="space-y-4">
                        {/* DepEd Reference Notice Banner */}
                        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-start gap-3">
                                <CalendarCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-extrabold text-blue-950 m-0">
                                            Weekly Class Timetable Reference • {activeTeacher.name}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                                            Read-Only Mode
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-blue-700 font-medium mt-1 m-0 leading-relaxed">
                                        Live-synced from <strong>Class Sections &amp; Schedules</strong>. Classroom scheduling conflicts and teacher assignment modifications must be adjusted inside the Classroom scheduler.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white text-blue-800 border border-blue-200 shadow-2xs">
                                    {teacherSchedules.length} Assigned Periods
                                </span>
                            </div>
                        </div>

                        {/* Full Width Dynamic Kanban Board */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                            <DynamicKanbanTimetable
                                perspective="teacher"
                                teacher={activeTeacher}
                                schedules={teacherSchedules}
                                classes={classes}
                                subjects={subjects}
                                teachers={teachers}
                                editable={false}
                                title={`${activeTeacher.name} • Weekly Timetable`}
                                subtitle="Class sessions assigned to this faculty member across all classroom sections."
                            />
                        </div>
                    </div>
                )}

                {/* TAB 3: DEPARTMENT TRANSFER & ROLE SETTINGS */}
                {workspaceTab === 'rbac' && workspaceRbacForm && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
                        {workspaceSavedBanner && (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
                                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                <span>{workspaceSavedBanner}</span>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 m-0">
                                    Department Assignment &amp; Workload Caps
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
                                    Transfer <strong>{activeTeacher.name}</strong> between departments, set DepEd teaching limits, or adjust system access permissions.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveWorkspaceRbac}
                                disabled={savingWorkspaceRbac}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0 shrink-0"
                            >
                                <Check size={15} />
                                <span>
                                    {savingWorkspaceRbac
                                        ? 'Saving Settings...'
                                        : 'Save Department & Role Configuration'}
                                </span>
                            </button>
                        </div>

                        {/* Section 1: Department Assignment & Transfer */}
                        <div>
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                Department Assignment
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div
                                    onClick={() =>
                                        setWorkspaceRbacForm((prev) => ({
                                            ...prev,
                                            department: 'JHS',
                                            departments: ['JHS'],
                                            is_dual_department: false,
                                            assigned_grade_level:
                                                prev.assigned_grade_level >= 7 &&
                                                prev.assigned_grade_level <= 10
                                                    ? prev.assigned_grade_level
                                                    : 7,
                                        }))
                                    }
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                        workspaceRbacForm.department === 'JHS' &&
                                        !workspaceRbacForm.is_dual_department
                                            ? 'border-blue-600 bg-blue-50/40'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                                            JHS DEPARTMENT
                                        </span>
                                        {workspaceRbacForm.department === 'JHS' &&
                                            !workspaceRbacForm.is_dual_department && (
                                                <CheckCircle2 size={16} className="text-blue-600" />
                                            )}
                                    </div>
                                    <div className="text-sm font-extrabold text-slate-900">
                                        Junior High School Only
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 mb-0">
                                        Authorized to teach and advise Grades 7, 8, 9, and 10 classrooms.
                                    </p>
                                </div>

                                <div
                                    onClick={() =>
                                        setWorkspaceRbacForm((prev) => ({
                                            ...prev,
                                            department: 'SHS',
                                            departments: ['SHS'],
                                            is_dual_department: false,
                                            assigned_grade_level:
                                                prev.assigned_grade_level >= 11
                                                    ? prev.assigned_grade_level
                                                    : 11,
                                        }))
                                    }
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                        workspaceRbacForm.department === 'SHS' &&
                                        !workspaceRbacForm.is_dual_department
                                            ? 'border-purple-600 bg-purple-50/40'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                                            SHS DEPARTMENT
                                        </span>
                                        {workspaceRbacForm.department === 'SHS' &&
                                            !workspaceRbacForm.is_dual_department && (
                                                <CheckCircle2 size={16} className="text-purple-600" />
                                            )}
                                    </div>
                                    <div className="text-sm font-extrabold text-slate-900">
                                        Senior High School Only
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 mb-0">
                                        Authorized to teach and advise Grades 11 and 12 (STEM, ABM, HUMSS, TVL, GAS).
                                    </p>
                                </div>

                                <div
                                    onClick={() =>
                                        setWorkspaceRbacForm((prev) => ({
                                            ...prev,
                                            departments: ['JHS', 'SHS'],
                                            is_dual_department: true,
                                        }))
                                    }
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                        workspaceRbacForm.is_dual_department
                                            ? 'border-emerald-600 bg-emerald-50/40'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                            CROSS-DEPARTMENT (JHS + SHS)
                                        </span>
                                        {workspaceRbacForm.is_dual_department && (
                                            <CheckCircle2 size={16} className="text-emerald-600" />
                                        )}
                                    </div>
                                    <div className="text-sm font-extrabold text-slate-900">
                                        Dual-Department Authority
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 mb-0">
                                        Grant shared cross-department authority across both JHS (Grades 7–10) and SHS (Grades 11–12).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Primary Grade Level & Daily Class Cap */}
                        <div>
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                Teaching Workload Caps
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Primary Homeroom / Grade Level Assignment
                                    </label>
                                    <select
                                        value={workspaceRbacForm.assigned_grade_level}
                                        onChange={(e) =>
                                            setWorkspaceRbacForm((prev) => ({
                                                ...prev,
                                                assigned_grade_level: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    >
                                        {(workspaceRbacForm.is_dual_department
                                            ? [7, 8, 9, 10, 11, 12]
                                            : workspaceRbacForm.department === 'SHS'
                                              ? [11, 12]
                                              : [7, 8, 9, 10]
                                        ).map((g) => (
                                            <option key={g} value={g}>
                                                Grade {g} ({g >= 11 ? 'Senior High School' : 'Junior High School'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Max Teaching Classes Per Day (Hard Cap: 9)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="9"
                                        value={workspaceRbacForm.max_classes_per_day}
                                        onChange={(e) =>
                                            setWorkspaceRbacForm((prev) => ({
                                                ...prev,
                                                max_classes_per_day: Math.min(
                                                    9,
                                                    Math.max(1, Number(e.target.value || 9))
                                                ),
                                            }))
                                        }
                                        className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Max Weekly Contact Hours (DepEd Order 007)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="40"
                                        value={workspaceRbacForm.max_weekly_hours}
                                        onChange={(e) =>
                                            setWorkspaceRbacForm((prev) => ({
                                                ...prev,
                                                max_weekly_hours: Number(e.target.value || 30),
                                            }))
                                        }
                                        className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: RBAC System Permission Flags */}
                        <div>
                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                System Access Permissions (RBAC)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    {
                                        key: 'can_encode_grades',
                                        title: 'Grade & Assessment Encoding',
                                        desc: 'Authorized to create assessments and encode student grades for assigned classes.',
                                    },
                                    {
                                        key: 'is_adviser_eligible',
                                        title: 'Classroom Adviser Eligibility',
                                        desc: 'Can be assigned as Homeroom Class Adviser for classrooms in their department.',
                                    },
                                    {
                                        key: 'is_department_head',
                                        title: 'Department Coordinator / Head',
                                        desc: 'Granted Master Teacher / Department Coordinator status for curriculum review.',
                                    },
                                ].map((item) => {
                                    const checked = Boolean(
                                        workspaceRbacForm.permissions?.[item.key]
                                    );
                                    return (
                                        <label
                                            key={item.key}
                                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                                checked
                                                    ? 'bg-blue-50/40 border-blue-300'
                                                    : 'bg-slate-50/60 border-slate-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) =>
                                                    setWorkspaceRbacForm((prev) => ({
                                                        ...prev,
                                                        permissions: {
                                                            ...prev.permissions,
                                                            [item.key]: e.target.checked,
                                                        },
                                                    }))
                                                }
                                                className="mt-0.5 w-4 h-4 accent-blue-600"
                                            />
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    {item.title}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                    {item.desc}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: TEACHER RBAC AUDIT & TRANSFER HISTORY LOG */}
                {workspaceTab === 'logs' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 m-0">
                                    Department Transfer &amp; RBAC Assignment Records
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 mb-0">
                                    Immutable accountability log tracking department assignments, transfers, subject updates, and permission changes for {activeTeacher.name}.
                                </p>
                            </div>
                        </div>

                        {(activeTeacher.rbac_logs || []).length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No assignment changes recorded yet for this teacher.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(activeTeacher.rbac_logs || []).map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 shrink-0">
                                                {(log.action_type || 'rbac_update').replace(/_/g, ' ')}
                                            </span>
                                            <div>
                                                <div className="text-xs font-bold text-slate-900">
                                                    {log.summary}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    Authorized by:{' '}
                                                    <strong>{log.actor_name || 'System Administrator'}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[11px] font-mono text-slate-400 shrink-0">
                                            {log.created_at
                                                ? new Date(log.created_at).toLocaleString()
                                                : 'Just now'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /* =========================================================================
       TOP-LEVEL DIRECTORY, RBAC MATRIX & AUDIT LOG VIEW
       ========================================================================= */
    return (
        <div className="space-y-6">
            {/* LEVEL 1: SAAS PAGE HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>DepEd Faculty Workload &bull; Max 9 Classes/Day Cap</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        {viewMode === 'rbac'
                            ? 'Subject & Department Qualifications'
                            : 'Faculty Directory & Teaching Profiles'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        {viewMode === 'rbac'
                            ? 'Assign teachers to JHS (Grades 7–10) or SHS (Grades 11–12) departments and authorize qualified curriculum subjects.'
                            : 'Manage teacher profiles, DepEd employee credentials, and review individual weekly timetables.'}
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                    <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('directory')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                                viewMode === 'directory'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Users size={14} />
                            <span>Faculty Cards &amp; Timetables</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('rbac')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                                viewMode === 'rbac'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <ShieldCheck size={14} />
                            <span>RBAC Matrix</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('logs')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                                viewMode === 'logs'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-transparent text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <History size={14} />
                            <span>Audit Logs ({globalAuditLogs.length})</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                    >
                        <Plus size={16} />
                        <span>+ Register Teacher &amp; Set RBAC</span>
                    </button>
                </div>
            </div>

            {/* LEVEL 2: 4 SAAS KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>Total Verified Faculty</span>
                        <Users size={17} className="text-blue-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">{kpiStats.total}</div>
                    <div className="text-xs text-slate-400 mt-1.5">
                        Active RBAC-provisioned accounts
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>JHS Department (Grades 7–10)</span>
                        <Building2 size={17} className="text-indigo-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">{kpiStats.jhsCount}</div>
                    <div className="text-xs text-slate-400 mt-1.5">
                        Authorized for Junior High classes
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>SHS Department (Grades 11–12)</span>
                        <GraduationCap size={17} className="text-purple-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900">{kpiStats.shsCount}</div>
                    <div className="text-xs text-slate-400 mt-1.5">
                        Authorized for Senior High strands
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>Daily Cap &amp; Scheduled Periods</span>
                        <CalendarCheck size={17} className="text-emerald-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-slate-900">
                            {kpiStats.totalScheduledClasses}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">max 9/day enforced</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1.5">
                        Synced across teacher &amp; student portals
                    </div>
                </div>
            </div>

            {/* LEVEL 3: DEPARTMENT FILTER PILLS, GRADE LEVEL FILTER & SEARCH BAR */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                            { id: 'ALL', label: `All Departments (${kpiStats.total})` },
                            { id: 'JHS', label: `Junior High • Grades 7–10 (${kpiStats.jhsCount})` },
                            { id: 'SHS', label: `Senior High • Grades 11–12 (${kpiStats.shsCount})` },
                            { id: 'DUAL', label: `Dual-Department (${kpiStats.dualCount})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setDepartmentFilter(tab.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                                    departmentFilter === tab.id
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <select
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                        >
                            <option value="ALL">All Grade Scopes (Grades 7–12)</option>
                            {[7, 8, 9, 10, 11, 12].map((g) => (
                                <option key={g} value={g}>
                                    Grade {g} ({g >= 11 ? 'SHS' : 'JHS'})
                                </option>
                            ))}
                        </select>

                        <div className="relative min-w-[250px] flex-1 sm:flex-initial">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search teacher name, ID, subject..."
                                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* EMPTY STATE FOR CLEAN-SLATE USER TESTING */}
            {teachers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={28} />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 m-0">
                        Clean-Slate Architecture Ready — Register Your First Teacher
                    </h3>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
                        Start by registering a teacher, assigning their department (<strong>JHS Grades 7–10</strong> or{' '}
                        <strong>SHS Grades 11–12</strong>), selecting their <strong>Authorized Subjects</strong>, and building their{' '}
                        <strong>Monday–Friday Timetable</strong> (up to 9 teaching classes per day).
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                    >
                        <Plus size={16} />
                        <span>+ Register First Teacher &amp; Configure RBAC</span>
                    </button>
                </div>
            ) : viewMode === 'logs' ? (
                /* =================================================================
                   GLOBAL RBAC AUDIT & DEPARTMENT TRANSFER LOGS
                   ================================================================= */
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                    <div className="mb-4">
                        <h3 className="text-base font-extrabold text-slate-900 m-0">
                            School-Wide RBAC Assignment &amp; Department Transfer Audit Log
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-0">
                            Complete accountability record of all teacher department assignments, cross-department transfers, subject allocations, and permission updates.
                        </p>
                    </div>

                    {globalAuditLogs.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No RBAC audit events recorded yet.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {globalAuditLogs.map((log) => (
                                <div
                                    key={`${log.teacher_employee_id}-${log.id}`}
                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 shrink-0">
                                            {(log.action_type || 'rbac_update').replace(/_/g, ' ')}
                                        </span>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900">
                                                <span className="text-blue-600">{log.teacher_name}</span>{' '}
                                                <span className="text-slate-400 font-mono text-[11px]">
                                                    ({log.teacher_employee_id})
                                                </span>{' '}
                                                &mdash; {log.summary}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                Authorized by:{' '}
                                                <strong>{log.actor_name || 'System Administrator'}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                                        {log.created_at
                                            ? new Date(log.created_at).toLocaleString()
                                            : 'Recorded'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : viewMode === 'rbac' ? (
                /* =================================================================
                   RBAC PERMISSIONS & DEPARTMENT ALLOCATION MATRIX TABLE
                   ================================================================= */
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Teacher &amp; Credentials</th>
                                    <th className="py-3.5 px-4">Department &amp; Grade Scope</th>
                                    <th className="py-3.5 px-4">Authorized Subjects</th>
                                    <th className="py-3.5 px-4">RBAC Permissions</th>
                                    <th className="py-3.5 px-4">Daily Class Cap (Max 9)</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredTeachers.map((teacher) => {
                                    const depts = getTeacherDepartments(teacher);
                                    const isDual = depts.includes('JHS') && depts.includes('SHS');
                                    const perms = getTeacherPermissions(teacher);
                                    const dailyCounts = getDailyClassCounts(teacher.id, schedules);
                                    const peakDaily = Math.max(0, ...Object.values(dailyCounts));
                                    const dailyCap = Number(teacher.max_classes_per_day || 9);
                                    const totalPeriods = schedules.filter(
                                        (s) => Number(s.teacher_id) === Number(teacher.id)
                                    ).length;

                                    const qualifiedObjs = (teacher.qualified_subject_ids || [])
                                        .map((sid) => subjects.find((s) => Number(s.id) === Number(sid)))
                                        .filter(Boolean);

                                    return (
                                        <tr
                                            key={teacher.id}
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="font-extrabold text-slate-900">
                                                    {teacher.name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                    {teacher.employee_id} &bull; {teacher.email}
                                                </div>
                                                {teacher.temporary_password && (
                                                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono">
                                                        <Key size={10} />
                                                        <span>PW: {teacher.temporary_password}</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {depts.includes('JHS') && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                                            JHS (G7–10)
                                                        </span>
                                                    )}
                                                    {depts.includes('SHS') && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                                                            SHS (G11–12)
                                                        </span>
                                                    )}
                                                    {isDual && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Dual
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1">
                                                    Primary: <strong>Grade {teacher.assigned_grade_level || (depts.includes('SHS') ? 11 : 7)}</strong> &bull; {teacher.specialization}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 max-w-[260px]">
                                                {qualifiedObjs.length > 0 ? (
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {qualifiedObjs.slice(0, 4).map((s) => (
                                                            <span
                                                                key={s.id}
                                                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                                                                title={`${s.name} (Grade ${s.grade_level})`}
                                                            >
                                                                {s.code}
                                                            </span>
                                                        ))}
                                                        {qualifiedObjs.length > 4 && (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                                                                +{qualifiedObjs.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400">
                                                        All {teacher.specialization} subjects in dept
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {perms.can_encode_grades && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Grades
                                                        </span>
                                                    )}
                                                    {perms.is_adviser_eligible && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            Adviser
                                                        </span>
                                                    )}
                                                    {perms.is_department_head && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Dept Head
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="font-extrabold text-slate-900">
                                                    Peak: {peakDaily} / {dailyCap} classes/day
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {totalPeriods} total weekly sessions
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTeacherId(teacher.id);
                                                            setWorkspaceTab('allocations');
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer shadow-2xs"
                                                    >
                                                        Allocate Subjects
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTeacherId(teacher.id);
                                                            setWorkspaceTab('schedule');
                                                        }}
                                                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 cursor-pointer"
                                                        title="View Timetable"
                                                    >
                                                        View Timetable
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* =================================================================
                   SAAS TEACHER DIRECTORY CARDS WITH TIMETABLE & RBAC LAUNCHERS
                   ================================================================= */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredTeachers.map((teacher) => {
                        const depts = getTeacherDepartments(teacher);
                        const isDual = depts.includes('JHS') && depts.includes('SHS');
                        const perms = getTeacherPermissions(teacher);
                        const dailyCounts = getDailyClassCounts(teacher.id, schedules);
                        const peakDaily = Math.max(0, ...Object.values(dailyCounts));
                        const dailyCap = Number(teacher.max_classes_per_day || 9);
                        const teacherSchedules = schedules.filter(
                            (s) => Number(s.teacher_id) === Number(teacher.id)
                        );
                        const qualifiedObjs = (teacher.qualified_subject_ids || [])
                            .map((sid) => subjects.find((s) => Number(s.id) === Number(sid)))
                            .filter(Boolean);

                        return (
                            <div
                                key={teacher.id}
                                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Top Row: Department Badge + Edit Icon */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {depts.includes('JHS') && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                                    JHS &bull; Grades 7–10
                                                </span>
                                            )}
                                            {depts.includes('SHS') && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                                                    SHS &bull; Grades 11–12
                                                </span>
                                            )}
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                                Grade {teacher.assigned_grade_level || (depts.includes('SHS') ? 11 : 7)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(teacher)}
                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 cursor-pointer"
                                            title="Edit Teacher & RBAC Modal"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>

                                    {/* Teacher Name & Specialization */}
                                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                                        {teacher.name}
                                    </h3>
                                    <div className="text-xs font-semibold text-blue-600 mt-0.5">
                                        {teacher.specialization || 'General Education'} &bull;{' '}
                                        <span className="text-slate-400 font-mono text-[11px]">
                                            {teacher.employee_id}
                                        </span>
                                    </div>

                                    {/* Credentials Box */}
                                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-slate-500 truncate font-mono">
                                                {teacher.email}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopy(teacher.email, `card-email-${teacher.id}`)
                                                }
                                                className="text-slate-500 hover:text-blue-600 bg-transparent border-0 p-0.5 cursor-pointer shrink-0"
                                                title="Copy Email"
                                            >
                                                {copiedKey === `card-email-${teacher.id}` ? (
                                                    <Check size={12} />
                                                ) : (
                                                    <Copy size={12} />
                                                )}
                                            </button>
                                        </div>
                                        {teacher.temporary_password && (
                                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                                                <span className="text-slate-500">
                                                    Password:{' '}
                                                    <code className="font-mono font-bold text-slate-800">
                                                        {teacher.temporary_password}
                                                    </code>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopy(
                                                            teacher.temporary_password,
                                                            `card-pw-${teacher.id}`
                                                        )
                                                    }
                                                    className="text-slate-500 hover:text-blue-600 bg-transparent border-0 p-0.5 cursor-pointer shrink-0"
                                                    title="Copy Password"
                                                >
                                                    {copiedKey === `card-pw-${teacher.id}` ? (
                                                        <Check size={12} />
                                                    ) : (
                                                        <Copy size={12} />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Qualified Subjects Pills */}
                                    <div className="mt-3">
                                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                                            Authorized Subjects ({qualifiedObjs.length})
                                        </div>
                                        {qualifiedObjs.length > 0 ? (
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {qualifiedObjs.slice(0, 4).map((s) => (
                                                    <span
                                                        key={s.id}
                                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                                                    >
                                                        {s.code} (G{s.grade_level})
                                                    </span>
                                                ))}
                                                {qualifiedObjs.length > 4 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                                                        +{qualifiedObjs.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 italic">
                                                Department-wide ({teacher.specialization})
                                            </div>
                                        )}
                                    </div>

                                    {/* Mon-Fri Daily Class Cap Strip (Max 9/day) */}
                                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                                            <span className="font-bold text-slate-600">
                                                Daily Load Cap (Max {dailyCap}/day)
                                            </span>
                                            <span className="font-extrabold text-slate-900">
                                                {teacherSchedules.length} weekly classes
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1">
                                            {DAYS.map((d) => {
                                                const c = dailyCounts[d] || 0;
                                                const full = c >= dailyCap;
                                                return (
                                                    <div
                                                        key={d}
                                                        className={`text-center py-1 rounded-lg text-[10px] font-bold border ${
                                                            full
                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                : c > 0
                                                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                                                        }`}
                                                    >
                                                        <div>{d.slice(0, 3)}</div>
                                                        <div className="font-extrabold">
                                                            {c}/{dailyCap}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTeacherId(teacher.id);
                                            setWorkspaceTab('allocations');
                                        }}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer border-0"
                                    >
                                        <BookOpen size={14} />
                                        <span>Allocate Subjects</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTeacherId(teacher.id);
                                            setWorkspaceTab('schedule');
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer border-0"
                                        title="View Generated Timetable (Read-Only)"
                                    >
                                        <CalendarCheck size={14} />
                                        <span>Schedule ({teacherSchedules.length})</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* =================================================================
               CREATE / EDIT TEACHER & RBAC PROVISIONING MODAL
               ================================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
                    <div className="w-full max-w-[780px] max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="m-0 text-base font-extrabold text-white">
                                        {editingTeacher
                                            ? `Configure Teacher RBAC & Profile — ${editingTeacher.name}`
                                            : 'Register New Teacher & Configure RBAC'}
                                    </h3>
                                    <div className="text-xs text-slate-300">
                                        Assign department (JHS/SHS), qualified subjects, system permissions, and 9-class daily cap
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="bg-transparent border-0 text-slate-300 hover:text-white cursor-pointer p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmitModal} className="p-6 overflow-y-auto flex-1 space-y-6">
                            {formError && (
                                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {/* 1. Identity & Login Credentials */}
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                    1. Faculty Identity &amp; Portal Login Credentials
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Maria Clara Santos"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Employee ID *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. ANHS-T-2026-001"
                                            value={formData.employee_id}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    employee_id: e.target.value,
                                                })
                                            }
                                            className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Official DepEd / Portal Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="teacher.name@deped.gov.ph"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            {editingTeacher
                                                ? 'Reset Login Password (Optional)'
                                                : 'Initial Portal Password *'}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required={!editingTeacher}
                                                placeholder={
                                                    editingTeacher
                                                        ? 'Leave blank to keep existing password'
                                                        : 'Default: password123'
                                                }
                                                value={formData.password}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        password: e.target.value,
                                                    })
                                                }
                                                className="w-full pl-3.5 pr-9 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-slate-400 hover:text-slate-600 cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Department Assignment & Cross-Department Transfer */}
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                                    2. Department Assignment &amp; Grade Scope (RBAC Isolation)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => handleDepartmentSwitchInForm('JHS', false)}
                                        className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                                            formData.department === 'JHS' &&
                                            !formData.is_dual_department
                                                ? 'border-blue-600 bg-blue-50/50'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-xs font-extrabold text-blue-700">
                                            JHS Department
                                        </div>
                                        <div className="text-[11px] text-slate-600 mt-0.5">
                                            Junior High (Grades 7–10)
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDepartmentSwitchInForm('SHS', false)}
                                        className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                                            formData.department === 'SHS' &&
                                            !formData.is_dual_department
                                                ? 'border-purple-600 bg-purple-50/50'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-xs font-extrabold text-purple-700">
                                            SHS Department
                                        </div>
                                        <div className="text-[11px] text-slate-600 mt-0.5">
                                            Senior High (Grades 11–12)
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDepartmentSwitchInForm(formData.department, true)
                                        }
                                        className={`p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                                            formData.is_dual_department
                                                ? 'border-emerald-600 bg-emerald-50/50'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="text-xs font-extrabold text-emerald-700">
                                            Dual Department (JHS + SHS)
                                        </div>
                                        <div className="text-[11px] text-slate-600 mt-0.5">
                                            Cross-Dept Access (Grades 7–12)
                                        </div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Faculty Rank / Position *
                                        </label>
                                        <select
                                            value={formData.position}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    position: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                                        >
                                            {DEPED_POSITIONS.map((pos) => (
                                                <option key={pos} value={pos}>
                                                    {pos}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Academic Specialization *
                                        </label>
                                        <select
                                            value={formData.specialization}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    specialization: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                                        >
                                            {SPECIALIZATIONS.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Primary Grade Level *
                                        </label>
                                        <select
                                            value={formData.assigned_grade_level}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    assigned_grade_level: Number(e.target.value),
                                                })
                                            }
                                            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                                        >
                                            {(formData.is_dual_department
                                                ? [7, 8, 9, 10, 11, 12]
                                                : formData.department === 'SHS'
                                                  ? [11, 12]
                                                  : [7, 8, 9, 10]
                                            ).map((g) => (
                                                <option key={g} value={g}>
                                                    Grade {g} ({g >= 11 ? 'SHS' : 'JHS'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Max Classes / Day (Cap: 9)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="9"
                                            value={formData.max_classes_per_day}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    max_classes_per_day: Math.min(
                                                        9,
                                                        Math.max(1, Number(e.target.value || 9))
                                                    ),
                                                })
                                            }
                                            className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Authorized Subject Allocations */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider m-0">
                                            3. Authorized Subjects ({formData.qualified_subject_ids.length} Selected)
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5 mb-0">
                                            Only selected subjects will appear when scheduling this teacher.
                                        </p>
                                    </div>

                                    <input
                                        type="text"
                                        value={subjectSearch}
                                        onChange={(e) => setSubjectSearch(e.target.value)}
                                        placeholder="Filter subjects by name or code..."
                                        className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                                    />
                                </div>

                                {/* Quick Grade Select Buttons */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                                    {(formData.is_dual_department
                                        ? [7, 8, 9, 10, 11, 12]
                                        : formData.department === 'SHS'
                                          ? [11, 12]
                                          : [7, 8, 9, 10]
                                    ).map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => selectAllSubjectsByGrade(g)}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border-0 cursor-pointer"
                                        >
                                            Toggle All Grade {g}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                                    {modalAllowedSubjects.map((subj) => {
                                        const checked = formData.qualified_subject_ids.includes(
                                            Number(subj.id)
                                        );
                                        return (
                                            <label
                                                key={subj.id}
                                                className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                                    checked
                                                        ? 'bg-blue-50 border-blue-400 font-bold text-slate-900'
                                                        : 'bg-white border-slate-200 text-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleFormSubject(subj.id)}
                                                        className="w-3.5 h-3.5 accent-blue-600 shrink-0"
                                                    />
                                                    <div className="truncate">
                                                        <div className="truncate text-[11px] font-bold">
                                                            {subj.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {subj.code} &bull; G{subj.grade_level}
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 4. RBAC Permissions */}
                            <div>
                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                                    4. System Access Permissions (RBAC)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        {
                                            key: 'can_encode_grades',
                                            label: 'Encode Grades & Assessments',
                                        },
                                        {
                                            key: 'is_adviser_eligible',
                                            label: 'Classroom Adviser Eligible',
                                        },
                                        {
                                            key: 'is_department_head',
                                            label: 'Department Coordinator',
                                        },
                                    ].map((perm) => (
                                        <label
                                            key={perm.key}
                                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={Boolean(formData.permissions?.[perm.key])}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        permissions: {
                                                            ...prev.permissions,
                                                            [perm.key]: e.target.checked,
                                                        },
                                                    }))
                                                }
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <span>{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
                                >
                                    {saving
                                        ? 'Saving RBAC Profile...'
                                        : editingTeacher
                                          ? 'Save RBAC & Profile Changes'
                                          : 'Register Teacher & Save RBAC'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
