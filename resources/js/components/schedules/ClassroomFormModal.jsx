import React, { useState, useEffect } from 'react';
import { X, Building2, User, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

const SHS_STRANDS = [
    { value: 'STEM', label: 'STEM (Science, Technology, Engineering, and Mathematics)', track: 'Academic' },
    { value: 'ABM', label: 'ABM (Accountancy, Business, and Management)', track: 'Academic' },
    { value: 'HUMSS', label: 'HUMSS (Humanities and Social Sciences)', track: 'Academic' },
    { value: 'GAS', label: 'GAS (General Academic Strand)', track: 'Academic' },
    { value: 'TVL-ICT', label: 'TVL - Information & Communications Technology', track: 'TVL' },
    { value: 'TVL-HE', label: 'TVL - Home Economics', track: 'TVL' },
    { value: 'TVL-IA', label: 'TVL - Industrial Arts', track: 'TVL' },
];

export default function ClassroomFormModal({
    isOpen,
    onClose,
    classroom = null,
    teachers = [],
    classes = [],
    defaultGrade = 7,
    onSave,
}) {
    const isEdit = Boolean(classroom && classroom.id);

    const [gradeLevel, setGradeLevel] = useState(defaultGrade);
    const [sectionName, setSectionName] = useState('');
    const [roomVenue, setRoomVenue] = useState('');
    const [adviserId, setAdviserId] = useState('');
    const [strand, setStrand] = useState('STEM');
    const [maxCapacity, setMaxCapacity] = useState(45);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (classroom) {
            setGradeLevel(Number(classroom.grade_level) || 7);
            setSectionName(classroom.section || classroom.name?.replace(/^Grade\s+\d+\s*-\s*/i, '') || '');
            setRoomVenue(classroom.room || '');
            setAdviserId(classroom.adviser_id ? String(classroom.adviser_id) : '');
            setStrand(classroom.strand || 'STEM');
            setMaxCapacity(classroom.max_capacity || 45);
        } else {
            setGradeLevel(defaultGrade || 7);
            setSectionName('');
            setRoomVenue('');
            setAdviserId('');
            setStrand('STEM');
            setMaxCapacity(45);
        }
        setError('');
    }, [classroom, defaultGrade, isOpen]);

    if (!isOpen) return null;

    const isSHS = Number(gradeLevel) >= 11;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!sectionName.trim()) {
            setError('Please enter a section name (e.g. Diamond, Emerald, Rizal).');
            return;
        }

        const fullName = isSHS 
            ? `Grade ${gradeLevel} - ${sectionName.trim()} (${strand})`
            : `Grade ${gradeLevel} - ${sectionName.trim()}`;

        const payload = {
            id: classroom?.id,
            name: fullName,
            grade_level: Number(gradeLevel),
            section: sectionName.trim(),
            room: roomVenue.trim() || 'Room TBA',
            adviser_id: adviserId ? Number(adviserId) : null,
            max_capacity: Number(maxCapacity) || 45,
            track: isSHS ? (SHS_STRANDS.find(s => s.value === strand)?.track || 'Academic') : null,
            strand: isSHS ? strand : null,
        };

        try {
            setLoading(true);
            await onSave(payload);
            onClose();
        } catch (err) {
            console.error('Failed to save classroom:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to save classroom section.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold tracking-tight">
                                {isEdit ? 'Edit Classroom / Section' : 'Create New Classroom / Section'}
                            </h3>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Step 1 of Scheduling: Define the room container and section
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
                            <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Grade Level */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Academic Level / Grade <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <optgroup label="Junior High School">
                                    <option value={7}>Grade 7</option>
                                    <option value={8}>Grade 8</option>
                                    <option value={9}>Grade 9</option>
                                    <option value={10}>Grade 10</option>
                                </optgroup>
                                <optgroup label="Senior High School">
                                    <option value={11}>Grade 11</option>
                                    <option value={12}>Grade 12</option>
                                </optgroup>
                            </select>
                        </div>

                        {/* Section Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                Section Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                placeholder="e.g. Diamond, Rizal"
                                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    {/* SHS Strand Selection (Conditional) */}
                    {isSHS && (
                        <div>
                            <label className="block text-xs font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                                <Layers size={13} className="text-indigo-600" />
                                <span>Senior High Academic Strand <span className="text-red-500">*</span></span>
                            </label>
                            <select
                                value={strand}
                                onChange={(e) => setStrand(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50/50 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {SHS_STRANDS.map(st => (
                                    <option key={st.value} value={st.value}>
                                        {st.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Physical Room Venue */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Classroom / Venue Assignment
                        </label>
                        <input
                            type="text"
                            value={roomVenue}
                            onChange={(e) => setRoomVenue(e.target.value)}
                            placeholder="e.g. Room 201, Building B - Science Lab"
                            className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            Physical room where classes for this section primarily take place.
                        </p>
                    </div>

                    {/* Class Adviser (OPTIONAL - Displays TBA if empty!) */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-600" />
                                <span>Class Adviser (Optional)</span>
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                Can be TBA
                            </span>
                        </label>
                        <select
                            value={adviserId}
                            onChange={(e) => setAdviserId(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                        >
                            <option value="">-- To Be Announced (TBA) / No Adviser Assigned Yet --</option>
                            {teachers.map(t => {
                                const advisingClass = (classes || []).find(
                                    (c) => Number(c.adviser_id) === Number(t.id) && Number(c.id) !== Number(classroom?.id)
                                );
                                const isBusy = Boolean(advisingClass);
                                return (
                                    <option key={t.id} value={t.id} disabled={isBusy}>
                                        {t.name} {t.department ? `(${t.department})` : ''}
                                        {isBusy ? ` — [OCCUPIED] Adviser of ${advisingClass.name}` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                            If not assigned yet, the classroom will automatically display <strong>TBA</strong>. You can follow up and assign a teacher later anytime!
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-lg shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <CheckCircle2 size={14} />
                            <span>{loading ? 'Saving...' : (isEdit ? 'Update Classroom' : 'Create Classroom')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
