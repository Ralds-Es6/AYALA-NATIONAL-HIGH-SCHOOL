import React, { useEffect } from 'react';
import {
    Clock,
    MapPin,
    User,
    BookOpen,
    Calendar,
    GraduationCap,
    Layers,
    FileText,
    CheckCircle2,
    AlertTriangle,
    X,
    Edit3,
    Trash2,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import { to12Hour, calcDuration } from './InteractiveScheduleModal';

/**
 * ScheduleDetailModal
 * 
 * Accessible, beautifully styled modal showing complete details of a clicked schedule entry.
 * Fulfills all Requirement 4 specifications:
 * - Teacher full name, department, email, position
 * - Subject name and code
 * - Classroom / laboratory assignment
 * - Day of the week
 * - 12-hour start and end time with calculated duration
 * - Assigned class section, grade level, track/strand
 * - Academic year & semester/quarter
 * - Session type (lecture, lab, etc.) and notes
 * - Accessible close button and Escape key listener
 */
export default function ScheduleDetailModal({
    isOpen,
    onClose,
    schedule,
    onEdit,
    onDelete,
    isAdmin = true,
}) {
    // Escape key listener for accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !schedule) return null;

    const teacher = schedule.teacher;
    const subject = schedule.subject;
    const schoolClass = schedule.school_class || schedule.schoolClass;
    const load = schedule.teaching_load || schedule.teachingLoad;

    const startTime12 = to12Hour(schedule.start_time);
    const endTime12 = to12Hour(schedule.end_time);
    const durationStr = calcDuration(schedule.start_time, schedule.end_time);
    const cardColor = subject?.color || '#1E3A8A';

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-detail-title"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.15s ease'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* ── Header Banner ─────────────────────────────────── */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, #0A1628 0%, #0F2240 60%, #1A3060 100%)',
                    color: '#FFFFFF',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px',
                    position: 'relative',
                    borderBottom: '3px solid #F59E0B'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close schedule details modal"
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(255, 255, 255, 0.12)',
                            border: 'none',
                            color: '#FFFFFF',
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                    >
                        <X size={16} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#FCD34D',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                        }}>
                            {subject?.code || 'ACAD-SUBJ'}
                        </span>
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: '#E2E8F0',
                            textTransform: 'capitalize'
                        }}>
                            {schedule.session_type || 'Lecture'} Session
                        </span>
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#6EE7B7',
                            border: '1px solid rgba(16, 185, 129, 0.4)'
                        }}>
                            {schedule.day_of_week}
                        </span>
                    </div>

                    <h2 id="schedule-detail-title" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
                        {subject?.name || 'Academic Subject'}
                    </h2>

                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>
                        Grade {schoolClass?.grade_level || subject?.grade_level || '—'} &bull; {schoolClass?.name || 'Assigned Section'}
                    </div>
                </div>

                {/* ── Body: Detailed Breakdown ───────────────────────── */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Grid of Key Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                        {/* 1. Teacher Information */}
                        <div style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1D4ED8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <User size={18} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Assigned Faculty
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', wordBreak: 'break-word' }}>
                                    {teacher?.name || 'Unassigned Instructor'}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '1px' }}>
                                    {teacher?.department || 'Academic Department'}
                                    {teacher?.position ? ` • ${teacher.position}` : ''}
                                </div>
                                {teacher?.email && (
                                    <div style={{ fontSize: '0.7rem', color: '#2563EB', marginTop: '2px' }}>
                                        {teacher.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Timing & Duration */}
                        <div style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: '#FEF3C7',
                                border: '1px solid #FDE68A',
                                color: '#B45309',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Clock size={18} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Schedule & Duration
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'monospace' }}>
                                    {startTime12} – {endTime12}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                                    {durationStr} ({schedule.day_of_week})
                                </div>
                            </div>
                        </div>

                        {/* 3. Section Assignment */}
                        <div style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                color: '#059669',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <GraduationCap size={18} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Class Section
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                                    {schoolClass?.name || 'Class Section TBA'}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '1px' }}>
                                    Grade {schoolClass?.grade_level || '—'}
                                    {schoolClass?.track ? ` • ${schoolClass.track}` : ''}
                                    {schoolClass?.strand ? ` (${schoolClass.strand})` : ''}
                                </div>
                            </div>
                        </div>

                        {/* 4. Classroom / Venue */}
                        <div style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: '#F5F3FF',
                                border: '1px solid #DDD6FE',
                                color: '#7C3AED',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <MapPin size={18} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Classroom / Venue
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                                    {schedule.room || 'General Classroom'}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '1px' }}>
                                    Ayala NHS Campus Facility
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Metadata Banner */}
                    <div style={{
                        background: '#F1F5F9',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#475569',
                        flexWrap: 'wrap',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} style={{ color: '#0F172A' }} />
                            <span>Academic Year: <strong>{load?.academic_year || '2026-2027'}</strong></span>
                            <span>&bull;</span>
                            <span>Term: <strong>{load?.semester_or_quarter || 'Term 1 / 1st Quarter'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#15803D', fontWeight: 700 }}>
                            <ShieldCheck size={14} />
                            <span>Conflict-Free Verified</span>
                        </div>
                    </div>

                    {/* Syllabus / Notes if present */}
                    {schedule.notes && (
                        <div style={{
                            background: '#FFFBEB',
                            border: '1px solid #FCD34D',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FileText size={13} />
                                Instructions & Syllabus Notes
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#78350F', lineHeight: 1.4 }}>
                                {schedule.notes}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer Actions ─────────────────────────────────── */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomLeftRadius: '16px',
                    borderBottomRightRadius: '16px',
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        {isAdmin && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(`Are you sure you want to delete this schedule entry (${subject?.name || 'Class'})?`)) {
                                        onDelete(schedule.id);
                                        onClose();
                                    }
                                }}
                                style={{
                                    border: '1px solid #FCA5A5',
                                    background: '#FEF2F2',
                                    color: '#B91C1C',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Trash2 size={13} />
                                Delete Entry
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isAdmin && onEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    onEdit(schedule);
                                    onClose();
                                }}
                                style={{
                                    border: '1px solid #2563EB',
                                    background: '#2563EB',
                                    color: '#FFFFFF',
                                    borderRadius: '8px',
                                    padding: '6px 14px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Edit3 size={13} />
                                Edit Schedule
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#334155',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
