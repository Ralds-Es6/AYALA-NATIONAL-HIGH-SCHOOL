import React, { useState } from 'react';
import { BookOpen, Search, BookMarked } from 'lucide-react';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CoursesPage({ courses, loading }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = courses.filter((c) =>
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="panel">
            <div className="panel-header">
                <div>
                    <h3 className="panel-title">Curriculum Course Catalog</h3>
                    <p className="panel-subtitle">
                        Accredited course offerings and credit units ({filtered.length} courses)
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                    type="text"
                    className="form-input"
                    placeholder="Search courses by code, title, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                />
            </div>

            {loading ? (
                <LoadingSpinner text="Fetching course catalog from API..." />
            ) : filtered.length > 0 ? (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course Code</th>
                                <th>Course Title</th>
                                <th>Department</th>
                                <th>Lecture Hrs</th>
                                <th>Lab Hrs</th>
                                <th>Credit Units</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((course) => (
                                <tr key={course.id}>
                                    <td>
                                        <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                                            {course.code}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: 600 }}>{course.title}</span>
                                    </td>
                                    <td>
                                        <Badge variant="neutral">
                                            {course.department}
                                        </Badge>
                                    </td>
                                    <td>{course.lecture_hours} hrs/wk</td>
                                    <td>{course.lab_hours} hrs/wk</td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {course.units} units
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {course.description || 'No description provided.'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <BookOpen size={42} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>No courses found matching your search filter.</p>
                </div>
            )}
        </div>
    );
}
