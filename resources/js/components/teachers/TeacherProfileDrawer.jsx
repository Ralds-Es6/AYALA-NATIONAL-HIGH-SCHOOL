import React, { useState } from 'react';
import { 
    User, 
    Mail, 
    Phone, 
    Award, 
    Layers, 
    CalendarCheck, 
    Clock, 
    MapPin, 
    BookOpen 
} from 'lucide-react';
import Drawer from '../ui/Drawer';
import Badge from '../Badge';
import TimetableGrid from '../TimetableGrid';

export default function TeacherProfileDrawer({ 
    isOpen, 
    onClose, 
    teacher, 
    schedules = [] 
}) {
    const [activeTab, setActiveTab] = useState('info');

    if (!teacher) return null;

    const teacherSchedules = schedules.filter((s) => s.teacher_id === teacher.id);
    const loads = teacher.teaching_loads || teacher.teachingLoads || [];
    const assignedHours = loads.reduce((acc, l) => acc + (l.teaching_hours || 0), 0);
    const maxHours = teacher.max_weekly_hours || 30;

    return (
        <Drawer isOpen={isOpen} title="Teacher Profile" onClose={onClose} width="520px">
            <div>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 800
                    }}>
                        {teacher.name?.charAt(0)}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {teacher.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <Badge variant="info">{teacher.position}</Badge>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                                {teacher.employee_id}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                    <button
                        className={`btn-ghost ${activeTab === 'info' ? 'btn-primary' : ''}`}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            borderBottom: activeTab === 'info' ? '2px solid var(--primary)' : '2px solid transparent',
                            borderRadius: '0',
                            fontWeight: 600,
                        }}
                        onClick={() => setActiveTab('info')}
                    >
                        Information
                    </button>
                    <button
                        className={`btn-ghost ${activeTab === 'loads' ? 'btn-primary' : ''}`}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            borderBottom: activeTab === 'loads' ? '2px solid var(--primary)' : '2px solid transparent',
                            borderRadius: '0',
                            fontWeight: 600,
                        }}
                        onClick={() => setActiveTab('loads')}
                    >
                        Teaching Load ({loads.length})
                    </button>
                    <button
                        className={`btn-ghost ${activeTab === 'schedule' ? 'btn-primary' : ''}`}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            borderBottom: activeTab === 'schedule' ? '2px solid var(--primary)' : '2px solid transparent',
                            borderRadius: '0',
                            fontWeight: 600,
                        }}
                        onClick={() => setActiveTab('schedule')}
                    >
                        Schedule ({teacherSchedules.length})
                    </button>
                </div>

                {/* TAB 1: Information */}
                {activeTab === 'info' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>
                                Professional Details
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Specialization:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{teacher.specialization}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>DepEd Position:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{teacher.position}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Max Weekly Limit:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{maxHours} hours/week</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>
                                Contact Details
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={15} color="var(--primary)" />
                                    <span>{teacher.email}</span>
                                </div>
                                {teacher.contact_number && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={15} color="var(--accent-emerald)" />
                                        <span>{teacher.contact_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Workload Mini-Meter */}
                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Current Teaching Workload</span>
                                <span style={{ color: assignedHours > maxHours ? 'var(--accent-rose)' : 'var(--teal)' }}>
                                    {assignedHours} / {maxHours} hrs
                                </span>
                            </div>
                            <div className="progress-bar-bg" style={{ marginTop: '0.4rem' }}>
                                <div 
                                    className="progress-bar-fill" 
                                    style={{
                                        width: `${Math.min(Math.round((assignedHours / maxHours) * 100), 100)}%`,
                                        background: assignedHours > maxHours ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: Teaching Load */}
                {activeTab === 'loads' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {loads.length > 0 ? (
                            loads.map((load) => (
                                <div 
                                    key={load.id} 
                                    style={{
                                        background: '#F8FAFC',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.85rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                            {load.subject?.name || load.subject?.code}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {load.school_class?.name || load.schoolClass?.name}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Badge variant="info">
                                            {load.teaching_hours} hrs/wk
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                                No teaching loads assigned yet.
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: Schedule Timetable */}
                {activeTab === 'schedule' && (
                    <div>
                        {teacherSchedules.length > 0 ? (
                            <TimetableGrid schedules={teacherSchedules} isStudentView={false} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                                No classes scheduled for this teacher yet.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Drawer>
    );
}
