import React, { useState } from 'react';
import { 
    Search, 
    Filter, 
    Trash2, 
    Clock, 
    MapPin, 
    Plus, 
    Calendar,
    BookOpen
} from 'lucide-react';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TeachingLoadsPage({ 
    loads, 
    loading, 
    onOpenNewLoad, 
    onDeleteLoad,
    academicYear,
    semester 
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const filteredLoads = loads.filter((load) => {
        const matchesSearch = 
            load.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            load.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            load.instructor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            load.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            load.room?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatus === 'All' || load.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status) => {
        if (status === 'Approved') return 'success';
        if (status === 'Overload') return 'danger';
        if (status === 'Assigned') return 'info';
        return 'warning';
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3 className="panel-title">Teaching Load Allocations</h3>
                    <p className="panel-subtitle">
                        Term: {academicYear} &bull; {semester} ({filteredLoads.length} total sections)
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onOpenNewLoad}>
                    <Plus size={16} />
                    <span>Assign Load</span>
                </button>
            </div>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 240px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="Search by course code, instructor, section, room..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.4rem' }}
                    />
                </div>

                <div style={{ width: '180px' }}>
                    <select 
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Approved">Approved</option>
                        <option value="Overload">Overload</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <LoadingSpinner text="Retrieving teaching loads from API..." />
            ) : filteredLoads.length > 0 ? (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course Details</th>
                                <th>Assigned Faculty</th>
                                <th>Section</th>
                                <th>Schedule</th>
                                <th>Room</th>
                                <th>Units</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLoads.map((load) => (
                                <tr key={load.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                            {load.course?.code}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {load.course?.title}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{load.instructor?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {load.instructor?.department} &bull; {load.instructor?.employment_type}
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
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem' }}>
                                            <MapPin size={13} color="var(--text-muted)" />
                                            <span>{load.room}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 700 }}>
                                            {load.course?.units}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '3px' }}>
                                            ({load.course?.lecture_hours}L / {load.course?.lab_hours}Lab)
                                        </span>
                                    </td>
                                    <td>
                                        <Badge variant={getStatusVariant(load.status)}>
                                            {load.status}
                                        </Badge>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button 
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => onDeleteLoad(load.id)}
                                            title="Delete assignment"
                                            style={{ color: 'var(--accent-rose)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <BookOpen size={42} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <h4>No Teaching Loads Found</h4>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        {searchTerm ? 'No results matched your search query.' : 'Click "Assign Load" to schedule a class section.'}
                    </p>
                </div>
            )}
        </div>
    );
}
