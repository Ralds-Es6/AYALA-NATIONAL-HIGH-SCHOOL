import React, { useState, useMemo, useEffect } from 'react';
import { 
    Building2, 
    Users, 
    MapPin, 
    Plus, 
    CalendarCheck, 
    ChevronDown, 
    AlertTriangle,
    Layers,
    Filter
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import ClassroomDirectory from '../../components/schedules/ClassroomDirectory';
import ClassroomFormModal from '../../components/schedules/ClassroomFormModal';
import CleanWeeklyTimetable from '../../components/schedules/CleanWeeklyTimetable';
import InteractiveScheduleModal from '../../components/schedules/InteractiveScheduleModal';
import { srnhsApi } from '../../api/endpoints';
import { notify } from '../../components/notifications/notify';

export default function ScheduleManagement({
    schedules = [],
    loads = [],
    classes = [],
    teachers = [],
    subjects = [],
    loading = false,
    onSaveSchedule,
    onDeleteSchedule,
    onRefresh,
    initialPerspective = 'section'
}) {
    // Current perspective: 'section' (Classrooms) | 'teacher' (Faculty) | 'room' (Venues)
    const normalizePerspective = (p) => (p === 'teacher' || p === 'room') ? p : 'section';
    const [perspective, setPerspective] = useState(normalizePerspective(initialPerspective));

    useEffect(() => {
        if (initialPerspective) {
            setPerspective(normalizePerspective(initialPerspective));
        }
    }, [initialPerspective]);

    // Active focused entities
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState('all');
    const [selectedRoom, setSelectedRoom] = useState('all');

    // Classroom Form Modal State
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState(null);
    const [classModalDefaultGrade, setClassModalDefaultGrade] = useState(7);

    // Schedule Entry Modal State (for creating/editing a class period)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [schedulePrefill, setSchedulePrefill] = useState({});

    // Available Rooms derived from classrooms and schedule entries
    const availableRooms = useMemo(() => {
        const set = new Set();
        classes.forEach(c => c.room && set.add(c.room.trim()));
        schedules.forEach(s => s.room && set.add(s.room.trim()));
        return Array.from(set).filter(Boolean).sort();
    }, [classes, schedules]);

    // Group teachers: Scheduled vs Unscheduled
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

    const scheduledTeachers = useMemo(() => {
        return teachers
            .map(t => ({ ...t, scheduleCount: teacherScheduleCountMap.get(Number(t.id)) || 0 }))
            .sort((a, b) => b.scheduleCount - a.scheduleCount);
    }, [teachers, teacherScheduleCountMap]);

    // Auto-select first active teacher when in teacher mode
    useEffect(() => {
        if (perspective === 'teacher') {
            if (selectedTeacherId === 'all' || !teachers.some(t => String(t.id) === String(selectedTeacherId))) {
                const defaultTeacher = scheduledTeachers[0] || teachers[0];
                if (defaultTeacher) {
                    setSelectedTeacherId(String(defaultTeacher.id));
                }
            }
        }
    }, [perspective, scheduledTeachers, teachers, selectedTeacherId]);

    const activeTeacher = useMemo(() => {
        if (selectedTeacherId !== 'all') {
            return teachers.find(t => String(t.id) === String(selectedTeacherId)) || null;
        }
        return scheduledTeachers[0] || teachers[0] || null;
    }, [teachers, selectedTeacherId, scheduledTeachers]);

    // Classroom creation / update handler
    const handleSaveClassroom = async (payload) => {
        try {
            if (payload.id) {
                await srnhsApi.updateClass(payload.id, payload);
                notify.success(`Classroom section "${payload.name}" updated successfully.`);
            } else {
                await srnhsApi.createClass(payload);
                notify.success(`Classroom section "${payload.name}" created successfully.`);
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Classroom save error:', err);
            notify.error('Failed to save classroom.');
            throw err;
        }
    };

    // Classroom deletion handler
    const handleDeleteClassroom = async (classId) => {
        const target = classes.find(c => c.id === classId);
        const name = target ? (target.section || target.name) : 'this classroom';
        if (!window.confirm(`Are you sure you want to delete classroom "${name}"? This will also remove associated schedules.`)) {
            return;
        }

        try {
            await srnhsApi.deleteClass(classId);
            notify.success(`Classroom "${name}" deleted.`);
            if (selectedClassroom?.id === classId) {
                setSelectedClassroom(null);
            }
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Delete classroom error:', err);
            notify.error('Failed to delete classroom.');
        }
    };

    // Open Schedule Entry Creator
    const handleOpenAddSchedule = (prefill = {}) => {
        setEditingSchedule(null);
        setSchedulePrefill(prefill);
        setIsScheduleModalOpen(true);
    };

    // Open Schedule Entry Editor
    const handleOpenEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setSchedulePrefill({
            school_class_id: schedule.school_class_id,
            teacher_id: schedule.teacher_id,
            subject_id: schedule.subject_id,
            day: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            room: schedule.room
        });
        setIsScheduleModalOpen(true);
    };

    // Save schedule handler
    const handleSaveScheduleEntry = async (payload) => {
        if (onSaveSchedule) {
            await onSaveSchedule(payload);
        } else {
            await srnhsApi.createSchedule(payload);
        }
        setIsScheduleModalOpen(false);
        setEditingSchedule(null);
        if (onRefresh) onRefresh();
    };

    // Delete schedule handler
    const handleDeleteScheduleEntry = async (scheduleId) => {
        if (!window.confirm('Are you sure you want to delete this schedule entry?')) {
            return;
        }
        if (onDeleteSchedule) {
            await onDeleteSchedule(scheduleId);
        } else {
            await srnhsApi.deleteSchedule(scheduleId);
        }
        if (onRefresh) onRefresh();
    };

    if (loading) {
        return <LoadingSpinner text="Retrieving schedule and classroom records..." />;
    }

    return (
        <div className="space-y-6">
            {/* ─── Page Header (60-30-10 Master Hierarchy) ────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>Automated Conflict-Free Engine</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        Master Timetables &amp; Class Schedules
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        Configure classroom schedules, assign faculty or TBA slots, and inspect timetables by section, teacher, or room venue.
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                    {perspective === 'section' && !selectedClassroom && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingClassroom(null);
                                setClassModalDefaultGrade(7);
                                setIsClassModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
                        >
                            <Building2 size={15} className="text-blue-600" />
                            <span>+ Create Classroom</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => handleOpenAddSchedule({})}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer border-0"
                    >
                        <Plus size={16} />
                        <span>+ Assign Schedule Slot</span>
                    </button>
                </div>
            </div>

            {/* ─── Perspective Navigation Bar (60-30-10 Pill Switcher) ─────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Perspective Tabs: Classrooms vs Faculty vs Room Venues */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                        type="button"
                        onClick={() => {
                            setPerspective('section');
                            setSelectedClassroom(null);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                            perspective === 'section'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Building2 size={15} />
                        <span>By Classroom Section ({classes.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPerspective('teacher')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                            perspective === 'teacher'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <Users size={15} />
                        <span>By Faculty Member ({teachers.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPerspective('room')}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                            perspective === 'room'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <MapPin size={15} />
                        <span>By Room Venue ({availableRooms.length})</span>
                    </button>
                </div>

                {/* Perspective Context Controls */}
                <div className="flex items-center gap-3">
                    {/* Faculty Dropdown Switcher when in Teacher Perspective */}
                    {perspective === 'teacher' && (
                        <div className="relative">
                            <select
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                                className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                            >
                                <optgroup label="Faculty with Scheduled Classes">
                                    {scheduledTeachers.filter(t => t.scheduleCount > 0).map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.scheduleCount} classes)
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other Faculty Members">
                                    {scheduledTeachers.filter(t => t.scheduleCount === 0).map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} (0 classes)
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                    )}

                    {/* Room Dropdown Switcher when in Room Perspective */}
                    {perspective === 'room' && (
                        <div className="relative">
                            <select
                                value={selectedRoom}
                                onChange={e => setSelectedRoom(e.target.value)}
                                className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                            >
                                {availableRooms.map(rm => (
                                    <option key={rm} value={rm}>
                                        Venue: {rm}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Main Content Views Based on Separation of Concerns ───────────── */}

            {/* 1. Classroom Section Perspective */}
            {perspective === 'section' && (
                <>
                    {!selectedClassroom ? (
                        // Step 1: Big View with 4 distinct Grade tables for JHS, and Strand tables for SHS
                        <ClassroomDirectory
                            classes={classes}
                            schedules={schedules}
                            onSelectClassroom={(cls) => setSelectedClassroom(cls)}
                            onOpenCreateModal={(grade) => {
                                setEditingClassroom(null);
                                setClassModalDefaultGrade(grade);
                                setIsClassModalOpen(true);
                            }}
                            onEditClassroom={(cls) => {
                                setEditingClassroom(cls);
                                setClassModalDefaultGrade(cls.grade_level);
                                setIsClassModalOpen(true);
                            }}
                            onDeleteClassroom={handleDeleteClassroom}
                            isAdmin={true}
                        />
                    ) : (
                        // Step 2: Clean Weekly Timetable Grid for the Selected Classroom
                        <CleanWeeklyTimetable
                            mode="classroom"
                            selectedClassroom={selectedClassroom}
                            schedules={schedules}
                            teachers={teachers}
                            classes={classes}
                            onBackToDirectory={() => setSelectedClassroom(null)}
                            onAddSchedule={handleOpenAddSchedule}
                            onEditSchedule={handleOpenEditSchedule}
                            onDeleteSchedule={handleDeleteScheduleEntry}
                            isAdmin={true}
                        />
                    )}
                </>
            )}

            {/* 2. By Faculty Member Perspective */}
            {perspective === 'teacher' && (
                <CleanWeeklyTimetable
                    mode="teacher"
                    selectedTeacher={activeTeacher}
                    schedules={schedules}
                    teachers={teachers}
                    classes={classes}
                    onAddSchedule={handleOpenAddSchedule}
                    onEditSchedule={handleOpenEditSchedule}
                    onDeleteSchedule={handleDeleteScheduleEntry}
                    onSelectTeacher={(tId) => setSelectedTeacherId(String(tId))}
                    isAdmin={true}
                />
            )}

            {/* 3. By Room Venue Perspective */}
            {perspective === 'room' && (
                <CleanWeeklyTimetable
                    mode="room"
                    selectedRoom={selectedRoom === 'all' ? availableRooms[0] : selectedRoom}
                    schedules={schedules}
                    teachers={teachers}
                    classes={classes}
                    onAddSchedule={handleOpenAddSchedule}
                    onEditSchedule={handleOpenEditSchedule}
                    onDeleteSchedule={handleDeleteScheduleEntry}
                    isAdmin={true}
                />
            )}

            {/* ─── Classroom Creation & Edit Modal ──────────────────────────────── */}
            <ClassroomFormModal
                isOpen={isClassModalOpen}
                onClose={() => {
                    setIsClassModalOpen(false);
                    setEditingClassroom(null);
                }}
                classroom={editingClassroom}
                teachers={teachers}
                classes={classes}
                defaultGrade={classModalDefaultGrade}
                onSave={handleSaveClassroom}
            />

            {/* ─── Interactive Schedule Assignment Modal ───────────────────────── */}
            <InteractiveScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => {
                    setIsScheduleModalOpen(false);
                    setEditingSchedule(null);
                }}
                editingSchedule={editingSchedule}
                initialData={{
                    targetClass: classes.find(c => String(c.id) === String(schedulePrefill.school_class_id || selectedClassroom?.id)) || classes[0],
                    teacherId: schedulePrefill.teacher_id || (activeTeacher?.id),
                    subjectId: schedulePrefill.subject_id,
                    day: schedulePrefill.day || 'Monday',
                    start_time: schedulePrefill.start_time || '07:30',
                    end_time: schedulePrefill.end_time || '08:30',
                    room: schedulePrefill.room || selectedClassroom?.room || 'Room 201'
                }}
                classes={classes}
                teachers={teachers}
                subjects={subjects}
                loads={loads}
                schedules={schedules}
                onSave={handleSaveScheduleEntry}
            />
        </div>
    );
}
