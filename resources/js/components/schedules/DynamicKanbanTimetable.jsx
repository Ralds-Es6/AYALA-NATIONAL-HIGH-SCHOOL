import React, { useState, useMemo, useEffect } from 'react';
import {
    Clock,
    Plus,
    Edit3,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Printer,
    ShieldCheck,
    ArrowUpDown,
    X,
    Building2,
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import { notify } from '../notifications/notify';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MAX_DAILY_CLASSES_DEFAULT = 9;

/**
 * Convert "HH:MM" or "HH:MM:SS" to total minutes from 00:00 (0 - 1439)
 */
export function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim().slice(0, 5);
    const [h, m] = clean.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Convert total minutes to "HH:MM" (24-hour format for inputs & API)
 */
export function minutesTo24h(totalMins) {
    const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMins));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format "HH:MM" or "HH:MM:SS" to crisp 12-hour "07:30 AM" / "06:00 PM"
 */
export function formatTime12h(timeStr) {
    if (!timeStr) return '—';
    const clean = String(timeStr).trim().slice(0, 5);
    const [hStr, mStr] = clean.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Format duration in minutes to readable label ("1 hr", "1h 30m", "45m")
 */
function formatDuration(startStr, endStr) {
    const diff = timeToMinutes(endStr) - timeToMinutes(startStr);
    if (diff <= 0) return '';
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
    return `${mins}m`;
}

/**
 * Helper: Check if a teacher is authorized for a given grade level (JHS: 7-10, SHS: 11-12)
 */
export function isTeacherAuthorizedForGrade(teacher, gradeLevel) {
    if (!teacher || !gradeLevel) return true;
    // Strict DepEd Modular Constraint: Teacher teaches strictly in their designated grade level for the school year (Grades 7 to 12)
    if (teacher.assigned_grade_level) {
        return Number(teacher.assigned_grade_level) === Number(gradeLevel);
    }
    const targetDept = Number(gradeLevel) >= 11 ? 'SHS' : 'JHS';
    const depts = Array.isArray(teacher.normalized_departments) && teacher.normalized_departments.length > 0
        ? teacher.normalized_departments
        : Array.isArray(teacher.departments) && teacher.departments.length > 0
        ? teacher.departments
        : [teacher.department || (Number(teacher.assigned_grade_level || 7) >= 11 ? 'SHS' : 'JHS')];

    return depts.map(d => String(d).toUpperCase()).includes(targetDept);
}

/**
 * Helper: Check if a teacher is qualified for a specific subject ID
 */
export function isTeacherQualifiedForSubject(teacher, subjectId) {
    if (!teacher || !subjectId) return true;
    const qIds = Array.isArray(teacher.qualified_subject_ids)
        ? teacher.qualified_subject_ids.map(Number)
        : [];
    if (qIds.length === 0) return true; // If no explicit restriction set yet, rely on department isolation
    return qIds.includes(Number(subjectId));
}

const QUICK_TIME_PRESETS = [
    { label: '7:30 – 8:30 AM', start: '07:30', end: '08:30' },
    { label: '8:30 – 9:30 AM', start: '08:30', end: '09:30' },
    { label: '9:45 – 10:45 AM', start: '09:45', end: '10:45' },
    { label: '10:45 – 11:45 AM', start: '10:45', end: '11:45' },
    { label: '1:00 – 2:00 PM', start: '13:00', end: '14:00' },
    { label: '2:00 – 3:00 PM', start: '14:00', end: '15:00' },
    { label: '3:00 – 4:00 PM', start: '15:00', end: '16:00' },
    { label: '6:00 – 7:00 PM', start: '18:00', end: '19:00' },
];

export default function DynamicKanbanTimetable({
    schedules = [],
    classroom = null,
    teacher = null, // Passed when Admin is building a timetable directly for a specific Teacher
    classes = [],
    subjects = [],
    teachers = [],
    allSchoolSchedules = [],
    editable = false,
    perspective = 'section', // 'section' | 'teacher' | 'student'
    title = 'Classroom Timetable',
    subtitle = '',
    onRefresh,
}) {
    const [localSchedules, setLocalSchedules] = useState(schedules);
    const [availableSubjects, setAvailableSubjects] = useState(subjects);
    const [availableTeachers, setAvailableTeachers] = useState(teachers);
    const [availableClasses, setAvailableClasses] = useState(classes);
    const [allSchedulesPool, setAllSchedulesPool] = useState(allSchoolSchedules);

    const isTeacherCentric = perspective === 'teacher' && Boolean(teacher?.id);
    const maxDailyClasses = Number(teacher?.max_classes_per_day || MAX_DAILY_CLASSES_DEFAULT);

    // Sync props when parent updates
    useEffect(() => {
        setLocalSchedules(schedules);
    }, [schedules]);

    // Lazy-fetch subjects, teachers, classes, and school-wide schedules when editable
    useEffect(() => {
        if (!editable) return;
        let mounted = true;

        const loadResources = async () => {
            try {
                const promises = [];
                if (!subjects || subjects.length === 0) {
                    promises.push(srnhsApi.getSubjects().then(res => mounted && setAvailableSubjects(res || [])));
                } else {
                    setAvailableSubjects(subjects);
                }
                if (!teachers || teachers.length === 0) {
                    promises.push(srnhsApi.getTeachers().then(res => mounted && setAvailableTeachers(res || [])));
                } else {
                    setAvailableTeachers(teachers);
                }
                if (!classes || classes.length === 0) {
                    promises.push(srnhsApi.getClasses().then(res => mounted && setAvailableClasses(res || [])));
                } else {
                    setAvailableClasses(classes);
                }
                if (!allSchoolSchedules || allSchoolSchedules.length === 0) {
                    promises.push(srnhsApi.getSchedules().then(res => mounted && setAllSchedulesPool(res || [])));
                } else {
                    setAllSchedulesPool(allSchoolSchedules);
                }
                await Promise.all(promises);
            } catch (err) {
                console.error('Error loading scheduling resources:', err);
            }
        };

        loadResources();
        return () => {
            mounted = false;
        };
    }, [editable, subjects, teachers, classes, allSchoolSchedules]);

    // Group & dynamically sort schedules per day strictly from earliest to latest start_time
    const schedulesByDay = useMemo(() => {
        const grouped = {};
        DAYS_OF_WEEK.forEach(d => {
            grouped[d] = [];
        });

        (localSchedules || []).forEach(item => {
            const d = item.day_of_week;
            if (grouped[d]) {
                grouped[d].push(item);
            }
        });

        DAYS_OF_WEEK.forEach(d => {
            grouped[d].sort((a, b) => {
                const diff = timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
                if (diff !== 0) return diff;
                return timeToMinutes(a.end_time) - timeToMinutes(b.end_time);
            });
        });

        return grouped;
    }, [localSchedules]);

    // Modal state for Create / Edit
    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: 'create', // 'create' | 'edit'
        editingId: null,
        selectedDays: ['Monday'],
        startTime: '07:30',
        endTime: '08:30',
        schoolClassId: classroom?.id ? String(classroom.id) : '',
        subjectId: '',
        teacherId: teacher?.id ? String(teacher.id) : '',
        room: classroom?.room || '',
        sessionType: 'lecture',
        submitting: false,
        serverError: null,
    });

    // Determine active classroom context inside the modal
    const modalActiveClassroom = useMemo(() => {
        if (classroom?.id) return classroom;
        if (modalState.schoolClassId) {
            return availableClasses.find(c => Number(c.id) === Number(modalState.schoolClassId)) || null;
        }
        return null;
    }, [classroom, modalState.schoolClassId, availableClasses]);

    // ─── STRICT RBAC ISOLATION FOR SUBJECTS ───────────────────────────────────
    const isolatedSubjects = useMemo(() => {
        // 1. If in Teacher-Centric mode, only show subjects the teacher is qualified/authorized for
        if (isTeacherCentric && teacher) {
            const teacherDepts = Array.isArray(teacher.normalized_departments) && teacher.normalized_departments.length > 0
                ? teacher.normalized_departments
                : [teacher.department || 'JHS'];
            const qIds = Array.isArray(teacher.qualified_subject_ids)
                ? teacher.qualified_subject_ids.map(Number)
                : [];

            return availableSubjects.filter(sub => {
                const subDept = Number(sub.grade_level) >= 11 ? 'SHS' : 'JHS';
                if (!teacherDepts.includes(subDept)) return false;
                if (qIds.length > 0 && !qIds.includes(Number(sub.id))) return false;
                if (modalActiveClassroom?.grade_level && Number(sub.grade_level) !== Number(modalActiveClassroom.grade_level)) {
                    return false;
                }
                return true;
            });
        }

        // 2. If in Classroom-Centric mode, STRICTLY show ONLY subjects matching the classroom's exact grade_level (and strand for SHS)
        if (modalActiveClassroom?.grade_level) {
            const targetGrade = Number(modalActiveClassroom.grade_level);
            const targetStrand = modalActiveClassroom.strand;

            return availableSubjects.filter(sub => {
                if (Number(sub.grade_level) !== targetGrade) return false;
                // For SHS (Grade 11 & 12), match core subjects (strand == null) OR the classroom's specific strand
                if (targetGrade >= 11 && sub.strand && targetStrand && sub.strand !== targetStrand) {
                    return false;
                }
                return true;
            });
        }

        return availableSubjects;
    }, [availableSubjects, isTeacherCentric, teacher, modalActiveClassroom]);

    // ─── STRICT RBAC ISOLATION FOR CLASSROOMS (When scheduling from Teacher View) ─
    const isolatedClasses = useMemo(() => {
        if (!isTeacherCentric || !teacher) return availableClasses;

        const selectedSub = availableSubjects.find(s => Number(s.id) === Number(modalState.subjectId));
        return availableClasses.filter(cls => {
            if (!isTeacherAuthorizedForGrade(teacher, cls.grade_level)) return false;
            if (selectedSub && Number(cls.grade_level) !== Number(selectedSub.grade_level)) return false;
            if (selectedSub?.strand && cls.strand && selectedSub.strand !== cls.strand) return false;
            return true;
        });
    }, [availableClasses, isTeacherCentric, teacher, modalState.subjectId, availableSubjects]);

    // ─── STRICT RBAC ISOLATION FOR TEACHERS (When scheduling from Classroom View) ─
    const isolatedTeachers = useMemo(() => {
        if (isTeacherCentric && teacher) return [teacher];

        const targetGrade = modalActiveClassroom?.grade_level;
        const targetSubjectId = modalState.subjectId;

        return availableTeachers.filter(t => {
            if (targetGrade && !isTeacherAuthorizedForGrade(t, targetGrade)) return false;
            if (targetSubjectId && !isTeacherQualifiedForSubject(t, targetSubjectId)) return false;
            return true;
        });
    }, [availableTeachers, isTeacherCentric, teacher, modalActiveClassroom, modalState.subjectId]);

    // Compute smart next available 1-hour slot on a given day
    const getSuggestedSlotForDay = (day) => {
        const dayItems = schedulesByDay[day] || [];
        if (dayItems.length === 0) {
            return { start: '07:30', end: '08:30' };
        }
        const lastItem = dayItems[dayItems.length - 1];
        const lastEndMins = timeToMinutes(lastItem.end_time);
        if (lastEndMins + 60 <= 21 * 60) {
            return {
                start: minutesTo24h(lastEndMins),
                end: minutesTo24h(lastEndMins + 60),
            };
        }
        return { start: '07:30', end: '08:30' };
    };

    const handleOpenCreateModal = (defaultDay = 'Monday') => {
        const suggested = getSuggestedSlotForDay(defaultDay);

        // Pick first valid subject
        let defaultSubjectId = '';
        let defaultClassId = classroom?.id ? String(classroom.id) : '';
        let defaultRoom = classroom?.room || 'Room 101';

        if (isTeacherCentric && teacher) {
            const teacherSubs = availableSubjects.filter(s => isTeacherQualifiedForSubject(teacher, s.id) && isTeacherAuthorizedForGrade(teacher, s.grade_level));
            const firstSub = teacherSubs[0] || availableSubjects[0];
            defaultSubjectId = firstSub ? String(firstSub.id) : '';

            const matchingClasses = availableClasses.filter(c =>
                firstSub ? Number(c.grade_level) === Number(firstSub.grade_level) : isTeacherAuthorizedForGrade(teacher, c.grade_level)
            );
            const firstClass = matchingClasses[0] || availableClasses[0];
            defaultClassId = firstClass ? String(firstClass.id) : '';
            defaultRoom = firstClass?.room || 'Room 101';
        } else if (classroom) {
            const gradeSubs = availableSubjects.filter(s => Number(s.grade_level) === Number(classroom.grade_level));
            const firstSub = gradeSubs[0];
            defaultSubjectId = firstSub ? String(firstSub.id) : '';
        }

        // Pick first valid teacher for that grade & subject
        const validTeachers = availableTeachers.filter(t => {
            if (classroom?.grade_level && !isTeacherAuthorizedForGrade(t, classroom.grade_level)) return false;
            if (defaultSubjectId && !isTeacherQualifiedForSubject(t, defaultSubjectId)) return false;
            return true;
        });

        const defaultTeacherId = isTeacherCentric && teacher
            ? String(teacher.id)
            : validTeachers[0]?.id
            ? String(validTeachers[0].id)
            : '';

        setModalState({
            isOpen: true,
            mode: 'create',
            editingId: null,
            selectedDays: [defaultDay],
            startTime: suggested.start,
            endTime: suggested.end,
            schoolClassId: defaultClassId,
            subjectId: defaultSubjectId,
            teacherId: defaultTeacherId,
            room: defaultRoom,
            sessionType: 'lecture',
            submitting: false,
            serverError: null,
        });
    };

    const handleOpenEditModal = (slot) => {
        setModalState({
            isOpen: true,
            mode: 'edit',
            editingId: slot.id,
            selectedDays: [slot.day_of_week],
            startTime: String(slot.start_time || '07:30').slice(0, 5),
            endTime: String(slot.end_time || '08:30').slice(0, 5),
            schoolClassId: String(slot.school_class_id || slot.school_class?.id || slot.schoolClass?.id || classroom?.id || ''),
            subjectId: String(slot.subject_id || slot.subject?.id || ''),
            teacherId: String(slot.teacher_id || slot.teacher?.id || teacher?.id || ''),
            room: slot.room || classroom?.room || 'Room 101',
            sessionType: slot.session_type || 'lecture',
            submitting: false,
            serverError: null,
        });
    };

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false, serverError: null }));
    };

    const handleToggleDay = (day) => {
        if (modalState.mode === 'edit') {
            setModalState(prev => ({ ...prev, selectedDays: [day], serverError: null }));
            return;
        }
        setModalState(prev => {
            const exists = prev.selectedDays.includes(day);
            if (exists && prev.selectedDays.length === 1) return prev;
            const nextDays = exists
                ? prev.selectedDays.filter(d => d !== day)
                : [...prev.selectedDays, day];
            return { ...prev, selectedDays: nextDays, serverError: null };
        });
    };

    // Helper: Count how many classes a teacher has on a given day (excluding editingId)
    const getTeacherDailyClassCount = (teacherIdToCheck, day) => {
        if (!teacherIdToCheck) return 0;
        const source = allSchedulesPool.length > 0 ? allSchedulesPool : localSchedules;
        return source.filter(
            s =>
                Number(s.teacher_id) === Number(teacherIdToCheck) &&
                s.day_of_week === day &&
                Number(s.id) !== Number(modalState.editingId)
        ).length;
    };

    // Helper: Determine live VACANT vs OCCUPIED status for a teacher during the selected day & time slot
    const getTeacherSlotStatus = (teacherIdToCheck, days = [], startMins, endMins) => {
        if (!teacherIdToCheck || !days || days.length === 0 || !startMins || !endMins || endMins <= startMins) {
            return { isOccupied: false, status: 'VACANT', label: 'VACANT', details: '' };
        }
        const source = allSchedulesPool.length > 0 ? allSchedulesPool : localSchedules;

        for (const day of days) {
            const conflict = source.find(s => {
                if (Number(s.teacher_id) !== Number(teacherIdToCheck)) return false;
                if (s.day_of_week !== day) return false;
                if (Number(s.id) === Number(modalState.editingId)) return false;
                const exStart = timeToMinutes(s.start_time);
                const exEnd = timeToMinutes(s.end_time);
                return startMins < exEnd && endMins > exStart;
            });

            if (conflict) {
                const className = conflict.school_class?.name || conflict.schoolClass?.name || 'Class Section';
                const roomName = conflict.room ? ` • ${conflict.room}` : '';
                return {
                    isOccupied: true,
                    status: 'OCCUPIED',
                    day,
                    className,
                    roomName,
                    conflict,
                    label: `OCCUPIED (${className}${roomName})`,
                };
            }
        }

        return {
            isOccupied: false,
            status: 'VACANT',
            label: 'VACANT',
            details: '',
        };
    };

    // ─── LIVE OVERLAP, DAILY CAP (9 CLASSES/DAY) & RBAC VALIDATION ENGINE ─────
    const validationResult = useMemo(() => {
        if (!modalState.isOpen) return { isValid: true, errors: [], previewRanks: {} };

        const errors = [];
        const startMins = timeToMinutes(modalState.startTime);
        const endMins = timeToMinutes(modalState.endTime);

        if (!modalState.startTime || !modalState.endTime) {
            errors.push({
                type: 'time',
                title: 'Missing Time Range',
                message: 'Please specify both a Start Time and an End Time.',
            });
        } else if (endMins <= startMins) {
            errors.push({
                type: 'time',
                title: 'Invalid Time Range',
                message: `End time (${formatTime12h(modalState.endTime)}) must be strictly later than start time (${formatTime12h(modalState.startTime)}).`,
            });
        }

        const targetClassId = Number(modalState.schoolClassId || classroom?.id || 0);
        const targetTeacherId = Number(modalState.teacherId || teacher?.id || 0);
        const selectedTeacherObj =
            availableTeachers.find(t => Number(t.id) === targetTeacherId) || teacher;
        const teacherDailyCap = Number(selectedTeacherObj?.max_classes_per_day || MAX_DAILY_CLASSES_DEFAULT);

        const previewRanks = {};

        if (endMins > startMins) {
            modalState.selectedDays.forEach(day => {
                // 1. Check Teacher Max 9 Classes Per Day Cap
                if (targetTeacherId > 0) {
                    const currentDailyCount = getTeacherDailyClassCount(targetTeacherId, day);
                    if (currentDailyCount >= teacherDailyCap) {
                        errors.push({
                            type: 'daily_cap',
                            day,
                            title: `Daily Teaching Limit Reached on ${day} (${currentDailyCount}/${teacherDailyCap})`,
                            message: `${selectedTeacherObj?.name || 'This teacher'} already has ${currentDailyCount} classes scheduled on ${day}. School policy allows a maximum of ${teacherDailyCap} teaching classes per day.`,
                        });
                    }
                }

                // 2. Check Classroom Time Overlap
                const sourceSchedules = allSchedulesPool.length > 0 ? allSchedulesPool : localSchedules;
                if (targetClassId > 0) {
                    const dayClassSchedules = sourceSchedules.filter(
                        s =>
                            s.day_of_week === day &&
                            Number(s.school_class_id) === targetClassId &&
                            Number(s.id) !== Number(modalState.editingId)
                    );

                    dayClassSchedules.forEach(existing => {
                        const exStart = timeToMinutes(existing.start_time);
                        const exEnd = timeToMinutes(existing.end_time);

                        if (startMins < exEnd && endMins > exStart) {
                            errors.push({
                                type: 'class_overlap',
                                day,
                                title: `Classroom Time Overlap on ${day}`,
                                message: `${formatTime12h(modalState.startTime)} – ${formatTime12h(modalState.endTime)} overlaps with "${existing.subject?.name || 'Subject'}" (${formatTime12h(existing.start_time)} – ${formatTime12h(existing.end_time)}) in ${modalActiveClassroom?.name || 'this classroom'}.`,
                            });
                        }
                    });
                }

                // 3. Check Teacher Time Overlap across all classrooms
                if (targetTeacherId > 0) {
                    const dayTeacherSchedules = sourceSchedules.filter(
                        s =>
                            s.day_of_week === day &&
                            Number(s.teacher_id) === targetTeacherId &&
                            Number(s.id) !== Number(modalState.editingId)
                    );

                    dayTeacherSchedules.forEach(existing => {
                        const exStart = timeToMinutes(existing.start_time);
                        const exEnd = timeToMinutes(existing.end_time);
                        if (startMins < exEnd && endMins > exStart) {
                            const tName = selectedTeacherObj?.name || existing.teacher?.name || 'Selected Teacher';
                            errors.push({
                                type: 'teacher_overlap',
                                day,
                                title: `Teacher Time Overlap on ${day}`,
                                message: `${tName} is already scheduled for "${existing.subject?.name || 'Subject'}" (${existing.school_class?.name || existing.schoolClass?.name || 'Classroom'}) from ${formatTime12h(existing.start_time)} to ${formatTime12h(existing.end_time)}.`,
                            });
                        }
                    });
                }

                // 4. Calculate automatic chronological rank preview on this board
                const currentBoardDayItems = (localSchedules || []).filter(
                    s => s.day_of_week === day && Number(s.id) !== Number(modalState.editingId)
                );
                const simulatedList = [
                    ...currentBoardDayItems,
                    { id: '__preview__', start_time: modalState.startTime, end_time: modalState.endTime },
                ].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

                const rankIndex = simulatedList.findIndex(item => item.id === '__preview__');
                previewRanks[day] = {
                    rank: rankIndex + 1,
                    total: simulatedList.length,
                };
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            previewRanks,
        };
    }, [modalState, localSchedules, allSchedulesPool, classroom, teacher, availableTeachers, modalActiveClassroom]);

    // Save Handler (Create or Edit)
    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        if (!validationResult.isValid) {
            notify.error(
                validationResult.errors[0]?.title || 'Schedule Conflict Detected',
                validationResult.errors[0]?.message || 'Please resolve the conflict before saving.'
            );
            return;
        }

        const targetClassId = Number(modalState.schoolClassId || classroom?.id || 0);
        const targetSubjectId = Number(modalState.subjectId || 0);
        const targetTeacherId = Number(modalState.teacherId || teacher?.id || 0);

        if (!targetClassId || !targetSubjectId || !targetTeacherId) {
            notify.error('Missing Required Selection', 'Please select a Classroom, Subject, and Authorized Teacher.');
            return;
        }

        setModalState(prev => ({ ...prev, submitting: true, serverError: null }));

        try {
            if (modalState.mode === 'edit' && modalState.editingId) {
                const payload = {
                    school_class_id: targetClassId,
                    subject_id: targetSubjectId,
                    teacher_id: targetTeacherId,
                    day_of_week: modalState.selectedDays[0],
                    start_time: modalState.startTime,
                    end_time: modalState.endTime,
                    room: modalState.room || modalActiveClassroom?.room || 'Room TBA',
                    session_type: modalState.sessionType || 'lecture',
                };

                const res = await srnhsApi.updateSchedule(modalState.editingId, payload);
                const updatedEntry = res?.data;

                if (updatedEntry) {
                    setLocalSchedules(prev =>
                        prev.map(s => (Number(s.id) === Number(modalState.editingId) ? updatedEntry : s))
                    );
                    setAllSchedulesPool(prev =>
                        prev.map(s => (Number(s.id) === Number(modalState.editingId) ? updatedEntry : s))
                    );
                }

                notify.saveSuccess(
                    'Schedule Updated & Auto-Sorted',
                    `${updatedEntry?.subject?.name || 'Class period'} moved to ${formatTime12h(modalState.startTime)} – ${formatTime12h(modalState.endTime)} on ${modalState.selectedDays[0]}.`
                );
            } else {
                const createdItems = [];
                for (const day of modalState.selectedDays) {
                    const payload = {
                        school_class_id: targetClassId,
                        subject_id: targetSubjectId,
                        teacher_id: targetTeacherId,
                        day_of_week: day,
                        start_time: modalState.startTime,
                        end_time: modalState.endTime,
                        room: modalState.room || modalActiveClassroom?.room || 'Room TBA',
                        session_type: modalState.sessionType || 'lecture',
                    };
                    const res = await srnhsApi.createSchedule(payload);
                    if (res?.data) {
                        createdItems.push(res.data);
                    }
                }

                if (createdItems.length > 0) {
                    setLocalSchedules(prev => [...prev, ...createdItems]);
                    setAllSchedulesPool(prev => [...prev, ...createdItems]);
                }

                notify.saveSuccess(
                    'Schedule Added & Synced Live',
                    `Scheduled at ${formatTime12h(modalState.startTime)} – ${formatTime12h(modalState.endTime)} (${modalState.selectedDays.join(', ')}).`
                );
            }

            handleCloseModal();
            if (onRefresh) await onRefresh();
        } catch (err) {
            const backendConflictMsg =
                err.response?.data?.conflicts?.[0]?.message ||
                err.response?.data?.message ||
                err.message ||
                'Unable to save schedule due to a conflict.';

            setModalState(prev => ({
                ...prev,
                submitting: false,
                serverError: backendConflictMsg,
            }));
            notify.error('Schedule Conflict / RBAC Block', backendConflictMsg);
        }
    };

    // Delete Handler
    const handleDeleteSchedule = async (slot) => {
        try {
            await srnhsApi.deleteSchedule(slot.id);
            setLocalSchedules(prev => prev.filter(s => Number(s.id) !== Number(slot.id)));
            setAllSchedulesPool(prev => prev.filter(s => Number(s.id) !== Number(slot.id)));
            notify.info(
                'Schedule Removed',
                `Removed ${slot.subject?.name || 'subject'} (${formatTime12h(slot.start_time)} – ${formatTime12h(slot.end_time)}) from ${slot.day_of_week}.`
            );
            if (onRefresh) await onRefresh();
        } catch (err) {
            notify.error('Delete Failed', err.message || 'Could not remove schedule period.');
        }
    };

    const isolationDeptLabel = classroom?.grade_level
        ? Number(classroom.grade_level) >= 11
            ? `SHS • Grade ${classroom.grade_level} (${classroom.strand || 'Core'})`
            : `JHS • Grade ${classroom.grade_level}`
        : isTeacherCentric && teacher
        ? `${(teacher.normalized_departments || [teacher.department || 'JHS']).join(' + ')} Faculty`
        : null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            {/* ── Top Header Bar ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 m-0">
                            {title}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                            <ArrowUpDown size={11} />
                            <span>Auto-Sorted by Time</span>
                        </span>
                        {isolationDeptLabel && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <ShieldCheck size={11} />
                                <span>RBAC Isolated: {isolationDeptLabel}</span>
                            </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {localSchedules.length} {localSchedules.length === 1 ? 'session' : 'sessions'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 mb-0">
                        {subtitle ||
                            (editable
                                ? 'Cards automatically sort top-to-bottom from earliest to latest time, enforce strict Grade/Department RBAC isolation, and cap faculty at 9 classes/day.'
                                : 'Schedules are dynamically ordered top-to-bottom from earliest morning class to latest session.')}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200/80"
                    >
                        <Printer size={14} />
                        <span>Print Timetable</span>
                    </button>

                    {editable && (
                        <button
                            type="button"
                            onClick={() => handleOpenCreateModal('Monday')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                        >
                            <Plus size={15} />
                            <span>+ Add Schedule Period</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── 5-Column Kanban Timetable Board (Monday – Friday) ── */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {DAYS_OF_WEEK.map((day) => {
                    const daySlots = schedulesByDay[day] || [];
                    const isAtDailyCap = isTeacherCentric && daySlots.length >= maxDailyClasses;

                    return (
                        <div
                            key={day}
                            className="bg-slate-50/70 rounded-2xl border border-slate-200/85 p-3.5 flex flex-col justify-between min-h-[340px]"
                        >
                            <div>
                                {/* Column Day Header */}
                                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                            {day}
                                        </span>
                                        <span
                                            className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                                                isAtDailyCap
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                    : 'text-blue-700 bg-blue-50 border-blue-200/60'
                                            }`}
                                        >
                                            {isTeacherCentric ? `${daySlots.length}/${maxDailyClasses}` : daySlots.length}
                                        </span>
                                    </div>

                                    {editable && !isAtDailyCap && (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenCreateModal(day)}
                                            title={`Add schedule to ${day}`}
                                            className="w-6 h-6 rounded-lg bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200/90 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                        >
                                            <Plus size={13} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>

                                {/* Chronologically Sorted Cards (#1 Earliest at Top -> Latest at Bottom) */}
                                {daySlots.length === 0 ? (
                                    <div className="py-12 px-3 text-center">
                                        <Clock size={26} className="mx-auto text-slate-300 mb-2" />
                                        <div className="text-xs font-bold text-slate-500">
                                            {perspective === 'teacher' ? `Vacant on ${day}` : `No classes on ${day}`}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 mb-0">
                                            {perspective === 'teacher'
                                                ? 'All periods vacant (Preparation Time)'
                                                : (editable
                                                    ? 'Click below to schedule a period at any time.'
                                                    : 'No sessions scheduled.')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {daySlots.map((slot, index) => {
                                            const rankNumber = index + 1;
                                            const durationLabel = formatDuration(slot.start_time, slot.end_time);
                                            const accentColor = slot.subject?.color || '#2563EB';
                                            const hasTeacher = Boolean(slot.teacher?.name);
                                            const sectionName = slot.school_class?.name || slot.schoolClass?.name;

                                            return (
                                                <div
                                                    key={slot.id || `${day}-${index}`}
                                                    onClick={() => editable && handleOpenEditModal(slot)}
                                                    style={{
                                                        borderLeft: `4px solid ${accentColor}`,
                                                    }}
                                                    className={`group relative bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs transition-all ${
                                                        editable
                                                            ? 'hover:border-blue-400 hover:shadow-md cursor-pointer'
                                                            : ''
                                                    }`}
                                                >
                                                    {/* Top Row: Rank Badge + Duration + Status */}
                                                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                                #{rankNumber}
                                                            </span>
                                                            {perspective === 'teacher' && (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                                                    Occupied
                                                                </span>
                                                            )}
                                                        </div>
                                                        {durationLabel && (
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {durationLabel}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Prominent 12-Hour Time Pill */}
                                                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-extrabold text-blue-600 mb-1.5">
                                                        <Clock size={12} className="shrink-0" />
                                                        <span>
                                                            {formatTime12h(slot.start_time)} – {formatTime12h(slot.end_time)}
                                                        </span>
                                                    </div>

                                                    {/* Subject Title */}
                                                    <div className="text-xs font-extrabold text-slate-900 leading-snug">
                                                        {slot.subject?.name || slot.subject?.code || 'Subject'}
                                                    </div>
                                                    {slot.subject?.code && (
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                            {slot.subject.code} &bull; Grade {slot.subject.grade_level}
                                                        </div>
                                                    )}

                                                    {/* Teacher / Section & Room Metadata */}
                                                    <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                                                        {perspective === 'teacher' ? (
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-slate-400">Classroom:</span>
                                                                <span className="font-bold text-slate-800 truncate">
                                                                    {sectionName || 'Assigned Section'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-slate-400">Teacher:</span>
                                                                <span
                                                                    className={`font-semibold truncate ${
                                                                        hasTeacher ? 'text-slate-700' : 'text-amber-600'
                                                                    }`}
                                                                >
                                                                    {slot.teacher?.name || 'TBA'}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-slate-400">Room:</span>
                                                            <span className="font-semibold text-slate-700 truncate">
                                                                {slot.room || classroom?.room || 'TBA'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Edit / Delete Hover Toolbar for Admin */}
                                                    {editable && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5"
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditModal(slot)}
                                                                className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white transition-colors cursor-pointer"
                                                            >
                                                                <Edit3 size={11} />
                                                                <span>Edit Time / Info</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSchedule(slot)}
                                                                title="Remove schedule"
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Bottom Add Button inside Each Day Column */}
                            {editable && (
                                <button
                                    type="button"
                                    disabled={isAtDailyCap}
                                    onClick={() => handleOpenCreateModal(day)}
                                    className={`mt-3 w-full py-2 px-3 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                        isAtDailyCap
                                            ? 'border-rose-200 bg-rose-50/50 text-rose-500 cursor-not-allowed'
                                            : 'border-slate-300 hover:border-blue-500 bg-white/70 hover:bg-blue-50/60 text-slate-600 hover:text-blue-700 cursor-pointer'
                                    }`}
                                >
                                    {isAtDailyCap ? (
                                        <span>Max {maxDailyClasses}/day Reached</span>
                                    ) : (
                                        <>
                                            <Plus size={14} />
                                            <span>Add to {day}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Dynamic Create / Edit Schedule Modal ── */}
            {editable && modalState.isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{
                        background: 'rgba(9, 9, 11, 0.65)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
                            <div>
                                <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                                    <ShieldCheck size={13} />
                                    <span>
                                        {isTeacherCentric
                                            ? `${teacher?.name} • Admin Teacher Timetable Builder`
                                            : `${modalActiveClassroom?.name || 'Classroom'} • Grade ${modalActiveClassroom?.grade_level || ''} RBAC Isolated`}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-slate-900 m-0 mt-0.5">
                                    {modalState.mode === 'edit'
                                        ? 'Edit Schedule Time & Assignment'
                                        : 'Create Dynamic Class Schedule'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
                            {/* 1. Day Selector Pills */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                                    {modalState.mode === 'edit'
                                        ? 'Scheduled Day (Click to Move Day)'
                                        : 'Select Day(s) of Week'}
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const isSelected = modalState.selectedDays.includes(day);
                                        const activeTId = Number(modalState.teacherId || teacher?.id || 0);
                                        const countOnDay = activeTId ? getTeacherDailyClassCount(activeTId, day) : null;
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleToggleDay(day)}
                                                className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-col items-center ${
                                                    isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{day.slice(0, 3)}</span>
                                                {countOnDay !== null && (
                                                    <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                                        {countOnDay}/9
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Custom Dynamic Start & End Time Pickers */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Custom Time Slot (Auto-Sorts Earliest to Latest)
                                    </label>
                                    {timeToMinutes(modalState.endTime) > timeToMinutes(modalState.startTime) && (
                                        <span className="text-[11px] font-bold text-blue-600">
                                            Duration: {formatDuration(modalState.startTime, modalState.endTime)}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                                            Start Time ({formatTime12h(modalState.startTime)})
                                        </span>
                                        <input
                                            type="time"
                                            value={modalState.startTime}
                                            onChange={(e) =>
                                                setModalState(prev => ({
                                                    ...prev,
                                                    startTime: e.target.value,
                                                    serverError: null,
                                                }))
                                            }
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                                            End Time ({formatTime12h(modalState.endTime)})
                                        </span>
                                        <input
                                            type="time"
                                            value={modalState.endTime}
                                            onChange={(e) =>
                                                setModalState(prev => ({
                                                    ...prev,
                                                    endTime: e.target.value,
                                                    serverError: null,
                                                }))
                                            }
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Quick Time Presets */}
                                <div className="mt-2.5">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Quick Time Presets (Or type any custom time above):
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_TIME_PRESETS.map((preset) => {
                                            const active =
                                                modalState.startTime === preset.start &&
                                                modalState.endTime === preset.end;
                                            return (
                                                <button
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() =>
                                                        setModalState(prev => ({
                                                            ...prev,
                                                            startTime: preset.start,
                                                            endTime: preset.end,
                                                            serverError: null,
                                                        }))
                                                    }
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                                        active
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Live Conflict / Daily Cap / Auto-Rank Feedback Banner */}
                            {!validationResult.isValid || modalState.serverError ? (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs font-black">
                                        <AlertTriangle size={15} className="shrink-0" />
                                        <span>
                                            {validationResult.errors[0]?.title || 'Schedule Conflict Detected'}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed m-0">
                                        {modalState.serverError || validationResult.errors[0]?.message}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2 font-bold">
                                        <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                                        <span>Conflict-free &amp; within 9 classes/day limit!</span>
                                    </div>
                                    {modalState.selectedDays.length === 1 &&
                                        validationResult.previewRanks[modalState.selectedDays[0]] && (
                                            <span className="font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                                                Auto-places at Rank #
                                                {validationResult.previewRanks[modalState.selectedDays[0]].rank} of{' '}
                                                {validationResult.previewRanks[modalState.selectedDays[0]].total}
                                            </span>
                                        )}
                                </div>
                            )}

                            {/* 4. Subject Selection (Strictly Isolated by Grade / Teacher Qualification) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Authorized Subject
                                    </label>
                                    <span className="text-[10px] font-bold text-emerald-600">
                                        {isolatedSubjects.length} eligible subject(s)
                                    </span>
                                </div>
                                <select
                                    value={modalState.subjectId}
                                    onChange={(e) => {
                                        const nextSubId = e.target.value;
                                        const subObj = availableSubjects.find(s => Number(s.id) === Number(nextSubId));
                                        setModalState(prev => {
                                            // If in teacher-centric mode, auto-select a matching classroom for this subject's grade level
                                            let nextClassId = prev.schoolClassId;
                                            let nextRoom = prev.room;
                                            if (isTeacherCentric && subObj) {
                                                const matchingCls = availableClasses.find(
                                                    c => Number(c.grade_level) === Number(subObj.grade_level)
                                                );
                                                if (matchingCls) {
                                                    nextClassId = String(matchingCls.id);
                                                    nextRoom = matchingCls.room || prev.room;
                                                }
                                            }
                                            return {
                                                ...prev,
                                                subjectId: nextSubId,
                                                schoolClassId: nextClassId,
                                                room: nextRoom,
                                                serverError: null,
                                            };
                                        });
                                    }}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                                >
                                    <option value="">
                                        {isolatedSubjects.length === 0
                                            ? 'No authorized subjects found for this grade/teacher...'
                                            : 'Select Authorized Subject...'}
                                    </option>
                                    {isolatedSubjects.map((sub) => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.name} ({sub.code}) — Grade {sub.grade_level}
                                            {sub.strand ? ` [${sub.strand}]` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 5. Teacher / Classroom & Room Selection */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {isTeacherCentric ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                                Target Classroom
                                            </label>
                                            <span className="text-[10px] font-bold text-blue-600">
                                                {isolatedClasses.length} matching
                                            </span>
                                        </div>
                                        <select
                                            value={modalState.schoolClassId}
                                            onChange={(e) => {
                                                const clsId = e.target.value;
                                                const clsObj = availableClasses.find(c => Number(c.id) === Number(clsId));
                                                setModalState(prev => ({
                                                    ...prev,
                                                    schoolClassId: clsId,
                                                    room: clsObj?.room || prev.room,
                                                    serverError: null,
                                                }));
                                            }}
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                                        >
                                            <option value="">
                                                {isolatedClasses.length === 0
                                                    ? 'No classrooms for this grade yet (Create in Classrooms)...'
                                                    : 'Select Classroom Section...'}
                                            </option>
                                            {isolatedClasses.map((cls) => (
                                                <option key={cls.id} value={cls.id}>
                                                    {cls.name} (Grade {cls.grade_level} • {cls.room || 'Room TBA'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                                Authorized Teacher
                                            </label>
                                            <span className="text-[10px] font-bold text-blue-600">
                                                {isolatedTeachers.length} qualified
                                            </span>
                                        </div>
                                        <select
                                            value={modalState.teacherId}
                                            onChange={(e) =>
                                                setModalState(prev => ({
                                                    ...prev,
                                                    teacherId: e.target.value,
                                                    serverError: null,
                                                }))
                                            }
                                            required
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                                        >
                                            <option value="">
                                                {isolatedTeachers.length === 0
                                                    ? 'No qualified teacher for this subject/department yet...'
                                                    : 'Select Qualified Teacher...'}
                                            </option>
                                            {isolatedTeachers.map((t) => {
                                                const primaryDay = modalState.selectedDays[0] || 'Monday';
                                                const dayCount = getTeacherDailyClassCount(t.id, primaryDay);
                                                const cap = Number(t.max_classes_per_day || 9);
                                                const startMins = timeToMinutes(modalState.startTime);
                                                const endMins = timeToMinutes(modalState.endTime);
                                                const slotStatus = getTeacherSlotStatus(t.id, modalState.selectedDays, startMins, endMins);

                                                const isExceededDaily = dayCount >= cap;
                                                const isDisabled = slotStatus.isOccupied || isExceededDaily;

                                                let statusBadge = slotStatus.isOccupied
                                                    ? `[🔴 OCCUPIED: ${slotStatus.className}${slotStatus.roomName}]`
                                                    : `[🟢 VACANT]`;

                                                if (isExceededDaily) {
                                                    statusBadge = `[⚠️ DAILY CAP (${dayCount}/${cap})]`;
                                                }

                                                return (
                                                    <option key={t.id} value={t.id} disabled={isDisabled}>
                                                        {t.name} {statusBadge} — ({dayCount}/{cap} classes on {primaryDay.slice(0, 3)})
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        {/* Real-time Vacant vs. Occupied Status Indicator */}
                                        {modalState.teacherId && (() => {
                                            const startMins = timeToMinutes(modalState.startTime);
                                            const endMins = timeToMinutes(modalState.endTime);
                                            const currentStatus = getTeacherSlotStatus(modalState.teacherId, modalState.selectedDays, startMins, endMins);
                                            const selectedTeacherObj = availableTeachers.find(t => Number(t.id) === Number(modalState.teacherId));

                                            if (currentStatus.isOccupied) {
                                                return (
                                                    <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
                                                        <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                                                        <span>
                                                            <strong>OCCUPIED:</strong> {selectedTeacherObj?.name || 'Teacher'} is already scheduled for <strong>{currentStatus.className}</strong> on {currentStatus.day}.
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="mt-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                                    <span>
                                                        <strong>VACANT:</strong> {selectedTeacherObj?.name || 'Teacher'} is free &amp; available for this time slot.
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Classroom / Venue
                                    </label>
                                    <input
                                        type="text"
                                        value={modalState.room}
                                        onChange={(e) =>
                                            setModalState(prev => ({
                                                ...prev,
                                                room: e.target.value,
                                                serverError: null,
                                            }))
                                        }
                                        placeholder="e.g. Building A - Room 101"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-600 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Helpful Hint when starting from a clean database */}
                            {((!isTeacherCentric && isolatedTeachers.length === 0) ||
                                (isTeacherCentric && isolatedClasses.length === 0)) && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                                    {isTeacherCentric
                                        ? 'Tip: Create a Classroom matching this teacher’s department/grade in "Classrooms & Enrollment" first so you can assign them class periods.'
                                        : 'Tip: Register or authorize a Teacher for this department & subject in "Faculty RBAC & Directory" first so they appear in this isolated dropdown.'}
                                </div>
                            )}

                            {/* Modal Footer Actions */}
                            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!validationResult.isValid || modalState.submitting}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                        !validationResult.isValid || modalState.submitting
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                    }`}
                                >
                                    {modalState.submitting
                                        ? 'Saving...'
                                        : modalState.mode === 'edit'
                                        ? 'Save & Re-Sort Timetable'
                                        : `Add to ${modalState.selectedDays.join(', ')}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
