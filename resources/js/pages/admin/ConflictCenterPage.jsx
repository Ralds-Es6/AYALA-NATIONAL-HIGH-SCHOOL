import React, { useState } from 'react';
import { 
    AlertOctagon, 
    ShieldCheck, 
    Search, 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    CalendarCheck, 
    Layers, 
    BookOpen, 
    Users 
} from 'lucide-react';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { srnhsApi } from '../../api/endpoints';
import { notify } from '../../components/notifications/notify';

export default function ConflictCenterPage({ teachers = [], classes = [], loading }) {
    const [testData, setTestData] = useState({
        teacher_id: '',
        school_class_id: '',
        day_of_week: 'Monday',
        start_time: '07:30',
        end_time: '08:30',
        room: 'Room 202',
    });

    const [checkResult, setCheckResult] = useState(null);
    const [isTesting, setIsTesting] = useState(false);

    const handleRunCheck = async (e) => {
        e.preventDefault();
        setIsTesting(true);
        setCheckResult(null);

        try {
            const res = await srnhsApi.checkConflict({
                ...testData,
                teacher_id: parseInt(testData.teacher_id),
                school_class_id: parseInt(testData.school_class_id),
            });
            setCheckResult(res);
            if (res.has_conflict) {
                notify.conflict(
                    'Schedule Conflict Detected!',
                    res.conflicts?.[0]?.message || 'A collision was found for the selected time and room.'
                );
            } else {
                notify.success(
                    'Conflict Free!',
                    `No collisions found for teacher, class, or room during ${testData.day_of_week} ${testData.start_time}-${testData.end_time}.`
                );
            }
        } catch (err) {
            const errMsg = err.message || 'Error occurred while evaluating schedule conflicts.';
            setCheckResult({ has_conflict: true, conflicts: [{ message: errMsg }] });
            notify.conflict('Schedule Conflict Detected!', errMsg);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3 className="panel-title">Schedule Conflict Center</h3>
                    <p className="panel-subtitle">
                        Automated collision detection engine for teacher overlaps, class double-bookings, and room conflicts
                    </p>
                </div>
            </div>

            {/* Conflict Logic Guide & Principles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--teal)', marginBottom: '0.35rem' }}>
                        <Users size={16} /> Teacher Overlap Rule
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        A teacher cannot be assigned to two different classes or subjects during the same day and time slot.
                    </p>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
                        <BookOpen size={16} /> Class Section Rule
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        A class section (e.g. Grade 10 - Rizal) cannot have two simultaneous subjects on the same day.
                    </p>
                </div>

                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
                        <Layers size={16} /> Room Occupancy Rule
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        A classroom or science/computer laboratory cannot accommodate more than one class concurrently.
                    </p>
                </div>
            </div>

            {/* Interactive Conflict Engine Diagnostic Form */}
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Interactive Schedule Collision Validator
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Simulate proposed assignments to test whether any scheduling conflicts exist in the database.
                </p>

                <form onSubmit={handleRunCheck}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Teacher *</label>
                            <select
                                className="form-select"
                                value={testData.teacher_id}
                                onChange={(e) => setTestData({ ...testData, teacher_id: e.target.value })}
                                required
                            >
                                <option value="">-- Choose Teacher --</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.specialization})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Class Section *</label>
                            <select
                                className="form-select"
                                value={testData.school_class_id}
                                onChange={(e) => setTestData({ ...testData, school_class_id: e.target.value })}
                                required
                            >
                                <option value="">-- Choose Class Section --</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Day of Week *</label>
                            <select
                                className="form-select"
                                value={testData.day_of_week}
                                onChange={(e) => setTestData({ ...testData, day_of_week: e.target.value })}
                            >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Classroom / Room *</label>
                            <input 
                                type="text"
                                className="form-input"
                                value={testData.room}
                                onChange={(e) => setTestData({ ...testData, room: e.target.value })}
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
                                value={testData.start_time}
                                onChange={(e) => setTestData({ ...testData, start_time: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">End Time *</label>
                            <input 
                                type="time"
                                className="form-input"
                                value={testData.end_time}
                                onChange={(e) => setTestData({ ...testData, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary btn-sm"
                        disabled={isTesting}
                        style={{ marginTop: '0.5rem' }}
                    >
                        <Clock size={15} /> {isTesting ? 'Analyzing schedule database...' : 'Run Collision Check'}
                    </button>
                </form>

                {/* Validation Output with Ultra-Readable Contrast */}
                {checkResult && (
                    <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
                        {checkResult.has_conflict ? (
                            <div 
                                style={{ 
                                    background: '#FEF2F2', 
                                    border: '1.5px solid #FCA5A5', 
                                    borderRadius: '12px', 
                                    padding: '1.15rem 1.35rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1.25rem',
                                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.08)'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.45rem' }}>
                                        <AlertOctagon size={22} color="#DC2626" /> Schedule Conflict Detected!
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.925rem', color: '#7F1D1D', fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word' }}>
                                        {checkResult.conflicts[0]?.message}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div 
                                style={{ 
                                    background: '#F0FDF4', 
                                    border: '1.5px solid #86EFAC', 
                                    borderRadius: '12px', 
                                    padding: '1.15rem 1.35rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    gap: '1.25rem',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065F46', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                                        <CheckCircle2 size={22} color="#10B981" /> Conflict Free!
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.925rem', color: '#064E3B', fontWeight: 600, lineHeight: 1.5 }}>
                                        No collisions found for teacher, class section, or room during {testData.day_of_week} {testData.start_time}-{testData.end_time}.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
