import React, { useState, useRef, useEffect } from 'react';
import {
    LogOut,
    RefreshCw,
    Globe,
    Menu,
    Settings,
    Moon,
    Sun,
} from 'lucide-react';

// ─── RoleSwitcherPill ──────────────────────────────────────────────────────────
function RoleSwitcherPill({ currentRole, onSwitchRole }) {
    const roles = [
        { role: 'admin', label: 'Admin' },
        { role: 'teacher', label: 'Faculty' },
        { role: 'student', label: 'Student' },
    ];

    return (
        <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <span className="text-[11px] font-extrabold text-slate-400 px-2.5 uppercase tracking-wider">
                VIEW
            </span>
            {roles.map(({ role, label }) => {
                const isActive = currentRole === role;
                return (
                    <button
                        key={role}
                        type="button"
                        onClick={() => onSwitchRole(role)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main RoleHeader ───────────────────────────────────────────────────────────
export default function RoleHeader({
    currentUser,
    onSwitchRole,
    onRefresh,
    isRefreshing,
    onLogout,
    onNavigateLanding,
    onToggleMobileSidebar,
    isDarkMode = false,
    onToggleDarkMode,
}) {
    const role = currentUser?.role || 'admin';
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20 gap-4">
            {/* ── Left: School Title & Academic Year ── */}
            <div className="flex items-center gap-3.5 min-w-0">
                {onToggleMobileSidebar && (
                    <button
                        onClick={onToggleMobileSidebar}
                        aria-label="Toggle navigation menu"
                        className="mobile-menu-btn p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <Menu size={20} />
                    </button>
                )}

                <span className="text-base font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                    Ayala National High School
                </span>

                <span className="w-px h-4 bg-slate-200 shrink-0" />

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold whitespace-nowrap">
                    <span>A.Y. 2026–2027</span>
                </div>
            </div>

            {/* ── Right: View Switcher + Icon-Only Night Mode Toggle + Sync + Settings ── */}
            <div className="flex items-center gap-2.5 shrink-0">
                {onSwitchRole && (
                    <RoleSwitcherPill
                        currentRole={role}
                        onSwitchRole={onSwitchRole}
                    />
                )}

                {/* Pure Icon-Only Night Mode Toggle Button (No Text Description) */}
                {onToggleDarkMode && (
                    <button
                        type="button"
                        onClick={onToggleDarkMode}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
                        aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Night Mode'}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-all cursor-pointer"
                    >
                        {isDarkMode ? (
                            <Sun size={17} className="text-amber-400" strokeWidth={2.2} />
                        ) : (
                            <Moon size={17} className="text-slate-700" strokeWidth={2.2} />
                        )}
                    </button>
                )}

                {onRefresh && (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title="Sync live schedule data"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}
                        />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                )}

                {/* Settings Gear with Quick Menu */}
                <div ref={menuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen(prev => !prev)}
                        title="Portal options & account"
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        <Settings size={16} />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                            {currentUser && (
                                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                                    <div className="text-xs font-extrabold text-slate-900 truncate">
                                        {currentUser.name}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 truncate">
                                        {currentUser.email || role.toUpperCase()}
                                    </div>
                                </div>
                            )}

                            {onNavigateLanding && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onNavigateLanding();
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer text-left transition-colors"
                                >
                                    <Globe size={14} className="text-slate-400" />
                                    <span>Public Landing Page</span>
                                </button>
                            )}

                            {onLogout && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onLogout();
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer text-left transition-colors"
                                >
                                    <LogOut size={14} />
                                    <span>Sign Out</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
