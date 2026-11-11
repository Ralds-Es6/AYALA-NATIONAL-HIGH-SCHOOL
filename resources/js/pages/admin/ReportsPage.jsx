import React, { useState, useEffect } from 'react';
import { 
    Printer, 
    FileText, 
    Calendar, 
    Award, 
    Download, 
    Filter, 
    BookOpen, 
    Users, 
    Clock, 
    CheckCircle2,
    Layers,
    GraduationCap
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';

export default function ReportsPage({ teachers = [], classes = [], subjects = [] }) {
    const [reportType, setReportType] = useState('schedules'); // 'schedules', 'assessments', 'summary'
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Filters
    const [scheduleFilterType, setScheduleFilterType] = useState('class'); // 'class' or 'teacher'
    const [selectedEntityId, setSelectedEntityId] = useState(classes[0]?.id || '');
    const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
    const [selectedQuarter, setSelectedQuarter] = useState('1st Quarter');

    // Fetch report data
    const loadReport = async () => {
        setLoading(true);
        try {
            if (reportType === 'schedules') {
                const res = await srnhsApi.getSchedulesReport({
                    type: scheduleFilterType,
                    id: selectedEntityId,
                });
                setReportData(res);
            } else if (reportType === 'assessments') {
                const res = await srnhsApi.getAssessmentsReport({
                    school_class_id: selectedEntityId,
                    subject_id: selectedSubjectId,
                    quarter: selectedQuarter,
                });
                setReportData(res);
            } else if (reportType === 'summary') {
                const res = await srnhsApi.getPerformanceSummaryReport();
                setReportData(res);
            }
        } catch (err) {
            console.error('Error generating report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classes.length > 0 && !selectedEntityId) {
            setSelectedEntityId(classes[0].id);
        }
        if (subjects.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(subjects[0].id);
        }
    }, [classes, subjects]);

    useEffect(() => {
        loadReport();
    }, [reportType, scheduleFilterType, selectedEntityId, selectedSubjectId, selectedQuarter]);

    return (
        <div className="space-y-6">
            {/* ─── Page Header (Matching Screenshot 6) ────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                <div>
                    <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>Official Institutional Records</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
                        Academic &amp; Scheduling Reports Center
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                        Generate, review and print official academic schedules, grading master sheets and institutional summaries.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
                        onClick={() => window.print()}
                        disabled={loading || !reportData}
                    >
                        <Printer size={15} />
                        <span>Print Official Report</span>
                    </button>
                </div>
            </div>

            {/* Control Panel (Hidden during Print) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs no-print space-y-4">
                {/* Report Type Selector */}
                <div className="inline-flex p-1 bg-slate-100/80 rounded-xl gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setReportType('schedules')}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            reportType === 'schedules'
                                ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                    >
                        <span>Timetable Schedules Report</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportType('assessments')}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            reportType === 'assessments'
                                ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                    >
                        <span>Class Assessment Master Sheet</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setReportType('summary')}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            reportType === 'summary'
                                ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/60 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                    >
                        <span>Institutional Performance Summary</span>
                    </button>
                </div>

                {/* Filter Options for active report */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {reportType === 'schedules' && (
                        <>
                            <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Schedule By</label>
                                <select 
                                    className="form-control"
                                    value={scheduleFilterType}
                                    onChange={(e) => {
                                        setScheduleFilterType(e.target.value);
                                        setSelectedEntityId(e.target.value === 'class' ? classes[0]?.id : teachers[0]?.id);
                                    }}
                                >
                                    <option value="class">Class Section</option>
                                    <option value="teacher">Faculty Member</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0, minWidth: '220px' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                                    {scheduleFilterType === 'class' ? 'Select Section' : 'Select Faculty'}
                                </label>
                                <select 
                                    className="form-control"
                                    value={selectedEntityId}
                                    onChange={(e) => setSelectedEntityId(e.target.value)}
                                >
                                    {scheduleFilterType === 'class' ? (
                                        classes.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} (Grade {c.grade_level})</option>
                                        ))
                                    ) : (
                                        teachers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </>
                    )}

                    {reportType === 'assessments' && (
                        <>
                            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Class Section</label>
                                <select 
                                    className="form-control"
                                    value={selectedEntityId}
                                    onChange={(e) => setSelectedEntityId(e.target.value)}
                                >
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject Curriculum</label>
                                <select 
                                    className="form-control"
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                >
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0, minWidth: '140px' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Grading Quarter</label>
                                <select 
                                    className="form-control"
                                    value={selectedQuarter}
                                    onChange={(e) => setSelectedQuarter(e.target.value)}
                                >
                                    <option value="1st Quarter">1st Quarter</option>
                                    <option value="2nd Quarter">2nd Quarter</option>
                                    <option value="3rd Quarter">3rd Quarter</option>
                                    <option value="4th Quarter">4th Quarter</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Official Report Document Area */}
            {loading || !reportData ? (
                <LoadingSpinner text="Compiling official report dataset..." />
            ) : (
                <div className="panel printable-sheet" style={{ background: '#FFFFFF', padding: '2rem' }}>
                    {/* DepEd & School Formal Report Header */}
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #0F2744', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                            Republic of the Philippines &bull; Department of Education
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--royal-blue)', margin: '0.35rem 0 0.15rem' }}>
                            AYALA NATIONAL HIGH SCHOOL
                        </h1>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-gold-dark)' }}>
                            {reportData.report_title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            School Year: {reportData.academic_year} &bull; Generated: {reportData.generated_at}
                        </div>
                    </div>

                    {/* Report Specific Details */}
                    {reportType === 'schedules' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700, fontSize: '0.95rem' }}>
                                <span>Target: <span style={{ color: 'var(--royal-bright)' }}>{reportData.target_name}</span></span>
                                <span>Total Weekly Sessions: {reportData.total_sessions}</span>
                            </div>

                            <table className="gradebook-table" style={{ border: '1px solid var(--border-subtle)' }}>
                                <thead>
                                    <tr>
                                        <th>Day of Week</th>
                                        <th>Time Slot</th>
                                        <th>Subject</th>
                                        <th>Class Section</th>
                                        <th>Assigned Faculty</th>
                                        <th>Classroom</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.data?.map((s) => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 700 }}>{s.day_of_week}</td>
                                            <td style={{ fontFamily: 'monospace' }}>
                                                {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{s.subject?.name}</td>
                                            <td>{s.school_class?.name}</td>
                                            <td>{s.teacher?.name}</td>
                                            <td>
                                                <Badge variant="neutral">{s.room}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {reportType === 'assessments' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <div>
                                    <strong>Section:</strong> {reportData.class_name} &bull; <strong>Adviser:</strong> {reportData.adviser}
                                </div>
                                <div>
                                    <strong>Subject:</strong> {reportData.subject_name} &bull; <strong>Period:</strong> {reportData.quarter}
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="gradebook-table" style={{ border: '1px solid var(--border-subtle)' }}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student Name</th>
                                            <th>LRN</th>
                                            {reportData.assessments?.map((a) => (
                                                <th key={a.id} style={{ textAlign: 'center', minWidth: '90px' }}>
                                                    <div style={{ fontSize: '0.7rem' }}>{a.type}</div>
                                                    <div>{a.title.slice(0, 15)}...</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Max: {a.max_score}</div>
                                                </th>
                                            ))}
                                            <th style={{ textAlign: 'center' }}>Total Points</th>
                                            <th style={{ textAlign: 'center' }}>Percentage</th>
                                            <th style={{ textAlign: 'center' }}>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.students?.map((st, idx) => (
                                            <tr key={st.student_id}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 700 }}>{st.name}</td>
                                                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{st.lrn}</td>
                                                {reportData.assessments?.map((a) => (
                                                    <td key={a.id} style={{ textAlign: 'center', fontWeight: 600 }}>
                                                        {st.scores[a.id] !== null && st.scores[a.id] !== undefined ? st.scores[a.id] : '—'}
                                                    </td>
                                                ))}
                                                <td style={{ textAlign: 'center', fontWeight: 700 }}>
                                                    {st.total_earned} / {st.total_max}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 800, color: st.percentage >= 75 ? 'var(--royal-blue)' : '#DC2626' }}>
                                                    {st.percentage}%
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={st.status === 'Passed' ? 'academic-badge-passed' : 'academic-badge-failed'}>
                                                        {st.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === 'summary' && (
                        <div>
                            {/* Summary Metrics Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                                <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrolled Students</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{reportData.total_students}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teaching Faculty</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{reportData.total_teachers}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Sections</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{reportData.total_classes}</div>
                                </div>
                                <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled Sessions</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{reportData.total_schedules}</div>
                                </div>
                            </div>

                            <h4 style={{ fontWeight: 800, marginBottom: '0.75rem' }}>Section Academic Standings</h4>
                            <table className="gradebook-table" style={{ border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                                <thead>
                                    <tr>
                                        <th>Section Name</th>
                                        <th>Grade Level</th>
                                        <th style={{ textAlign: 'center' }}>Enrolled Students</th>
                                        <th style={{ textAlign: 'center' }}>Section Average</th>
                                        <th style={{ textAlign: 'center' }}>Pass Rate</th>
                                        <th style={{ textAlign: 'center' }}>Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.classes?.map((c) => (
                                        <tr key={c.class_id}>
                                            <td style={{ fontWeight: 700 }}>{c.name}</td>
                                            <td>Grade {c.grade_level}</td>
                                            <td style={{ textAlign: 'center' }}>{c.students_count}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.average_score}%</td>
                                            <td style={{ textAlign: 'center' }}>{c.pass_rate}%</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <Badge variant={c.academic_status === 'Exemplary' ? 'success' : 'neutral'}>
                                                    {c.academic_status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Official DepEd Sign-off Block */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #CBD5E1' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Prepared by:</div>
                            <div style={{ marginTop: '2rem', borderBottom: '1px solid #0F172A', width: '220px' }}></div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem' }}>Academic Records Officer</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ayala National High School</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved & Certified by:</div>
                            <div style={{ marginTop: '2rem', borderBottom: '1px solid #0F172A', width: '220px', marginLeft: 'auto' }}></div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem' }}>School Principal / Head Admin</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DepEd Division of Zamboanga City</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
