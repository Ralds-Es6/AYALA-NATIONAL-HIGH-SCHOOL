import React, { useState } from 'react';
import { Clock, MapPin, User, BookOpen, AlertOctagon, CheckCircle2, Calendar, Coffee, Utensils, LayoutGrid, Columns } from 'lucide-react';
import Badge from './Badge';

// Continuous DepEd Secondary Timetable Periods (Morning to Afternoon - No Fixed Recess or Lunch Rows)
const STANDARD_PERIODS = [
    { id: 'p1', period: 'Period 1', start: '07:30', end: '08:30' },
    { id: 'p2', period: 'Period 2', start: '08:30', end: '09:30' },
    { id: 'p3', period: 'Period 3', start: '09:30', end: '10:30' },
    { id: 'p4', period: 'Period 4', start: '10:30', end: '11:30' },
    { id: 'p5', period: 'Period 5', start: '11:30', end: '12:30' },
    { id: 'p6', period: 'Period 6', start: '12:30', end: '13:30' },
    { id: 'p7', period: 'Period 7', start: '13:30', end: '14:30' },
    { id: 'p8', period: 'Period 8', start: '14:30', end: '15:30' },
    { id: 'p9', period: 'Period 9', start: '15:30', end: '16:30' },
    { id: 'p10', period: 'Period 10', start: '16:30', end: '17:30' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper to convert HH:MM string to minutes from midnight
const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

export default function TimetableGrid({ 
    schedules = [], 
    isStudentView = false, 
    onScheduleClick,
    onSlotClick
}) {
    const [displayStyle, setDisplayStyle] = useState('matrix'); // 'matrix' (Period Grid) or 'cards' (Day Columns)

    // Helper to find schedules matching a specific day and period
    const getSchedulesForSlot = (day, period) => {
        const pStart = toMinutes(period.start);
        const pEnd = toMinutes(period.end);

        return schedules.filter(s => {
            if (s.day_of_week !== day) return false;
            const sStart = toMinutes(s.start_time);
            const sEnd = toMinutes(s.end_time);

            // Check for overlap: max(start1, start2) < min(end1, end2)
            return Math.max(pStart, sStart) < Math.min(pEnd, sEnd);
        });
    };

    // Card View grouping (fallback or alternative)
    const schedulesByDay = DAYS.reduce((acc, day) => {
        acc[day] = schedules
            .filter((s) => s.day_of_week === day)
            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
        return acc;
    }, {});

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div style={{ marginTop: '0.75rem' }}>
            {/* View Mode Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={15} style={{ color: 'var(--teal)' }} />
                    <span>Total sessions displayed: <strong>{schedules.length}</strong></span>
                </div>

                <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid #E2E8F0' }}>
                    <button
                        type="button"
                        onClick={() => setDisplayStyle('matrix')}
                        className={`btn btn-sm ${displayStyle === 'matrix' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '5px' }}
                    >
                        <LayoutGrid size={13} />
                        <span>Period Matrix (DepEd Table)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDisplayStyle('cards')}
                        className={`btn btn-sm ${displayStyle === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '5px' }}
                    >
                        <Columns size={13} />
                        <span>Day Columns</span>
                    </button>
                </div>
            </div>

            {/* ==============================================================
                1. PERIOD-BASED MATRIX (PROFESSIONAL TIMETABLE FORMAT)
               ============================================================== */}
            {displayStyle === 'matrix' ? (
                <div className="panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="table-responsive" style={{ maxHeight: '720px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                            <thead>
                                <tr style={{ background: '#0F172A', color: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
                                    <th style={{ width: '130px', padding: '12px 14px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', borderRight: '1px solid #334155' }}>
                                        Time Period
                                    </th>
                                    {DAYS.map(day => (
                                        <th 
                                            key={day} 
                                            style={{ 
                                                padding: '12px 14px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 800, 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.04em',
                                                borderRight: '1px solid #334155',
                                                background: todayName === day ? '#1E3A8A' : 'transparent',
                                                color: todayName === day ? '#FCD34D' : '#FFFFFF'
                                            }}
                                        >
                                            {day} {todayName === day && '(Today)'}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {STANDARD_PERIODS.map(period => (
                                    <tr key={period.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            {/* Leftmost Period Info Column */}
                                            <td style={{ padding: '10px 12px', background: '#F8FAFC', borderRight: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A' }}>
                                                    {period.period}
                                                </div>
                                                <div style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: 'var(--teal)', fontWeight: 600, marginTop: '2px' }}>
                                                    {period.start} - {period.end}
                                                </div>
                                            </td>

                                            {/* Days Columns */}
                                            {DAYS.map(day => {
                                                const slotItems = getSchedulesForSlot(day, period);
                                                const hasConflict = slotItems.length > 1;

                                                return (
                                                    <td 
                                                        key={`${period.id}-${day}`}
                                                        style={{ 
                                                            padding: '6px 8px', 
                                                            borderRight: '1px solid #E2E8F0', 
                                                            verticalAlign: 'top',
                                                            background: hasConflict ? '#FEF2F2' : todayName === day ? 'rgba(30, 58, 138, 0.02)' : '#FFFFFF',
                                                            minWidth: '150px'
                                                        }}
                                                    >
                                                        {slotItems.length === 0 ? (
                                                            <div 
                                                                onClick={() => onSlotClick && onSlotClick(day, period)}
                                                                style={{ 
                                                                    height: '100%', 
                                                                    minHeight: '62px', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    color: '#CBD5E1',
                                                                    fontSize: '0.725rem',
                                                                    fontWeight: 500,
                                                                    borderRadius: '6px',
                                                                    cursor: onSlotClick ? 'pointer' : 'default',
                                                                    transition: 'background 0.15s ease'
                                                                }}
                                                            >
                                                                <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>— Vacant —</span>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                {hasConflict && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800 }}>
                                                                        <AlertOctagon size={11} />
                                                                        <span>{slotItems.length} Overlapping Sessions!</span>
                                                                    </div>
                                                                )}
                                                                {slotItems.map(item => {
                                                                    const cardColor = item.subject?.color || 'var(--teal)';

                                                                    return (
                                                                        <div
                                                                            key={item.id}
                                                                            onClick={() => onScheduleClick && onScheduleClick(item)}
                                                                            className="schedule-card"
                                                                            style={{
                                                                                margin: 0,
                                                                                padding: '7px 9px',
                                                                                borderLeftColor: cardColor,
                                                                                borderLeftWidth: '4px',
                                                                                borderLeftStyle: 'solid',
                                                                                background: '#FFFFFF',
                                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                                                                borderRadius: '6px',
                                                                                cursor: onScheduleClick ? 'pointer' : 'default',
                                                                                transition: 'all 0.15s ease'
                                                                            }}
                                                                        >
                                                                            {/* Subject Title */}
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                                                                                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0F172A', lineHeight: 1.2 }}>
                                                                                    {item.subject?.name || item.subject?.code}
                                                                                </span>
                                                                            </div>

                                                                            {/* Teacher or Section */}
                                                                            {isStudentView ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#475569', marginTop: '3px' }}>
                                                                                    <User size={11} style={{ color: 'var(--teal)' }} />
                                                                                    <span style={{ fontWeight: 600 }}>{item.teacher?.name}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', color: '#00563F', fontWeight: 700, marginTop: '3px' }}>
                                                                                    <BookOpen size={11} />
                                                                                    <span>{item.school_class?.name || item.schoolClass?.name}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Room and Teacher (Admin View) */}
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.675rem', color: '#64748B' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                                    <MapPin size={10} />
                                                                                    <span>{item.room || 'TBA'}</span>
                                                                                </div>
                                                                                {!isStudentView && item.teacher && (
                                                                                    <span style={{ color: '#475569', fontWeight: 600 }}>
                                                                                        {item.teacher.name.split(' ').pop()}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* ==============================================================
                    2. DAY COLUMNS VIEW (COMPACT CARD LIST)
                   ============================================================== */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
                    {DAYS.map((day) => {
                        const daySchedules = schedulesByDay[day] || [];
                        const isToday = todayName === day;

                        return (
                            <div 
                                key={day} 
                                style={{ 
                                    background: '#FFFFFF', 
                                    border: isToday ? '2px solid var(--teal)' : '1px solid var(--border-subtle)', 
                                    borderRadius: 'var(--radius-md)', 
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: isToday ? '0 4px 12px rgba(13, 148, 136, 0.12)' : 'var(--shadow-sm)'
                                }}
                            >
                                <div 
                                    style={{ 
                                        padding: '0.75rem 1rem', 
                                        background: isToday ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(6, 182, 212, 0.08))' : '#F8FAFC', 
                                        borderBottom: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isToday ? 'var(--teal)' : 'var(--text-primary)' }}>
                                        {day}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {daySchedules.length} class{daySchedules.length === 1 ? '' : 'es'}
                                    </span>
                                </div>

                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, background: '#FFFFFF' }}>
                                    {daySchedules.length > 0 ? (
                                        daySchedules.map((item) => {
                                            const startTime = item.start_time ? item.start_time.substring(0, 5) : '';
                                            const endTime = item.end_time ? item.end_time.substring(0, 5) : '';
                                            const cardColor = item.subject?.color || 'var(--teal)';

                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className="schedule-card"
                                                    onClick={() => onScheduleClick && onScheduleClick(item)}
                                                    style={{
                                                        borderLeftColor: cardColor,
                                                        background: '#F8FAFC',
                                                        border: '1px solid var(--border-subtle)',
                                                        borderLeft: `4px solid ${cardColor}`,
                                                        cursor: onScheduleClick ? 'pointer' : 'default',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                            {item.subject?.name || item.subject?.code}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '0.7rem', 
                                                            fontFamily: 'monospace', 
                                                            color: 'var(--teal)', 
                                                            fontWeight: 600,
                                                            background: 'rgba(13, 148, 136, 0.08)',
                                                            padding: '1px 5px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {startTime} - {endTime}
                                                        </span>
                                                    </div>

                                                    {isStudentView ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                                            <User size={12} color="var(--primary)" />
                                                            <span>{item.teacher?.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '3px' }}>
                                                            <BookOpen size={12} />
                                                            <span>{item.school_class?.name || item.schoolClass?.name}</span>
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        <MapPin size={11} />
                                                        <span>{item.room || 'TBD'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ padding: '2rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                                            No classes scheduled
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

