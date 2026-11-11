import React, { useState, useEffect, useMemo } from 'react';
import {
    GraduationCap,
    UserCheck,
    ShieldCheck,
    Plus,
    Search,
    Copy,
    Check,
    AlertCircle,
    CheckCircle2,
    Key,
    RefreshCw,
    ShieldAlert,
    X,
    School,
    Mail,
    CalendarCheck,
    ArrowRightLeft,
    Edit3,
    Clock,
    MapPin,
    User,
    CheckCircle,
    BookOpen,
    Award,
    ArrowLeft,
    Settings,
    Printer,
    Users,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Trash2,
    Building2,
    SlidersHorizontal,
    Info,
    UserPlus
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import Badge from '../../components/Badge';
import { notify } from '../../components/notifications/notify';
import DynamicKanbanTimetable, { formatTime12h, timeToMinutes, isTeacherAuthorizedForGrade } from '../../components/schedules/DynamicKanbanTimetable';

// DepEd K-12 Senior High School Curriculum Tracks & Strands
const ACADEMIC_TRACKS = [
    { label: 'Junior High School (Grades 7–10)', value: 'Junior High School' },
    { label: 'Academic Track (SHS)', value: 'Academic Track' },
    { label: 'TVL Track (Technical-Vocational-Livelihood)', value: 'TVL Track' },
];

const STRANDS_BY_TRACK = {
    'Academic Track': [
        { code: 'STEM', name: 'STEM - Science, Technology, Engineering, & Math' },
        { code: 'HUMSS', name: 'HUMSS - Humanities & Social Sciences' },
        { code: 'ABM', name: 'ABM - Accountancy, Business, & Management' },
        { code: 'GAS', name: 'GAS - General Academic Strand' },
    ],
    'TVL Track': [
        { code: 'TVL-ICT', name: 'TVL-ICT - Information & Communications Tech' },
        { code: 'TVL-HE', name: 'TVL-HE - Home Economics' },
        { code: 'TVL-IA', name: 'TVL-IA - Industrial Arts' },
    ],
    'Junior High School': [
        { code: 'JHS General', name: 'Junior High General Curriculum' },
    ]
};

export const getStrandBadge = (strand) => {
    switch (strand) {
        case 'STEM':
            return { bg: '#ECFDF5', border: '#A7F3D0', color: '#047857', label: 'STEM' };
        case 'HUMSS':
            return { bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA', label: 'HUMSS' };
        case 'ABM':
            return { bg: '#FFFBEB', border: '#FDE68A', color: '#B45309', label: 'ABM' };
        case 'GAS':
            return { bg: '#F0F9FF', border: '#BAE6FD', color: '#0369A1', label: 'GAS' };
        case 'TVL-ICT':
            return { bg: '#ECFEFF', border: '#A5F3FC', color: '#0E7490', label: 'TVL-ICT' };
        case 'TVL-HE':
            return { bg: '#FDF2F8', border: '#FBCFE8', color: '#BE185D', label: 'TVL-HE' };
        case 'TVL-IA':
            return { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', label: 'TVL-IA' };
        default:
            return { bg: '#F1F5F9', border: '#CBD5E1', color: '#334155', label: strand || 'JHS General' };
    }
};

export default function StudentProvisioningPage({
    classes: initialClasses = [],
    teachers = [],
    subjects = [],
    schedules = [],
    selectedClassroomId = null,
    onSelectClassroom,
    onNavigate,
    onRefreshData,
}) {
    // Local synchronized classes state
    const [classes, setClasses] = useState(initialClasses);
    useEffect(() => {
        setClasses(initialClasses);
    }, [initialClasses]);

    // Active Classroom ID (supports both URL route prop and internal fallback)
    const [internalClassroomId, setInternalClassroomId] = useState(selectedClassroomId);
    useEffect(() => {
        setInternalClassroomId(selectedClassroomId);
    }, [selectedClassroomId]);

    const activeClassroomId = selectedClassroomId !== undefined ? selectedClassroomId : internalClassroomId;

    const navigateToClassroom = (id, initialTab = 'students') => {
        setClassroomWorkspaceTab(initialTab);
        setClassroomSearch('');
        if (onSelectClassroom) {
            onSelectClassroom(id);
        } else {
            setInternalClassroomId(id);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Directory View State (View A: Classrooms Grid vs All Enrolled Students)
    const [directoryMode, setDirectoryMode] = useState('classrooms'); // 'classrooms' | 'all-students'
    const [gradeGroupFilter, setGradeGroupFilter] = useState('all'); // 'all' | 'jhs' | 'shs'
    const [classroomGridSearch, setClassroomGridSearch] = useState('');
    const [inspectClassroom, setInspectClassroom] = useState(null);
    const [classroomPage, setClassroomPage] = useState(1);
    const CLASSROOM_PAGE_SIZE = 9; // 3 columns x 3 rows per page

    // Dedicated Classroom Page State (View B)
    const [classroomWorkspaceTab, setClassroomWorkspaceTab] = useState('students'); // 'students' | 'timetable' | 'settings'
    const [classroomDetail, setClassroomDetail] = useState(null);
    const [loadingClassroomDetail, setLoadingClassroomDetail] = useState(false);
    const [classroomSearch, setClassroomSearch] = useState('');

    // Classroom Settings Form State (inside Dedicated Classroom Page)
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        section: '',
        grade_level: 7,
        track: 'Junior High School',
        strand: 'JHS General',
        room: '',
        adviser_id: '',
        max_capacity: 45,
        shift: 'Whole Day Shift',
    });
    const [savingSettings, setSavingSettings] = useState(false);

    // Create New Classroom Modal State
    const [isCreateClassroomModalOpen, setIsCreateClassroomModalOpen] = useState(false);
    const [newClassroomForm, setNewClassroomForm] = useState({
        name: '',
        section: '',
        grade_level: 7,
        track: 'Junior High School',
        strand: 'JHS General',
        room: '',
        adviser_id: '',
        max_capacity: 45,
        shift: 'Whole Day Shift',
    });
    const [creatingClassroom, setCreatingClassroom] = useState(false);

    // Students List & Global Stats State
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({
        total_students: 0,
        active_accounts: 0,
        suspended_accounts: 0,
        sections_covered: 0,
        senior_high_students: 0,
    });
    const [loading, setLoading] = useState(true);

    // Master Student List Filters
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [strandFilter, setStrandFilter] = useState('all');

    // Student Action Modals
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [credentialsModal, setCredentialsModal] = useState({
        isOpen: false,
        data: null,
        copied: false
    });
    const [transferModal, setTransferModal] = useState({
        isOpen: false,
        student: null,
        newClassId: ''
    });
    const [schedulePreviewModal, setSchedulePreviewModal] = useState({
        isOpen: false,
        student: null,
        classInfo: null,
        schedules: [],
        loading: false
    });
    const [editModal, setEditModal] = useState({
        isOpen: false,
        student: null,
        name: '',
        lrn: '',
        email: '',
        strand: '',
        account_status: 'active'
    });

    const generateInitialPassword = () => `ANHS-${new Date().getFullYear()}!${Math.floor(100 + Math.random() * 900)}`;

    const firstClass = classes[0];
    const initialFormState = {
        lrn: '',
        name: '',
        email: '',
        school_class_id: firstClass?.id || '',
        track: firstClass?.track || (firstClass?.grade_level >= 11 ? 'Academic Track' : 'Junior High School'),
        strand: firstClass?.strand || (firstClass?.grade_level >= 11 ? 'STEM' : 'JHS General'),
        document_type: 'Certificate of Registration (COR)',
        document_reference: '',
        custom_temp_password: ''
    };
    const [formData, setFormData] = useState(initialFormState);
    const [duplicateCheck, setDuplicateCheck] = useState({
        isChecking: false,
        hasChecked: false,
        exists: false,
        message: '',
        conflictField: null,
        existingStudent: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    // Refresh classes & students helper
    const refreshClassesAndStudents = async () => {
        try {
            const [clsData] = await Promise.all([
                srnhsApi.getClasses(),
                fetchStudents(),
            ]);
            if (Array.isArray(clsData)) {
                setClasses(clsData);
            }
            if (onRefreshData) {
                onRefreshData();
            }
        } catch (err) {
            console.error('Error refreshing classes:', err);
        }
    };

    // Fetch students list
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (classFilter !== 'all') params.school_class_id = classFilter;
            if (strandFilter !== 'all') params.strand = strandFilter;

            const res = await srnhsApi.getStudents(params);
            setStudents(res.data || []);
            if (res.stats) setStats(res.stats);
        } catch (err) {
            notify.error('Failed to load students', err.message || 'Unable to fetch student records.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 200);
        return () => clearTimeout(timer);
    }, [search, classFilter, strandFilter]);

    // Fetch Detailed Classroom Data when viewing a Dedicated Classroom Page
    const fetchActiveClassroomDetail = async (id) => {
        if (!id) {
            setClassroomDetail(null);
            return;
        }
        setLoadingClassroomDetail(true);
        try {
            const detail = await srnhsApi.getClassDetails(id);
            setClassroomDetail(detail);
            if (detail) {
                const isShs = detail.grade_level >= 11;
                setSettingsForm({
                    name: detail.name || '',
                    section: detail.section || detail.name || '',
                    grade_level: detail.grade_level || 7,
                    track: detail.track || (isShs ? 'Academic Track' : 'Junior High School'),
                    strand: detail.strand || (isShs ? 'STEM' : 'JHS General'),
                    room: detail.room || '',
                    adviser_id: detail.adviser_id ? String(detail.adviser_id) : '',
                    max_capacity: detail.max_capacity || 45,
                    shift: detail.shift || 'Whole Day Shift',
                });
            }
        } catch (err) {
            // Fallback to local class object if API fails
            const fallback = classes.find(c => c.id === parseInt(id, 10));
            if (fallback) {
                setClassroomDetail(fallback);
                const isShs = fallback.grade_level >= 11;
                setSettingsForm({
                    name: fallback.name || '',
                    section: fallback.section || fallback.name || '',
                    grade_level: fallback.grade_level || 7,
                    track: fallback.track || (isShs ? 'Academic Track' : 'Junior High School'),
                    strand: fallback.strand || (isShs ? 'STEM' : 'JHS General'),
                    room: fallback.room || '',
                    adviser_id: fallback.adviser_id ? String(fallback.adviser_id) : '',
                    max_capacity: fallback.max_capacity || 45,
                    shift: fallback.shift || 'Whole Day Shift',
                });
            }
        } finally {
            setLoadingClassroomDetail(false);
        }
    };

    useEffect(() => {
        if (activeClassroomId) {
            fetchActiveClassroomDetail(activeClassroomId);
        } else {
            setClassroomDetail(null);
        }
    }, [activeClassroomId]);

    // Active classroom merged object
    const activeClassroom = useMemo(() => {
        if (!activeClassroomId) return null;
        const fromList = classes.find(c => c.id === parseInt(activeClassroomId, 10));
        return classroomDetail || fromList || null;
    }, [activeClassroomId, classroomDetail, classes]);

    // Students enrolled in the currently opened Dedicated Classroom Page
    const activeClassroomStudents = useMemo(() => {
        if (!activeClassroomId) return [];
        const targetId = parseInt(activeClassroomId, 10);
        const list = students.filter(s => parseInt(s.school_class_id, 10) === targetId);
        const source = list.length > 0 ? list : (classroomDetail?.students || []);
        if (!classroomSearch.trim()) return source;
        const q = classroomSearch.toLowerCase();
        return source.filter(s =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.lrn && s.lrn.toLowerCase().includes(q)) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.strand && s.strand.toLowerCase().includes(q))
        );
    }, [activeClassroomId, students, classroomDetail, classroomSearch]);

    // Schedules for the currently opened Dedicated Classroom Page
    const activeClassroomSchedules = useMemo(() => {
        if (!activeClassroomId) return [];
        const targetId = parseInt(activeClassroomId, 10);
        if (classroomDetail?.schedules && classroomDetail.schedules.length > 0) {
            return classroomDetail.schedules;
        }
        return schedules.filter(s => parseInt(s.school_class_id, 10) === targetId);
    }, [activeClassroomId, classroomDetail, schedules]);

    // Filtered classrooms for View A Directory Grid
    const filteredClassrooms = useMemo(() => {
        return classes.filter(c => {
            if (gradeGroupFilter === 'jhs' && c.grade_level >= 11) return false;
            if (gradeGroupFilter === 'shs' && c.grade_level < 11) return false;
            if (classroomGridSearch.trim()) {
                const q = classroomGridSearch.toLowerCase();
                const matchName = c.name?.toLowerCase().includes(q);
                const matchRoom = c.room?.toLowerCase().includes(q);
                const matchStrand = c.strand?.toLowerCase().includes(q);
                const matchAdviser = c.adviser?.name?.toLowerCase().includes(q);
                if (!matchName && !matchRoom && !matchStrand && !matchAdviser) return false;
            }
            return true;
        });
    }, [classes, gradeGroupFilter, classroomGridSearch]);

    // Reset pagination when grade filter or search query changes
    useEffect(() => {
        setClassroomPage(1);
    }, [gradeGroupFilter, classroomGridSearch]);

    // 9 Classrooms per page (3 columns x 3 rows)
    const paginatedClassrooms = useMemo(() => {
        const start = (classroomPage - 1) * CLASSROOM_PAGE_SIZE;
        return filteredClassrooms.slice(start, start + CLASSROOM_PAGE_SIZE);
    }, [filteredClassrooms, classroomPage]);

    // Total remaining seats across all classrooms
    const totalAvailableSeats = useMemo(() => {
        return classes.reduce((acc, c) => {
            const enrolled = c.students_count ?? (c.students ? c.students.length : 0);
            const maxCap = c.max_capacity || 45;
            return acc + Math.max(0, maxCap - enrolled);
        }, 0);
    }, [classes]);

    // Save Classroom Settings Handler
    const handleSaveClassroomSettings = async (e) => {
        e.preventDefault();
        if (!activeClassroom) return;
        setSavingSettings(true);
        try {
            const payload = {
                name: settingsForm.name.trim(),
                section: settingsForm.section.trim() || settingsForm.name.trim(),
                grade_level: parseInt(settingsForm.grade_level, 10),
                track: settingsForm.track,
                strand: settingsForm.strand,
                room: settingsForm.room.trim() || null,
                adviser_id: settingsForm.adviser_id ? parseInt(settingsForm.adviser_id, 10) : null,
                max_capacity: parseInt(settingsForm.max_capacity, 10) || 45,
                shift: settingsForm.shift || 'Whole Day Shift',
            };

            const res = await srnhsApi.updateClass(activeClassroom.id, payload);
            notify.saveSuccess(
                'Classroom Settings Saved',
                `Configuration for ${payload.name} has been updated and synced to all enrolled students.`
            );
            if (res.data) {
                setClassroomDetail(prev => ({ ...prev, ...res.data }));
            }
            await fetchActiveClassroomDetail(activeClassroom.id);
            await refreshClassesAndStudents();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            notify.error('Update Failed', msg || 'Unable to save classroom settings.');
        } finally {
            setSavingSettings(false);
        }
    };

    // Create New Classroom Handler (TBA Adviser supported)
    const handleCreateClassroomSubmit = async (e) => {
        e.preventDefault();
        setCreatingClassroom(true);
        try {
            const payload = {
                name: newClassroomForm.name.trim(),
                section: newClassroomForm.section.trim() || newClassroomForm.name.trim(),
                grade_level: parseInt(newClassroomForm.grade_level, 10),
                track: newClassroomForm.track,
                strand: newClassroomForm.strand,
                room: newClassroomForm.room.trim() || 'Room TBA',
                adviser_id: newClassroomForm.adviser_id ? parseInt(newClassroomForm.adviser_id, 10) : null,
                max_capacity: parseInt(newClassroomForm.max_capacity, 10) || 45,
                shift: newClassroomForm.shift || 'Whole Day Shift',
            };

            const res = await srnhsApi.createClass(payload);
            notify.createSuccess(
                'Classroom Created',
                `${payload.name} is now ready for subject scheduling and student enrollment.`
            );
            setIsCreateClassroomModalOpen(false);
            await refreshClassesAndStudents();
            if (res.data?.id) {
                navigateToClassroom(res.data.id, 'students');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            notify.error('Creation Failed', msg || 'Unable to create classroom.');
        } finally {
            setCreatingClassroom(false);
        }
    };

    // Delete Empty Classroom Handler
    const handleDeleteClassroom = async () => {
        if (!activeClassroom) return;
        const enrolledCount = activeClassroomStudents.length;
        if (enrolledCount > 0) {
            notify.error(
                'Cannot Delete Active Classroom',
                `Transfer or remove the ${enrolledCount} enrolled student(s) before deleting this classroom.`
            );
            return;
        }
        if (!window.confirm(`Are you sure you want to permanently remove "${activeClassroom.name}"?`)) {
            return;
        }
        try {
            await srnhsApi.deleteClass(activeClassroom.id);
            notify.deleteSuccess('Classroom Removed', `${activeClassroom.name} has been deleted.`);
            navigateToClassroom(null);
            await refreshClassesAndStudents();
        } catch (err) {
            notify.error('Deletion Failed', err.message || 'Unable to delete classroom.');
        }
    };

    // Handle Class Selection Change in Student Registration Modal
    const handleClassChange = (newClassId) => {
        const selClass = classes.find(c => c.id === parseInt(newClassId, 10));
        let track = selClass?.track;
        let strand = selClass?.strand;

        if (!track) {
            if (selClass && selClass.grade_level >= 11) {
                track = 'Academic Track';
                strand = 'STEM';
            } else {
                track = 'Junior High School';
                strand = 'JHS General';
            }
        }

        setFormData(prev => ({
            ...prev,
            school_class_id: newClassId,
            track: track || 'Junior High School',
            strand: strand || (track === 'Academic Track' ? 'STEM' : 'JHS General')
        }));
    };

    const handleTrackChange = (newTrack) => {
        const matchingStrands = STRANDS_BY_TRACK[newTrack] || STRANDS_BY_TRACK['Academic Track'];
        const firstStrand = matchingStrands[0]?.code || '';
        setFormData(prev => ({
            ...prev,
            track: newTrack,
            strand: firstStrand
        }));
    };

    // Live Duplicate Checking Debounce
    useEffect(() => {
        if (!isRegisterModalOpen) return;
        if (!formData.lrn.trim() && !formData.email.trim()) {
            setDuplicateCheck({ isChecking: false, hasChecked: false, exists: false, message: '', conflictField: null, existingStudent: null });
            return;
        }

        const timer = setTimeout(async () => {
            setDuplicateCheck(prev => ({ ...prev, isChecking: true }));
            try {
                const res = await srnhsApi.checkStudentDuplicate({
                    lrn: formData.lrn.trim(),
                    email: formData.email.trim()
                });
                setDuplicateCheck({
                    isChecking: false,
                    hasChecked: true,
                    exists: res.exists,
                    message: res.message,
                    conflictField: res.conflict_field,
                    existingStudent: res.existing_student || null
                });
            } catch (err) {
                setDuplicateCheck(prev => ({ ...prev, isChecking: false }));
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [formData.lrn, formData.email, isRegisterModalOpen]);

    // Handle Student Registration Submit
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (duplicateCheck.exists) {
            setFormError('Cannot enroll student: A student with matching LRN or Email already exists.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await srnhsApi.provisionStudent(formData);

            notify.createSuccess(
                'Student Enrolled & Timetable Synced',
                `${formData.name} is now enrolled and has inherited their classroom timetable.`
            );

            setIsRegisterModalOpen(false);
            setFormData(initialFormState);
            setDuplicateCheck({ isChecking: false, hasChecked: false, exists: false, message: '', conflictField: null, existingStudent: null });

            if (res.credentials) {
                setCredentialsModal({
                    isOpen: true,
                    data: res.credentials,
                    copied: false
                });
            }

            await refreshClassesAndStudents();
            if (activeClassroomId) {
                await fetchActiveClassroomDetail(activeClassroomId);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setFormError(msg || 'Failed to enroll student. Please verify input fields.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Reset Temporary Password
    const handleResetPassword = async (student) => {
        if (!window.confirm(`Generate new temporary credentials for ${student.name}? The student will be prompted to change their password on next sign in.`)) {
            return;
        }

        try {
            const res = await srnhsApi.resetStudentCredentials(student.id);
            notify.saveSuccess('Credentials Reset', `New temporary password generated for ${student.name}.`);
            if (res.credentials) {
                setCredentialsModal({
                    isOpen: true,
                    data: res.credentials,
                    copied: false
                });
            }
            await fetchStudents();
        } catch (err) {
            notify.error('Reset Failed', err.message || 'Unable to reset credentials.');
        }
    };

    // Transfer Student to a Different Classroom
    const handleOpenTransfer = (student) => {
        setTransferModal({
            isOpen: true,
            student,
            newClassId: student.school_class_id || (classes[0]?.id || '')
        });
    };

    const handleConfirmTransfer = async () => {
        if (!transferModal.student || !transferModal.newClassId) return;
        try {
            await srnhsApi.updateStudent(transferModal.student.id, {
                school_class_id: transferModal.newClassId
            });
            const targetClass = classes.find(c => c.id === parseInt(transferModal.newClassId, 10));
            notify.saveSuccess(
                'Classroom Transferred',
                `${transferModal.student.name} has been moved to ${targetClass?.name || 'new classroom'}. Timetable updated!`
            );
            setTransferModal({ isOpen: false, student: null, newClassId: '' });
            await refreshClassesAndStudents();
            if (activeClassroomId) {
                await fetchActiveClassroomDetail(activeClassroomId);
            }
        } catch (err) {
            notify.error('Transfer Failed', err.message || 'Unable to transfer student.');
        }
    };

    // View Live Schedule Preview for Student's Enrolled Classroom
    const handleOpenSchedulePreview = async (student) => {
        setSchedulePreviewModal({
            isOpen: true,
            student,
            classInfo: student.school_class || activeClassroom,
            schedules: [],
            loading: true
        });
        try {
            const res = await srnhsApi.getAdminStudentSchedule(student.id);
            setSchedulePreviewModal(prev => ({
                ...prev,
                schedules: res.schedules || [],
                classInfo: res.class_info || student.school_class || activeClassroom,
                loading: false
            }));
        } catch (err) {
            notify.error('Failed to load timetable', err.message || 'Unable to retrieve student class schedule.');
            setSchedulePreviewModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Edit Student Details
    const handleOpenEdit = (student) => {
        setEditModal({
            isOpen: true,
            student,
            name: student.name || '',
            lrn: student.lrn || '',
            email: student.email || '',
            strand: student.strand || '',
            account_status: student.user?.account_status || 'active'
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editModal.student) return;
        try {
            await srnhsApi.updateStudent(editModal.student.id, {
                name: editModal.name,
                lrn: editModal.lrn,
                email: editModal.email,
                strand: editModal.strand,
                account_status: editModal.account_status
            });
            notify.saveSuccess('Student Updated', `Details for ${editModal.name} have been updated successfully.`);
            setEditModal({ isOpen: false, student: null, name: '', lrn: '', email: '', strand: '', account_status: 'active' });
            await refreshClassesAndStudents();
            if (activeClassroomId) {
                await fetchActiveClassroomDetail(activeClassroomId);
            }
        } catch (err) {
            notify.error('Update Failed', err.message || 'Unable to save student details.');
        }
    };

    const handleCopyCredentials = () => {
        if (!credentialsModal.data) return;
        const strandText = credentialsModal.data.strand
            ? `Curriculum: ${credentialsModal.data.strand} (${credentialsModal.data.track || 'Senior High'})\n`
            : '';
        const text = `Ayala NHS Student Login Credentials\n--------------------------------\nStudent Name: ${credentialsModal.data.name}\nLRN: ${credentialsModal.data.lrn}\nAssigned Classroom: ${credentialsModal.data.class_name}\n${strandText}Login Email: ${credentialsModal.data.email}\nTemporary Password: ${credentialsModal.data.temporary_password}\nPortal URL: ${window.location.origin}/student/login\n\nNote: Your classroom timetable is automatically synced to your Student Dashboard.`;
        navigator.clipboard.writeText(text);
        setCredentialsModal(prev => ({ ...prev, copied: true }));
        setTimeout(() => setCredentialsModal(prev => ({ ...prev, copied: false })), 3000);
    };

    // Open Enroll Modal pre-locked to a specific Classroom
    const handleEnrollToSection = (sectionId) => {
        const tempPass = generateInitialPassword();
        const targetClass = classes.find(c => c.id === parseInt(sectionId, 10)) || activeClassroom;
        const isShs = targetClass?.grade_level >= 11;
        setFormData({
            ...initialFormState,
            school_class_id: sectionId || targetClass?.id || '',
            track: targetClass?.track || (isShs ? 'Academic Track' : 'Junior High School'),
            strand: targetClass?.strand || (isShs ? 'STEM' : 'JHS General'),
            custom_temp_password: tempPass
        });
        setFormError(null);
        setDuplicateCheck({ isChecking: false, hasChecked: false, exists: false, message: '', conflictField: null, existingStudent: null });
        setIsRegisterModalOpen(true);
    };

    // Helper to render the reusable Student Table
    const renderStudentsTable = (studentRows, emptyMessage, showClassroomColumn = true) => (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <th className="py-3.5 px-5">LRN / Learner ID</th>
                            <th className="py-3.5 px-5">Student Full Name &amp; Email</th>
                            {showClassroomColumn && <th className="py-3.5 px-5">Assigned Classroom</th>}
                            <th className="py-3.5 px-5">Data Classification</th>
                            <th className="py-3.5 px-5">Status</th>
                            <th className="py-3.5 px-5 text-right">Timetable &amp; Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {studentRows.length === 0 ? (
                            <tr>
                                <td colSpan={showClassroomColumn ? 6 : 5} className="py-14 px-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                        <Users size={24} />
                                    </div>
                                    <div className="text-base font-bold text-slate-800 mb-1">
                                        {emptyMessage.title}
                                    </div>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                                        {emptyMessage.subtitle}
                                    </p>
                                    {emptyMessage.actionButton}
                                </td>
                            </tr>
                        ) : (
                            studentRows.map((s) => {
                                const accStatus = s.user?.account_status || 'active';
                                const mustChange = s.user?.must_change_password;
                                const clsObj = s.school_class || activeClassroom;
                                const strandCode = s.strand || clsObj?.strand;
                                const trackName = s.track || clsObj?.track;
                                const badgeStyle = getStrandBadge(strandCode);
                                const isSHS = (clsObj?.grade_level >= 11) || (trackName && trackName !== 'Junior High School');

                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* 1. LRN */}
                                        <td className="py-3.5 px-5 whitespace-nowrap">
                                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-md">
                                                {s.lrn}
                                            </span>
                                        </td>

                                        {/* 2. Name & Email */}
                                        <td className="py-3.5 px-5">
                                            <div className="font-bold text-slate-900 text-[13.5px]">
                                                {s.name}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <Mail size={12} className="text-slate-400" />
                                                <span>{s.email}</span>
                                            </div>
                                        </td>

                                        {/* 3. Classroom (Optional) */}
                                        {showClassroomColumn && (
                                            <td className="py-3.5 px-5">
                                                <button
                                                    type="button"
                                                    onClick={() => clsObj?.id && navigateToClassroom(clsObj.id, 'students')}
                                                    className="text-left group cursor-pointer bg-transparent border-0 p-0"
                                                >
                                                    <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-xs flex items-center gap-1">
                                                        <span>{clsObj?.name || 'Unassigned'}</span>
                                                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        Grade {clsObj?.grade_level || 'N/A'} &bull; {clsObj?.room || 'Room TBA'}
                                                    </div>
                                                </button>
                                            </td>
                                        )}

                                        {/* 4. Data Classification */}
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    style={{
                                                        backgroundColor: badgeStyle.bg,
                                                        borderColor: badgeStyle.border,
                                                        color: badgeStyle.color,
                                                    }}
                                                    className="text-[11px] font-bold px-2 py-0.5 rounded-md border"
                                                >
                                                    {strandCode || (isSHS ? 'SHS' : 'JHS General')}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-600">
                                                    Grade {clsObj?.grade_level || '7'}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {trackName || (isSHS ? 'Senior High Track' : 'Junior High Curriculum')}
                                            </div>
                                        </td>

                                        {/* 5. Status */}
                                        <td className="py-3.5 px-5 whitespace-nowrap">
                                            {accStatus === 'active' && (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Enrolled
                                                    </span>
                                                    {mustChange && (
                                                        <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                                            Temp password active
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {accStatus === 'transferred' && <Badge variant="warning">Transferred</Badge>}
                                            {accStatus === 'dropped' && <Badge variant="secondary">Dropped</Badge>}
                                            {accStatus === 'suspended' && <Badge variant="danger">Suspended</Badge>}
                                        </td>

                                        {/* 6. Actions */}
                                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSchedulePreview(s)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer"
                                                    title="View & print student's inherited classroom timetable"
                                                >
                                                    <CalendarCheck size={13} />
                                                    <span>Timetable</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenTransfer(s)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                                    title="Transfer to another classroom"
                                                >
                                                    <ArrowRightLeft size={13} className="text-slate-500" />
                                                    <span>Transfer</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleResetPassword(s)}
                                                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                                                    title="Reset Student Password"
                                                >
                                                    <Key size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(s)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                                                    title="Edit Student Information"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto pb-10">
            {/* =====================================================================
                VIEW B: DEDICATED CLASSROOM PAGE (4-LEVEL VISUAL HIERARCHY)
               ===================================================================== */}
            {activeClassroom ? (
                <div className="space-y-6">
                    {/* LEVEL 1: BREADCRUMB & HERO COMMAND HEADER */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                        {/* Top Breadcrumb Navigation */}
                        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-5 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <button
                                    type="button"
                                    onClick={() => navigateToClassroom(null)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer border-0"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Back to All Classrooms</span>
                                </button>
                                <span className="text-slate-300">/</span>
                                <span>Grade {activeClassroom.grade_level}</span>
                                <span className="text-slate-300">/</span>
                                <span className="font-bold text-slate-800">{activeClassroom.name}</span>
                            </div>

                            {/* Quick Classroom Switcher Dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Jump to Classroom:</span>
                                <select
                                    value={activeClassroom.id}
                                    onChange={(e) => navigateToClassroom(parseInt(e.target.value, 10), classroomWorkspaceTab)}
                                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-600"
                                >
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.room || 'Room TBA'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Classroom Hero Banner */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                    <School size={28} />
                                </div>
                                <div>
                                    <div className="flex items-center flex-wrap gap-2.5">
                                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight m-0">
                                            {activeClassroom.name}
                                        </h1>
                                        {(() => {
                                            const sb = getStrandBadge(activeClassroom.strand);
                                            return (
                                                <span
                                                    style={{ backgroundColor: sb.bg, borderColor: sb.border, color: sb.color }}
                                                    className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                                                >
                                                    Grade {activeClassroom.grade_level} &bull; {sb.label}
                                                </span>
                                            );
                                        })()}
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Active Classroom
                                        </span>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-slate-600">
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <MapPin size={14} className="text-blue-600" />
                                            <span>Venue: <strong className="text-slate-900">{activeClassroom.room || 'Room TBA'}</strong></span>
                                        </span>
                                        <span className="text-slate-300">&bull;</span>
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <User size={14} className="text-blue-600" />
                                            <span>
                                                Class Adviser:{' '}
                                                <strong className={activeClassroom.adviser?.name ? 'text-slate-900' : 'text-amber-600'}>
                                                    {activeClassroom.adviser?.name || 'TBA (To Be Assigned)'}
                                                </strong>
                                            </span>
                                        </span>
                                        <span className="text-slate-300">&bull;</span>
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <Clock size={14} className="text-blue-600" />
                                            <span>{activeClassroom.shift || 'Whole Day Shift'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Command Action Buttons */}
                            <div className="flex items-center flex-wrap gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setClassroomWorkspaceTab('settings')}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                        classroomWorkspaceTab === 'settings'
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <Settings size={15} />
                                    <span>Classroom Settings</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    <Printer size={15} />
                                    <span>Print Classroom Data</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleEnrollToSection(activeClassroom.id)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                                >
                                    <Plus size={16} />
                                    <span>Enroll Student to Classroom</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LEVEL 2: 4-CARD CLASSROOM SNAPSHOT STRIP */}
                    {(() => {
                        const enrolledCount = activeClassroomStudents.length;
                        const maxCap = activeClassroom.max_capacity || 45;
                        const seatsLeft = Math.max(0, maxCap - enrolledCount);
                        const pct = Math.min(100, Math.round((enrolledCount / maxCap) * 100));

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Card 1: Enrollment & Capacity */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                                        <span>Enrolled Learners</span>
                                        <Users size={16} className="text-blue-600" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-extrabold text-slate-900">{enrolledCount}</span>
                                        <span className="text-xs font-semibold text-slate-400">/ {maxCap} capacity</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
                                        <div
                                            className={`h-full rounded-full transition-all ${
                                                seatsLeft === 0 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-2 font-medium">
                                        {seatsLeft > 0 ? `${seatsLeft} seats available for enrollment` : 'Classroom at full capacity'}
                                    </div>
                                </div>

                                {/* Card 2: Class Adviser Status */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                                        <span>Class Adviser</span>
                                        <UserCheck size={16} className="text-emerald-600" />
                                    </div>
                                    <div className="text-base font-extrabold text-slate-900 truncate">
                                        {activeClassroom.adviser?.name || 'TBA — Unassigned'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {activeClassroom.adviser?.specialization
                                            ? `Specialization: ${activeClassroom.adviser.specialization}`
                                            : 'Room active even while adviser is TBA'}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setClassroomWorkspaceTab('settings')}
                                        className="mt-2.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-transparent border-0 p-0 cursor-pointer"
                                    >
                                        {activeClassroom.adviser ? 'Change adviser →' : '+ Assign adviser in settings →'}
                                    </button>
                                </div>

                                {/* Card 3: Inherited Timetable Status */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                                        <span>Classroom Timetable</span>
                                        <CalendarCheck size={16} className="text-indigo-600" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-extrabold text-slate-900">
                                            {activeClassroomSchedules.length}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-400">scheduled sessions</span>
                                    </div>
                                    <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                                        <CheckCircle2 size={12} />
                                        <span>Auto-synced to enrolled students</span>
                                    </div>
                                </div>

                                {/* Card 4: Classification & Room */}
                                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                                        <span>Classification &amp; Room</span>
                                        <Building2 size={16} className="text-amber-600" />
                                    </div>
                                    <div className="text-base font-extrabold text-slate-900 truncate">
                                        {activeClassroom.room || 'Room TBA'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Grade {activeClassroom.grade_level} &bull; {activeClassroom.strand || 'JHS General'}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-1.5">
                                        {activeClassroom.track || (activeClassroom.grade_level >= 11 ? 'Senior High School' : 'Junior High School')}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* LEVEL 3: SEGMENTED WORKSPACE TABS */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-xs flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                {
                                    id: 'students',
                                    label: 'Enrolled Students',
                                    badge: activeClassroomStudents.length,
                                    icon: Users,
                                },
                                {
                                    id: 'timetable',
                                    label: 'Classroom Timetable',
                                    badge: activeClassroomSchedules.length,
                                    icon: CalendarCheck,
                                },
                                {
                                    id: 'settings',
                                    label: 'Classroom Settings',
                                    icon: SlidersHorizontal,
                                },
                            ].map(({ id, label, badge, icon: Icon }) => {
                                const isActive = classroomWorkspaceTab === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setClassroomWorkspaceTab(id)}
                                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                            isActive
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon size={15} />
                                        <span>{label}</span>
                                        {badge !== undefined && (
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {classroomWorkspaceTab === 'students' && (
                            <div className="relative min-w-[260px] flex-1 max-w-sm">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={`Search students in ${activeClassroom.name}...`}
                                    value={classroomSearch}
                                    onChange={(e) => setClassroomSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                />
                            </div>
                        )}
                    </div>

                    {/* LEVEL 4: FOCUSED WORKSPACE CANVAS */}
                    {classroomWorkspaceTab === 'students' && (
                        <div>
                            {renderStudentsTable(
                                activeClassroomStudents,
                                {
                                    title: `No Students Enrolled in ${activeClassroom.name} Yet`,
                                    subtitle: `This classroom is active and ready. Enroll students matching Grade ${activeClassroom.grade_level} (${activeClassroom.strand || 'General'}) so they automatically inherit this classroom's timetable on their Student Dashboard.`,
                                    actionButton: (
                                        <button
                                            type="button"
                                            onClick={() => handleEnrollToSection(activeClassroom.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                                        >
                                            <Plus size={15} />
                                            <span>Enroll First Student to {activeClassroom.name}</span>
                                        </button>
                                    ),
                                },
                                false
                            )}
                        </div>
                    )}

                    {classroomWorkspaceTab === 'timetable' && (
                        <DynamicKanbanTimetable
                            schedules={activeClassroomSchedules}
                            allSchoolSchedules={schedules}
                            classroom={activeClassroom}
                            classes={classes}
                            subjects={subjects}
                            teachers={teachers}
                            editable={true}
                            perspective="section"
                            title={`${activeClassroom.name} • Dynamic Kanban Timetable`}
                            subtitle={`Create or edit any class schedule for ${activeClassroom.name}. Cards automatically sort top-to-bottom from earliest to latest time, block overlapping time ranges, enforce the 9-classes/day teacher cap, and sync live to enrolled students and faculty.`}
                            onRefresh={async () => {
                                await fetchActiveClassroomDetail(activeClassroom.id);
                                await refreshClassesAndStudents();
                            }}
                        />
                    )}

                    {classroomWorkspaceTab === 'settings' && (
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
                            <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                                        Classroom Configuration &amp; Settings
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-0">
                                        Update this classroom&apos;s room venue, student capacity, classification, or assign a Class Adviser (can remain TBA).
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                                    Changes sync live to {activeClassroomStudents.length} enrolled learner(s)
                                </span>
                            </div>

                            <form onSubmit={handleSaveClassroomSettings} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Classroom Display Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={settingsForm.name}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                            placeholder="e.g. Grade 10 - Rizal"
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Section Identifier *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={settingsForm.section}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, section: e.target.value })}
                                            placeholder="e.g. Rizal"
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Grade Level *
                                        </label>
                                        <select
                                            value={settingsForm.grade_level}
                                            onChange={(e) => {
                                                const gl = parseInt(e.target.value, 10);
                                                const isShs = gl >= 11;
                                                setSettingsForm({
                                                    ...settingsForm,
                                                    grade_level: gl,
                                                    track: isShs ? 'Academic Track' : 'Junior High School',
                                                    strand: isShs ? 'STEM' : 'JHS General',
                                                });
                                            }}
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        >
                                            {[7, 8, 9, 10, 11, 12].map((g) => (
                                                <option key={g} value={g}>
                                                    Grade {g} ({g >= 11 ? 'Senior High School' : 'Junior High School'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Curriculum Track
                                        </label>
                                        <select
                                            value={settingsForm.track}
                                            onChange={(e) => {
                                                const tr = e.target.value;
                                                const firstSt = (STRANDS_BY_TRACK[tr] || STRANDS_BY_TRACK['Junior High School'])[0]?.code || 'JHS General';
                                                setSettingsForm({ ...settingsForm, track: tr, strand: firstSt });
                                            }}
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        >
                                            {ACADEMIC_TRACKS.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Classification / Strand
                                        </label>
                                        <select
                                            value={settingsForm.strand}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, strand: e.target.value })}
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        >
                                            {(STRANDS_BY_TRACK[settingsForm.track] || STRANDS_BY_TRACK['Junior High School']).map((s) => (
                                                <option key={s.code} value={s.code}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Class Adviser ({Number(settingsForm.grade_level) >= 11 ? 'SHS Faculty Only' : 'JHS Faculty Only'})
                                        </label>
                                        <select
                                            value={settingsForm.adviser_id}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, adviser_id: e.target.value })}
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="">TBA — To Be Assigned</option>
                                            {teachers
                                                .filter(
                                                    (t) =>
                                                        isTeacherAuthorizedForGrade(t, settingsForm.grade_level) &&
                                                        t.permissions?.is_adviser_eligible !== false
                                                )
                                                .map((t) => {
                                                    const advisingClass = classes.find(
                                                        (c) => Number(c.adviser_id) === Number(t.id) && Number(c.id) !== Number(activeClassroom?.id)
                                                    );
                                                    const isBusy = Boolean(advisingClass);

                                                    return (
                                                        <option key={t.id} value={t.id} disabled={isBusy}>
                                                            {t.name} ({t.specialization || 'Faculty'} • {t.department || 'Dept'})
                                                            {isBusy ? ` — [OCCUPIED] Adviser of ${advisingClass.name}` : ''}
                                                        </option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Physical Room / Building Location
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.room}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, room: e.target.value })}
                                            placeholder="e.g. Building A - Room 101"
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Maximum Student Capacity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            value={settingsForm.max_capacity}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, max_capacity: e.target.value })}
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                            Class Session Shift
                                        </label>
                                        <select
                                            value={settingsForm.shift}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, shift: e.target.value })}
                                            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="Whole Day Shift">Whole Day Shift</option>
                                            <option value="Morning Shift">Morning Shift</option>
                                            <option value="Afternoon Shift">Afternoon Shift</option>
                                            <option value="Custom Shift">Custom Shift</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDeleteClassroom}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete Classroom</span>
                                    </button>

                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setClassroomWorkspaceTab('students')}
                                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border-0"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingSettings}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                                        >
                                            <Check size={15} />
                                            <span>{savingSettings ? 'Saving Settings...' : 'Save Classroom Settings'}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            ) : (
                /* =====================================================================
                    VIEW A: CLASSROOMS & STUDENT ENROLLMENT DIRECTORY GRID
                   ===================================================================== */
                <div className="space-y-6">
                    {/* LEVEL 1: PAGE HEADER (Matching Screenshot 2) */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-600" />
                                <span>DepEd Section &amp; Timetable Directory</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                                Class Sections &amp; Timetables
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                                Manage enrolled learners, view weekly timetables and configure classroom venues.
                            </p>
                        </div>

                        <div className="flex items-center flex-wrap gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsCreateClassroomModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                            >
                                <span>+ Create Class Section</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleEnrollToSection(classes[0]?.id || '')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                            >
                                <Users size={15} />
                                <span>Enroll Student</span>
                            </button>
                        </div>
                    </div>

                    {/* LEVEL 2: 4 KPI METRIC CARDS (Matching Screenshot 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>Total enrolled students</span>
                                <GraduationCap size={17} className="text-blue-500 stroke-[1.8]" />
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.total_students}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1.5">Active learner accounts</div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>Academic classrooms</span>
                                <School size={17} className="text-emerald-500 stroke-[1.8]" />
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{classes.length}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1.5">Grades 7–12 active sections</div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>Senior high learners</span>
                                <Award size={17} className="text-purple-500 stroke-[1.8]" />
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.senior_high_students}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1.5">Academic &amp; TVL strands</div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>Available classroom seats</span>
                                <Users size={17} className="text-amber-500 stroke-[1.8]" />
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalAvailableSeats}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1.5">Open slots across {classes.length} room{classes.length === 1 ? '' : 's'}</div>
                        </div>
                    </div>

                    {/* LEVEL 3: VIEW SWITCHER & FILTER BAR (Matching Screenshot 2) */}
                    <div className="flex flex-col gap-3">
                        {/* Tabs Row */}
                        <div className="flex items-center justify-between">
                            <div className="inline-flex bg-slate-100/80 p-1 rounded-xl gap-1">
                                <button
                                    type="button"
                                    onClick={() => setDirectoryMode('classrooms')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                                        directoryMode === 'classrooms'
                                            ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                    }`}
                                >
                                    Academic Classrooms ({classes.length})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDirectoryMode('all-students')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                                        directoryMode === 'all-students'
                                            ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                    }`}
                                >
                                    Master Student Directory ({stats.total_students})
                                </button>
                            </div>

                            <div className="text-xs font-medium text-slate-400 hidden sm:block">
                                {classes.length} active classroom{classes.length === 1 ? '' : 's'}
                            </div>
                        </div>

                        {/* Filter Pills + Search Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {directoryMode === 'classrooms' ? (
                                <div className="inline-flex bg-slate-100/80 p-1 rounded-xl gap-1">
                                    {[
                                        { key: 'all', label: 'All Levels' },
                                        { key: 'jhs', label: 'Junior High (7–10)' },
                                        { key: 'shs', label: 'Senior High (11–12)' },
                                    ].map((g) => (
                                        <button
                                            key={g.key}
                                            type="button"
                                            onClick={() => setGradeGroupFilter(g.key)}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                                                gradeGroupFilter === g.key
                                                    ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                            }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            ) : <div />}

                            <div className="relative min-w-[280px]">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={directoryMode === 'classrooms' ? 'Search classroom, room or strand' : 'Search student name, LRN, email...'}
                                    value={directoryMode === 'classrooms' ? classroomGridSearch : search}
                                    onChange={(e) => directoryMode === 'classrooms' ? setClassroomGridSearch(e.target.value) : setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200/90 rounded-xl outline-none focus:border-blue-600 shadow-2xs placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* LEVEL 4: FULL-WIDTH RESPONSIVE 3-COLUMN CLASSROOM DIRECTORY GRID */}
                    {directoryMode === 'classrooms' ? (
                        filteredClassrooms.length > 0 ? (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {paginatedClassrooms.map((c) => {
                                        const enrolled = c.students_count ?? (c.students ? c.students.length : 0);
                                        const maxCap = c.max_capacity || 70;
                                        const isFull = enrolled >= maxCap;
                                        const pct = Math.min(100, Math.round((enrolled / maxCap) * 100));

                                        return (
                                            <div
                                                key={c.id}
                                                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 transition-all duration-200 p-6 shadow-xs hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col justify-between"
                                            >
                                                <div>
                                                    {/* Card Header: Icon + Title + Enrolled Badge */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3.5">
                                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
                                                                <School size={22} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-black text-slate-900 tracking-tight m-0">
                                                                    {c.name}
                                                                </h3>
                                                                <p className="text-xs font-semibold text-slate-400 mt-1 mb-0">
                                                                    Grade {c.grade_level} &bull; {c.grade_level >= 11 ? (c.strand || 'Senior High') : 'JHS General'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 border ${
                                                            isFull 
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                                        }`}>
                                                            {enrolled} / {maxCap} enrolled
                                                        </span>
                                                    </div>

                                                    {/* Capacity Progress Bar */}
                                                    <div className="my-5">
                                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                                                            <span>Classroom capacity</span>
                                                            <span className="font-black text-slate-900">
                                                                {Math.max(0, maxCap - enrolled)} seats available
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-300 ${
                                                                    isFull ? 'bg-rose-500' : 'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-medium mt-1.5">
                                                            {enrolled} enrolled learner out of {maxCap} available seats
                                                        </div>
                                                    </div>

                                                    {/* Room & Adviser Details */}
                                                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
                                                        <div>
                                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                                ROOM / VENUE
                                                            </div>
                                                            <div className="text-sm font-black mt-1">
                                                                {c.room ? (
                                                                    <span className="text-slate-900">{c.room}</span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium italic">Room TBA</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                                CLASS ADVISER
                                                            </div>
                                                            <div className="text-sm font-black mt-1">
                                                                {c.adviser?.name ? (
                                                                    <span className="text-slate-900">{c.adviser.name}</span>
                                                                ) : (
                                                                    <span className="text-amber-600 font-bold">TBA (Unassigned)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Footer Actions */}
                                                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2.5 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigateToClassroom(c.id, 'students')}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer border-0"
                                                    >
                                                        <span>Open Classroom ({enrolled})</span>
                                                        <ChevronRight size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => navigateToClassroom(c.id, 'settings')}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                                                    >
                                                        <Settings size={14} className="text-slate-500" />
                                                        <span>Configure</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isFull}
                                                        onClick={() => handleEnrollToSection(c.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Plus size={14} className="text-blue-600" />
                                                        <span>Enroll</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination Controls (Auto-hidden if total <= 9) */}
                                {filteredClassrooms.length > CLASSROOM_PAGE_SIZE && (
                                    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="text-xs font-semibold text-slate-500">
                                            Showing <strong className="text-slate-900 font-extrabold">{(classroomPage - 1) * CLASSROOM_PAGE_SIZE + 1}</strong> to{' '}
                                            <strong className="text-slate-900 font-extrabold">{Math.min(filteredClassrooms.length, classroomPage * CLASSROOM_PAGE_SIZE)}</strong> of{' '}
                                            <strong className="text-slate-900 font-extrabold">{filteredClassrooms.length}</strong> academic classrooms
                                        </div>

                                        <div className="flex items-center gap-1.5 self-center sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => setClassroomPage(p => Math.max(1, p - 1))}
                                                disabled={classroomPage <= 1}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                                            >
                                                <ChevronLeft size={14} />
                                                <span>Previous</span>
                                            </button>

                                            <div className="flex items-center gap-1 px-1">
                                                {Array.from({ length: Math.ceil(filteredClassrooms.length / CLASSROOM_PAGE_SIZE) }, (_, i) => i + 1).map((pageNum) => (
                                                    <button
                                                        key={pageNum}
                                                        type="button"
                                                        onClick={() => setClassroomPage(pageNum)}
                                                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                                                            classroomPage === pageNum
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
                                                onClick={() => setClassroomPage(p => Math.min(Math.ceil(filteredClassrooms.length / CLASSROOM_PAGE_SIZE), p + 1))}
                                                disabled={classroomPage >= Math.ceil(filteredClassrooms.length / CLASSROOM_PAGE_SIZE)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                                            >
                                                <span>Next</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
                                <School size={36} className="mx-auto text-slate-300 mb-3" />
                                <h3 className="text-base font-extrabold text-slate-900 m-0">No Classroom Sections Found</h3>
                                <p className="text-xs text-slate-400 mt-1 mb-5">
                                    No classrooms match the selected grade filter or search query.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleOpenCreateClassModal(7)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                                >
                                    <Plus size={15} />
                                    <span>Create New Classroom Section</span>
                                </button>
                            </div>
                        )
                    ) : (
                        renderStudentsTable(
                            students,
                            {
                                title: 'No Student Records Found',
                                subtitle: 'No matching students found for the current search or filter criteria.',
                                actionButton: null,
                            },
                            true
                        )
                    )}
                </div>
            )}

            {/* =========================================================
                CREATE NEW CLASSROOM MODAL (SUPPORTS TBA ADVISER)
               ========================================================= */}
            {isCreateClassroomModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <School size={20} className="text-blue-400" />
                                <div>
                                    <h3 className="text-base font-extrabold m-0 text-white">Create New Classroom</h3>
                                    <div className="text-[11px] text-slate-400">
                                        Adviser can remain TBA so you can immediately schedule subjects &amp; enroll students
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateClassroomModalOpen(false)}
                                className="text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateClassroomSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Classroom Display Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Grade 11 - STEM (Banzon)"
                                        value={newClassroomForm.name}
                                        onChange={(e) => setNewClassroomForm({ ...newClassroomForm, name: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Section Identifier *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Banzon"
                                        value={newClassroomForm.section}
                                        onChange={(e) => setNewClassroomForm({ ...newClassroomForm, section: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Grade Level *
                                    </label>
                                    <select
                                        value={newClassroomForm.grade_level}
                                        onChange={(e) => {
                                            const gl = parseInt(e.target.value, 10);
                                            const isShs = gl >= 11;
                                            setNewClassroomForm({
                                                ...newClassroomForm,
                                                grade_level: gl,
                                                track: isShs ? 'Academic Track' : 'Junior High School',
                                                strand: isShs ? 'STEM' : 'JHS General',
                                            });
                                        }}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    >
                                        {[7, 8, 9, 10, 11, 12].map((g) => (
                                            <option key={g} value={g}>Grade {g}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Classification / Strand *
                                    </label>
                                    <select
                                        value={newClassroomForm.strand}
                                        onChange={(e) => setNewClassroomForm({ ...newClassroomForm, strand: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    >
                                        {(STRANDS_BY_TRACK[newClassroomForm.track] || STRANDS_BY_TRACK['Junior High School']).map((s) => (
                                            <option key={s.code} value={s.code}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Physical Room / Building
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Building B - Room 204"
                                        value={newClassroomForm.room}
                                        onChange={(e) => setNewClassroomForm({ ...newClassroomForm, room: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Class Adviser ({Number(newClassroomForm.grade_level) >= 11 ? 'SHS Faculty' : 'JHS Faculty'} / TBA)
                                    </label>
                                    <select
                                        value={newClassroomForm.adviser_id}
                                        onChange={(e) => setNewClassroomForm({ ...newClassroomForm, adviser_id: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                                    >
                                        <option value="">TBA — To Be Assigned</option>
                                        {teachers
                                            .filter(
                                                (t) =>
                                                    isTeacherAuthorizedForGrade(t, newClassroomForm.grade_level) &&
                                                    t.permissions?.is_adviser_eligible !== false
                                            )
                                            .map((t) => {
                                                const advisingClass = classes.find(
                                                    (c) => Number(c.adviser_id) === Number(t.id)
                                                );
                                                const isBusy = Boolean(advisingClass);

                                                return (
                                                    <option key={t.id} value={t.id} disabled={isBusy}>
                                                        {t.name} ({t.specialization || 'Faculty'})
                                                        {isBusy ? ` — [OCCUPIED] Adviser of ${advisingClass.name}` : ''}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateClassroomModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingClassroom}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
                                >
                                    {creatingClassroom ? 'Creating Classroom...' : 'Create Classroom'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =========================================================
                ENROLL STUDENT MODAL (AUTOMATIC TIMETABLE INHERITANCE)
               ========================================================= */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
                    <div className="w-full max-w-[600px] max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <GraduationCap size={22} />
                                <div>
                                    <h3 className="m-0 text-base font-extrabold text-white">
                                        Enroll Student to Classroom
                                    </h3>
                                    <div className="text-xs text-blue-100">
                                        Student automatically inherits their assigned classroom&apos;s timetable on their dashboard
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRegisterModalOpen(false)}
                                className="bg-transparent border-0 text-white cursor-pointer p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {formError && (
                                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs mb-4 flex items-start gap-2">
                                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {duplicateCheck.hasChecked && (
                                <div
                                    className={`p-3.5 rounded-xl mb-4 flex items-start gap-2.5 text-xs border ${
                                        duplicateCheck.exists
                                            ? 'bg-red-50 border-red-200 text-red-800'
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    }`}
                                >
                                    {duplicateCheck.exists ? (
                                        <>
                                            <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
                                            <div>
                                                <strong>Duplicate Record Detected!</strong>
                                                <p className="m-0 mt-0.5">{duplicateCheck.message}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <strong>Verified Unique Learner</strong>
                                                <p className="m-0 mt-0.5">LRN and email are unique and ready for classroom enrollment.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <form id="registerForm" onSubmit={handleRegisterSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Learner Reference Number (LRN) *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. 109283746506"
                                            value={formData.lrn}
                                            onChange={(e) => setFormData({ ...formData, lrn: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Full Student Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. Juan Dela Cruz"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Student Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="e.g. j.delacruz@anhs.edu.ph"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Assigned Classroom *
                                        </label>
                                        <select
                                            className="form-input"
                                            value={formData.school_class_id}
                                            onChange={(e) => handleClassChange(e.target.value)}
                                            required
                                        >
                                            {classes.map((c) => {
                                                const enrolled = c.students_count ?? (c.students ? c.students.length : 0);
                                                const maxCap = c.max_capacity || 45;
                                                const isFull = enrolled >= maxCap;
                                                return (
                                                    <option key={c.id} value={c.id} disabled={isFull}>
                                                        {c.name} ({enrolled}/{maxCap}) {isFull ? '— FULL' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Award size={15} className="text-blue-600" />
                                        <span>Student Data Classification (Grade / Track / Strand)</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                Curriculum Track
                                            </label>
                                            <select
                                                className="form-input"
                                                value={formData.track}
                                                onChange={(e) => handleTrackChange(e.target.value)}
                                                required
                                            >
                                                {ACADEMIC_TRACKS.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                Strand / Classification
                                            </label>
                                            <select
                                                className="form-input"
                                                value={formData.strand}
                                                onChange={(e) => setFormData({ ...formData, strand: e.target.value })}
                                                required
                                            >
                                                {(STRANDS_BY_TRACK[formData.track] || STRANDS_BY_TRACK['Academic Track']).map((s) => (
                                                    <option key={s.code} value={s.code}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Initial Temporary Password
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="form-input font-mono font-bold text-blue-700"
                                            value={formData.custom_temp_password}
                                            onChange={(e) => setFormData({ ...formData, custom_temp_password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, custom_temp_password: generateInitialPassword() })}
                                            className="btn btn-secondary btn-sm whitespace-nowrap"
                                        >
                                            <RefreshCw size={13} /> Re-roll
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsRegisterModalOpen(false)}
                                className="btn btn-secondary"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="registerForm"
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
                                disabled={isSubmitting || duplicateCheck.exists}
                            >
                                {isSubmitting ? 'Enrolling Student...' : 'Confirm Enrollment & Sync Timetable'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                CREDENTIALS ISSUED MODAL (WITH 1-CLICK COPY)
               ========================================================= */}
            {credentialsModal.isOpen && credentialsModal.data && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[9995] flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center gap-3">
                            <ShieldCheck size={24} />
                            <div>
                                <h3 className="m-0 text-base font-extrabold text-white">Student Enrolled &amp; Synced!</h3>
                                <div className="text-xs text-emerald-100">
                                    Classroom timetable is now live on the student&apos;s dashboard
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Student Name:</span>
                                    <strong className="text-slate-900">{credentialsModal.data.name}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">LRN:</span>
                                    <span className="font-mono font-bold text-blue-700">{credentialsModal.data.lrn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Assigned Classroom:</span>
                                    <strong className="text-slate-900">{credentialsModal.data.class_name}</strong>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Login Email:</span>
                                    <strong className="text-slate-900">{credentialsModal.data.email}</strong>
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-slate-500">Temporary Password:</span>
                                    <span className="font-mono text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                                        {credentialsModal.data.temporary_password}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleCopyCredentials}
                                className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 border-0 cursor-pointer"
                            >
                                {credentialsModal.copied ? <Check size={16} /> : <Copy size={16} />}
                                <span>{credentialsModal.copied ? 'Copied to Clipboard!' : 'Copy Credentials for Student'}</span>
                            </button>

                            <button
                                onClick={() => setCredentialsModal({ isOpen: false, data: null, copied: false })}
                                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border-0 cursor-pointer"
                            >
                                Done &amp; Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                TRANSFER CLASSROOM MODAL
               ========================================================= */}
            {transferModal.isOpen && transferModal.student && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft size={18} />
                                <h3 className="m-0 text-base font-extrabold text-white">Transfer Student Classroom</h3>
                            </div>
                            <button
                                onClick={() => setTransferModal({ isOpen: false, student: null, newClassId: '' })}
                                className="bg-transparent border-0 text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="text-xs font-bold text-blue-900">{transferModal.student.name}</div>
                                <div className="text-[11px] text-blue-700 mt-0.5">
                                    LRN: {transferModal.student.lrn}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Select Destination Classroom (Timetable Auto-Syncs)
                                </label>
                                <select
                                    className="form-input w-full"
                                    value={transferModal.newClassId}
                                    onChange={(e) => setTransferModal((prev) => ({ ...prev, newClassId: e.target.value }))}
                                >
                                    {classes.map((c) => {
                                        const enrolled = c.students_count ?? (c.students ? c.students.length : 0);
                                        const maxCap = c.max_capacity || 45;
                                        const isFull = enrolled >= maxCap;
                                        return (
                                            <option key={c.id} value={c.id} disabled={isFull}>
                                                {c.name} ({c.room || 'Room TBA'}) — {enrolled}/{maxCap}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTransferModal({ isOpen: false, student: null, newClassId: '' })}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmTransfer}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
                                >
                                    Confirm Classroom Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                STUDENT INHERITED TIMETABLE PREVIEW MODAL (WITH PRINT)
               ========================================================= */}
            {schedulePreviewModal.isOpen && schedulePreviewModal.student && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <CalendarCheck size={20} className="text-emerald-400" />
                                <div>
                                    <h3 className="m-0 text-base font-extrabold text-white">
                                        {schedulePreviewModal.student.name}&apos;s Classroom Timetable
                                    </h3>
                                    <span className="text-xs text-slate-300">
                                        Inherited from {schedulePreviewModal.classInfo?.name || 'Assigned Classroom'} &bull; {schedulePreviewModal.classInfo?.room || 'Room TBA'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSchedulePreviewModal({ isOpen: false, student: null, classInfo: null, schedules: [], loading: false })}
                                className="bg-transparent border-0 text-white cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {schedulePreviewModal.loading ? (
                                <div className="text-center py-12">
                                    <div className="spinner mx-auto mb-3"></div>
                                    <div className="text-xs text-slate-500">Fetching inherited classroom timetable...</div>
                                </div>
                            ) : schedulePreviewModal.schedules.length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock size={36} className="mx-auto text-slate-300 mb-2" />
                                    <div className="font-bold text-slate-800 text-sm">No Subjects Plotted Yet</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        Once subjects are scheduled for this classroom, the student will see them automatically.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                                        const dayClasses = schedulePreviewModal.schedules
                                            .filter((s) => s.day_of_week === day)
                                            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

                                        if (dayClasses.length === 0) return null;

                                        return (
                                            <div key={day} className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 font-extrabold text-xs text-slate-800 flex justify-between">
                                                    <span>{day}</span>
                                                    <span className="text-slate-500">{dayClasses.length} session(s)</span>
                                                </div>
                                                <div className="p-3 space-y-2">
                                                    {dayClasses.map((item, idx) => (
                                                        <div key={item.id} className="flex justify-between items-center p-2.5 bg-slate-50/70 rounded-lg border-l-4 border-blue-600">
                                                            <div>
                                                                <span className="font-bold text-xs text-slate-900">
                                                                    #{idx + 1} &bull; {item.subject?.name || item.subject?.code}
                                                                </span>
                                                                <div className="text-[11px] text-slate-500 flex gap-3 mt-0.5">
                                                                    <span>Teacher: <strong className={item.teacher?.name ? 'text-slate-700' : 'text-amber-600'}>{item.teacher?.name || 'TBA'}</strong></span>
                                                                    <span>Room: <strong>{item.room || schedulePreviewModal.classInfo?.room || 'TBA'}</strong></span>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                                                                {formatTime12h(item.start_time)} – {formatTime12h(item.end_time)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
                            >
                                <Printer size={14} />
                                <span>Print Student Schedule</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSchedulePreviewModal({ isOpen: false, student: null, classInfo: null, schedules: [], loading: false })}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
                EDIT STUDENT INFORMATION MODAL
               ========================================================= */}
            {editModal.isOpen && editModal.student && (
                <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-[9990] flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Edit3 size={18} className="text-blue-400" />
                                <h3 className="m-0 text-base font-extrabold text-white">Edit Student Details</h3>
                            </div>
                            <button
                                onClick={() => setEditModal({ isOpen: false, student: null, name: '', lrn: '', email: '', strand: '', account_status: 'active' })}
                                className="bg-transparent border-0 text-white cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editModal.name}
                                    onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Learner Reference Number (LRN)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editModal.lrn}
                                    onChange={(e) => setEditModal((prev) => ({ ...prev, lrn: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Login Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={editModal.email}
                                    onChange={(e) => setEditModal((prev) => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Enrollment Status</label>
                                <select
                                    className="form-input"
                                    value={editModal.account_status}
                                    onChange={(e) => setEditModal((prev) => ({ ...prev, account_status: e.target.value }))}
                                >
                                    <option value="active">Enrolled (Active)</option>
                                    <option value="transferred">Transferred Out</option>
                                    <option value="dropped">Dropped / Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditModal({ isOpen: false, student: null, name: '', lrn: '', email: '', strand: '', account_status: 'active' })}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
