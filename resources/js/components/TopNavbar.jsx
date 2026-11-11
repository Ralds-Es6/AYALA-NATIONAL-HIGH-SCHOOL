import React from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Layers, 
    CalendarCheck, 
    Activity, 
    Mail, 
    GraduationCap, 
    ShieldCheck, 
    BookOpen, 
    LogOut, 
    RefreshCw, 
    FileText, 
    Printer, 
    AlertOctagon,
    Shield
} from 'lucide-react';
import Badge from './Badge';

export default function TopNavbar({
    currentUser,
    onSwitchRole,
    onRefresh,
    isRefreshing,
    onLogout,
    activeAdminTab,
    onNavigate
}) {
    const roleColors = {
        admin: 'danger',
        teacher: 'info',
        student: 'success',
    };

    // Flattened Admin Nav Tabs for Sleek Horizontal Layout
    const adminNavTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'assessment-tracking', label: 'Assessment Tracker', icon: FileText, highlight: true },
        { id: 'teachers', label: 'Faculty Directory', icon: Users },
        { id: 'students', label: 'Student Accounts', icon: GraduationCap },
        { id: 'loads', label: 'Teaching Loads', icon: Layers },
        { id: 'schedules', label: 'Timetable & Schedules', icon: CalendarCheck },
        { id: 'conflicts', label: 'Conflict Center', icon: AlertOctagon },
        { id: 'reports', label: 'Academic Reports', icon: Printer, highlight: true },
        { id: 'workload', label: 'Workload Monitoring', icon: Activity },
        { id: 'notifications', label: 'Gmail Logs', icon: Mail },
    ];

    return (
        <header className="top-navbar-container no-print">
            {/* Upper Tier: Brand, Mascot, System Status, Role Switcher, & User Profile */}
            <div className="top-navbar-main">
                {/* Brand */}
                <div className="top-navbar-brand">
                    <div className="top-navbar-brand-icon">
                        <img src="/assets/backgrounds/ayala-logo.jpeg" alt="Ayala NHS logo" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                    </div>
                    <div className="top-navbar-brand-text">
                        <h1>Ayala National High School</h1>
                        <span>Automated Teacher Scheduling & Student Assessment Tracker</span>
                    </div>
                </div>

                {/* Right Controls: Role Badge, Quick Switcher, Sync & Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {currentUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Badge variant={roleColors[currentUser.role] || 'neutral'}>
                                {currentUser.role?.toUpperCase()} PORTAL
                            </Badge>
                        </div>
                    )}

                    {/* Quick Role Switcher for instant evaluation */}
                    <div className="top-role-switcher">
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, paddingLeft: '4px' }}>
                            View:
                        </span>
                        <button
                            className={`btn-sm ${currentUser?.role === 'admin' ? 'btn btn-gold' : 'btn btn-ghost'}`}
                            style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                            onClick={() => onSwitchRole('admin')}
                        >
                            <ShieldCheck size={13} /> Admin
                        </button>
                        <button
                            className={`btn-sm ${currentUser?.role === 'teacher' ? 'btn btn-gold' : 'btn btn-ghost'}`}
                            style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                            onClick={() => onSwitchRole('teacher')}
                        >
                            <GraduationCap size={13} /> Teacher
                        </button>
                        <button
                            className={`btn-sm ${currentUser?.role === 'student' ? 'btn btn-gold' : 'btn btn-ghost'}`}
                            style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                            onClick={() => onSwitchRole('student')}
                        >
                            <BookOpen size={13} /> Student
                        </button>
                    </div>

                    {/* Sync Button */}
                    <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title="Live sync with database"
                        style={{ padding: '0.35rem 0.65rem' }}
                    >
                        <RefreshCw size={13} className={isRefreshing ? 'spinner' : ''} />
                        <span style={{ fontSize: '0.75rem' }}>Sync</span>
                    </button>

                    {/* User info & Logout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid rgba(255, 255, 255, 0.15)' }}>
                        <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                                {currentUser?.name || 'User'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                {currentUser?.email}
                            </div>
                        </div>

                        {onLogout && (
                            <button 
                                className="btn btn-ghost btn-sm" 
                                onClick={onLogout} 
                                title="Sign out"
                                style={{ color: '#F87171', padding: '0.35rem' }}
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Lower Tier: Horizontal Navigation Tabs (Active in Admin Mode) */}
            {currentUser?.role === 'admin' && (
                <div className="top-navbar-tabs-bar">
                    <nav className="top-navbar-tabs-inner">
                        {adminNavTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeAdminTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    className={`top-nav-tab ${isActive ? 'active' : ''}`}
                                    onClick={() => onNavigate(tab.id)}
                                >
                                    <Icon size={14} style={{ color: isActive ? '#F59E0B' : 'inherit' }} />
                                    <span>{tab.label}</span>
                                    {tab.highlight && !isActive && (
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#F59E0B' }}></span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
