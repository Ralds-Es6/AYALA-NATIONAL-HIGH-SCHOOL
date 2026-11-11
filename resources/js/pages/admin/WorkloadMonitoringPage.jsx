import React, { useState } from 'react';
import { Users, Search, ShieldAlert, Award, Clock, Layers, BookOpen } from 'lucide-react';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function WorkloadMonitoringPage({ workloadData, loading }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    if (loading || !workloadData) {
        return <LoadingSpinner text="Computing teacher workload statistics..." />;
    }

    const teachers = workloadData.teacher_summaries || [];

    const filtered = teachers.filter((t) => {
        const matchesSearch = 
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'All' || t.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status) => {
        if (status === 'Overload') return 'danger';
        if (status === 'Underload') return 'warning';
        return 'success';
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3 className="panel-title">Teacher Workload Monitoring</h3>
                    <p className="panel-subtitle">
                        Standard DepEd workload capacity tracking (Limit: 30 teaching hours/week)
                    </p>
                </div>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 240px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="Search by teacher name, position, specialization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.4rem' }}
                    />
                </div>

                <div style={{ width: '180px' }}>
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Load Statuses</option>
                        <option value="Normal">Normal Load (18-30h)</option>
                        <option value="Underload">Underload (&lt;18h)</option>
                        <option value="Overload">Overload (&gt;30h)</option>
                    </select>
                </div>
            </div>

            {/* Teacher Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {filtered.map((teacher) => {
                    const assigned = teacher.assigned_hours;
                    const max = teacher.max_weekly_hours || 30;
                    const percentage = Math.min(Math.round((assigned / max) * 100), 100);
                    const isOverloaded = assigned > max;

                    let progressColor = 'var(--accent-emerald)';
                    if (percentage > 85) progressColor = 'var(--accent-amber)';
                    if (isOverloaded) progressColor = 'var(--accent-rose)';

                    return (
                        <div 
                            key={teacher.teacher_id} 
                            className="stat-card"
                            style={{
                                border: isOverloaded ? '1px solid rgba(244, 63, 94, 0.4)' : undefined,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {teacher.name}
                                    </h4>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                                        {teacher.employee_id} &bull; {teacher.position}
                                    </div>
                                </div>
                                <Badge variant={getStatusVariant(teacher.status)}>
                                    {teacher.status}
                                </Badge>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                <Award size={13} color="var(--primary)" />
                                <span>{teacher.specialization} Department</span>
                            </div>

                            {/* Load Progress Meter */}
                            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Teaching Hours</span>
                                    <span style={{ color: isOverloaded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                                        {assigned} / {max} hrs ({percentage}%)
                                    </span>
                                </div>

                                <div className="progress-bar-bg">
                                    <div 
                                        className="progress-bar-fill"
                                        style={{ width: `${percentage}%`, background: progressColor }}
                                    ></div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                    <span>{teacher.sections_count} Section(s)</span>
                                    <span>{teacher.subjects_count} Subject(s)</span>
                                    <span>{max - assigned > 0 ? `${max - assigned}h capacity left` : 'Limit reached'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
