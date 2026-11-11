import React, { useState, useEffect } from 'react';
import {
    LayoutGrid,
    Calendar,
    CalendarCheck,
    Clock,
    Layers,
    Users,
    GraduationCap,
    BookOpen,
    MapPin,
    Award,
    TrendingUp,
    FileText,
    Send,
    Mail,
    LogOut,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ShieldCheck,
} from 'lucide-react';

// ─── Role Metadata ────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
    admin: {
        badge: 'ADMINISTRATOR PORTAL',
        roleLabel: 'System Administrator',
        subtitle: 'Academic Operations Suite',
        title: 'Ayala National HS',
    },
    teacher: {
        badge: 'FACULTY PORTAL',
        roleLabel: 'Faculty Member',
        subtitle: 'Academic Operations Suite',
        title: 'Ayala National HS',
    },
    student: {
        badge: 'LEARNER PORTAL',
        roleLabel: 'Enrolled Learner',
        subtitle: 'Academic Operations Suite',
        title: 'Ayala National HS',
    },
};

// ─── Navigation by Role (With Hover Descriptions) ─────────────────────────────
const getNavSections = (role) => {
    if (role === 'admin') {
        return [
            {
                title: 'OVERVIEW',
                items: [
                    {
                        id: 'dashboard',
                        label: 'Dashboard',
                        description: 'School KPIs & active sessions',
                        icon: LayoutGrid,
                    },
                ],
            },
            {
                title: 'ACADEMIC & SCHEDULING',
                items: [
                    {
                        id: 'students',
                        label: 'Class Sections & Schedules',
                        description: 'Sections, rosters & timetables',
                        icon: GraduationCap,
                    },
                    {
                        id: 'loads',
                        label: 'Curriculum & Loads',
                        description: 'Subject loads & 30h DepEd cap',
                        icon: Layers,
                    },
                ],
            },
            {
                title: 'FACULTY MANAGEMENT',
                items: [
                    {
                        id: 'teachers',
                        label: 'Faculty Directory',
                        description: 'Teacher accounts & profiles',
                        icon: Users,
                    },
                    {
                        id: 'teacher-rbac',
                        label: 'Subject Qualifications',
                        description: 'JHS/SHS department & subjects',
                        icon: ShieldCheck,
                    },
                ],
            },
            {
                title: 'EVALUATION & REPORTS',
                items: [
                    {
                        id: 'assessment-tracking',
                        label: 'Assessment Analytics',
                        description: 'Student grades & mastery rates',
                        icon: TrendingUp,
                    },
                    {
                        id: 'reports',
                        label: 'DepEd Forms & Reports',
                        description: 'Official SF-7 & timetable reports',
                        icon: FileText,
                    },
                    {
                        id: 'notifications',
                        label: 'Notification Logs',
                        description: 'Automated email alert audit',
                        icon: Mail,
                    },
                ],
            },
        ];
    }

    if (role === 'teacher') {
        return [
            {
                title: 'OVERVIEW',
                items: [
                    {
                        id: 'dashboard',
                        label: 'Faculty Overview',
                        description: 'View your daily teaching summary, assigned classes, and upcoming periods.',
                        icon: LayoutGrid,
                    },
                ],
            },
            {
                title: 'TEACHING SCHEDULES',
                items: [
                    {
                        id: 'schedule',
                        label: 'Weekly Timetable',
                        description: 'Full Monday–Friday visual grid of your assigned teaching periods.',
                        icon: CalendarCheck,
                    },
                    {
                        id: 'agenda',
                        label: 'Daily Agenda',
                        description: 'Day-by-day timeline of classes, rooms, and subjects.',
                        icon: Clock,
                    },
                    {
                        id: 'loads',
                        label: 'Assigned Teaching Loads',
                        description: 'Review your official DepEd subject allocations and weekly teaching hours.',
                        icon: Layers,
                    },
                ],
            },
            {
                title: 'EVALUATION & LEARNERS',
                items: [
                    {
                        id: 'assessments',
                        label: 'Assessments & Grades',
                        description: 'Encode quarterly DepEd Form 138 (SF-9) grades and manage tasks.',
                        icon: Award,
                    },
                    {
                        id: 'students',
                        label: 'Class Masterlist (SF-1)',
                        description: 'View enrolled learners & class masterlist across your assigned sections.',
                        icon: Users,
                    },
                    {
                        id: 'feedback',
                        label: 'Student Guidance',
                        description: 'Send academic guidance notes and progress feedback directly to learners.',
                        icon: Send,
                    },
                ],
            },
        ];
    }

    // Student
    return [
        {
            title: 'OVERVIEW',
            items: [
                {
                    id: 'dashboard',
                    label: 'Learner Overview',
                    description: 'Your personal academic summary, today’s classes, and classroom advisory info.',
                    icon: LayoutGrid,
                },
            ],
        },
        {
            title: 'MY SCHEDULE',
            items: [
                {
                    id: 'timetables',
                    label: 'Class Schedules',
                    description: 'View and print your inherited classroom weekly timetable and daily schedule.',
                    icon: Calendar,
                    hasDropdown: true,
                    dropdownKey: 'timetables',
                    subItems: [
                        {
                            id: 'schedule',
                            label: 'Weekly Class Timetable',
                            description: 'Complete Monday–Friday timetable inherited from your enrolled classroom.',
                            icon: CalendarCheck,
                        },
                        {
                            id: 'agenda',
                            label: 'Daily Period Agenda',
                            description: 'Focused list of class periods and room venues for each school day.',
                            icon: Clock,
                        },
                    ],
                },
            ],
        },
        {
            title: 'CURRICULUM & EVALUATION',
            items: [
                {
                    id: 'subjects',
                    label: 'Enrolled Subjects',
                    description: 'Complete list of your core, applied, and specialized subjects with instructors.',
                    icon: BookOpen,
                },
                {
                    id: 'classroom',
                    label: 'Classroom & Advisory',
                    description: 'Details on your assigned section, room venue, class adviser, and classmates.',
                    icon: MapPin,
                },
                {
                    id: 'assessments',
                    label: 'Grades & Evaluations',
                    description: 'Monitor your recorded scores, subject mastery, and quarterly academic standing.',
                    icon: Award,
                },
                {
                    id: 'feedback',
                    label: 'Teacher Guidance Notes',
                    description: 'Read academic feedback and consultation notes from your subject teachers.',
                    icon: FileText,
                },
            ],
        },
    ];
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Sidebar({
    currentUser,
    activeTab,
    onNavigateTab,
    isOpenMobile = false,
    onCloseMobile,
    onLogout,
}) {
    const [openDropdowns, setOpenDropdowns] = useState({ timetables: true });
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem('ayala_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    // Hover Tooltip State for Icon-Only Mode (and rich description preview)
    const [hoveredItem, setHoveredItem] = useState(null);

    useEffect(() => {
        try {
            localStorage.setItem('ayala_sidebar_collapsed', String(isCollapsed));
        } catch {
            // ignore storage errors
        }
        setHoveredItem(null);
    }, [isCollapsed]);

    const role = currentUser?.role || 'admin';
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
    const sections = getNavSections(role);

    const toggleDropdown = (key) =>
        setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));

    const isAnySubActive = (subItems = []) =>
        subItems.some(sub =>
            activeTab === sub.id ||
            (sub.id === 'schedules' && activeTab?.startsWith('schedules'))
        );

    const handleNavigate = (tabId) => {
        setHoveredItem(null);
        onNavigateTab(tabId);
        if (onCloseMobile) onCloseMobile();
    };

    const handleMouseEnterItem = (e, item, sectionTitle) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({
            ...item,
            sectionTitle,
            top: rect.top + rect.height / 2,
            left: rect.right + 12,
        });
    };

    const handleMouseLeaveItem = () => {
        setHoveredItem(null);
    };

    const userInitial = currentUser?.name?.charAt(0).toUpperCase() || 'A';

    // Effective collapsed state (never collapsed when mobile drawer is open)
    const collapsed = isCollapsed && !isOpenMobile;

    return (
        <>
            {/* Mobile backdrop */}
            {isOpenMobile && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 40,
                    }}
                    onClick={onCloseMobile}
                />
            )}

            <aside
                style={{
                    width: collapsed ? '5.25rem' : '18.25rem',
                    transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'visible',
                    userSelect: 'none',
                }}
                className={`sidebar ${isOpenMobile ? 'mobile-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}
            >
                {/* ── Brand Header ── */}
                <div className={`relative ${collapsed ? 'px-3 pt-5 pb-5' : 'px-5 pt-6 pb-5'} border-b border-slate-200/80 transition-all`}>
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-3 mb-3.5'}`}>
                        <div className="flex items-center gap-3.5 min-w-0">
                            {/* 44x44px Brand Emblem */}
                            <div
                                onClick={() => collapsed && setIsCollapsed(false)}
                                title={collapsed ? 'Click to expand sidebar' : config.title}
                                className={`w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm tracking-tight shrink-0 shadow-sm ${
                                    collapsed ? 'cursor-pointer hover:bg-blue-700 transition-colors' : ''
                                }`}
                            >
                                AN
                            </div>

                            {/* School Name & Suite Subtitle */}
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <span className="text-base font-black text-slate-900 tracking-tight block leading-tight">
                                        {config.title}
                                    </span>
                                    <span className="text-xs text-slate-500 font-semibold block truncate mt-0.5">
                                        {config.subtitle}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Close button only on Mobile Drawer */}
                        {isOpenMobile && (
                            <button
                                type="button"
                                onClick={onCloseMobile}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Portal Role Pill (Full vs Icon-Only) */}
                    {!collapsed ? (
                        <div className="flex items-center gap-2.5 bg-blue-50/90 border border-blue-200/80 rounded-xl px-3.5 py-2.5">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                            <span className="text-[11px] font-extrabold text-blue-700 tracking-wider uppercase truncate">
                                {config.badge}
                            </span>
                        </div>
                    ) : (
                        <div
                            title={config.badge}
                            className="mt-3 flex items-center justify-center bg-blue-50/90 border border-blue-200/80 rounded-xl py-2"
                        >
                            <ShieldCheck size={16} className="text-blue-600" />
                        </div>
                    )}

                    {/* ── Floating Circular Edge Toggle Button (Straddles Right Sidebar Border Below "ADMINISTRATOR PORTAL") ── */}
                    {!isOpenMobile && (
                        <button
                            type="button"
                            onClick={() => setIsCollapsed(prev => !prev)}
                            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            style={{
                                position: 'absolute',
                                right: '-14px',
                                bottom: '-14px',
                                zIndex: 50,
                            }}
                            className="sidebar-edge-toggle w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md hover:scale-110"
                        >
                            {collapsed ? (
                                <ChevronRight size={15} strokeWidth={3} />
                            ) : (
                                <ChevronLeft size={15} strokeWidth={3} />
                            )}
                        </button>
                    )}
                </div>

                {/* ── Primary Navigation Menu ── */}
                <div className={`custom-scrollbar-minimal flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2.5 py-5 space-y-4' : 'px-4 py-5 space-y-6'}`}>
                    {sections.map((sec, sIdx) => (
                        <div key={sec.title || sIdx}>
                            {/* Section Category Header */}
                            {!collapsed ? (
                                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 px-3.5">
                                    {sec.title}
                                </div>
                            ) : (
                                sIdx > 0 && <div className="h-px bg-slate-200/80 my-2 mx-2" />
                            )}

                            {/* Section Items */}
                            <div className="space-y-1.5">
                                {sec.items.map(item => {
                                    const Icon = item.icon;

                                    if (item.hasDropdown) {
                                        const isOpen = openDropdowns[item.dropdownKey];
                                        const childActive = isAnySubActive(item.subItems);

                                        if (collapsed) {
                                            return (
                                                <React.Fragment key={item.id}>
                                                    {(item.subItems || []).map(sub => {
                                                        const SubIcon = sub.icon;
                                                        const isSubActive = activeTab === sub.id;
                                                        return (
                                                            <button
                                                                key={sub.id}
                                                                type="button"
                                                                onClick={() => handleNavigate(sub.id)}
                                                                onMouseEnter={(e) => handleMouseEnterItem(e, sub, sec.title)}
                                                                onMouseLeave={handleMouseLeaveItem}
                                                                className={`group relative flex items-center justify-center w-full h-11 rounded-xl transition-all cursor-pointer ${
                                                                    isSubActive
                                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                                        : 'text-slate-600 hover:bg-blue-50/80 hover:text-blue-700'
                                                                }`}
                                                            >
                                                                <SubIcon
                                                                    size={20}
                                                                    strokeWidth={isSubActive ? 2.25 : 1.9}
                                                                    className={`shrink-0 transition-colors ${
                                                                        isSubActive
                                                                            ? 'text-white'
                                                                            : 'text-slate-400 group-hover:text-blue-600'
                                                                    }`}
                                                                />
                                                            </button>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        }

                                        return (
                                            <div key={item.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDropdown(item.dropdownKey)}
                                                    onMouseEnter={(e) => handleMouseEnterItem(e, item, sec.title)}
                                                    onMouseLeave={handleMouseLeaveItem}
                                                    className={`group flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-sm transition-all text-left cursor-pointer ${
                                                        childActive
                                                            ? 'bg-blue-50 text-blue-700 font-extrabold'
                                                            : 'text-slate-600 font-bold hover:bg-blue-50/80 hover:text-blue-700'
                                                    }`}
                                                >
                                                    <Icon
                                                        size={19}
                                                        className={`shrink-0 transition-colors ${
                                                            childActive
                                                                ? 'text-blue-600'
                                                                : 'text-slate-400 group-hover:text-blue-600'
                                                        }`}
                                                    />
                                                    <span className="flex-1 truncate">
                                                        {item.label}
                                                    </span>
                                                    {isOpen ? (
                                                        <ChevronDown size={16} className="text-slate-400 shrink-0" />
                                                    ) : (
                                                        <ChevronRight size={16} className="text-slate-400 shrink-0" />
                                                    )}
                                                </button>

                                                {isOpen && (
                                                    <div className="ml-5 mt-1.5 mb-1.5 pl-3.5 border-l-2 border-slate-200 space-y-1">
                                                        {(item.subItems || []).map(sub => {
                                                            const SubIcon = sub.icon;
                                                            const isSubActive = activeTab === sub.id;
                                                            return (
                                                                <button
                                                                    key={sub.id}
                                                                    type="button"
                                                                    onClick={() => handleNavigate(sub.id)}
                                                                    onMouseEnter={(e) => handleMouseEnterItem(e, sub, sec.title)}
                                                                    onMouseLeave={handleMouseLeaveItem}
                                                                    className={`group flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left cursor-pointer ${
                                                                        isSubActive
                                                                            ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                                                                            : 'text-slate-600 font-semibold hover:bg-blue-50/80 hover:text-blue-700'
                                                                    }`}
                                                                >
                                                                    <SubIcon
                                                                        size={16}
                                                                        className={`shrink-0 transition-colors ${
                                                                            isSubActive
                                                                                ? 'text-white'
                                                                                : 'text-slate-400 group-hover:text-blue-600'
                                                                        }`}
                                                                    />
                                                                    <span className="flex-1 truncate">
                                                                        {sub.label}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    // Regular Nav Item
                                    const isActive = activeTab === item.id ||
                                        (item.id === 'schedules' && activeTab?.startsWith('schedules')) ||
                                        (item.id === 'loads' && activeTab === 'workload');

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleNavigate(item.id)}
                                            onMouseEnter={(e) => handleMouseEnterItem(e, item, sec.title)}
                                            onMouseLeave={handleMouseLeaveItem}
                                            className={`group relative flex items-center ${
                                                collapsed ? 'justify-center px-0 h-11' : 'gap-3.5 px-4 py-3'
                                            } w-full rounded-xl text-sm transition-all text-left cursor-pointer ${
                                                isActive
                                                    ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                                                    : 'text-slate-600 font-bold hover:bg-blue-50/80 hover:text-blue-700'
                                            }`}
                                        >
                                            <Icon
                                                size={collapsed ? 20 : 19}
                                                strokeWidth={isActive ? 2.25 : 1.9}
                                                className={`shrink-0 transition-colors ${
                                                    isActive
                                                        ? 'text-white'
                                                        : 'text-slate-400 group-hover:text-blue-600'
                                                }`}
                                            />
                                            {!collapsed && (
                                                <span className="flex-1 truncate">
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Footer (DepEd Badge Only — Redundant User Profile Removed) ── */}
                {!collapsed && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider mb-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>DEPED REGION IX</span>
                            </div>
                            <div className="font-extrabold text-slate-800 text-xs">
                                S.Y. 2026–2027 · Quarter 1
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* ── Floating Hover Tooltip Card (Shows Icon Title & Description) ── */}
            {hoveredItem && (
                <div
                    style={{
                        position: 'fixed',
                        top: `${hoveredItem.top}px`,
                        left: `${hoveredItem.left}px`,
                        transform: 'translateY(-50%)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                    }}
                    className="w-64 rounded-2xl p-3.5 shadow-xl border bg-slate-900 text-white border-slate-700/90 transition-opacity duration-150"
                >
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 mb-0.5">
                        {hoveredItem.sectionTitle}
                    </div>
                    <div className="text-sm font-black text-white leading-snug mb-1">
                        {hoveredItem.label}
                    </div>
                    {hoveredItem.description && (
                        <p className="text-xs text-slate-300 font-medium leading-relaxed m-0">
                            {hoveredItem.description}
                        </p>
                    )}
                </div>
            )}
        </>
    );
}
