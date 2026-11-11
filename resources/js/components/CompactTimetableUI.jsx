import React, { useState, useMemo, useEffect } from 'react';
import {
    CalendarCheck,
    Users,
    MapPin,
    AlertTriangle,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Coffee,
    Lock,
    ExternalLink,
    Filter,
    RotateCcw,
    FileText,
    CheckCircle2,
    Layers,
    BookOpen,
    GraduationCap,
    Grid,
    List,
    AlertCircle,
    Printer,
    Sparkles,
    Calendar,
    X
} from 'lucide-react';
import InteractiveScheduleModal, { to12Hour, to24Hour, toMinutes, calcDuration } from './schedules/InteractiveScheduleModal';
import ScheduleDetailModal from './schedules/ScheduleDetailModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Baseline standard periods in 12-hour school bell schedule (Dynamic continuous template, breaks configured by admin)
const BASELINE_STANDARD_PERIODS = [
    { start: '07:30', end: '08:30' },
    { start: '08:30', end: '09:30' },
    { start: '09:30', end: '10:30' },
    { start: '10:30', end: '11:30' },
    { start: '11:30', end: '12:30' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
];

const GRADE_OPTIONS = [
    { value: 7, label: 'Grade 7', stage: 'JHS' },
    { value: 8, label: 'Grade 8', stage: 'JHS' },
    { value: 9, label: 'Grade 9', stage: 'JHS' },
    { value: 10, label: 'Grade 10', stage: 'JHS' },
    { value: 11, label: 'Grade 11', stage: 'SHS' },
    { value: 12, label: 'Grade 12', stage: 'SHS' },
    { value: 'all', label: 'All Grades', stage: 'ALL' },
];

// Check if a period overlaps with a schedule or break record
const doesPeriodOverlap = (period, item) => {
    const pStart = toMinutes(period.start);
    const pEnd = toMinutes(period.end);
    const iStart = toMinutes(item.start_time || item.start);
    const iEnd = toMinutes(item.end_time || item.end);
    return Math.max(pStart, iStart) < Math.min(pEnd, iEnd);
};

// ─── CompactTimetableUI Component ─────────────────────────────────────────────
export default function CompactTimetableUI({
    schedules = [],
    loads = [],
    classes = [],
    teachers = [],
    subjects = [],
    breaks = [],
    academicYear = '2026-2027',
    term = 'Term 1',
    initialPerspective = 'section',
    onPerspectiveChange,
    onScheduleClick,
    onSlotClick,
    onAddScheduleClick,
    onOpenBreakModal,
    onDeleteBreak,
    onOpenConflictModal,
    onOpenConfigureTemplates,
    onAutoGenerate,
    isAutoGenerating = false,
    isAdmin = true,
    viewMode: controlledViewMode,
    sectionTitle,
    onDeleteSchedule,
    onEditSchedule,
}) {
    // ─── Core Perspective State: 'section' | 'teacher' | 'classroom' ──────────
    const [perspective, setPerspective] = useState(
        controlledViewMode === 'teacher' ? 'teacher' : (initialPerspective || 'section')
    );

    useEffect(() => {
        if (controlledViewMode) {
            setPerspective(controlledViewMode);
        } else if (initialPerspective) {
            setPerspective(initialPerspective);
        }
    }, [controlledViewMode, initialPerspective]);

    const handleSwitchPerspective = (newPersp) => {
        setPerspective(newPersp);
        if (onPerspectiveChange) {
            onPerspectiveChange(newPersp);
        }
    };

    // ─── Academic Context State ───────────────────────────────────────────────
    const [selectedYear, setSelectedYear] = useState(academicYear);
    const [selectedTerm, setSelectedTerm] = useState(term);
    const [selectedStage, setSelectedStage] = useState('JHS');

    // ─── Presentation Controls State ──────────────────────────────────────────
    const [timeRangeMode, setTimeRangeMode] = useState('week'); // 'day' | 'week'
    const [displayMode, setDisplayMode] = useState('timetable'); // 'timetable' | 'list'
    const [activeDayInDayMode, setActiveDayInDayMode] = useState('Monday');

    // Smart initial grade detection: pick a grade that has active schedules (e.g. Grade 10)
    const initialGradeWithData = useMemo(() => {
        if (schedules.length > 0) {
            const firstSched = schedules.find(s => s.school_class?.grade_level || s.schoolClass?.grade_level);
            if (firstSched) {
                return Number(firstSched.school_class?.grade_level || firstSched.schoolClass?.grade_level);
            }
        }
        return 10; // Default to Grade 10 which has active data in the database
    }, [schedules]);

    // ─── Filtering State ──────────────────────────────────────────────────────
    const [selectedGrade, setSelectedGrade] = useState(initialGradeWithData);
    const [selectedSectionId, setSelectedSectionId] = useState('all');
    const [selectedTeacherId, setSelectedTeacherId] = useState('all');
    const [selectedRoom, setSelectedRoom] = useState('all');
    const [selectedSubjectId, setSelectedSubjectId] = useState('all');
    const [selectedDayFilter, setSelectedDayFilter] = useState('all');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic custom added periods by Admin
    const [customPeriods, setCustomPeriods] = useState([]);
    const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
    const [newSlotStart, setNewSlotStart] = useState('18:00');
    const [newSlotEnd, setNewSlotEnd] = useState('19:00');

    // Interactive Schedule Creation/Edit Modal state
    const [scheduleModalState, setScheduleModalState] = useState({
        isOpen: false,
        editingSchedule: null,
        initialData: {}
    });

    // Requirement 4: Schedule Detail Modal state
    const [selectedDetailSchedule, setSelectedDetailSchedule] = useState(null);

    // Requirement 3: Filter toggle for faculty with schedules
    const [onlyScheduledTeachers, setOnlyScheduledTeachers] = useState(true);

    // ─── Derived Lists & Dynamic Dropdown Options ─────────────────────────────
    const availableSectionsForGrade = useMemo(() => {
        if (selectedGrade === 'all') return classes;
        return classes.filter(c => Number(c.grade_level) === Number(selectedGrade));
    }, [classes, selectedGrade]);

    const availableRooms = useMemo(() => {
        const set = new Set();
        classes.forEach(c => c.room && set.add(c.room.trim()));
        schedules.forEach(s => s.room && set.add(s.room.trim()));
        return Array.from(set).filter(Boolean).sort();
    }, [classes, schedules]);

    const availableSubjects = useMemo(() => {
        const map = new Map();
        schedules.forEach(s => {
            if (s.subject && s.subject.id) {
                map.set(s.subject.id, s.subject.name || s.subject.code);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [schedules]);

    // Group teachers by scheduled vs unscheduled
    const teacherScheduleCountMap = useMemo(() => {
        const map = new Map();
        schedules.forEach(s => {
            if (s.teacher_id) {
                const tid = Number(s.teacher_id);
                map.set(tid, (map.get(tid) || 0) + 1);
            }
        });
        return map;
    }, [schedules]);

    const { scheduledTeachers, unscheduledTeachers } = useMemo(() => {
        const scheduled = [];
        const unscheduled = [];
        teachers.forEach(t => {
            const count = teacherScheduleCountMap.get(Number(t.id)) || 0;
            const enhanced = { ...t, scheduleCount: count };
            if (count > 0) {
                scheduled.push(enhanced);
            } else {
                unscheduled.push(enhanced);
            }
        });
        scheduled.sort((a, b) => b.scheduleCount - a.scheduleCount);
        unscheduled.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        return { scheduledTeachers: scheduled, unscheduledTeachers: unscheduled };
    }, [teachers, teacherScheduleCountMap]);

    // Auto-select valid section when grade changes
    useEffect(() => {
        if (perspective === 'section') {
            if (selectedGrade !== 'all') {
                const gradeClasses = classes.filter(c => Number(c.grade_level) === Number(selectedGrade));
                if (gradeClasses.length > 0) {
                    const exists = gradeClasses.some(c => String(c.id) === String(selectedSectionId));
                    if (!exists && selectedSectionId !== 'all') {
                        setSelectedSectionId(String(gradeClasses[0].id));
                    }
                }
            }
        }
    }, [selectedGrade, classes, perspective]);

    // Auto-select first scheduled teacher when entering teacher mode
    useEffect(() => {
        if (perspective === 'teacher') {
            const currentValid = teachers.some(t => String(t.id) === String(selectedTeacherId));
            if (!currentValid || selectedTeacherId === 'all') {
                const defaultTeacher = scheduledTeachers[0] || teachers[0];
                if (defaultTeacher) {
                    setSelectedTeacherId(String(defaultTeacher.id));
                }
            }
        }
    }, [perspective, scheduledTeachers, teachers]);

    const activeSection = useMemo(() => {
        if (selectedSectionId !== 'all') {
            return classes.find(c => String(c.id) === String(selectedSectionId)) || null;
        }
        return availableSectionsForGrade[0] || classes[0] || null;
    }, [classes, selectedSectionId, availableSectionsForGrade]);

    const activeTeacher = useMemo(() => {
        if (selectedTeacherId !== 'all') {
            return teachers.find(t => String(t.id) === String(selectedTeacherId)) || null;
        }
        return scheduledTeachers[0] || teachers[0] || null;
    }, [teachers, selectedTeacherId, scheduledTeachers]);

    // Active Teacher Workload and Profile Summary
    const activeTeacherStats = useMemo(() => {
        if (!activeTeacher) return null;
        const teacherSchedules = schedules.filter(s => String(s.teacher_id) === String(activeTeacher.id));
        
        let totalMinutes = 0;
        const uniqueSubjects = new Set();
        const uniqueSections = new Set();
        const uniqueRooms = new Set();
        const daysActive = new Set();

        teacherSchedules.forEach(s => {
            const dur = toMinutes(s.end_time) - toMinutes(s.start_time);
            if (dur > 0) totalMinutes += dur;
            if (s.subject?.name || s.subject?.code) uniqueSubjects.add(s.subject?.name || s.subject?.code);
            const secName = s.school_class?.name || s.schoolClass?.name;
            if (secName) uniqueSections.add(secName);
            if (s.room) uniqueRooms.add(s.room);
            if (s.day_of_week) daysActive.add(s.day_of_week);
        });

        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
        const depEdMaxHours = 30; // standard 30 teaching hours max per week
        const workloadPct = Math.min(100, Math.round((totalHours / depEdMaxHours) * 100));

        return {
            totalSessions: teacherSchedules.length,
            totalHours,
            workloadPct,
            depEdMaxHours,
            uniqueSubjects: Array.from(uniqueSubjects),
            uniqueSections: Array.from(uniqueSections),
            uniqueRooms: Array.from(uniqueRooms),
            daysActiveCount: daysActive.size
        };
    }, [activeTeacher, schedules]);

    const handleStepTeacher = (direction) => {
        const pool = onlyScheduledTeachers && scheduledTeachers.length > 0 ? scheduledTeachers : teachers;
        if (!pool || pool.length === 0) return;
        const currentIndex = pool.findIndex(t => String(t.id) === String(selectedTeacherId));
        let nextIndex = 0;
        if (currentIndex !== -1) {
            nextIndex = direction === 'next' 
                ? (currentIndex + 1) % pool.length 
                : (currentIndex - 1 + pool.length) % pool.length;
        }
        setSelectedTeacherId(String(pool[nextIndex].id));
    };

    const activeRoom = useMemo(() => {
        if (selectedRoom !== 'all') {
            return selectedRoom;
        }
        return availableRooms[0] || 'Room 101';
    }, [selectedRoom, availableRooms]);

    // ─── Real-Time Conflict Detection ─────────────────────────────────────────
    const { detectedConflicts, conflictedScheduleIds } = useMemo(() => {
        const list = [];
        const conflictIds = new Set();

        for (let i = 0; i < schedules.length; i++) {
            for (let j = i + 1; j < schedules.length; j++) {
                const a = schedules[i];
                const b = schedules[j];

                if (a.day_of_week === b.day_of_week) {
                    const aS = toMinutes(a.start_time), aE = toMinutes(a.end_time);
                    const bS = toMinutes(b.start_time), bE = toMinutes(b.end_time);

                    if (Math.max(aS, bS) < Math.min(aE, bE)) {
                        if (a.teacher_id && b.teacher_id && a.teacher_id === b.teacher_id && a.school_class_id !== b.school_class_id) {
                            conflictIds.add(a.id);
                            conflictIds.add(b.id);
                            list.push({
                                id: `t-${a.id}-${b.id}`,
                                type: 'teacher_overlap',
                                scheduleA: a,
                                scheduleB: b,
                                teacherName: a.teacher?.name || b.teacher?.name || 'Faculty Member',
                                day: a.day_of_week,
                                time: `${to12Hour(a.start_time)} – ${to12Hour(a.end_time)}`,
                                message: `${a.teacher?.name || 'Teacher'}: ${a.subject?.name || 'Subject'}, ${a.school_class?.name || 'Section'} (${a.room || 'Room'}) overlaps ${b.subject?.name || 'Subject'}, ${b.school_class?.name || 'Section'} (${b.room || 'Room'}) at the same time.`
                            });
                        } else if (a.room && b.room && a.room.trim().toLowerCase() === b.room.trim().toLowerCase() && a.school_class_id !== b.school_class_id) {
                            conflictIds.add(a.id);
                            conflictIds.add(b.id);
                            list.push({
                                id: `r-${a.id}-${b.id}`,
                                type: 'room_overlap',
                                scheduleA: a,
                                scheduleB: b,
                                room: a.room,
                                day: a.day_of_week,
                                time: `${to12Hour(a.start_time)} – ${to12Hour(a.end_time)}`,
                                message: `Room ${a.room}: ${a.school_class?.name} (${a.subject?.name}) overlaps ${b.school_class?.name} (${b.subject?.name}) simultaneously.`
                            });
                        }
                    }
                }
            }
        }

        return { detectedConflicts: list, conflictedScheduleIds: conflictIds };
    }, [schedules]);

    // ─── Filtered Schedule Records ────────────────────────────────────────────
    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            if (perspective === 'section') {
                if (selectedSectionId !== 'all') {
                    if (String(s.school_class_id) !== String(selectedSectionId)) return false;
                } else if (activeSection) {
                    if (String(s.school_class_id) !== String(activeSection.id)) return false;
                }
            } else if (perspective === 'teacher') {
                if (selectedTeacherId !== 'all') {
                    if (String(s.teacher_id) !== String(selectedTeacherId)) return false;
                } else if (activeTeacher) {
                    if (String(s.teacher_id) !== String(activeTeacher.id)) return false;
                }
            } else if (perspective === 'classroom') {
                if (selectedRoom !== 'all') {
                    if ((s.room || '').trim().toLowerCase() !== selectedRoom.trim().toLowerCase()) return false;
                } else if (activeRoom) {
                    if ((s.room || '').trim().toLowerCase() !== activeRoom.trim().toLowerCase()) return false;
                }
            }

            // Only apply grade filter when NOT in teacher perspective, so a teacher's cross-grade schedule is intact!
            if (perspective !== 'teacher' && selectedGrade !== 'all') {
                const sGrade = s.school_class?.grade_level || s.schoolClass?.grade_level;
                if (sGrade && Number(sGrade) !== Number(selectedGrade)) return false;
            }

            if (selectedSubjectId !== 'all') {
                if (String(s.subject_id) !== String(selectedSubjectId)) return false;
            }

            if (selectedDayFilter !== 'all') {
                if (s.day_of_week !== selectedDayFilter) return false;
            }

            if (selectedStatusFilter === 'conflict') {
                if (!conflictedScheduleIds.has(s.id)) return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const subj = (s.subject?.name || s.subject?.code || '').toLowerCase();
                const teach = (s.teacher?.name || '').toLowerCase();
                const sec = (s.school_class?.name || s.schoolClass?.name || '').toLowerCase();
                const rm = (s.room || '').toLowerCase();
                if (!subj.includes(q) && !teach.includes(q) && !sec.includes(q) && !rm.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [
        schedules,
        perspective,
        selectedSectionId,
        activeSection,
        selectedTeacherId,
        activeTeacher,
        selectedRoom,
        activeRoom,
        selectedGrade,
        selectedSubjectId,
        selectedDayFilter,
        selectedStatusFilter,
        searchQuery,
        conflictedScheduleIds
    ]);

    // ─── DYNAMIC PERIODS ENGINE (12-Hour AM/PM & Future-Proof 24H Range) ───────
    // Derives period time slots dynamically from:
    // 1. Baseline school bell schedule (07:30 AM to 05:00 PM)
    // 2. Custom time slots added by the admin (e.g. 06:00 PM - 07:00 PM)
    // 3. Distinct start/end times in filteredSchedules and breaks
    // ─── DYNAMIC PERIODS ENGINE (12-Hour AM/PM & Arbitrary 24H Range) ────────
    // Derives period time slots dynamically from:
    // 1. Explicit active schedules in filteredSchedules (including extended classes e.g. 5:00-6:00 PM)
    // 2. Configured dynamic breaks (morning break, lunch break, etc.)
    // 3. Custom time slots added by the administrator
    // 4. Baseline school periods to provide available free slots
    const dynamicPeriods = useMemo(() => {
        const periodMap = new Map();
        const explicitSlots = [];

        // 1. Active schedule intervals
        filteredSchedules.forEach(s => {
            if (s.start_time && s.end_time) {
                const sStart = s.start_time.substring(0, 5);
                const sEnd = s.end_time.substring(0, 5);
                explicitSlots.push({ start: sStart, end: sEnd });
            }
        });

        // 2. Configured breaks
        breaks.forEach(b => {
            if (b.start_time && b.end_time) {
                const bStart = b.start_time.substring(0, 5);
                const bEnd = b.end_time.substring(0, 5);
                explicitSlots.push({ start: bStart, end: bEnd });
            }
        });

        // 3. Custom periods added by admin
        customPeriods.forEach(cp => {
            if (cp.start && cp.end) {
                explicitSlots.push({ start: cp.start, end: cp.end });
            }
        });

        // Standard baseline template (provides clickable free slots)
        const defaultBaselines = [
            { start: '07:30', end: '08:30' },
            { start: '08:30', end: '09:30' },
            { start: '10:00', end: '11:00' },
            { start: '11:00', end: '12:00' },
            { start: '13:00', end: '14:00' },
            { start: '14:00', end: '15:00' },
            { start: '15:00', end: '16:00' },
            { start: '16:00', end: '17:00' },
        ];

        // Register all explicit slots first
        explicitSlots.forEach(p => {
            const key = `${p.start}-${p.end}`;
            if (!periodMap.has(key)) {
                periodMap.set(key, {
                    id: `slot-${key}`,
                    start: p.start,
                    end: p.end,
                    timeRange12: `${to12Hour(p.start)} – ${to12Hour(p.end)}`,
                    duration: calcDuration(p.start, p.end),
                    isBreak: false,
                    label: null
                });
            }
        });

        // Register baseline slots that do not awkwardly overlap with explicit slots
        defaultBaselines.forEach(p => {
            const key = `${p.start}-${p.end}`;
            if (!periodMap.has(key)) {
                const pStart = toMinutes(p.start);
                const pEnd = toMinutes(p.end);
                const overlapsDifferent = explicitSlots.some(ex => {
                    const exStart = toMinutes(ex.start);
                    const exEnd = toMinutes(ex.end);
                    const isOverlap = Math.max(pStart, exStart) < Math.min(pEnd, exEnd);
                    const isExact = pStart === exStart && pEnd === exEnd;
                    return isOverlap && !isExact;
                });

                if (!overlapsDifferent) {
                    periodMap.set(key, {
                        id: `p-${key}`,
                        start: p.start,
                        end: p.end,
                        timeRange12: `${to12Hour(p.start)} – ${to12Hour(p.end)}`,
                        duration: calcDuration(p.start, p.end),
                        isBreak: false,
                        label: null
                    });
                }
            }
        });

        // Sort chronologically from morning to evening by start time
        return Array.from(periodMap.values()).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    }, [filteredSchedules, customPeriods, breaks]);

    // Handle adding custom time slot
    const handleAddCustomPeriod = (e) => {
        e.preventDefault();
        if (toMinutes(newSlotStart) >= toMinutes(newSlotEnd)) {
            alert('End time must be after start time.');
            return;
        }
        setCustomPeriods(prev => [
            ...prev,
            { start: newSlotStart, end: newSlotEnd, isBreak: false }
        ]);
        setIsAddSlotModalOpen(false);
    };

    // ─── Active Header Title & Meta Description ───────────────────────────────
    const headerTitle = useMemo(() => {
        if (sectionTitle) return sectionTitle;
        if (perspective === 'section') {
            return activeSection ? activeSection.name : `Grade ${selectedGrade}`;
        }
        if (perspective === 'teacher') {
            return activeTeacher ? activeTeacher.name : 'All Assigned Faculty';
        }
        if (perspective === 'classroom') {
            return activeRoom ? `Classroom: ${activeRoom}` : 'All Classrooms';
        }
        return 'School Timetable';
    }, [sectionTitle, perspective, activeSection, selectedGrade, activeTeacher, activeRoom]);

    const headerSub = useMemo(() => {
        const count = filteredSchedules.length;
        return `${count} session${count === 1 ? '' : 's'} • recurring weekly`;
    }, [filteredSchedules]);

    const activeDays = useMemo(() => {
        if (timeRangeMode === 'day') {
            return [activeDayInDayMode];
        }
        return DAYS_OF_WEEK;
    }, [timeRangeMode, activeDayInDayMode]);

    // KPI Summary Metrics
    const totalWeeklySessions = schedules.length;
    const totalActiveSections = classes.length;
    const totalAssignedTeachers = teachers.length;
    const totalAvailableClassrooms = availableRooms.length;
    const totalUnresolvedConflicts = detectedConflicts.length;

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedGrade !== initialGradeWithData) count++;
        if (selectedSectionId !== 'all') count++;
        if (selectedTeacherId !== 'all') count++;
        if (selectedRoom !== 'all') count++;
        if (selectedSubjectId !== 'all') count++;
        if (selectedDayFilter !== 'all') count++;
        if (selectedStatusFilter !== 'all') count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [
        selectedGrade,
        initialGradeWithData,
        selectedSectionId,
        selectedTeacherId,
        selectedRoom,
        selectedSubjectId,
        selectedDayFilter,
        selectedStatusFilter,
        searchQuery
    ]);

    const handleResetFilters = () => {
        setSelectedGrade(initialGradeWithData);
        setSelectedSectionId('all');
        setSelectedTeacherId('all');
        setSelectedRoom('all');
        setSelectedSubjectId('all');
        setSelectedDayFilter('all');
        setSelectedStatusFilter('all');
        setSearchQuery('');
    };

    // Open Interactive Schedule Creation Modal for Free Slot
    const handleOpenSlotModal = (slotData) => {
        if (onSlotClick) {
            onSlotClick(slotData);
        } else {
            setScheduleModalState({
                isOpen: true,
                editingSchedule: null,
                initialData: slotData
            });
        }
    };

    // Open Interactive Schedule Edit Modal
    const handleOpenEditModal = (schedule) => {
        if (onScheduleClick) {
            onScheduleClick(schedule);
        } else {
            setScheduleModalState({
                isOpen: true,
                editingSchedule: schedule,
                initialData: {}
            });
        }
    };

    return (
        <div style={{ fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)', color: '#0F172A' }}>

            {/* ══════════════════════════════════════════════════════════════════
                1. TOP PAGE HEADER & ACADEMIC CONTEXT
               ══════════════════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Academics <span style={{ margin: '0 4px', color: '#CBD5E1' }}>/</span> <span style={{ color: '#0F172A', fontWeight: 600 }}>Timetable</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                            School Timetable
                        </h1>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                            Build, adjust, and review class schedules.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {totalUnresolvedConflicts > 0 ? (
                            <button
                                type="button"
                                onClick={onOpenConflictModal}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                <AlertTriangle size={14} style={{ color: '#DC2626' }} />
                                <span>{totalUnresolvedConflicts} unresolved conflict{totalUnresolvedConflicts > 1 ? 's' : ''}</span>
                            </button>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#F0FDF4',
                                border: '1px solid #BBF7D0',
                                color: '#16A34A',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700
                            }}>
                                <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
                                <span>All schedules conflict-free</span>
                            </div>
                        )}

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onAddScheduleClick) onAddScheduleClick();
                                    else setScheduleModalState({ isOpen: true, editingSchedule: null, initialData: {} });
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: '#0B2545',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '7px 14px',
                                    fontSize: '0.825rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 6px rgba(11,37,69,0.25)'
                                }}
                            >
                                <Plus size={14} />
                                <span>+ Create Schedule</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-header controls: Academic Year & Term Dropdowns + Stage Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Academic year</span>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedYear}
                                onChange={e => setSelectedYear(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    padding: '5px 26px 5px 10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="2026-2027">2026–2027</option>
                                <option value="2025-2026">2025–2026</option>
                                <option value="2027-2028">2027–2028</option>
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedTerm}
                                onChange={e => setSelectedTerm(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    padding: '5px 26px 5px 10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="Term 1">Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Whole Year">Whole Year</option>
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        background: '#E2E8F0',
                        padding: '3px',
                        borderRadius: '8px',
                        gap: '2px'
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedStage('JHS');
                                if (Number(selectedGrade) > 10) setSelectedGrade(10);
                            }}
                            style={{
                                border: 'none',
                                background: selectedStage === 'JHS' ? '#FFFFFF' : 'transparent',
                                color: selectedStage === 'JHS' ? '#0F172A' : '#64748B',
                                fontSize: '0.75rem',
                                fontWeight: selectedStage === 'JHS' ? 700 : 500,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: selectedStage === 'JHS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Junior High • Grades 7–10
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedStage('SHS');
                                if (Number(selectedGrade) <= 10) setSelectedGrade(11);
                            }}
                            style={{
                                border: 'none',
                                background: selectedStage === 'SHS' ? '#FFFFFF' : 'transparent',
                                color: selectedStage === 'SHS' ? '#0F172A' : '#64748B',
                                fontSize: '0.75rem',
                                fontWeight: selectedStage === 'SHS' ? 700 : 500,
                                padding: '4px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: selectedStage === 'SHS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Senior High • Grades 11–12
                        </button>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                2. FIVE UNIFORM SUMMARY KPI CARDS
               ══════════════════════════════════════════════════════════════════ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.85rem',
                marginBottom: '1.25rem'
            }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>Scheduled class sessions</span>
                        <CalendarCheck size={15} style={{ color: '#2563EB' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, margin: '6px 0 2px' }}>
                        {totalWeeklySessions}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Weekly • all JHS/SHS sections</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>Active sections</span>
                        <Layers size={15} style={{ color: '#2563EB' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, margin: '6px 0 2px' }}>
                        {totalActiveSections}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Across Grades 7–12</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>Assigned teachers</span>
                        <Users size={15} style={{ color: '#2563EB' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, margin: '6px 0 2px' }}>
                        {totalAssignedTeachers}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>In this term's draft</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.9rem 1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>Available classrooms</span>
                        <MapPin size={15} style={{ color: '#2563EB' }} />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, margin: '6px 0 2px' }}>
                        {totalAvailableClassrooms}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>In the academic room pool</div>
                </div>

                <div style={{
                    background: totalUnresolvedConflicts > 0 ? '#FEF2F2' : '#FFFFFF',
                    border: totalUnresolvedConflicts > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.9rem 1.1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: totalUnresolvedConflicts > 0 ? '#DC2626' : '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
                        <span>Unresolved conflicts</span>
                        <AlertTriangle size={15} style={{ color: totalUnresolvedConflicts > 0 ? '#DC2626' : '#10B981' }} />
                    </div>
                    <div style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: totalUnresolvedConflicts > 0 ? '#DC2626' : '#059669',
                        lineHeight: 1.2,
                        margin: '6px 0 2px'
                    }}>
                        {totalUnresolvedConflicts}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: totalUnresolvedConflicts > 0 ? '#DC2626' : '#64748B' }}>
                        {totalUnresolvedConflicts > 0 ? 'Teacher / room overlap • blocks publish' : 'Zero scheduling conflicts'}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                3. MAIN TIMETABLE PANEL
               ══════════════════════════════════════════════════════════════════ */}
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                overflow: 'hidden'
            }}>
                {/* ── Header: Context Title, Draft Badge, Switcher & + Add Schedule ── */}
                <div style={{
                    padding: '1.1rem 1.4rem',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                            {headerTitle}
                        </h2>
                        <span style={{
                            background: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            color: '#92400E',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                        }}>
                            Draft
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {headerSub}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Segmented View Switcher: [ Section ] [ Teacher ] [ Classroom ] */}
                        <div style={{
                            display: 'flex',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            padding: '3px',
                            gap: '2px'
                        }}>
                            {[
                                { id: 'section', label: 'Section' },
                                { id: 'teacher', label: 'Teacher' },
                                { id: 'classroom', label: 'Classroom' },
                            ].map(btn => {
                                const isActive = perspective === btn.id;
                                return (
                                    <button
                                        key={btn.id}
                                        type="button"
                                        onClick={() => handleSwitchPerspective(btn.id)}
                                        style={{
                                            border: 'none',
                                            background: isActive ? '#0B2545' : 'transparent',
                                            color: isActive ? '#FFFFFF' : '#475569',
                                            fontSize: '0.78rem',
                                            fontWeight: isActive ? 700 : 500,
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            boxShadow: isActive ? '0 1px 3px rgba(11,37,69,0.3)' : 'none',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {btn.label}
                                    </button>
                                );
                            })}
                        </div>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onAddScheduleClick) onAddScheduleClick();
                                    else setScheduleModalState({ isOpen: true, editingSchedule: null, initialData: {} });
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: '#0B2545',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '7px 14px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 5px rgba(11,37,69,0.2)'
                                }}
                            >
                                <Plus size={14} />
                                <span>+ Add Schedule</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════
                    FACULTY TIMETABLE PROFILE & WORKLOAD BANNER (Requirement 1 & 3)
                   ══════════════════════════════════════════════════════════════════ */}
                {perspective === 'teacher' && activeTeacher && (
                    <div className="mx-4 mt-3 mb-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-md relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute bottom-0 left-1/3 -mb-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Avatar & Identity */}
                            <div className="flex items-center gap-3.5">
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-md ring-2 ring-white/10">
                                        {activeTeacher.name ? activeTeacher.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'FT'}
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white font-bold" title="Active Faculty">
                                        ✓
                                    </span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                            Faculty Timetable View
                                        </span>
                                        {activeTeacher.department && (
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                                {activeTeacher.department}
                                            </span>
                                        )}
                                        <span className="text-[11px] font-medium text-slate-400">
                                            ID: #{activeTeacher.employee_id || activeTeacher.id}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-extrabold tracking-tight text-white mt-0.5">
                                        {activeTeacher.name}
                                    </h2>

                                    <div className="text-xs text-slate-300 flex items-center gap-2.5 mt-0.5 flex-wrap">
                                        <span>{activeTeacher.specialization || 'Secondary Education Faculty'}</span>
                                        {activeTeacher.email && (
                                            <span className="text-slate-400">• {activeTeacher.email}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Workload & Stepper Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                {activeTeacherStats && (
                                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg px-3.5 py-2 min-w-[190px]">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-400 font-medium text-[11px]">Weekly Teaching Load</span>
                                            <span className={`font-bold text-xs ${activeTeacherStats.totalHours > activeTeacherStats.depEdMaxHours ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {activeTeacherStats.totalHours} hrs / {activeTeacherStats.depEdMaxHours}h max
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${activeTeacherStats.totalHours > activeTeacherStats.depEdMaxHours ? 'bg-red-500' : activeTeacherStats.workloadPct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(100, activeTeacherStats.workloadPct)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                            <span>{activeTeacherStats.totalSessions} class sessions</span>
                                            <span>{activeTeacherStats.daysActiveCount} active days</span>
                                        </div>
                                    </div>
                                )}

                                {/* Teacher Stepper */}
                                <div className="flex items-center bg-slate-800/90 border border-slate-700/70 rounded-lg p-0.5 gap-0.5">
                                    <button
                                        type="button"
                                        onClick={() => handleStepTeacher('prev')}
                                        title="Previous Faculty Member"
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                    >
                                        <ChevronLeft size={15} />
                                    </button>
                                    <span className="text-[11px] font-semibold px-1.5 text-slate-300 select-none">
                                        Faculty {((onlyScheduledTeachers ? scheduledTeachers : teachers).findIndex(t => String(t.id) === String(selectedTeacherId)) + 1) || 1} of {(onlyScheduledTeachers ? scheduledTeachers : teachers).length}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleStepTeacher('next')}
                                        title="Next Faculty Member"
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                    >
                                        <ChevronRight size={15} />
                                    </button>
                                </div>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onAddScheduleClick) {
                                                onAddScheduleClick({
                                                    teacher_id: activeTeacher.id,
                                                    day: 'Monday',
                                                    start_time: '07:30',
                                                    end_time: '08:30'
                                                });
                                            } else {
                                                setScheduleModalState({
                                                    isOpen: true,
                                                    editingSchedule: null,
                                                    initialData: { teacherId: activeTeacher.id, day: 'Monday' }
                                                });
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                                    >
                                        <Plus size={14} />
                                        <span>Assign Class</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Search Bar & Display Controls Row (Day/Week & Timetable/List) ── */}
                <div style={{
                    padding: '0.75rem 1.4rem',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '540px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Search grade, section, subject, teacher or classroom..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 10px 6px 32px',
                                fontSize: '0.8rem',
                                border: '1px solid #CBD5E1',
                                borderRadius: '8px',
                                outline: 'none',
                                background: '#FFFFFF',
                                color: '#0F172A'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Dynamic Day Selector Tabs (Independent Day Views) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            padding: '2px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                type="button"
                                onClick={() => setTimeRangeMode('week')}
                                style={{
                                    border: 'none',
                                    background: timeRangeMode === 'week' ? '#FFFFFF' : 'transparent',
                                    color: timeRangeMode === 'week' ? '#1D4ED8' : '#64748B',
                                    fontSize: '0.76rem',
                                    fontWeight: timeRangeMode === 'week' ? 800 : 600,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    boxShadow: timeRangeMode === 'week' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <Calendar size={13} />
                                All Days (Week)
                            </button>
                            {DAYS_OF_WEEK.map(day => {
                                const count = filteredSchedules.filter(s => s.day_of_week === day).length;
                                const isActive = timeRangeMode === 'day' && activeDayInDayMode === day;
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            setTimeRangeMode('day');
                                            setActiveDayInDayMode(day);
                                        }}
                                        style={{
                                            border: 'none',
                                            background: isActive ? '#FFFFFF' : 'transparent',
                                            color: isActive ? '#1D4ED8' : '#475569',
                                            fontSize: '0.76rem',
                                            fontWeight: isActive ? 800 : 600,
                                            padding: '4px 9px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span>{day}</span>
                                        <span style={{
                                            fontSize: '0.67rem',
                                            padding: '1px 5px',
                                            borderRadius: '8px',
                                            background: isActive ? '#DBEAFE' : '#E2E8F0',
                                            color: isActive ? '#1E40AF' : '#64748B',
                                            fontWeight: 700
                                        }}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Timetable Grid vs List */}
                        <div style={{
                            display: 'flex',
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: '8px',
                            padding: '2px',
                            gap: '2px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setDisplayMode('timetable')}
                                style={{
                                    border: 'none',
                                    background: displayMode === 'timetable' ? '#FFFFFF' : 'transparent',
                                    color: displayMode === 'timetable' ? '#0F172A' : '#64748B',
                                    fontSize: '0.76rem',
                                    fontWeight: displayMode === 'timetable' ? 700 : 500,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    boxShadow: displayMode === 'timetable' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                Timetable
                            </button>
                            <button
                                type="button"
                                onClick={() => setDisplayMode('list')}
                                style={{
                                    border: 'none',
                                    background: displayMode === 'list' ? '#FFFFFF' : 'transparent',
                                    color: displayMode === 'list' ? '#0F172A' : '#64748B',
                                    fontSize: '0.76rem',
                                    fontWeight: displayMode === 'list' ? 700 : 500,
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    boxShadow: displayMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Compact Filter Row: Grade Dropdown & Context Filters ── */}
                <div style={{
                    padding: '0.65rem 1.4rem',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    background: '#FAFAFA'
                }}>
                    {/* Grade Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedGrade}
                            onChange={e => {
                                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                                setSelectedGrade(val);
                            }}
                            style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '7px',
                                padding: '5px 26px 5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#0F172A',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <optgroup label="Junior High School (7–10)">
                                <option value={7}>Grade: 7</option>
                                <option value={8}>Grade: 8</option>
                                <option value={9}>Grade: 9</option>
                                <option value={10}>Grade: 10</option>
                            </optgroup>
                            <optgroup label="Senior High School (11–12)">
                                <option value={11}>Grade: 11</option>
                                <option value={12}>Grade: 12</option>
                            </optgroup>
                            <option value="all">Grade: All</option>
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                    </div>

                    {/* Contextual Selector */}
                    {perspective === 'section' && (
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedSectionId}
                                onChange={e => setSelectedSectionId(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    padding: '5px 26px 5px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    maxWidth: '190px'
                                }}
                            >
                                <option value="all">Section: All ({availableSectionsForGrade.length})</option>
                                {availableSectionsForGrade.map(sec => (
                                    <option key={sec.id} value={sec.id}>
                                        Section: {sec.section || sec.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                        </div>
                    )}

                    {perspective === 'teacher' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedTeacherId}
                                    onChange={e => setSelectedTeacherId(e.target.value)}
                                    style={{
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        background: '#FFFFFF',
                                        border: '1.5px solid #2563EB',
                                        borderRadius: '7px',
                                        padding: '5px 28px 5px 10px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        color: '#0F172A',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        maxWidth: '260px'
                                    }}
                                >
                                    <optgroup label={`Faculty with Scheduled Classes (${scheduledTeachers.length})`}>
                                        {scheduledTeachers.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.scheduleCount} classes)
                                            </option>
                                        ))}
                                    </optgroup>
                                    {!onlyScheduledTeachers && unscheduledTeachers.length > 0 && (
                                        <optgroup label={`Faculty without Schedules (${unscheduledTeachers.length})`}>
                                            {unscheduledTeachers.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name} (0 classes)
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                                <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#2563EB' }} />
                            </div>

                            <button
                                type="button"
                                onClick={() => setOnlyScheduledTeachers(prev => !prev)}
                                title={onlyScheduledTeachers ? "Showing faculty with scheduled classes. Click to include unscheduled faculty." : "Showing all faculty. Click to show scheduled only."}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: onlyScheduledTeachers ? '#EFF6FF' : '#F1F5F9',
                                    border: `1px solid ${onlyScheduledTeachers ? '#BFDBFE' : '#CBD5E1'}`,
                                    color: onlyScheduledTeachers ? '#1D4ED8' : '#64748B',
                                    borderRadius: '7px',
                                    padding: '5px 9px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Filter size={12} />
                                <span>{onlyScheduledTeachers ? `Active Only (${scheduledTeachers.length})` : `All Faculty (${teachers.length})`}</span>
                            </button>
                        </div>
                    )}

                    {perspective === 'classroom' && (
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedRoom}
                                onChange={e => setSelectedRoom(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    padding: '5px 26px 5px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    maxWidth: '190px'
                                }}
                            >
                                <option value="all">Classroom: All ({availableRooms.length})</option>
                                {availableRooms.map(rm => (
                                    <option key={rm} value={rm}>Classroom: {rm}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                        </div>
                    )}

                    {/* Subject Filter */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedSubjectId}
                            onChange={e => setSelectedSubjectId(e.target.value)}
                            style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '7px',
                                padding: '5px 26px 5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#0F172A',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">Subject: All</option>
                            {availableSubjects.map(s => (
                                <option key={s.id} value={s.id}>Subject: {s.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                    </div>

                    {/* Secondary Filters */}
                    {perspective !== 'teacher' && (
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    padding: '5px 26px 5px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    maxWidth: '180px'
                                }}
                            >
                                <option value="all">Teacher: All</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>Teacher: {t.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                        </div>
                    )}

                    {perspective !== 'classroom' && (
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedRoom}
                                onChange={e => setSelectedRoom(e.target.value)}
                                style={{
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '7px',
                                    padding: '5px 26px 5px 10px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    color: '#0F172A',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="all">Classroom: All</option>
                                {availableRooms.map(rm => (
                                    <option key={rm} value={rm}>Classroom: {rm}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                        </div>
                    )}

                    {/* Day Filter */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedDayFilter}
                            onChange={e => setSelectedDayFilter(e.target.value)}
                            style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '7px',
                                padding: '5px 26px 5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#0F172A',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">Day: All</option>
                            {DAYS_OF_WEEK.map(d => (
                                <option key={d} value={d}>Day: {d}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                    </div>

                    {/* Status Filter */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedStatusFilter}
                            onChange={e => setSelectedStatusFilter(e.target.value)}
                            style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '7px',
                                padding: '5px 26px 5px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: '#0F172A',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="all">Status: All</option>
                            <option value="scheduled">Status: Scheduled</option>
                            <option value="conflict">Status: Conflicted</option>
                        </select>
                        <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }} />
                    </div>
                </div>

                {/* ── Active Filters & Legend Sub-bar ── */}
                <div style={{
                    padding: '0.55rem 1.4rem',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#64748B'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Filter size={12} />
                            <span>{activeFiltersCount} active filter{activeFiltersCount === 1 ? '' : 's'}</span>
                        </span>
                        {activeFiltersCount > 0 && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#2563EB',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: '0 4px',
                                    textDecoration: 'underline'
                                }}
                            >
                                Reset filters
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}></span>
                            <span>Scheduled</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#FFFFFF', border: '1px dashed #CBD5E1' }}></span>
                            <span>Free</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}></span>
                            <span>Break</span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#FEF2F2', border: '1px solid #EF4444' }}></span>
                            <span style={{ color: '#DC2626', fontWeight: 600 }}>Conflict</span>
                        </span>
                    </div>
                </div>

                {/* ── Dynamic Template Banner with "+ Add Custom Time Slot" Button ── */}
                <div style={{
                    padding: '0.45rem 1.4rem',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.73rem',
                    color: '#64748B',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={12} style={{ color: '#0B2545' }} />
                        <span>
                            Configured timetable schedule: <strong style={{ color: '#0F172A' }}>{dynamicPeriods.length} Time Slots</strong> • 12-Hour AM/PM Format
                        </span>
                    </div>

                    {isAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setIsAddSlotModalOpen(true)}
                                style={{
                                    border: '1px solid #0B2545',
                                    background: '#FFFFFF',
                                    color: '#0B2545',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}
                            >
                                <Plus size={12} />
                                <span>+ Add Custom Time Slot</span>
                            </button>

                            {onOpenConfigureTemplates && (
                                <button
                                    type="button"
                                    onClick={onOpenConfigureTemplates}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#0B2545',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                    }}
                                >
                                    <span>Configure Template Breaks</span>
                                    <ExternalLink size={11} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Day Mode Navigation (when timeRangeMode === 'day') ── */}
                {timeRangeMode === 'day' && (
                    <div style={{
                        padding: '0.55rem 1.4rem',
                        background: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const idx = DAYS_OF_WEEK.indexOf(activeDayInDayMode);
                                    const prev = DAYS_OF_WEEK[(idx - 1 + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length];
                                    setActiveDayInDayMode(prev);
                                }}
                                style={{ border: '1px solid #CBD5E1', background: '#FFFFFF', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                title="Previous Day"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                                {activeDayInDayMode} Timetable
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const idx = DAYS_OF_WEEK.indexOf(activeDayInDayMode);
                                    const next = DAYS_OF_WEEK[(idx + 1) % DAYS_OF_WEEK.length];
                                    setActiveDayInDayMode(next);
                                }}
                                style={{ border: '1px solid #CBD5E1', background: '#FFFFFF', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                title="Next Day"
                            >
                                <ChevronRight size={14} />
                            </button>
                            <span style={{ fontSize: '0.78rem', color: '#64748B', marginLeft: '6px', fontWeight: 600 }}>
                                {filteredSchedules.filter(s => s.day_of_week === activeDayInDayMode).length} session(s) scheduled
                            </span>
                        </div>

                        {isAdmin && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleOpenSlotModal({
                                        day: activeDayInDayMode,
                                        start_time: '07:30',
                                        end_time: '08:30',
                                        targetClass: activeSection,
                                        teacherId: selectedTeacherId !== 'all' ? selectedTeacherId : null,
                                        room: selectedRoom !== 'all' ? selectedRoom : (activeSection?.room || 'Room 101')
                                    })}
                                    style={{
                                        border: '1px solid #2563EB',
                                        background: '#2563EB',
                                        color: '#FFFFFF',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        fontSize: '0.74rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <Plus size={13} />
                                    + Add {activeDayInDayMode} Class
                                </button>
                                {onOpenBreakModal && (
                                    <button
                                        type="button"
                                        onClick={onOpenBreakModal}
                                        style={{
                                            border: '1px solid #FCD34D',
                                            background: '#FFFBEB',
                                            color: '#B45309',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Coffee size={13} />
                                        + Break on {activeDayInDayMode}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    4. TIMETABLE GRID (12-HOUR FORMAT & DYNAMIC PERIODS)
                   ══════════════════════════════════════════════════════════════════ */}
                {displayMode === 'timetable' ? (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            minWidth: activeDays.length === 1 ? '520px' : '960px'
                        }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                                    <th style={{
                                        width: '150px',
                                        padding: '10px 14px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        color: '#64748B',
                                        textTransform: 'uppercase',
                                        textAlign: 'left',
                                        letterSpacing: '0.04em'
                                    }}>
                                        TIME (12-HOUR)
                                    </th>
                                    {activeDays.map(day => (
                                        <th
                                            key={day}
                                            style={{
                                                padding: '10px 12px',
                                                fontSize: '0.76rem',
                                                fontWeight: 800,
                                                color: '#0F172A',
                                                textAlign: 'left',
                                                borderLeft: '1px solid #E2E8F0'
                                            }}
                                        >
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dynamicPeriods.map((period) => {
                                    return (
                                        <tr key={period.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            {/* Time Column (12-Hour AM/PM) */}
                                            <td style={{
                                                padding: '10px 14px',
                                                verticalAlign: 'top',
                                                background: '#FFFFFF'
                                            }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                                                    {period.timeRange12}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                                                    {period.duration}
                                                </div>
                                            </td>

                                            {/* Day Columns (Independently Managed) */}
                                            {activeDays.map(day => {
                                                const slotSessions = filteredSchedules.filter(s =>
                                                    s.day_of_week === day && doesPeriodOverlap(period, s)
                                                );
                                                const slotBreaks = breaks.filter(b =>
                                                    (!b.day_of_week || b.day_of_week === 'all' || b.day_of_week === day) &&
                                                    doesPeriodOverlap(period, b)
                                                );

                                                return (
                                                    <td
                                                        key={day}
                                                        style={{
                                                            padding: '6px 8px',
                                                            verticalAlign: 'top',
                                                            borderLeft: '1px solid #E2E8F0',
                                                            background: slotSessions.length === 0 && slotBreaks.length === 0 ? '#FFFFFF' : '#FAFAFA'
                                                        }}
                                                    >
                                                        {/* Render Dynamic Break Cards */}
                                                        {slotBreaks.map(b => (
                                                            <div
                                                                key={`brk-${b.id || b.name}`}
                                                                style={{
                                                                    background: '#FEF3C7',
                                                                    border: '1px solid #FDE68A',
                                                                    borderLeft: '4px solid #D97706',
                                                                    borderRadius: '7px',
                                                                    padding: '7px 9px',
                                                                    marginBottom: slotSessions.length > 0 ? '6px' : '0'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#92400E' }}>
                                                                        <Coffee size={13} style={{ color: '#D97706' }} />
                                                                        <span>{b.name || 'Break Period'}</span>
                                                                    </span>
                                                                    {isAdmin && onDeleteBreak && b.id && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (confirm(`Remove break "${b.name}"?`)) {
                                                                                    onDeleteBreak(b.id);
                                                                                }
                                                                            }}
                                                                            title="Remove Break"
                                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#B45309', padding: '1px' }}
                                                                        >
                                                                            <X size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '0.69rem', color: '#B45309', marginTop: '2px', fontWeight: 600 }}>
                                                                    {to12Hour(b.start_time)} – {to12Hour(b.end_time)}
                                                                    {b.day_of_week && b.day_of_week !== 'all' ? ` (${b.day_of_week})` : ''}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Render Academic Classes */}
                                                        {slotSessions.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                {slotSessions.map(session => {
                                                                    const isConflicted = conflictedScheduleIds.has(session.id) || slotBreaks.length > 0;
                                                                    const isContinuation = session.start_time && toMinutes(session.start_time) < toMinutes(period.start);

                                                                    if (isContinuation) {
                                                                        return (
                                                                            <div
                                                                                key={`cont-${session.id}`}
                                                                                onClick={() => setSelectedDetailSchedule(session)}
                                                                                style={{
                                                                                    background: '#F0FDF4',
                                                                                    border: '1px dashed #86EFAC',
                                                                                    borderLeft: '3.5px solid #16A34A',
                                                                                    borderRadius: '7px',
                                                                                    padding: '5px 8px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.73rem',
                                                                                    color: '#15803D',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '5px',
                                                                                    transition: 'all 0.15s ease'
                                                                                }}
                                                                                title="Continuing multi-hour session • Click to inspect details"
                                                                            >
                                                                                <Clock size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
                                                                                <span style={{ fontWeight: 700 }}>
                                                                                    ↳ Continued: {session.subject?.name || session.subject?.code} ({session.school_class?.name || session.schoolClass?.name || 'Class'}) until {to12Hour(session.end_time)}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <div
                                                                            key={session.id}
                                                                            onClick={() => setSelectedDetailSchedule(session)}
                                                                            style={{
                                                                                background: isConflicted ? '#FEF2F2' : '#EFF6FF',
                                                                                border: isConflicted ? '1.5px solid #EF4444' : '1px solid #BFDBFE',
                                                                                borderLeft: isConflicted ? '4px solid #DC2626' : '3.5px solid #2563EB',
                                                                                borderRadius: '7px',
                                                                                padding: '7px 9px',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.15s ease'
                                                                            }}
                                                                            onMouseEnter={e => {
                                                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)';
                                                                            }}
                                                                            onMouseLeave={e => {
                                                                                e.currentTarget.style.transform = 'none';
                                                                                e.currentTarget.style.boxShadow = 'none';
                                                                            }}
                                                                            title={isConflicted ? 'Scheduling conflict or break overlap detected • Click to inspect complete details' : 'Click to inspect complete schedule details'}
                                                                        >
                                                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4px' }}>
                                                                                <div style={{
                                                                                    fontSize: '0.82rem',
                                                                                    fontWeight: 800,
                                                                                    color: isConflicted ? '#B91C1C' : '#0F172A',
                                                                                    lineHeight: 1.25
                                                                                }}>
                                                                                    {session.subject?.name || session.subject?.code || 'Academic Subject'}
                                                                                </div>
                                                                                {isConflicted && (
                                                                                    <AlertTriangle size={13} style={{ color: '#DC2626', flexShrink: 0, marginTop: '1px' }} />
                                                                                )}
                                                                            </div>

                                                                            <div style={{
                                                                                fontSize: '0.73rem',
                                                                                color: isConflicted ? '#991B1B' : '#475569',
                                                                                marginTop: '3px',
                                                                                fontWeight: 600,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '4px'
                                                                            }}>
                                                                                {perspective === 'teacher' ? (
                                                                                    <>
                                                                                        <GraduationCap size={12} style={{ color: '#2563EB', flexShrink: 0 }} />
                                                                                        <span>{session.school_class?.name || session.schoolClass?.name || 'Class Section'}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <span>{session.teacher?.name || 'Assigned Instructor'}</span>
                                                                                )}
                                                                            </div>

                                                                            <div style={{
                                                                                fontSize: '0.7rem',
                                                                                color: isConflicted ? '#DC2626' : '#64748B',
                                                                                marginTop: '3px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'space-between',
                                                                                gap: '4px'
                                                                            }}>
                                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                                    {perspective === 'classroom' ? (
                                                                                        session.school_class?.name || 'Class Section'
                                                                                    ) : (
                                                                                        <>
                                                                                            <MapPin size={11} style={{ color: '#64748B', flexShrink: 0 }} />
                                                                                            <span>{session.room || 'Room TBA'}</span>
                                                                                        </>
                                                                                    )}
                                                                                </span>
                                                                                <span style={{
                                                                                    fontSize: '0.67rem',
                                                                                    fontWeight: 700,
                                                                                    color: '#1D4ED8',
                                                                                    background: '#DBEAFE',
                                                                                    padding: '1px 5px',
                                                                                    borderRadius: '4px',
                                                                                    whiteSpace: 'nowrap'
                                                                                }}>
                                                                                    {calcDuration(session.start_time, session.end_time)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : slotBreaks.length === 0 ? (
                                                            // Clickable Free Period slot to assign schedule
                                                            <div
                                                                onClick={() => {
                                                                    handleOpenSlotModal({
                                                                        day,
                                                                        period,
                                                                        start_time: period.start,
                                                                        end_time: period.end,
                                                                        targetClass: activeSection,
                                                                        teacherId: activeTeacher ? activeTeacher.id : (selectedTeacherId !== 'all' ? selectedTeacherId : null),
                                                                        room: selectedRoom !== 'all' ? selectedRoom : (activeSection?.room || 'Room 101')
                                                                    });
                                                                }}
                                                                style={{
                                                                    height: '100%',
                                                                    minHeight: '62px',
                                                                    border: '1px dashed #E2E8F0',
                                                                    borderRadius: '7px',
                                                                    padding: '7px',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'flex-start',
                                                                    cursor: isAdmin ? 'pointer' : 'default',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                onMouseEnter={e => {
                                                                    if (isAdmin) {
                                                                        e.currentTarget.style.background = '#F8FAFC';
                                                                        e.currentTarget.style.borderColor = '#93C5FD';
                                                                    }
                                                                }}
                                                                onMouseLeave={e => {
                                                                    if (isAdmin) {
                                                                        e.currentTarget.style.background = 'transparent';
                                                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                                                    }
                                                                }}
                                                            >
                                                                <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#94A3B8' }}>
                                                                    + Free period
                                                                </div>
                                                                <div style={{ fontSize: '0.67rem', color: '#CBD5E1', marginTop: '1px' }}>
                                                                    Available for scheduling
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: '#F8FAFC', borderTop: '1.5px solid #CBD5E1' }}>
                                    <td colSpan={activeDays.length + 1} style={{ padding: '10px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.77rem', color: '#64748B' }}>
                                                <Sparkles size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
                                                <span>
                                                    <strong>Dynamic Timetable Engine:</strong> Add, edit, or extend sessions (e.g. 5:00–6:00 PM) at any time. Changes on {timeRangeMode === 'day' ? activeDayInDayMode : 'one day'} never affect other days.
                                                </span>
                                            </div>
                                            {isAdmin && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddSlotModalOpen(true)}
                                                        style={{
                                                            border: '1px dashed #94A3B8',
                                                            background: '#FFFFFF',
                                                            color: '#334155',
                                                            borderRadius: '6px',
                                                            padding: '4px 10px',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <Clock size={13} />
                                                        + Extend Timetable Slot
                                                    </button>
                                                    {onOpenBreakModal && (
                                                        <button
                                                            type="button"
                                                            onClick={onOpenBreakModal}
                                                            style={{
                                                                border: '1px solid #FCD34D',
                                                                background: '#FFFBEB',
                                                                color: '#B45309',
                                                                borderRadius: '6px',
                                                                padding: '4px 10px',
                                                                fontSize: '0.74rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <Coffee size={13} />
                                                            + Configure Breaks
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    /* ── List Mode with 12-Hour Times ── */
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800 }}>
                                    <th style={{ padding: '10px 14px' }}>Day</th>
                                    <th style={{ padding: '10px 14px' }}>Time Slot (12H)</th>
                                    <th style={{ padding: '10px 14px' }}>Subject</th>
                                    <th style={{ padding: '10px 14px' }}>Instructor</th>
                                    <th style={{ padding: '10px 14px' }}>Section</th>
                                    <th style={{ padding: '10px 14px' }}>Room</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSchedules.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                                            No scheduled sessions matching the active filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSchedules.map(session => {
                                        const isConflicted = conflictedScheduleIds.has(session.id);
                                        return (
                                            <tr
                                                key={session.id}
                                                onClick={() => setSelectedDetailSchedule(session)}
                                                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.12s ease' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                title="Click to view complete schedule details"
                                            >
                                                <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.8rem', color: '#0F172A' }}>
                                                    {session.day_of_week}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.76rem', color: '#475569' }}>
                                                    {to12Hour(session.start_time)} – {to12Hour(session.end_time)}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                                                    {session.subject?.name || session.subject?.code}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#334155' }}>
                                                    {session.teacher?.name}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#334155' }}>
                                                    {session.school_class?.name || session.schoolClass?.name}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: '#64748B' }}>
                                                    {session.room || 'TBA'}
                                                </td>
                                                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                                    {isConflicted ? (
                                                        <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '5px' }}>
                                                            Conflict
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: '5px' }}>
                                                            Scheduled
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Teacher Empty State (Requirement 3 & 5) */}
                {perspective === 'teacher' && filteredSchedules.length === 0 && (
                    <div style={{
                        margin: '1.5rem',
                        padding: '2.5rem 1.5rem',
                        background: '#F8FAFC',
                        border: '2px dashed #CBD5E1',
                        borderRadius: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <Calendar size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
                            No Scheduled Classes for {activeTeacher?.name || 'Selected Faculty Member'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                            This faculty member currently has no assigned class periods on their timetable. You can click any free period slot above or use the button below to assign a class.
                        </p>
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onAddScheduleClick) {
                                        onAddScheduleClick({
                                            teacher_id: activeTeacher?.id,
                                            day: 'Monday',
                                            start_time: '07:30',
                                            end_time: '08:30'
                                        });
                                    } else {
                                        setScheduleModalState({
                                            isOpen: true,
                                            editingSchedule: null,
                                            initialData: { teacherId: activeTeacher?.id, day: 'Monday' }
                                        });
                                    }
                                }}
                                style={{
                                    background: '#0B2545',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 18px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 6px rgba(11,37,69,0.2)'
                                }}
                            >
                                <Plus size={16} />
                                <span>Assign First Class Schedule</span>
                            </button>
                        )}
                    </div>
                )}

                {/* ── Timetable Footer ── */}
                <div style={{
                    padding: '0.65rem 1.4rem',
                    background: '#FAFAFA',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: '#94A3B8'
                }}>
                    <span>Dynamic schedule timetable • Configurable 12-hour period slots.</span>
                    <span>↔ Scroll horizontally on smaller screens</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                5. BOTTOM CONFLICT ALERT BANNER
               ══════════════════════════════════════════════════════════════════ */}
            {detectedConflicts.length > 0 && (
                <div style={{
                    marginTop: '1.25rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '280px' }}>
                        <AlertTriangle size={18} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#B91C1C' }}>
                                {detectedConflicts[0].type === 'teacher_overlap' ? 'Teacher overlap' : 'Room overlap'} • {detectedConflicts[0].day}, {detectedConflicts[0].time} • Publishing blocked
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#7F1D1D', marginTop: '2px', lineHeight: 1.4 }}>
                                {detectedConflicts[0].message} Assign another teacher or move one session to a free period.
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenConflictModal}
                        style={{
                            border: '1px solid #DC2626',
                            background: '#FFFFFF',
                            color: '#DC2626',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            padding: '6px 14px',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <span>Review conflict</span>
                        <ChevronRight size={13} />
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                6. BOTTOM PUBLISHED BASELINE STATUS BAR
               ══════════════════════════════════════════════════════════════════ */}
            <div style={{
                marginTop: '1rem',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A' }}>
                        Working draft v3 – Published baseline v2
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                        Review changes before publishing. The published timetable remains unchanged.
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {totalUnresolvedConflicts > 0 ? (
                        <span style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px'
                        }}>
                            Resolve {totalUnresolvedConflicts} hard conflict{totalUnresolvedConflicts > 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span style={{
                            background: '#F0FDF4',
                            color: '#16A34A',
                            border: '1px solid #BBF7D0',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px'
                        }}>
                            ✓ 0 conflicts
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => window.print()}
                        style={{
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#334155',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '6px 12px',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        <FileText size={13} />
                        <span>Review changes</span>
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            disabled={totalUnresolvedConflicts > 0}
                            style={{
                                border: 'none',
                                background: totalUnresolvedConflicts > 0 ? '#94A3B8' : '#0B2545',
                                color: '#FFFFFF',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '6px 14px',
                                borderRadius: '7px',
                                cursor: totalUnresolvedConflicts > 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                            onClick={() => {
                                alert('Timetable baseline published successfully to all portals!');
                            }}
                        >
                            <Lock size={13} />
                            <span>Publish timetable</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                7. ADD CUSTOM TIME SLOT MODAL (Future-Proof 24H Expansion)
               ══════════════════════════════════════════════════════════════════ */}
            {isAddSlotModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15,23,42,0.6)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '440px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                                + Add Custom Timetable Slot
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddSlotModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddCustomPeriod} style={{ padding: '1.25rem' }}>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#64748B' }}>
                                Configure an additional time slot (e.g. evening class 06:00 PM – 07:00 PM or extended remedial period).
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                        Start Time (12H) *
                                    </label>
                                    <input
                                        type="time"
                                        value={newSlotStart}
                                        onChange={e => setNewSlotStart(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '7px',
                                            border: '1.5px solid #CBD5E1',
                                            fontSize: '0.85rem',
                                            fontWeight: 700
                                        }}
                                        required
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600 }}>
                                        {to12Hour(newSlotStart)}
                                    </span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                        End Time (12H) *
                                    </label>
                                    <input
                                        type="time"
                                        value={newSlotEnd}
                                        onChange={e => setNewSlotEnd(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '7px',
                                            border: '1.5px solid #CBD5E1',
                                            fontSize: '0.85rem',
                                            fontWeight: 700
                                        }}
                                        required
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600 }}>
                                        {to12Hour(newSlotEnd)}
                                    </span>
                                </div>
                            </div>

                            <div style={{
                                padding: '8px 12px',
                                background: '#EFF6FF',
                                borderRadius: '7px',
                                marginBottom: '1rem',
                                fontSize: '0.75rem',
                                color: '#1D4ED8',
                                fontWeight: 700
                            }}>
                                ⏱ New Period Duration: {calcDuration(newSlotStart, newSlotEnd)}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddSlotModalOpen(false)}
                                    style={{
                                        border: '1px solid #CBD5E1',
                                        background: '#FFFFFF',
                                        color: '#475569',
                                        padding: '7px 14px',
                                        borderRadius: '7px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        border: 'none',
                                        background: '#0B2545',
                                        color: '#FFFFFF',
                                        padding: '7px 16px',
                                        borderRadius: '7px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    + Add Slot to Timetable
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                8. EMBEDDED INTERACTIVE SCHEDULE MODAL (Fall-back standalone)
               ══════════════════════════════════════════════════════════════════ */}
            {scheduleModalState.isOpen && (
                <InteractiveScheduleModal
                    isOpen={scheduleModalState.isOpen}
                    onClose={() => setScheduleModalState({ isOpen: false, editingSchedule: null, initialData: {} })}
                    editingSchedule={scheduleModalState.editingSchedule}
                    initialData={scheduleModalState.initialData}
                    classes={classes}
                    teachers={teachers}
                    loads={loads}
                    schedules={schedules}
                    onSave={(payload) => {
                        // Handled by parent or default
                        alert(`Schedule saved: ${payload.start_time} - ${payload.end_time}`);
                        setScheduleModalState({ isOpen: false, editingSchedule: null, initialData: {} });
                    }}
                />
            )}

            {/* ══════════════════════════════════════════════════════════════════
                9. CLICKABLE SCHEDULE BLOCK DETAIL MODAL (Requirement 4)
               ══════════════════════════════════════════════════════════════════ */}
            <ScheduleDetailModal
                isOpen={Boolean(selectedDetailSchedule)}
                schedule={selectedDetailSchedule}
                onClose={() => setSelectedDetailSchedule(null)}
                onEdit={(sched) => {
                    setSelectedDetailSchedule(null);
                    if (onEditSchedule) {
                        onEditSchedule(sched);
                    } else {
                        handleOpenEditModal(sched);
                    }
                }}
                onDelete={onDeleteSchedule ? (schedId) => {
                    setSelectedDetailSchedule(null);
                    onDeleteSchedule(schedId);
                } : undefined}
                isAdmin={isAdmin}
                academicYear={selectedYear}
                term={selectedTerm}
            />

        </div>
    );
}
