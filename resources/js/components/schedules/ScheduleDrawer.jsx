import React from 'react';
import { 
    Clock, 
    MapPin, 
    User, 
    BookOpen, 
    Calendar, 
    Trash2, 
    Layers, 
    ShieldCheck,
    Edit3
} from 'lucide-react';
import Drawer from '../ui/Drawer';
import Badge from '../Badge';

export default function ScheduleDrawer({ 
    isOpen, 
    onClose, 
    schedule, 
    onDelete,
    onEdit
}) {
    if (!schedule) return null;

    const startTime = schedule.start_time ? schedule.start_time.substring(0, 5) : '';
    const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : '';
    const cardColor = schedule.subject?.color || 'var(--primary)';

    return (
        <Drawer isOpen={isOpen} title="Schedule Details" onClose={onClose} width="460px">
            <div>
                {/* Header Banner */}
                <div style={{
                    background: `linear-gradient(135deg, rgba(13, 148, 136, 0.06), rgba(6, 182, 212, 0.06))`,
                    border: `1px solid var(--border-subtle)`,
                    borderLeft: `5px solid ${cardColor}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase' }}>
                        {schedule.subject?.code} &bull; Grade {schedule.subject?.grade_level || schedule.school_class?.grade_level || schedule.schoolClass?.grade_level}
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                        {schedule.subject?.name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <Badge variant="neutral">
                            {schedule.school_class?.name || schedule.schoolClass?.name}
                        </Badge>
                        {(schedule.school_class?.strand || schedule.schoolClass?.strand || schedule.subject?.strand) && (
                            <Badge variant="success">
                                {schedule.school_class?.strand || schedule.schoolClass?.strand || schedule.subject?.strand}
                            </Badge>
                        )}
                        {(schedule.school_class?.track || schedule.schoolClass?.track) && (
                            <Badge variant="teal">
                                {schedule.school_class?.track || schedule.schoolClass?.track}
                            </Badge>
                        )}
                        <Badge variant="info">
                            {schedule.day_of_week}
                        </Badge>
                    </div>
                </div>

                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(13, 148, 136, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
                            <User size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Faculty</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {schedule.teacher?.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {schedule.teacher?.position} &bull; {schedule.teacher?.specialization}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                            <Clock size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Schedule Time</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                {startTime} — {endTime}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {schedule.day_of_week}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                            <MapPin size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Room</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {schedule.room || 'General Classroom'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                    {onEdit && (
                        <button 
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ background: '#00563F', borderColor: '#004B37', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                                onEdit(schedule);
                                onClose();
                            }}
                        >
                            <Edit3 size={15} /> Edit Session
                        </button>
                    )}
                    <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                            if (onDelete) {
                                onDelete(schedule.id);
                                onClose();
                            }
                        }}
                    >
                        <Trash2 size={15} /> Remove Schedule
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </Drawer>
    );
}
