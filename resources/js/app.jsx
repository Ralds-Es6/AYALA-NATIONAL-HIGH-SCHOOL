import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
    LayoutDashboard, 
    Users, 
    Layers, 
    CalendarCheck, 
    Activity, 
    Mail, 
    GraduationCap,
    Sparkles,
    Shield,
    AlertOctagon
} from 'lucide-react';
import { srnhsApi } from './api/endpoints';
import RoleHeader from './components/RoleHeader';
import { NotificationProvider } from './components/notifications/NotificationProvider';
import { notify } from './components/notifications/notify';
import ConfirmationModal from './components/modals/ConfirmationModal';
import ConflictModal from './components/modals/ConflictModal';

import LandingPage from './pages/LandingPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import TeacherLoginPage from './pages/auth/TeacherLoginPage';
import StudentLoginPage from './pages/auth/StudentLoginPage';
import AccessDeniedPage from './pages/auth/AccessDeniedPage';

// Portal & Feature Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherManagement from './pages/admin/TeacherManagement';
import TeachingLoadsPage from './pages/admin/TeachingLoadsPage';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import ConflictCenterPage from './pages/admin/ConflictCenterPage';
import WorkloadMonitoringPage from './pages/admin/WorkloadMonitoringPage';
import NotificationLogsPage from './pages/admin/NotificationLogsPage';
import TeacherPortal from './pages/teacher/TeacherPortal';
import StudentPortal from './pages/student/StudentPortal';
import StudentProvisioningPage from './pages/admin/StudentProvisioningPage';
import FirstTimePasswordChangeModal from './components/modals/FirstTimePasswordChangeModal';
import AssessmentTrackingPage from './pages/admin/AssessmentTrackingPage';
import ReportsPage from './pages/admin/ReportsPage';
import Sidebar from './components/Sidebar';
import { FileText, Printer } from 'lucide-react';

function AppContent() {
    // Current user session & role
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPath, setCurrentPath] = useState(window.location.pathname);
    
    // Core data state
    const [workloadData, setWorkloadData] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loads, setLoads] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            return localStorage.getItem('ayala_theme_mode') === 'dark';
        } catch {
            return false;
        }
    });

    // Sync AMOLED Dark Mode class onto <html> and <body>
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
        try {
            localStorage.setItem('ayala_theme_mode', isDarkMode ? 'dark' : 'light');
        } catch {
            // ignore storage errors
        }
    }, [isDarkMode]);

    const handleToggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    // Centered Modals state
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        confirmVariant: 'danger',
        onConfirm: null,
        isLoading: false
    });

    const [conflictModal, setConflictModal] = useState({
        isOpen: false,
        conflict: null
    });

    // Client-side Navigation helper
    const navigate = (path) => {
        window.history.pushState({}, '', path);
        setCurrentPath(path);
    };

    // Listen to browser Back/Forward navigation
    useEffect(() => {
        const handlePopState = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Fetch initial user & admin data
    const refreshData = useCallback(async (isBackground = false, knownUser = null) => {
        if (!isBackground) setLoading(true);
        else setIsRefreshing(true);

        try {
            const user = knownUser || (await srnhsApi.getCurrentUser());
            setCurrentUser(user);

            // Fetch admin data only if authenticated user is admin
            if (user && user.role === 'admin') {
                const results = await Promise.allSettled([
                    srnhsApi.getWorkloadOverview(),
                    srnhsApi.getTeachers(),
                    srnhsApi.getClasses(),
                    srnhsApi.getSubjects(),
                    srnhsApi.getTeachingLoads(),
                    srnhsApi.getSchedules(),
                    srnhsApi.getNotifications(),
                ]);

                const [wRes, tRes, cRes, sRes, lRes, schRes, nRes] = results;

                const tData = tRes.status === 'fulfilled' && Array.isArray(tRes.value) ? tRes.value : [];
                const cData = cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value : [];
                const sData = sRes.status === 'fulfilled' && Array.isArray(sRes.value) ? sRes.value : [];
                const lData = lRes.status === 'fulfilled' && Array.isArray(lRes.value) ? lRes.value : [];
                const schData = schRes.status === 'fulfilled' && Array.isArray(schRes.value) ? schRes.value : [];
                const nData = nRes.status === 'fulfilled' && Array.isArray(nRes.value) ? nRes.value : [];
                const wData = wRes.status === 'fulfilled' && wRes.value ? wRes.value : {
                    total_teachers: tData.length,
                    total_classes: cData.length,
                    total_schedules: schData.length,
                    total_teaching_hours: 0,
                    overloaded_teachers: 0,
                    underload_teachers: tData.length,
                    normal_load_teachers: 0,
                    teacher_summaries: [],
                };

                setWorkloadData(wData);
                setTeachers(tData);
                setClasses(cData);
                setSubjects(sData);
                setLoads(lData);
                setSchedules(schData);
                setNotifications(nData);
            }
        } catch (err) {
            console.error('Data refresh error:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Handle Login submission from dedicated role pages
    const handleLogin = async (credentials) => {
        try {
            const res = await srnhsApi.login(credentials);
            const loggedInUser = res.user;
            setCurrentUser(loggedInUser);
            notify.success(`Welcome back, ${loggedInUser.name}!`, `Authenticated as ${loggedInUser.role.toUpperCase()}`, { mascot: 'success' });
            
            const targetDashboard = res.redirect_url || `/${loggedInUser.role}/dashboard`;
            navigate(targetDashboard);
            await refreshData(true, loggedInUser);
        } catch (err) {
            throw err;
        }
    };

    // Quick demo role switch (for evaluator convenience)
    const handleSwitchRole = useCallback(async (role, targetPath = null) => {
        setIsMobileSidebarOpen(false);
        setIsRefreshing(true);
        try {
            const res = await srnhsApi.switchDemoUser(role);
            const switchedUser = res.user;
            setCurrentUser(switchedUser);
            notify.info(
                'Role Switched', 
                `Switched to ${role.toUpperCase()} mode (${switchedUser.name})`,
                { mascot: role === 'admin' ? 'idle' : role === 'teacher' ? 'schedule' : 'idle' }
            );
            const destination = targetPath && targetPath.startsWith(`/${role}`) && !targetPath.endsWith('/login')
                ? (targetPath === `/${role}` ? `/${role}/dashboard` : targetPath)
                : `/${role}/dashboard`;
            navigate(destination);
            await refreshData(true, switchedUser);
        } catch (err) {
            notify.error('Role Switch Failed', err.message);
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshData]);

    // Ensure authenticated users on matching /login routes are redirected to their dashboard,
    // and auto-switch role when navigating directly to /admin/*, /teacher/*, or /student/*
    useEffect(() => {
        if (!currentUser) return;

        if (currentPath === '/login' || currentPath === `/${currentUser.role}/login` || currentPath === `/${currentUser.role}`) {
            const target = `/${currentUser.role}/dashboard`;
            window.history.replaceState({}, '', target);
            setCurrentPath(target);
            return;
        }

        // If user explicitly visits another role's login page (/teacher/login, /student/login, /admin/login), let them see that login form
        if (currentPath.endsWith('/login')) {
            return;
        }

        // If user navigates directly to /teacher/dashboard, /student/dashboard, or /admin/dashboard while in another role, auto-switch
        if ((currentPath === '/teacher' || currentPath.startsWith('/teacher/')) && currentUser.role !== 'teacher' && !isRefreshing) {
            handleSwitchRole('teacher', currentPath === '/teacher' ? '/teacher/dashboard' : currentPath);
        } else if ((currentPath === '/student' || currentPath.startsWith('/student/')) && currentUser.role !== 'student' && !isRefreshing) {
            handleSwitchRole('student', currentPath === '/student' ? '/student/dashboard' : currentPath);
        } else if ((currentPath === '/admin' || currentPath.startsWith('/admin/')) && currentUser.role !== 'admin' && !isRefreshing) {
            handleSwitchRole('admin', currentPath === '/admin' ? '/admin/dashboard' : currentPath);
        }
    }, [currentUser, currentPath, isRefreshing, handleSwitchRole]);

    // Logout
    const handleLogout = async () => {
        const prevRole = currentUser?.role || 'admin';
        try {
            await srnhsApi.logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
        setCurrentUser(null);
        notify.info('Logged Out', 'You have been safely signed out of your session.');
        navigate(`/${prevRole}/login`);
    };

    // Actions for Admin operations
    const handleSaveTeacher = async (teacherData, id = null) => {
        try {
            if (id) {
                await srnhsApi.updateTeacher(id, teacherData);
                notify.success('Teacher Updated', `${teacherData.name}'s information has been successfully saved.`, { mascot: 'success' });
            } else {
                await srnhsApi.createTeacher(teacherData);
                notify.success('Teacher Added', `${teacherData.name} has been added to the faculty directory.`, { mascot: 'success' });
            }
            await refreshData(true);
        } catch (err) {
            notify.error('Action Failed', err.message || 'Unable to save teacher record.');
            throw err;
        }
    };

    const handleAssignLoad = async (loadData) => {
        try {
            const res = await srnhsApi.createTeachingLoad(loadData);
            if (res.warning) {
                notify.warning('Workload Alert', res.message, { mascot: 'warning' });
            } else {
                notify.success('Teaching Load Assigned', res.message || 'Teaching load successfully allocated to faculty.', { mascot: 'success' });
            }
            await refreshData(true);
        } catch (err) {
            notify.error('Assignment Failed', err.message || 'Unable to assign teaching load.');
            throw err;
        }
    };

    // Centered Confirmation Modal for Deleting Teaching Load
    const handleDeleteLoad = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Teaching Load?',
            message: 'Are you sure you want to remove this teaching load allocation? This cannot be undone.',
            confirmLabel: 'Delete Load',
            confirmVariant: 'danger',
            isLoading: false,
            onConfirm: async () => {
                setConfirmation((prev) => ({ ...prev, isLoading: true }));
                try {
                    await srnhsApi.deleteTeachingLoad(id);
                    notify.deleteSuccess('Teaching Load Removed', 'The teaching load allocation was removed.');
                    setConfirmation({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', confirmVariant: 'danger', onConfirm: null, isLoading: false });
                    await refreshData(true);
                } catch (err) {
                    notify.error('Deletion Failed', err.message || 'Unable to delete load.');
                    setConfirmation((prev) => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleSaveSchedule = async (scheduleData) => {
        try {
            let res;
            if (scheduleData.id) {
                res = await srnhsApi.updateSchedule(scheduleData.id, scheduleData);
                notify.schedule('Schedule Updated', res.message || 'The teaching schedule has been successfully updated.', { mascot: 'schedule' });
            } else {
                res = await srnhsApi.createSchedule(scheduleData);
                notify.schedule('Schedule Assigned', res.message || 'The teaching schedule has been successfully assigned.', { mascot: 'schedule' });
            }
            notify.email('Notification Sent', 'The schedule update notification was dispatched to concerned teacher and class.', { mascot: 'email' });
            await refreshData(true);
            return res;
        } catch (err) {
            if (err.response?.data?.conflicts) {
                const firstConflict = err.response.data.conflicts[0];
                setConflictModal({
                    isOpen: true,
                    conflict: {
                        message: firstConflict.message || err.message,
                        teacher_name: firstConflict.teacher_name,
                        day: firstConflict.day,
                        time: firstConflict.time,
                        room: firstConflict.room,
                        class_name: firstConflict.class_name
                    }
                });
            } else {
                notify.error('Scheduling Failed', err.message || 'Unable to save schedule.');
            }
            throw err;
        }
    };

    const handleDeleteSchedule = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Schedule?',
            message: 'Are you sure you want to delete this schedule? Cancellation notices will be automatically dispatched to teacher and class via Gmail.',
            confirmLabel: 'Delete Schedule',
            confirmVariant: 'danger',
            isLoading: false,
            onConfirm: async () => {
                setConfirmation((prev) => ({ ...prev, isLoading: true }));
                try {
                    await srnhsApi.deleteSchedule(id);
                    notify.deleteSuccess('Schedule Deleted', 'The schedule record was removed and cancellation notice dispatched.');
                    setConfirmation({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', confirmVariant: 'danger', onConfirm: null, isLoading: false });
                    await refreshData(true);
                } catch (err) {
                    notify.error('Deletion Failed', err.message || 'Unable to delete schedule.');
                    setConfirmation((prev) => ({ ...prev, isLoading: true }));
                }
            }
        });
    };

    // ==========================================
    // ROUTE & ACCESS CONTROL EVALUATION
    // ==========================================

    // Loading Splash
    if (loading && !currentUser) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#FFFFFF' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#2563EB', borderTopColor: 'transparent', marginBottom: '1rem' }}></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94A3B8' }}>Loading Ayala National High School Portal...</div>
            </div>
        );
    }

    // Public / Landing Page route: visiting '/' or '/landing' or '/home'
    if (currentPath === '/' || currentPath === '/landing' || currentPath === '/home') {
        return (
            <LandingPage 
                onNavigate={navigate} 
                onQuickLogin={handleLogin} 
                currentUser={currentUser} 
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
            />
        );
    }

    // Explicit role login pages (accessible even if another role session is active)
    if (currentPath === '/teacher/login' && (!currentUser || currentUser.role !== 'teacher')) {
        return <TeacherLoginPage onLogin={handleLogin} onNavigatePortal={navigate} />;
    }
    if (currentPath === '/student/login' && (!currentUser || currentUser.role !== 'student')) {
        return <StudentLoginPage onLogin={handleLogin} onNavigatePortal={navigate} />;
    }
    if ((currentPath === '/admin/login' || currentPath === '/login') && (!currentUser || currentUser.role !== 'admin')) {
        return <AdminLoginPage onLogin={handleLogin} onNavigatePortal={navigate} />;
    }

    // Unauthenticated: Direct to role-specific login pages
    if (!currentUser) {
        if (currentPath.startsWith('/teacher')) {
            return <TeacherLoginPage onLogin={handleLogin} onNavigatePortal={navigate} />;
        }
        if (currentPath.startsWith('/student')) {
            return <StudentLoginPage onLogin={handleLogin} onNavigatePortal={navigate} />;
        }
        if (currentPath.startsWith('/admin')) {
            return <AdminLoginPage onLogin={handleLogin} onNavigatePortal={navigate} />;
        }
        // Fallback to Landing Page
        return (
            <LandingPage 
                onNavigate={navigate} 
                onQuickLogin={handleLogin} 
                currentUser={currentUser} 
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                onToggleDarkMode={handleToggleDarkMode}
            />
        );
    }

    // Authenticated: Resolve login paths to authorized dashboard cleanly
    const resolvedPath = (currentPath.endsWith('/login') || currentPath === '/login')
        ? `/${currentUser.role}/dashboard`
        : currentPath;

    // Authenticated RBAC Check: If switching roles via URL is in progress, show loading spinner
    const isAdminRoute = resolvedPath.startsWith('/admin');
    const isTeacherRoute = resolvedPath.startsWith('/teacher');
    const isStudentRoute = resolvedPath.startsWith('/student');

    if (
        (isAdminRoute && currentUser.role !== 'admin') ||
        (isTeacherRoute && currentUser.role !== 'teacher') ||
        (isStudentRoute && currentUser.role !== 'student')
    ) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#FFFFFF' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#2563EB', borderTopColor: 'transparent', marginBottom: '1rem' }}></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94A3B8' }}>Switching portal session...</div>
            </div>
        );
    }

    // Active Tab for Admin
    let activeAdminTab = 'dashboard';
    let selectedClassroomId = null;
    if (currentPath.startsWith('/admin/')) {
        const sub = currentPath.replace('/admin/', '');
        if (sub.startsWith('students/classroom/') || sub.startsWith('classrooms/')) {
            activeAdminTab = 'students';
            const parts = sub.split('/');
            selectedClassroomId = parseInt(parts[parts.length - 1], 10) || null;
        } else if (['dashboard', 'teachers', 'teacher-rbac', 'students', 'loads', 'schedules', 'schedules-teacher', 'schedules-room', 'schedules-master', 'conflicts', 'workload', 'notifications', 'assessment-tracking', 'reports'].includes(sub)) {
            activeAdminTab = sub;
        }
    }

    // Active Tab for Teacher
    let activeTeacherTab = 'dashboard';
    if (currentPath.startsWith('/teacher/')) {
        const sub = currentPath.replace('/teacher/', '');
        if (['dashboard', 'schedule', 'agenda', 'loads', 'assessments', 'feedback', 'students'].includes(sub)) {
            activeTeacherTab = sub;
        }
    }

    // Active Tab for Student
    let activeStudentTab = 'dashboard';
    if (currentPath.startsWith('/student/')) {
        const sub = currentPath.replace('/student/', '');
        if (['dashboard', 'schedule', 'agenda', 'subjects', 'classroom', 'assessments', 'feedback'].includes(sub)) {
            activeStudentTab = sub;
        }
    }

    const activeTabForRole = currentUser?.role === 'admin' 
        ? activeAdminTab 
        : currentUser?.role === 'teacher' 
            ? activeTeacherTab 
            : activeStudentTab;

    const handleNavigateTab = (tabId) => {
        if (!currentUser) return;
        navigate(`/${currentUser.role}/${tabId}`);
    };

    return (
        <div className="app-container">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => !confirmation.isLoading && setConfirmation((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                confirmLabel={confirmation.confirmLabel}
                confirmVariant={confirmation.confirmVariant}
                isLoading={confirmation.isLoading}
            />

            {/* Conflict Modal */}
            <ConflictModal
                isOpen={conflictModal.isOpen}
                onClose={() => setConflictModal({ isOpen: false, conflict: null })}
                conflict={conflictModal.conflict}
                onReviewSchedule={() => {
                    navigate('/admin/schedules');
                }}
            />

            {/* First-Time Student Login Mandatory Password Change Modal */}
            <FirstTimePasswordChangeModal
                isOpen={Boolean(currentUser?.role === 'student' && currentUser?.must_change_password)}
                user={currentUser}
                onSuccess={(updatedUser) => {
                    setCurrentUser(updatedUser);
                }}
            />

            {/* Sidebar Navigation: Rendered for all authenticated roles */}
            {currentUser && (
                <Sidebar
                    currentUser={currentUser}
                    activeTab={activeTabForRole}
                    onNavigateTab={handleNavigateTab}
                    isOpenMobile={isMobileSidebarOpen}
                    onCloseMobile={() => setIsMobileSidebarOpen(false)}
                    onLogout={handleLogout}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                />
            )}

            {/* Main Application Area */}
            <div className="main-wrapper">
                <RoleHeader
                    currentUser={currentUser}
                    onSwitchRole={handleSwitchRole}
                    onRefresh={() => refreshData(true)}
                    isRefreshing={isRefreshing}
                    onLogout={handleLogout}
                    onNavigateLanding={() => navigate('/')}
                    onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                />

                <main className="content-area">
                    {/* ROLE-SPECIFIC VIEWS */}
                    {currentUser?.role === 'teacher' && (
                        <TeacherPortal 
                            activeTab={activeTeacherTab} 
                            onNavigateTab={(tab) => navigate(`/teacher/${tab}`)} 
                        />
                    )}

                    {currentUser?.role === 'student' && (
                        <StudentPortal 
                            activeTab={activeStudentTab} 
                            onNavigateTab={(tab) => navigate(`/student/${tab}`)} 
                        />
                    )}

                    {currentUser?.role === 'admin' && (
                        <>
                            {activeAdminTab === 'dashboard' && (
                                <AdminDashboard 
                                    workloadData={workloadData} 
                                    schedules={schedules}
                                    loading={loading}
                                    onNavigate={(tab) => navigate(`/admin/${tab}`)}
                                    notifications={notifications}
                                />
                            )}

                            {(activeAdminTab === 'teachers' || activeAdminTab === 'teacher-rbac') && (
                                <TeacherManagement 
                                    teachers={teachers}
                                    classes={classes}
                                    subjects={subjects}
                                    schedules={schedules}
                                    loading={loading}
                                    initialView={activeAdminTab === 'teacher-rbac' ? 'rbac' : 'directory'}
                                    onSaveTeacher={handleSaveTeacher}
                                    onRefresh={() => refreshData(true)}
                                />
                            )}

                            {activeAdminTab === 'students' && (
                                <StudentProvisioningPage 
                                    classes={classes}
                                    teachers={teachers}
                                    subjects={subjects}
                                    schedules={schedules}
                                    selectedClassroomId={selectedClassroomId}
                                    onSelectClassroom={(id) => navigate(id ? `/admin/students/classroom/${id}` : '/admin/students')}
                                    onNavigate={(tab) => navigate(`/admin/${tab}`)}
                                    onRefreshData={() => refreshData(true)}
                                />
                            )}

                            {(activeAdminTab === 'loads' || activeAdminTab === 'workload') && (
                                <TeachingLoadsPage 
                                    loads={loads}
                                    teachers={teachers}
                                    classes={classes}
                                    subjects={subjects}
                                    schedules={schedules}
                                    workloadData={workloadData}
                                    initialTab={activeAdminTab === 'workload' ? 'capacity' : 'assignments'}
                                    loading={loading}
                                    onAssignLoad={handleAssignLoad}
                                    onDeleteLoad={handleDeleteLoad}
                                    onRefresh={() => refreshData(true)}
                                />
                            )}

                            {activeAdminTab === 'assessment-tracking' && (
                                <AssessmentTrackingPage />
                            )}

                            {activeAdminTab === 'reports' && (
                                <ReportsPage 
                                    teachers={teachers}
                                    classes={classes}
                                    subjects={subjects}
                                />
                            )}

                            {activeAdminTab.startsWith('schedules') && (
                                <ScheduleManagement 
                                    schedules={schedules}
                                    loads={loads}
                                    classes={classes}
                                    teachers={teachers}
                                    subjects={subjects}
                                    loading={loading}
                                    onSaveSchedule={handleSaveSchedule}
                                    onDeleteSchedule={handleDeleteSchedule}
                                    onRefresh={() => refreshData(true)}
                                    initialPerspective={
                                        activeAdminTab === 'schedules-teacher' 
                                            ? 'teacher' 
                                            : activeAdminTab === 'schedules-room' 
                                                ? 'room' 
                                                : 'section'
                                    }
                                />
                            )}

                            {activeAdminTab === 'conflicts' && (
                                <ConflictCenterPage 
                                    teachers={teachers}
                                    classes={classes}
                                    loading={loading}
                                />
                            )}

                            {activeAdminTab === 'notifications' && (
                                <NotificationLogsPage 
                                    notifications={notifications}
                                    loading={loading}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <NotificationProvider>
            <AppContent />
        </NotificationProvider>
    );
}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
