import React from 'react';
import LoginCard from '../../components/auth/LoginCard';

export default function StudentLoginPage({ onLogin, onNavigatePortal }) {
    return (
        <LoginCard
            role="student"
            title="Student sign in"
            subtitle="Access your class timetable and quarterly grades."
            emailLabel="Student email"
            emailPlaceholder="student@anhs.edu.ph"
            defaultEmail="student@anhs.edu.ph"
            defaultPassword="password"
            submitLabel="Sign in"
            notice="Student accounts are created by the school administration. If you don't have credentials yet, please contact the registrar or your adviser."
            onLogin={onLogin}
            onNavigatePortal={onNavigatePortal}
        />
    );
}
