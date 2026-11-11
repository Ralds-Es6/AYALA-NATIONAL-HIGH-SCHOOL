import React from 'react';
import LoginCard from '../../components/auth/LoginCard';

export default function AdminLoginPage({ onLogin, onNavigatePortal }) {
    return (
        <LoginCard
            role="admin"
            title="Administrator sign in"
            subtitle="Manage schedules, faculty, and student records."
            emailLabel="Email address"
            emailPlaceholder="admin@anhs.edu.ph"
            defaultEmail="admin@anhs.edu.ph"
            defaultPassword="password"
            submitLabel="Sign in"
            onLogin={onLogin}
            onNavigatePortal={onNavigatePortal}
        />
    );
}
