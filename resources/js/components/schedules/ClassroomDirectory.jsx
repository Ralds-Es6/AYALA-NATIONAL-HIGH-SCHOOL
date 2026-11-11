import React, { useState, useMemo } from 'react';
import { 
    Building2, 
    Plus, 
    Search, 
    Calendar, 
    Users, 
    MapPin, 
    User, 
    Layers, 
    Edit3, 
    Trash2, 
    GraduationCap, 
    ChevronRight,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

export default function ClassroomDirectory({
    classes = [],
    schedules = [],
    onSelectClassroom,
    onOpenCreateModal,
    onEditClassroom,
    onDeleteClassroom,
    isAdmin = true,
}) {
    const [activeStage, setActiveStage] = useState('JHS'); // 'JHS' | 'SHS'
    const [searchQuery, setSearchQuery] = useState('');

    // Precalculate schedules count per classroom
    const schedulesCountMap = useMemo(() => {
        const map = new Map();
        schedules.forEach(s => {
            if (s.school_class_id) {
                const cid = Number(s.school_class_id);
                map.set(cid, (map.get(cid) || 0) + 1);
            }
        });
        return map;
    }, [schedules]);

    // Filter classes by active stage and search query
    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            const grade = Number(c.grade_level);
            if (activeStage === 'JHS' && (grade < 7 || grade > 10)) return false;
            if (activeStage === 'SHS' && (grade < 11 || grade > 12)) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const sec = (c.section || c.name || '').toLowerCase();
                const room = (c.room || '').toLowerCase();
                const adv = (c.adviser?.name || '').toLowerCase();
                const strand = (c.strand || '').toLowerCase();
                if (!sec.includes(q) && !room.includes(q) && !adv.includes(q) && !strand.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [classes, activeStage, searchQuery]);

    // Grouping for Junior High: Grade 7, 8, 9, 10
    const jhsGroups = useMemo(() => {
        return [7, 8, 9, 10].map(grade => ({
            grade,
            title: `Grade ${grade} Classrooms`,
            classes: filteredClasses.filter(c => Number(c.grade_level) === grade)
        }));
    }, [filteredClasses]);

    // Grouping for Senior High: Grade 11 & 12, categorized by strand
    const shsGroups = useMemo(() => {
        return [11, 12].map(grade => {
            const gradeClasses = filteredClasses.filter(c => Number(c.grade_level) === grade);
            const strandMap = new Map();

            gradeClasses.forEach(c => {
                const st = c.strand || 'General';
                if (!strandMap.has(st)) strandMap.set(st, []);
                strandMap.get(st).push(c);
            });

            return {
                grade,
                title: `Grade ${grade} Senior High Classrooms`,
                totalClasses: gradeClasses.length,
                strands: Array.from(strandMap.entries()).map(([strand, items]) => ({
                    strand,
                    items
                }))
            };
        });
    }, [filteredClasses]);

    // Overall metrics for this stage
    const totalStageClasses = filteredClasses.length;
    const assignedAdviserCount = filteredClasses.filter(c => Boolean(c.adviser_id)).length;
    const tbaAdviserCount = totalStageClasses - assignedAdviserCount;

    return (
        <div className="space-y-6">
            {/* ─── Top Filter & Stage Bar (60-30-10) ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Stage Switcher Tabs */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveStage('JHS')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            activeStage === 'JHS'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Junior High School (Grades 7–10)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveStage('SHS')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                            activeStage === 'SHS'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Senior High School (Grades 11–12)
                    </button>
                </div>

                {/* Search and Summary Pill */}
                <div className="flex items-center gap-3">
                    <div className="text-xs font-semibold text-slate-500 hidden md:block">
                        <span>{totalStageClasses} classrooms</span>
                        {tbaAdviserCount > 0 && (
                            <span className="ml-2 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                {tbaAdviserCount} TBA Adviser{tbaAdviserCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="relative min-w-[230px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search classroom, room, adviser..."
                            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600"
                        />
                    </div>
                </div>
            </div>

            {/* ─── Junior High School: 1 Big Table, 4 Separated Grade Sections ─── */}
            {activeStage === 'JHS' && (
                <div className="space-y-6">
                    {jhsGroups.map(({ grade, title, classes: gradeClasses }) => (
                        <div key={grade} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Section Header */}
                            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                        G{grade}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                            {title}
                                        </h2>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            {gradeClasses.length} section{gradeClasses.length === 1 ? '' : 's'} assigned to Grade {grade}
                                        </p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenCreateModal(grade)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-blue-200 transition-colors shadow-xs"
                                    >
                                        <Plus size={13} />
                                        <span>+ Add Grade {grade} Classroom</span>
                                    </button>
                                )}
                            </div>

                            {/* Section Classrooms Table */}
                            {gradeClasses.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50/50">
                                    <p className="text-xs font-semibold text-slate-400">
                                        No Grade {grade} classrooms found matching your search.
                                    </p>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenCreateModal(grade)}
                                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                                        >
                                            + Create First Grade {grade} Classroom
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                                                <th className="py-3 px-5">Class Section</th>
                                                <th className="py-3 px-4">Room Venue</th>
                                                <th className="py-3 px-4">Class Adviser</th>
                                                <th className="py-3 px-4">Enrolled Learners</th>
                                                <th className="py-3 px-4">Weekly Schedule</th>
                                                <th className="py-3 px-5 text-right">Timetable Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs">
                                            {gradeClasses.map(c => {
                                                const schedCount = schedulesCountMap.get(Number(c.id)) || 0;
                                                const hasAdviser = Boolean(c.adviser && c.adviser.name);

                                                return (
                                                    <tr 
                                                        key={c.id} 
                                                        className="hover:bg-blue-50/20 transition-colors group"
                                                    >
                                                        {/* Section Name */}
                                                        <td className="py-3.5 px-5 font-bold text-slate-900">
                                                            <div className="flex items-center gap-2">
                                                                <GraduationCap size={16} className="text-blue-600 flex-shrink-0" />
                                                                <span className="text-sm font-extrabold text-slate-900">
                                                                    {c.section || c.name}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Room Venue */}
                                                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                                                                <MapPin size={11} className="text-slate-500" />
                                                                <span>{c.room || 'Room TBA'}</span>
                                                            </span>
                                                        </td>

                                                        {/* Class Adviser (With TBA Badge if Empty!) */}
                                                        <td className="py-3.5 px-4">
                                                            {hasAdviser ? (
                                                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                                    <User size={13} className="text-emerald-600" />
                                                                    <span>{c.adviser.name}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                                    TBA (To Be Announced)
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Enrolled Students */}
                                                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Users size={12} className="text-slate-400" />
                                                                <span>{c.students_count || c.students?.length || 0} learners</span>
                                                            </span>
                                                        </td>

                                                        {/* Weekly Schedule Sessions */}
                                                        <td className="py-3.5 px-4 font-semibold">
                                                            {schedCount > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                                                                    <CheckCircle2 size={11} />
                                                                    <span>{schedCount} class sessions</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 text-[11px]">
                                                                    No schedule configured
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Actions: View Timetable & Edit */}
                                                        <td className="py-3.5 px-5 text-right">
                                                            <div className="inline-flex items-center gap-1.5 justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onSelectClassroom(c)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs"
                                                                    title="Open and inspect weekly timetable for this section"
                                                                >
                                                                    <Calendar size={13} />
                                                                    <span>View Timetable</span>
                                                                    <ChevronRight size={13} />
                                                                </button>

                                                                {isAdmin && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onEditClassroom(c)}
                                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                                                                            title="Edit classroom details or assign adviser"
                                                                        >
                                                                            <Edit3 size={14} />
                                                                        </button>
                                                                        {onDeleteClassroom && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => onDeleteClassroom(c.id)}
                                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                                title="Delete classroom"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ─── Senior High School: Categorized by Strand ────────────────────── */}
            {activeStage === 'SHS' && (
                <div className="space-y-6">
                    {shsGroups.map(({ grade, title, strands }) => (
                        <div key={grade} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Section Header */}
                            <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                        G{grade}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                                            {title}
                                        </h2>
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            Categorized by academic track and learning strand
                                        </p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => onOpenCreateModal(grade)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-blue-200 transition-colors shadow-xs"
                                    >
                                        <Plus size={13} />
                                        <span>+ Add Grade {grade} Classroom</span>
                                    </button>
                                )}
                            </div>

                            {/* Strands Breakdown */}
                            {strands.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50/50">
                                    <p className="text-xs font-semibold text-slate-400">
                                        No Grade {grade} Senior High classrooms found.
                                    </p>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => onOpenCreateModal(grade)}
                                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                                        >
                                            + Create First Grade {grade} Classroom
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 space-y-6">
                                    {strands.map(({ strand, items }) => (
                                        <div key={strand} className="rounded-xl border border-slate-200 overflow-hidden">
                                            {/* Strand Badge Title */}
                                            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                                                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Layers size={13} className="text-blue-600" />
                                                    <span>Strand: {strand}</span>
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-500">
                                                    {items.length} section{items.length === 1 ? '' : 's'}
                                                </span>
                                            </div>

                                            {/* Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <tbody className="divide-y divide-slate-100 text-xs">
                                                        {items.map(c => {
                                                            const schedCount = schedulesCountMap.get(Number(c.id)) || 0;
                                                            const hasAdviser = Boolean(c.adviser && c.adviser.name);

                                                            return (
                                                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                                    <td className="py-3 px-4 font-extrabold text-slate-900 w-1/4">
                                                                        {c.section || c.name}
                                                                    </td>
                                                                    <td className="py-3 px-4 w-1/5">
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                                                                            <MapPin size={11} className="text-slate-400" />
                                                                            <span>{c.room || 'Room TBA'}</span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-4 w-1/4">
                                                                        {hasAdviser ? (
                                                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                                                <User size={13} className="text-emerald-600" />
                                                                                <span>{c.adviser.name}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                                                                TBA (To Be Announced)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                                        {schedCount > 0 ? `${schedCount} sessions` : 'No schedule'}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right">
                                                                        <div className="inline-flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => onSelectClassroom(c)}
                                                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-1 shadow-xs"
                                                                            >
                                                                                <Calendar size={12} />
                                                                                <span>Timetable</span>
                                                                            </button>
                                                                            {isAdmin && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => onEditClassroom(c)}
                                                                                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500"
                                                                                    title="Edit Classroom"
                                                                                >
                                                                                    <Edit3 size={13} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
