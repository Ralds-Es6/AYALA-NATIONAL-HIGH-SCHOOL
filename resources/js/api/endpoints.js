import apiClient from './axios';

export const srnhsApi = {
    // Public Landing Page & Sandbox Endpoints
    getLandingData: async () => {
        const res = await apiClient.get('/public/landing-data');
        return res.data.data;
    },
    testSandboxConflict: async (data) => {
        const res = await apiClient.post('/public/check-conflict', data);
        return res.data;
    },
    lookupStudentLrn: async (lrn) => {
        const res = await apiClient.get('/public/lookup-lrn', { params: { lrn } });
        return res.data;
    },

    // Auth & Demo Switcher
    login: async (credentials) => {
        const res = await apiClient.post('/auth/login', credentials);
        return res.data;
    },
    logout: async () => {
        const res = await apiClient.post('/auth/logout');
        return res.data;
    },
    getCurrentUser: async () => {
        try {
            const res = await apiClient.get('/auth/me');
            return res.data.user;
        } catch (err) {
            return null;
        }
    },
    switchDemoUser: async (role) => {
        const res = await apiClient.post('/auth/switch-demo-user', { role });
        return res.data;
    },

    // Teacher Management
    getTeachers: async (params = {}) => {
        const res = await apiClient.get('/teachers', { params });
        return res.data.data;
    },
    createTeacher: async (data) => {
        const res = await apiClient.post('/teachers', data);
        return res.data;
    },
    updateTeacher: async (id, data) => {
        const res = await apiClient.put(`/teachers/${id}`, data);
        return res.data;
    },
    deleteTeacher: async (id) => {
        const res = await apiClient.delete(`/teachers/${id}`);
        return res.data;
    },

    // Classes / Sections
    getClasses: async (params = {}) => {
        const res = await apiClient.get('/classes', { params });
        return res.data.data;
    },
    getClassDetails: async (id) => {
        const res = await apiClient.get(`/classes/${id}`);
        return res.data.data;
    },
    createClass: async (data) => {
        const res = await apiClient.post('/classes', data);
        return res.data;
    },
    updateClass: async (id, data) => {
        const res = await apiClient.put(`/classes/${id}`, data);
        return res.data;
    },
    deleteClass: async (id) => {
        const res = await apiClient.delete(`/classes/${id}`);
        return res.data;
    },

    // Subjects
    getSubjects: async (params = {}) => {
        const res = await apiClient.get('/subjects', { params });
        return res.data.data;
    },
    createSubject: async (data) => {
        const res = await apiClient.post('/subjects', data);
        return res.data;
    },

    // Teaching Loads
    getTeachingLoads: async (params = {}) => {
        const res = await apiClient.get('/teaching-loads', { params });
        return res.data.data;
    },
    createTeachingLoad: async (data) => {
        const res = await apiClient.post('/teaching-loads', data);
        return res.data;
    },
    deleteTeachingLoad: async (id) => {
        const res = await apiClient.delete(`/teaching-loads/${id}`);
        return res.data;
    },

    // Schedules & Conflict Detection
    getSchedules: async (params = {}) => {
        const res = await apiClient.get('/schedules', { params });
        return res.data.data;
    },
    checkConflict: async (data) => {
        const res = await apiClient.post('/schedules/check-conflict', data);
        return res.data.data;
    },
    createSchedule: async (data) => {
        const res = await apiClient.post('/schedules', data);
        return res.data;
    },
    updateSchedule: async (id, data) => {
        const res = await apiClient.put(`/schedules/${id}`, data);
        return res.data;
    },
    deleteSchedule: async (id) => {
        const res = await apiClient.delete(`/schedules/${id}`);
        return res.data;
    },

    // Dynamic Section Breaks
    getSectionBreaks: async (params = {}) => {
        const res = await apiClient.get('/section-breaks', { params });
        return res.data.data;
    },
    createSectionBreak: async (data) => {
        const res = await apiClient.post('/section-breaks', data);
        return res.data;
    },
    updateSectionBreak: async (id, data) => {
        const res = await apiClient.put(`/section-breaks/${id}`, data);
        return res.data;
    },
    deleteSectionBreak: async (id) => {
        const res = await apiClient.delete(`/section-breaks/${id}`);
        return res.data;
    },

    // Workload Monitoring & Notification Logs
    getWorkloadOverview: async (params = {}) => {
        const res = await apiClient.get('/workload-monitoring', { params });
        return res.data.data;
    },
    getNotifications: async (params = {}) => {
        const res = await apiClient.get('/notifications', { params });
        return res.data.data;
    },

    // Teacher Portal
    getTeacherLoads: async () => {
        const res = await apiClient.get('/teacher-portal/my-loads');
        return res.data;
    },
    getTeacherSchedule: async () => {
        const res = await apiClient.get('/teacher-portal/my-schedule');
        return res.data;
    },

    // Student Portal
    getStudentSchedule: async (classId = null) => {
        const res = await apiClient.get('/student-portal/my-schedule', {
            params: classId ? { school_class_id: classId } : {},
        });
        return res.data;
    },

    // Student Account Provisioning & Verification (Admin Portal)
    getStudents: async (params = {}) => {
        const res = await apiClient.get('/students', { params });
        return res.data;
    },
    checkStudentDuplicate: async (params = {}) => {
        const res = await apiClient.post('/students/check-duplicate', params);
        return res.data;
    },
    provisionStudent: async (data) => {
        const res = await apiClient.post('/students/provision', data);
        return res.data;
    },
    updateStudentStatus: async (id, data) => {
        const res = await apiClient.put(`/students/${id}/status`, data);
        return res.data;
    },
    updateStudent: async (id, data) => {
        const res = await apiClient.put(`/students/${id}`, data);
        return res.data;
    },
    resetStudentCredentials: async (id) => {
        const res = await apiClient.post(`/students/${id}/reset-credentials`);
        return res.data;
    },
    getAdminStudentSchedule: async (studentId) => {
        const res = await apiClient.get(`/students/${studentId}/schedule`);
        return res.data;
    },

    // First-Time Password Change & Auth Security
    changePassword: async (data) => {
        const res = await apiClient.post('/auth/change-password', data);
        return res.data;
    },

    // Automated Scheduling Generator
    autoGenerateSchedules: async (data = {}) => {
        const res = await apiClient.post('/schedules/auto-generate', data);
        return res.data;
    },

    // Assessments & Grade Tracking (Admin & Teacher)
    getAssessments: async (params = {}) => {
        try {
            const res = await apiClient.get('/teacher-portal/assessments', { params });
            return res.data.data;
        } catch (e) {
            const res = await apiClient.get('/assessments', { params });
            return res.data.data;
        }
    },
    createAssessment: async (data) => {
        try {
            const res = await apiClient.post('/teacher-portal/assessments', data);
            return res.data;
        } catch (e) {
            const res = await apiClient.post('/assessments', data);
            return res.data;
        }
    },
    deleteAssessment: async (id) => {
        try {
            const res = await apiClient.delete(`/teacher-portal/assessments/${id}`);
            return res.data;
        } catch (e) {
            const res = await apiClient.delete(`/assessments/${id}`);
            return res.data;
        }
    },
    getAssessmentGradingSheet: async (id) => {
        const res = await apiClient.get(`/teacher-portal/assessments/${id}/sheet`);
        return res.data;
    },
    saveAssessmentGrades: async (id, grades) => {
        const res = await apiClient.post(`/teacher-portal/assessments/${id}/grades`, { grades });
        return res.data;
    },
    submitStudentFeedback: async (data) => {
        const res = await apiClient.post('/teacher-portal/feedback', data);
        return res.data;
    },

    // Student Portal (Grades & Feedback)
    getMyAssessments: async () => {
        const res = await apiClient.get('/student-portal/my-assessments');
        return res.data;
    },
    getMyFeedback: async () => {
        const res = await apiClient.get('/student-portal/my-feedback');
        return res.data.data;
    },

    // Admin Assessment Monitoring & Academic Reports
    getAssessmentMonitoring: async () => {
        const res = await apiClient.get('/assessments/monitoring');
        return res.data;
    },

    // Quarterly Grading System (DepEd Form 138 / SF-9)
    getQuarterlyGradeContexts: async () => {
        const res = await apiClient.get('/quarterly-grades/contexts');
        return res.data;
    },
    getQuarterlyGradeMatrix: async (params = {}) => {
        const res = await apiClient.get('/quarterly-grades/matrix', { params });
        return res.data;
    },
    saveQuarterlyGrades: async (data) => {
        const res = await apiClient.post('/quarterly-grades/batch-save', data);
        return res.data;
    },
    getMyReportCard: async () => {
        const res = await apiClient.get('/student-portal/my-report-card');
        return res.data;
    },
    getSchedulesReport: async (params = {}) => {
        const res = await apiClient.get('/reports/schedules', { params });
        return res.data;
    },
    getAssessmentsReport: async (params = {}) => {
        const res = await apiClient.get('/reports/assessments', { params });
        return res.data;
    },
    getPerformanceSummaryReport: async () => {
        const res = await apiClient.get('/reports/performance-summary');
        return res.data;
    },
};
