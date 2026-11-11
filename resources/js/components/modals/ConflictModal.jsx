import React from 'react';
import BaseModal from './BaseModal';
import { AlertOctagon, Calendar, Clock, MapPin, User, BookOpen } from 'lucide-react';

/**
 * ConflictModal Component
 * Centered dialog triggered when a schedule conflict or overlap is detected.
 * Clearly articulates why the schedule cannot be saved with structured metadata
 * and clear action buttons.
 */
export default function ConflictModal({
    isOpen,
    onClose,
    onReviewSchedule,
    conflict = null
}) {
    if (!conflict) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Schedule Conflict Detected"
            maxWidth="520px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Conflict Alert Banner */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    padding: '1rem 1.15rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '9999px', 
                            background: '#FEE2E2', 
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <AlertOctagon size={18} />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 3px 0', fontSize: '0.925rem', fontWeight: 800, color: '#B91C1C' }}>
                                Collision Prevention Triggered
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: '#991B1B', lineHeight: 1.4 }}>
                                {conflict.message || 'The selected time slot overlaps with an existing class schedule.'}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Structured Conflict Breakdown Card */}
                <div style={{ 
                    background: '#F8FAFC', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '12px', 
                    padding: '1rem' 
                }}>
                    <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.65rem', letterSpacing: '0.04em' }}>
                        Conflicting Assignment Details
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.825rem' }}>
                        {conflict.teacher_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                <User size={15} color="var(--teal)" />
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Teacher</div>
                                    <span style={{ fontWeight: 600 }}>{conflict.teacher_name}</span>
                                </div>
                            </div>
                        )}

                        {conflict.day && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                <Calendar size={15} color="var(--teal)" />
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Day</div>
                                    <span style={{ fontWeight: 600 }}>{conflict.day}</span>
                                </div>
                            </div>
                        )}

                        {conflict.time && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                <Clock size={15} color="var(--teal)" />
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Time Slot</div>
                                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{conflict.time}</span>
                                </div>
                            </div>
                        )}

                        {conflict.room && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                <MapPin size={15} color="var(--teal)" />
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Room</div>
                                    <span style={{ fontWeight: 600 }}>{conflict.room}</span>
                                </div>
                            </div>
                        )}

                        {conflict.class_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', gridColumn: 'span 2' }}>
                                <BookOpen size={15} color="var(--teal)" />
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Section / Class</div>
                                    <span style={{ fontWeight: 600 }}>{conflict.class_name}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* DepEd Conflict Policy Explanation */}
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Ayala National High School automatic conflict validation enforces zero double-booking policy. A teacher or classroom cannot be assigned to more than one session concurrently.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    {onReviewSchedule && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                onClose();
                                onReviewSchedule(conflict);
                            }}
                        >
                            Review Timetable
                        </button>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}
