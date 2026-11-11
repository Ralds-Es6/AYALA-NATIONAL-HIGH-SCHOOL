import React from 'react';
import { 
    Users, 
    BookOpen, 
    CalendarCheck, 
    Layers, 
    AlertOctagon, 
    Percent, 
    Clock, 
    ArrowRight 
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage({ stats, loading, onNavigate, onOpenNewLoad }) {
    if (loading || !stats) {
        return <LoadingSpinner text="Computing dashboard metrics from Laravel Service..." />;
    }

    const getStatusVariant = (status) => {
        if (status === 'Approved') return 'success';
        if (status === 'Overload') return 'danger';
        if (status === 'Assigned') return 'info';
        return 'warning';
    };

    return (
        <div>
            {/* Overload Alert if any */}
            {stats.overloaded_instructors > 0 && (
                <div className="alert-banner danger">
                    <AlertOctagon size={20} />
                    <div style={{ flex: 1 }}>
                        <strong>Workload Capacity Alert:</strong> {stats.overloaded_instructors} faculty member(s) exceed their maximum allowable unit limits for {stats.semester} ({stats.academic_year}).
                    </div>
                    <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => onNavigate('instructors')}
                    >
                        Review Faculty
                    </button>
                </div>
            )}

            {/* KPI Metrics Grid */}
            <div className="stats-grid">
                <StatCard 
                    title="Faculty Roster"
                    value={stats.total_instructors}
                    subtitle="Active teaching staff"
                    icon={Users}
                    color="var(--primary)"
                />
                <StatCard 
                    title="Course Catalog"
                    value={stats.total_courses}
                    subtitle="Curriculum offerings"
                    icon={BookOpen}
                    color="var(--accent-cyan)"
                />
                <StatCard 
                    title="Teaching Loads"
                    value={stats.total_assigned_loads}
                    subtitle={`Sections for ${stats.semester}`}
                    icon={CalendarCheck}
                    color="var(--accent-emerald)"
                />
                <StatCard 
                    title="Total Units Assigned"
                    value={`${stats.total_assigned_units} hrs`}
                    subtitle="Aggregated credit units"
                    icon={Layers}
                    color="var(--accent-violet)"
                />
                <StatCard 
                    title="Capacity Utilization"
                    value={`${stats.capacity_utilization_percentage}%`}
                    subtitle="Faculty workload capacity"
                    icon={Percent}
                    color="var(--accent-amber)"
                />
                <StatCard 
                    title="Overloaded Staff"
                    value={stats.overloaded_instructors}
                    subtitle="Exceeding unit limits"
                    icon={AlertOctagon}
                    color="var(--accent-rose)"
                />
            </div>

            {/* Recent Assignments Panel */}
            <div className="panel">
                <div className="panel-header">
                    <div>
                        <h3 className="panel-title">Recent Load Assignments</h3>
                        <p className="panel-subtitle">Latest class schedule allocations processed by the Laravel backend</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('loads')}>
                            <span>View All Loads</span>
                            <ArrowRight size={14} />
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={onOpenNewLoad}>
                            Assign New
                        </button>
                    </div>
                </div>

                {stats.recent_assignments && stats.recent_assignments.length > 0 ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>Faculty Member</th>
                                    <th>Section</th>
                                    <th>Schedule & Room</th>
                                    <th>Units</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent_assignments.map((load) => (
                                    <tr key={load.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{load.course?.code}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {load.course?.title}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{load.instructor?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {load.instructor?.department}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                                                {load.section}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
                                                <Clock size={13} color="var(--text-muted)" />
                                                <span>{load.schedule}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {load.room}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600 }}>{load.course?.units} units</span>
                                        </td>
                                        <td>
                                            <Badge variant={getStatusVariant(load.status)}>
                                                {load.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No teaching loads assigned for this academic period yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
