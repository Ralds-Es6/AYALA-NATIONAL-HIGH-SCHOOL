import React, { useState, useEffect, useMemo } from 'react';
import {
    Calendar,
    Clock,
    BookOpen,
    User,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    X,
    Plus,
    Coffee,
    Sparkles,
    Layers,
    Info,
    CalendarCheck,
    GraduationCap,
    Check
} from 'lucide-react';
import Modal from '../Modal';

// ─── Time Helper Utilities (12-Hour AM/PM <-> 24-Hour SQL) ───────────────────
export const to12Hour = (timeStr) => {
    if (!timeStr) return '';
    const clean = timeStr.substring(0, 5);
    const [hStr, mStr] = clean.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const to24Hour = (time12Str) => {
    if (!time12Str) return '07:30';
    const parts = time12Str.trim().split(' ');
    if (parts.length < 2) return time12Str.substring(0, 5);
    const [time, ampm] = parts;
    let [h, m] = time.split(':').map(Number);
    if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const clean = timeStr.includes(' ') ? to24Hour(timeStr) : timeStr.substring(0, 5);
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

export const calcDuration = (start24, end24) => {
    if (!start24 || !end24) return '';
    const sMin = toMinutes(start24);
    const eMin = toMinutes(end24);
    const diff = Math.max(0, eMin - sMin);
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${hrs} hr ${mins} min${mins > 1 ? 's' : ''}`;
};

// Generates standard 12-hour intervals for dropdowns: 06:00 AM to 10:00 PM (every 15/30 mins)
export const TIME_12H_OPTIONS = (() => {
    const opts = [];
    for (let h = 6; h <= 22; h++) {
        for (let m = 0; m < 60; m += 15) {
            const h24 = String(h).padStart(2, '0');
            const m24 = String(m).padStart(2, '0');
            const time24 = `${h24}:${m24}`;
            opts.push({
                value24: time24,
                label12: to12Hour(time24)
            });
        }
    }
    return opts;
})();

const DAYS_OF_WEEK = [
    { key: 'Monday', label: 'Mon', full: 'Monday' },
    { key: 'Tuesday', label: 'Tue', full: 'Tuesday' },
    { key: 'Wednesday', label: 'Wed', full: 'Wednesday' },
    { key: 'Thursday', label: 'Thu', full: 'Thursday' },
    { key: 'Friday', label: 'Fri', full: 'Friday' },
    { key: 'Saturday', label: 'Sat', full: 'Saturday' }
];

// ─── InteractiveScheduleModal Component ───────────────────────────────────────
export default function InteractiveScheduleModal({
    isOpen,
    onClose,
    editingSchedule = null,
    initialData = {},
    classes = [],
    teachers = [],
    subjects = [],
    loads = [],
    onSave,
    isSubmitting = false,
    schedules = [],
}) {
    // ─── Form State ───────────────────────────────────────────────────────────
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTeacherId, setSelectedTeacherId] = useState('');
    const [room, setRoom] = useState('Room 101');
    const [selectedDays, setSelectedDays] = useState(['Monday']);
    const [startTime24, setStartTime24] = useState('07:30');
    const [endTime24, setEndTime24] = useState('08:30');
    const [sessionType, setSessionType] = useState('lecture');
    const [notes, setNotes] = useState('');
    const [editScope, setEditScope] = useState('single'); // 'single' or 'all_selected'

    // ─── Sync when modal opens or editingSchedule changes ──────────────────────
    useEffect(() => {
        if (isOpen) {
            if (editingSchedule) {
                // Editing existing schedule
                setSelectedClassId(editingSchedule.school_class_id ? String(editingSchedule.school_class_id) : '');
                setSelectedSubjectId(editingSchedule.subject_id ? String(editingSchedule.subject_id) : '');
                setSelectedTeacherId(editingSchedule.teacher_id ? String(editingSchedule.teacher_id) : '');
                setRoom(editingSchedule.room || 'Room 101');
                setSelectedDays([editingSchedule.day_of_week || 'Monday']);
                setStartTime24((editingSchedule.start_time || '07:30:00').substring(0, 5));
                setEndTime24((editingSchedule.end_time || '08:30:00').substring(0, 5));
                setSessionType(editingSchedule.session_type || 'lecture');
                setNotes(editingSchedule.notes || '');
                setEditScope('single');
            } else {
                // Creating new schedule
                const defaultClassId = initialData.targetClass?.id 
                    ? String(initialData.targetClass.id) 
                    : (classes[0]?.id ? String(classes[0].id) : '');
                
                setSelectedClassId(defaultClassId);
                setSelectedDays(initialData.day ? [initialData.day] : ['Monday']);
                setStartTime24(initialData.start_time ? initialData.start_time.substring(0, 5) : '07:30');
                setEndTime24(initialData.end_time ? initialData.end_time.substring(0, 5) : '08:30');
                setRoom(initialData.room || initialData.targetClass?.room || 'Room 101');
                setSessionType('lecture');
                setNotes('');
                setEditScope('single');

                // If initial teacher provided
                if (initialData.teacherId) {
                    setSelectedTeacherId(String(initialData.teacherId));
                } else if (teachers[0]?.id) {
                    setSelectedTeacherId(String(teachers[0].id));
                } else {
                    setSelectedTeacherId('');
                }

                // If class has existing loads, pick first load subject/teacher
                const classLoads = loads.filter(l => String(l.school_class_id) === String(defaultClassId));
                if (classLoads.length > 0) {
                    setSelectedSubjectId(String(classLoads[0].subject_id));
                    if (!initialData.teacherId && classLoads[0].teacher_id) {
                        setSelectedTeacherId(String(classLoads[0].teacher_id));
                    }
                } else if (subjects[0]) {
                    setSelectedSubjectId(String(subjects[0].id));
                } else if (loads[0]) {
                    setSelectedSubjectId(String(loads[0].subject_id));
                }
            }
        }
    }, [isOpen, editingSchedule, initialData, classes, teachers, subjects, loads]);

    // Available subjects list derived from subjects prop and loads
    const availableSubjects = useMemo(() => {
        const map = new Map();
        // Priority 1: Loads assigned to this class
        loads.forEach(l => {
            if (l.subject && (!selectedClassId || String(l.school_class_id) === String(selectedClassId))) {
                map.set(String(l.subject.id), {
                    id: String(l.subject.id),
                    name: l.subject.name,
                    code: l.subject.code,
                    teacher_id: l.teacher_id
                });
            }
        });
        // Priority 2: All school subjects passed in
        if (subjects && subjects.length > 0) {
            subjects.forEach(s => {
                if (!map.has(String(s.id))) {
                    map.set(String(s.id), {
                        id: String(s.id),
                        name: s.name,
                        code: s.code || '',
                        teacher_id: null
                    });
                }
            });
        }
        // Fallback: any load subjects
        loads.forEach(l => {
            if (l.subject && !map.has(String(l.subject.id))) {
                map.set(String(l.subject.id), {
                    id: String(l.subject.id),
                    name: l.subject.name,
                    code: l.subject.code,
                    teacher_id: l.teacher_id
                });
            }
        });
        return Array.from(map.values());
    }, [subjects, loads, selectedClassId]);

    // When section changes, optionally update room if not custom
    const handleClassChange = (classId) => {
        setSelectedClassId(classId);
        const targetClass = classes.find(c => String(c.id) === String(classId));
        if (targetClass?.room) {
            setRoom(targetClass.room);
        }
        // Check if this class has an existing load for the current subject
        const match = loads.find(l => 
            String(l.school_class_id) === String(classId) && 
            String(l.subject_id) === String(selectedSubjectId)
        );
        if (match && match.teacher_id) {
            setSelectedTeacherId(String(match.teacher_id));
        }
    };

    // When subject changes, auto-select its assigned teacher from teaching loads
    const handleSubjectChange = (subjId) => {
        setSelectedSubjectId(subjId);
        const match = loads.find(l => 
            String(l.subject_id) === String(subjId) && 
            (!selectedClassId || String(l.school_class_id) === String(selectedClassId))
        );
        if (match && match.teacher_id) {
            setSelectedTeacherId(String(match.teacher_id));
        }
    };

    // Duration calculation
    const currentDurationText = useMemo(() => {
        return calcDuration(startTime24, endTime24);
    }, [startTime24, endTime24]);

    // ─── Quick Duration Adjusters (e.g. +45m, +1h, +1.5h, +2h, +3h) ───────────
    const handleSetDuration = (minutes) => {
        const sMin = toMinutes(startTime24);
        const eMin = Math.min(24 * 60, sMin + minutes);
        const h24 = String(Math.floor(eMin / 60)).padStart(2, '0');
        const m24 = String(eMin % 60).padStart(2, '0');
        setEndTime24(`${h24}:${m24}`);
    };

    // ─── Quick Day Presets ────────────────────────────────────────────────────
    const handleSelectDayPreset = (preset) => {
        if (preset === 'weekdays') {
            setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        } else if (preset === 'mwf') {
            setSelectedDays(['Monday', 'Wednesday', 'Friday']);
        } else if (preset === 'tth') {
            setSelectedDays(['Tuesday', 'Thursday']);
        } else if (preset === 'sat') {
            setSelectedDays(['Saturday']);
        } else if (preset === 'single') {
            setSelectedDays([selectedDays[0] || 'Monday']);
        }
    };

    const handleToggleDay = (dayKey) => {
        if (selectedDays.includes(dayKey)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter(d => d !== dayKey));
            }
        } else {
            setSelectedDays([...selectedDays, dayKey]);
        }
    };

    // ─── Real-Time Live Conflict Radar ────────────────────────────────────────
    const activeConflicts = useMemo(() => {
        if (!selectedDays.length || !startTime24 || !endTime24) return [];
        const sMin = toMinutes(startTime24);
        const eMin = toMinutes(endTime24);
        const conflictsList = [];

        schedules.forEach(s => {
            // Exclude current schedule if editing
            if (editingSchedule && s.id === editingSchedule.id) return;

            // Check if same day and overlapping time
            if (selectedDays.includes(s.day_of_week)) {
                const sS = toMinutes(s.start_time);
                const sE = toMinutes(s.end_time);

                if (Math.max(sMin, sS) < Math.min(eMin, sE)) {
                    // Check teacher conflict (only if teacher is assigned)
                    if (selectedTeacherId && String(s.teacher_id) === String(selectedTeacherId) && String(s.school_class_id) !== String(selectedClassId)) {
                        conflictsList.push({
                            type: 'Instructor Conflict',
                            day: s.day_of_week,
                            time: `${to12Hour(s.start_time)} – ${to12Hour(s.end_time)}`,
                            detail: `Instructor is already teaching ${s.school_class?.name || s.schoolClass?.name || 'another section'} (${s.subject?.name || 'Subject'}) on ${s.day_of_week}.`
                        });
                    }
                    // Check room conflict
                    else if (room && s.room && s.room.trim().toLowerCase() === room.trim().toLowerCase() && String(s.school_class_id) !== String(selectedClassId)) {
                        conflictsList.push({
                            type: 'Room Conflict',
                            day: s.day_of_week,
                            time: `${to12Hour(s.start_time)} – ${to12Hour(s.end_time)}`,
                            detail: `Room "${room}" is already reserved for ${s.school_class?.name || 'another section'} on ${s.day_of_week}.`
                        });
                    }
                    // Check section overlap
                    else if (String(s.school_class_id) === String(selectedClassId)) {
                        conflictsList.push({
                            type: 'Section Conflict',
                            day: s.day_of_week,
                            time: `${to12Hour(s.start_time)} – ${to12Hour(s.end_time)}`,
                            detail: `This section already has ${s.subject?.name || 'a class'} scheduled on ${s.day_of_week}.`
                        });
                    }
                }
            }
        });

        return conflictsList;
    }, [selectedTeacherId, selectedClassId, selectedDays, startTime24, endTime24, room, schedules, editingSchedule]);

    // ─── Submit Form ──────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Find matching teaching load
        const matchingLoad = loads.find(l => 
            String(l.school_class_id) === String(selectedClassId) && 
            String(l.subject_id) === String(selectedSubjectId)
        ) || loads.find(l => String(l.school_class_id) === String(selectedClassId)) || loads[0];

        const payload = {
            id: editingSchedule?.id || null,
            school_class_id: selectedClassId,
            subject_id: selectedSubjectId,
            teacher_id: selectedTeacherId || null,
            teaching_load_id: matchingLoad?.id || '',
            selected_days: selectedDays,
            edit_scope: editScope,
            start_time: startTime24,
            end_time: endTime24,
            room: room.trim() || 'Room 101',
            session_type: sessionType,
            notes: notes.trim()
        };

        if (onSave) {
            onSave(payload);
        }
    };

    if (!isOpen) return null;

    const modalTitle = editingSchedule 
        ? `Edit Schedule: ${editingSchedule.subject?.name || 'Class Session'}`
        : 'Schedule Class Session';

    const modalSubtitle = editingSchedule 
        ? `Modify timetable slot and room details for this class`
        : `Assign section, subject, venue, and weekly timetable slot`;

    return (
        <Modal
            isOpen={isOpen}
            title={modalTitle}
            subtitle={modalSubtitle}
            icon={CalendarCheck}
            maxWidth="780px"
            onClose={() => !isSubmitting && onClose()}
        >
            <form onSubmit={handleSubmit} className="space-y-3.5" style={{ fontFamily: 'var(--font-sans, system-ui)' }}>

                {/* ══════════════════════════════════════════════════════════
                    PANEL 1: ACADEMIC & CLASSROOM ASSIGNMENT
                   ══════════════════════════════════════════════════════════ */}
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1.15rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '1rem',
                        paddingBottom: '0.65rem',
                        borderBottom: '1px solid #F1F5F9'
                    }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <BookOpen size={15} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                Academic & Classroom Assignment
                            </h4>
                            <p style={{ fontSize: '0.725rem', color: '#64748B', margin: 0 }}>
                                Select the class section, subject curriculum, and assigned venue
                            </p>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {/* Grade & Class Section */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                <span>Grade & Class Section</span>
                                <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                                value={selectedClassId}
                                onChange={e => handleClassChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    outline: 'none',
                                    color: '#0F172A',
                                    transition: 'border-color 0.15s, box-shadow 0.15s'
                                }}
                                required
                            >
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        Grade {c.grade_level} — {c.section || c.name} {c.room ? `(${c.room})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Curriculum Subject */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                <span>Curriculum Subject</span>
                                <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                                value={selectedSubjectId}
                                onChange={e => handleSubjectChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    outline: 'none',
                                    color: '#0F172A'
                                }}
                                required
                            >
                                {availableSubjects.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.code ? `(${s.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assigned Instructor */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                                    <span>Assigned Instructor</span>
                                </label>
                                {!selectedTeacherId && (
                                    <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 600 }}>
                                        Pending Assignment
                                    </span>
                                )}
                            </div>
                            <select
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    outline: 'none',
                                    color: selectedTeacherId ? '#0F172A' : '#64748B'
                                }}
                            >
                                <option value="">— Unassigned / TBA (Assign Later) —</option>
                                {teachers.map(t => {
                                    const targetClass = classes.find(c => String(c.id) === String(selectedClassId));
                                    const isGradeMismatch = Boolean(
                                        t.assigned_grade_level && 
                                        targetClass?.grade_level && 
                                        Number(t.assigned_grade_level) !== Number(targetClass.grade_level)
                                    );

                                    return (
                                        <option key={t.id} value={t.id} disabled={isGradeMismatch}>
                                            {t.name} {t.specialization ? `• ${t.specialization}` : ''}
                                            {isGradeMismatch ? ` (Grade ${t.assigned_grade_level} Only)` : ` [Grade ${t.assigned_grade_level || '7'}]`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Room / Venue */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                <span>Classroom / Venue</span>
                                <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Building A - Room 101, Science Lab"
                                value={room}
                                onChange={e => setRoom(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    outline: 'none',
                                    color: '#0F172A'
                                }}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    PANEL 2: WEEKLY SCHEDULE & TIME SLOT
                   ══════════════════════════════════════════════════════════ */}
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1.15rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                        paddingBottom: '0.65rem',
                        borderBottom: '1px solid #F1F5F9',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Clock size={15} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                                    Weekly Schedule & Time Slot
                                </h4>
                                <p style={{ fontSize: '0.725rem', color: '#64748B', margin: 0 }}>
                                    Select class meeting days and standard 12-hour session timeframe
                                </p>
                            </div>
                        </div>

                        {/* Live Duration Pill Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '20px'
                        }}>
                            <Clock size={12} />
                            <span>{currentDurationText || '1 hour'}</span>
                        </div>
                    </div>

                    {/* Days Selection Sub-section */}
                    <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                            flexWrap: 'wrap',
                            gap: '6px'
                        }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                                Meeting Days ({selectedDays.length} selected)
                            </label>

                            {/* Quick Presets */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[
                                    { id: 'weekdays', label: 'Mon–Fri' },
                                    { id: 'mwf', label: 'MWF' },
                                    { id: 'tth', label: 'TTH' },
                                    { id: 'sat', label: 'Sat' },
                                    { id: 'single', label: 'Single' },
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handleSelectDayPreset(p.id)}
                                        style={{
                                            border: '1px solid #E2E8F0',
                                            background: '#F8FAFC',
                                            color: '#475569',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.12s ease'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.backgroundColor = '#EFF6FF';
                                            e.currentTarget.style.color = '#1D4ED8';
                                            e.currentTarget.style.borderColor = '#BFDBFE';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                                            e.currentTarget.style.color = '#475569';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Day Toggle Chips */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                            {DAYS_OF_WEEK.map(({ key, label, full }) => {
                                const isChecked = selectedDays.includes(key);
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleToggleDay(key)}
                                        title={full}
                                        style={{
                                            padding: '8px 4px',
                                            borderRadius: '10px',
                                            border: isChecked ? '1.5px solid #0B2545' : '1px solid #E2E8F0',
                                            background: isChecked ? 'linear-gradient(135deg, #0B2545 0%, #163E6E 100%)' : '#FFFFFF',
                                            color: isChecked ? '#FFFFFF' : '#475569',
                                            fontSize: '0.8rem',
                                            fontWeight: isChecked ? 700 : 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '2px',
                                            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                                            boxShadow: isChecked ? '0 2px 6px rgba(11, 37, 69, 0.2)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            {isChecked && <Check size={12} strokeWidth={3} />}
                                            <span>{label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Slot Inputs (12-Hour) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1rem',
                        marginBottom: '0.85rem'
                    }}>
                        {/* Start Time */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                <span>Start Time (12-Hour AM/PM)</span>
                                <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                                value={startTime24}
                                onChange={e => setStartTime24(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    outline: 'none',
                                    fontVariantNumeric: 'tabular-nums'
                                }}
                                required
                            >
                                {TIME_12H_OPTIONS.map(opt => (
                                    <option key={opt.value24} value={opt.value24}>
                                        {opt.label12}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* End Time */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                <span>End Time (12-Hour AM/PM)</span>
                                <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <select
                                value={endTime24}
                                onChange={e => setEndTime24(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    outline: 'none',
                                    fontVariantNumeric: 'tabular-nums'
                                }}
                                required
                            >
                                {TIME_12H_OPTIONS.map(opt => (
                                    <option key={opt.value24} value={opt.value24}>
                                        {opt.label12}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quick Duration Preset Chips */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        background: '#F8FAFC',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #F1F5F9'
                    }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>
                            Quick Duration:
                        </span>
                        {[
                            { label: '+ 45 mins', mins: 45 },
                            { label: '+ 1 hour', mins: 60 },
                            { label: '+ 1 hr 30m', mins: 90 },
                            { label: '+ 2 hours', mins: 120 },
                            { label: '+ 3 hours', mins: 180 },
                        ].map(btn => (
                            <button
                                key={btn.label}
                                type="button"
                                onClick={() => handleSetDuration(btn.mins)}
                                style={{
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#334155',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.12s ease'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#EFF6FF';
                                    e.currentTarget.style.color = '#1D4ED8';
                                    e.currentTarget.style.borderColor = '#BFDBFE';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.color = '#334155';
                                    e.currentTarget.style.borderColor = '#CBD5E1';
                                }}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    PANEL 3: SESSION DETAILS & REMARKS (COMPACT)
                   ══════════════════════════════════════════════════════════ */}
                <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1.15rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '0.85rem'
                    }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: '#F1F5F9',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Layers size={15} />
                        </div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            Session Classification & Remarks
                        </h4>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {/* Session Type */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Session Type
                            </label>
                            <select
                                value={sessionType}
                                onChange={e => setSessionType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    outline: 'none',
                                    color: '#0F172A'
                                }}
                            >
                                <option value="lecture">📘 Lecture / Regular Class</option>
                                <option value="laboratory">🔬 Laboratory / TVL Workshop</option>
                                <option value="remedial">🌙 Evening / Remedial Period</option>
                                <option value="break">☕ School Recess / Lunch Break</option>
                            </select>
                        </div>

                        {/* Special Notes / Instructions */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                Special Notes / Remarks (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Double period, TVL lab, remedial class"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    border: '1.5px solid #CBD5E1',
                                    borderRadius: '10px',
                                    background: '#FFFFFF',
                                    outline: 'none',
                                    color: '#0F172A'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    PANEL 4: LIVE CONFLICT RADAR STATUS BAR
                   ══════════════════════════════════════════════════════════ */}
                {activeConflicts.length > 0 ? (
                    <div style={{
                        padding: '0.9rem 1.15rem',
                        borderRadius: '12px',
                        background: '#FEF2F2',
                        border: '1.5px solid #FECACA',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                    }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <AlertTriangle size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#991B1B' }}>
                                    Potential Schedule Conflict Detected
                                </span>
                                <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    background: '#DC2626',
                                    color: '#FFFFFF',
                                    padding: '1px 7px',
                                    borderRadius: '10px'
                                }}>
                                    {activeConflicts.length} {activeConflicts.length > 1 ? 'Overlaps' : 'Overlap'}
                                </span>
                            </div>
                            <ul style={{ margin: '6px 0 0', paddingLeft: '1.1rem', fontSize: '0.76rem', color: '#7F1D1D' }}>
                                {activeConflicts.map((c, i) => (
                                    <li key={i} style={{ marginBottom: '3px' }}>
                                        <strong>[{c.type}]</strong> {c.detail} <span style={{ color: '#991B1B', fontWeight: 700 }}>({c.time})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <CheckCircle2 size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#166534' }}>
                            Timetable slot is conflict-free across all {selectedDays.length} selected day(s) at {to12Hour(startTime24)} – {to12Hour(endTime24)}.
                        </span>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    MODAL FOOTER ACTIONS (STICKY DOCKED AT BOTTOM)
                   ══════════════════════════════════════════════════════════ */}
                <div style={{
                    position: 'sticky',
                    bottom: '-1.25rem',
                    margin: '0.75rem -1.5rem -1.25rem -1.5rem',
                    padding: '0.85rem 1.5rem',
                    background: '#FFFFFF',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    boxShadow: '0 -4px 14px rgba(15, 23, 42, 0.05)',
                    zIndex: 20
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#475569',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            padding: '8px 18px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.color = '#0F172A';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.color = '#475569';
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            border: 'none',
                            background: 'linear-gradient(135deg, #0B2545 0%, #163E6E 100%)',
                            color: '#FFFFFF',
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            padding: '8px 22px',
                            borderRadius: '10px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            boxShadow: '0 4px 12px rgba(11, 37, 69, 0.25)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {isSubmitting ? (
                            <span>Saving Schedule...</span>
                        ) : (
                            <>
                                <Plus size={15} />
                                <span>
                                    {editingSchedule
                                        ? `Update Schedule Session (${to12Hour(startTime24)} – ${to12Hour(endTime24)})`
                                        : `Save Schedule (${selectedDays.length} ${selectedDays.length === 1 ? 'Day' : 'Days'})`
                                    }
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
