import React, { useState } from 'react';
import { Users, Search, Mail, ShieldAlert, Award, Layers } from 'lucide-react';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function InstructorsPage({ instructors, loading, academicYear, semester }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = instructors.filter((inst) => 
        inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.employment_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3 className="panel-title">Faculty Roster & Workload Capacities</h3>
                    <p className="panel-subtitle">
                        Academic Load Tracking for {semester} ({academicYear})
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                    type="text"
                    className="form-input"
                    placeholder="Search by faculty name, email, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                />
            </div>

            {loading ? (
                <LoadingSpinner text="Loading faculty members and calculating workloads..." />
            ) : filtered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {filtered.map((inst) => {
                        const assigned = inst.current_assigned_units || 0;
                        const max = inst.max_units || 21;
                        const percentage = Math.min(Math.round((assigned / max) * 100), 100);
                        const isOverloaded = assigned > max;

                        let progressColor = 'var(--accent-emerald)';
                        if (percentage > 85) progressColor = 'var(--accent-amber)';
                        if (isOverloaded) progressColor = 'var(--accent-rose)';

                        return (
                            <div 
                                key={inst.id} 
                                className="stat-card"
                                style={{
                                    border: isOverloaded ? '1px solid rgba(244, 63, 94, 0.4)' : undefined,
                                    boxShadow: isOverloaded ? '0 0 15px rgba(244, 63, 94, 0.15)' : undefined
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {inst.name}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            <Mail size={12} />
                                            <span>{inst.email}</span>
                                        </div>
                                    </div>
                                    <Badge variant="neutral">
                                        {inst.employment_type}
                                    </Badge>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                                    <Award size={14} color="var(--primary)" />
                                    <span>{inst.department}</span>
                                </div>

                                {/* Load Meter */}
                                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Teaching Load</span>
                                        <span style={{ color: isOverloaded ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                                            {assigned} / {max} Units
                                        </span>
                                    </div>

                                    <div className="progress-bar-bg">
                                        <div 
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${percentage}%`,
                                                background: progressColor
                                            }}
                                        ></div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {inst.loads_count || 0} assigned section(s)
                                        </span>
                                        {isOverloaded ? (
                                            <span style={{ color: 'var(--accent-rose)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <ShieldAlert size={12} /> Overload (+{assigned - max} units)
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {max - assigned} units remaining
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <Users size={42} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>No faculty members found matching your search.</p>
                </div>
            )}
        </div>
    );
}
