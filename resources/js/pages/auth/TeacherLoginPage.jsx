import React from 'react';
import LoginCard from '../../components/auth/LoginCard';

export default function TeacherLoginPage({ onLogin, onNavigatePortal }) {
    return (
        <LoginCard
            role="teacher"
            title="Teacher sign in"
            subtitle="View your teaching load, schedules, and class records."
            emailLabel="Faculty email"
            emailPlaceholder="m.santos@anhs.edu.ph"
            defaultEmail="m.santos@anhs.edu.ph"
            defaultPassword="password"
            submitLabel="Sign in"
            onLogin={onLogin}
            onNavigatePortal={onNavigatePortal}
        />
    );
}
