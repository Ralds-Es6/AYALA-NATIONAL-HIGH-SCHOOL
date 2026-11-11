import React, { useState } from 'react';
import { 
    Users, 
    BookOpen, 
    Layers, 
    CalendarCheck, 
    Check, 
    ArrowRight, 
    ArrowLeft, 
    Clock, 
    MapPin, 
    ShieldAlert, 
    CheckCircle2, 
    Search 
} from 'lucide-react';
import Modal from '../Modal';
import Badge from '../Badge';
import { srnhsApi } from '../../api/endpoints';

export default function GuidedLoadWizard({ 
    isOpen, 
    onClose, 
    teachers = [], 
    subjects = [], 
    classes = [], 
    onComplete 
}) {
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCheckingConflict, setIsCheckingConflict] = useState(false);
    const [conflictResult, setConflictResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Selected Wizard State
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [teachingHours, setTeachingHours] = useState(4);
    const [scheduleConfig, setScheduleConfig] = useState({
        day_of_week: 'Monday',
        start_time: '07:30',
        end_time: '08:30',
        room: 'Room 202',
    });

    if (!isOpen) return null;

    const resetWizard = () => {
        setStep(1);
        setSelectedTeacher(null);
        setSelectedSubject(null);
        setSelectedClass(null);
        setConflictResult(null);
    };

    const handleClose = () => {
        resetWizard();
        onClose();
    };

    // Step 4: Check Schedule Conflict
    const handleCheckSchedule = async () => {
        if (!selectedTeacher || !selectedClass) return;

        setIsCheckingConflict(true);
        setConflictResult(null);

        try {
            const check = await srnhsApi.checkConflict({
                teacher_id: selectedTeacher.id,
                school_class_id: selectedClass.id,
                day_of_week: scheduleConfig.day_of_week,
                start_time: scheduleConfig.start_time,
                end_time: scheduleConfig.end_time,
                room: scheduleConfig.room,
            });
            setConflictResult(check);
        } catch (err) {
            setConflictResult({ has_conflict: true, conflicts: [{ message: err.message }] });
        } finally {
            setIsCheckingConflict(false);
        }
    };

    // Complete Wizard
    const handleFinalConfirm = async () => {
        setIsSubmitting(true);
        try {
            // 1. Create Teaching Load
            const loadRes = await srnhsApi.createTeachingLoad({
                teacher_id: selectedTeacher.id,
                subject_id: selectedSubject.id,
                school_class_id: selectedClass.id,
                teaching_hours: teachingHours,
                academic_year: '2026-2027',
                semester_or_quarter: '1st Quarter',
            });

            // 2. Create Schedule using created load
            if (loadRes.data?.id) {
                await srnhsApi.createSchedule({
                    teaching_load_id: loadRes.data.id,
                    day_of_week: scheduleConfig.day_of_week,
                    start_time: scheduleConfig.start_time,
                    end_time: scheduleConfig.end_time,
                    room: scheduleConfig.room,
                });
            }

            if (onComplete) onComplete();
            handleClose();
        } catch (err) {
            alert(err.message || 'Failed to complete assignment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredTeachers = teachers.filter((t) => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.position?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} title="Guided Teaching Load Assignment" onClose={handleClose}>
            {/* Step Progress Indicators */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid var(--border-subtle)',
                background: '#F8FAFC'
            }}>
                {[
                    { num: 1, title: 'Teacher' },
                    { num: 2, title: 'Subject' },
                    { num: 3, title: 'Class & Hours' },
                    { num: 4, title: 'Schedule' }
                ].map((s) => (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: step === s.num 
                                ? 'var(--primary)' 
                                : step > s.num 
                                ? 'var(--accent-emerald)' 
                                : 'var(--border-subtle)',
                            color: step >= s.num ? '#ffffff' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            {step > s.num ? <Check size={13} /> : s.num}
                        </div>
                        <span style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: step === s.num ? 700 : 500,
                            color: step === s.num ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ padding: '1.5rem' }}>
                {/* STEP 1: Select Teacher */}
                {step === 1 && (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Search or Select Teacher</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '2.25rem' }}
                                    placeholder="Filter by name or specialization..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto' }}>
                            {filteredTeachers.map((t) => {
                                const isSelected = selectedTeacher?.id === t.id;
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTeacher(t)}
                                        style={{
                                            padding: '0.85rem 1rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: isSelected ? 'rgba(13, 148, 136, 0.12)' : '#F8FAFC',
                                            border: isSelected ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                {t.name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {t.position} &bull; {t.specialization}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 600 }}>
                                                {t.assigned_hours || 0} / {t.max_weekly_hours || 30}h
                                            </span>
                                            {isSelected && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--teal)', fontSize: '0.75rem', fontWeight: 700, marginTop: '2px' }}>
                                                    <Check size={14} /> Selected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 2: Select Subject */}
                {step === 2 && (
                    <div>
                        <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(13, 148, 136, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
                                <Users size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned Teacher:</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {selectedTeacher?.name} ({selectedTeacher?.specialization})
                                </div>
                            </div>
                        </div>

                        <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Choose Curriculum Subject</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', maxHeight: '260px', overflowY: 'auto' }}>
                            {subjects.map((s) => {
                                const isSelected = selectedSubject?.id === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => {
                                            setSelectedSubject(s);
                                            setTeachingHours(s.weekly_hours || 4);
                                        }}
                                        style={{
                                            padding: '0.85rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: isSelected ? 'rgba(13, 148, 136, 0.12)' : '#F8FAFC',
                                            border: isSelected ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                                            borderLeft: `4px solid ${s.color || 'var(--teal)'}`,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            {s.code}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                            {s.name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                            Grade {s.grade_level} &bull; {s.weekly_hours}h / week
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* STEP 3: Class and Teaching Hours */}
                {step === 3 && (
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ flex: 1, background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Teacher</div>
                                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTeacher?.name}</div>
                            </div>
                            <div style={{ flex: 1, background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subject</div>
                                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedSubject?.name}</div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Grade Section *</label>
                            <select
                                className="form-select"
                                value={selectedClass?.id || ''}
                                onChange={(e) => {
                                    const c = classes.find((item) => item.id === parseInt(e.target.value));
                                    setSelectedClass(c);
                                    if (c?.room) setScheduleConfig({ ...scheduleConfig, room: c.room });
                                }}
                            >
                                <option value="">-- Choose Class Section --</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.strand ? `[${c.strand}]` : ''} (Adviser: {c.adviser?.name || 'Unassigned'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Teaching Hours (weekly) *</label>
                            <input 
                                type="number"
                                className="form-input"
                                min="1"
                                max="15"
                                value={teachingHours}
                                onChange={(e) => setTeachingHours(parseInt(e.target.value) || 4)}
                                required
                            />
                            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                Standard curriculum weekly teaching contact hours
                            </span>
                        </div>
                    </div>
                )}

                {/* STEP 4: Schedule and Conflict Check */}
                {step === 4 && (
                    <div>
                        <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Assignment Summary:
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {selectedTeacher?.name} &rarr; {selectedSubject?.name} ({selectedClass?.name})
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Day of Week *</label>
                                <select
                                    className="form-select"
                                    value={scheduleConfig.day_of_week}
                                    onChange={(e) => {
                                        setScheduleConfig({ ...scheduleConfig, day_of_week: e.target.value });
                                        setConflictResult(null);
                                    }}
                                >
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Room / Lab *</label>
                                <input 
                                    type="text"
                                    className="form-input"
                                    value={scheduleConfig.room}
                                    onChange={(e) => {
                                        setScheduleConfig({ ...scheduleConfig, room: e.target.value });
                                        setConflictResult(null);
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Start Time *</label>
                                <input 
                                    type="time"
                                    className="form-input"
                                    value={scheduleConfig.start_time}
                                    onChange={(e) => {
                                        setScheduleConfig({ ...scheduleConfig, start_time: e.target.value });
                                        setConflictResult(null);
                                    }}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time *</label>
                                <input 
                                    type="time"
                                    className="form-input"
                                    value={scheduleConfig.end_time}
                                    onChange={(e) => {
                                        setScheduleConfig({ ...scheduleConfig, end_time: e.target.value });
                                        setConflictResult(null);
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        {/* Conflict Validation Action */}
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleCheckSchedule}
                                disabled={isCheckingConflict}
                                style={{ width: '100%' }}
                            >
                                <Clock size={14} /> {isCheckingConflict ? 'Validating overlaps...' : 'Check Schedule Conflict'}
                            </button>

                            {conflictResult && (
                                <div>
                                    {conflictResult.has_conflict ? (
                                        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8rem', color: '#fecdd3' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#fb7185' }}>
                                                <ShieldAlert size={15} /> Collision Detected!
                                            </div>
                                            <p style={{ marginTop: '0.2rem', lineHeight: 1.4 }}>
                                                {conflictResult.conflicts[0]?.message}
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: '#a7f3d0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <CheckCircle2 size={16} color="#34d399" />
                                            <span>✓ Time slot available. Ready to confirm!</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Controls */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                {step > 1 ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => setStep(step - 1)}>
                        <ArrowLeft size={14} /> Back
                    </button>
                ) : (
                    <button className="btn btn-ghost btn-sm" onClick={handleClose}>
                        Cancel
                    </button>
                )}

                {step < 4 ? (
                    <button 
                        className="btn btn-primary btn-sm" 
                        disabled={(step === 1 && !selectedTeacher) || (step === 2 && !selectedSubject) || (step === 3 && !selectedClass)}
                        onClick={() => setStep(step + 1)}
                    >
                        Continue <ArrowRight size={14} />
                    </button>
                ) : (
                    <button 
                        className="btn btn-primary btn-sm"
                        disabled={isSubmitting || conflictResult?.has_conflict}
                        onClick={handleFinalConfirm}
                    >
                        {isSubmitting ? 'Finalizing Assignment...' : 'Confirm Assignment & Dispatch Gmail'}
                    </button>
                )}
            </div>
        </Modal>
    );
}
