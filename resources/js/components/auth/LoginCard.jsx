import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Info } from 'lucide-react';

/**
 * LoginCard
 * Shared, minimal sign-in card used by the Admin, Teacher and Student portals.
 * Keeps the three login pages visually consistent and professional.
 */
const PORTALS = [
    { key: 'admin', label: 'Admin', path: '/admin/login' },
    { key: 'teacher', label: 'Teacher', path: '/teacher/login' },
    { key: 'student', label: 'Student', path: '/student/login' },
];

export default function LoginCard({
    role,
    title,
    subtitle,
    emailLabel = 'Email address',
    emailPlaceholder = 'name@anhs.edu.ph',
    defaultEmail = '',
    defaultPassword = '',
    submitLabel = 'Sign in',
    notice = null,
    onLogin,
    onNavigatePortal,
}) {
    const [email, setEmail] = useState(defaultEmail);
    const [password, setPassword] = useState(defaultPassword);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setEmail(defaultEmail);
        setPassword(defaultPassword);
        setError(null);
    }, [role, defaultEmail, defaultPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onLogin({ email, password, expected_role: role });
        } catch (err) {
            const isRoleMismatch = err.response?.data?.status === 'unauthorized_role';
            const serverMsg = err.response?.data?.message || err.message;
            setError(
                isRoleMismatch
                    ? serverMsg || `This account does not have access to the ${role} portal.`
                    : serverMsg || 'Invalid email or password. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-shell">
                {/* Brand */}
                <header className="auth-brand">
                    <img
                        src="/assets/backgrounds/ayala-logo.jpeg"
                        alt="Ayala National High School logo"
                        className="auth-logo"
                    />
                    <div className="auth-brand-text">
                        <span className="auth-brand-name">Ayala National High School</span>
                        <span className="auth-brand-sub">Scheduling &amp; Assessment System</span>
                    </div>
                </header>

                <section className="auth-card" aria-labelledby="auth-title">
                    {/* Portal switcher */}
                    <div className="auth-tabs" role="tablist" aria-label="Select portal">
                        {PORTALS.map((p) => (
                            <button
                                key={p.key}
                                id={`portal-tab-${p.key}`}
                                type="button"
                                role="tab"
                                aria-selected={p.key === role}
                                className={`auth-tab ${p.key === role ? 'active' : ''}`}
                                onClick={() => p.key !== role && onNavigatePortal(p.path)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="auth-heading">
                        <h1 id="auth-title">{title}</h1>
                        <p>{subtitle}</p>
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
                        <div className="auth-field">
                            <label htmlFor={`${role}-email`}>{emailLabel}</label>
                            <div className="auth-input-wrap">
                                <Mail size={16} className="auth-input-icon" />
                                <input
                                    id={`${role}-email`}
                                    type="email"
                                    autoComplete="username"
                                    placeholder={emailPlaceholder}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor={`${role}-password`}>Password</label>
                            <div className="auth-input-wrap">
                                <Lock size={16} className="auth-input-icon" />
                                <input
                                    id={`${role}-password`}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    id={`${role}-toggle-password`}
                                    className="auth-input-action"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            id={`${role}-login-submit`}
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="auth-spin" />
                                    Signing in…
                                </>
                            ) : (
                                submitLabel
                            )}
                        </button>
                    </form>

                    {notice && (
                        <div className="auth-notice">
                            <Info size={15} />
                            <span>{notice}</span>
                        </div>
                    )}
                </section>

                <footer className="auth-footer">
                    <button
                        type="button"
                        id="auth-back-home"
                        className="auth-link"
                        onClick={() => onNavigatePortal('/')}
                    >
                        <ArrowLeft size={14} />
                        Back to home
                    </button>
                    <span>© {new Date().getFullYear()} Ayala National High School</span>
                </footer>
            </div>
        </main>
    );
}
