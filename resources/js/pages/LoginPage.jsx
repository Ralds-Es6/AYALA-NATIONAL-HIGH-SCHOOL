import React, { useState } from 'react';
import { 
    GraduationCap, 
    ShieldCheck, 
    BookOpen, 
    Lock, 
    Mail, 
    ArrowRight,
    Sparkles
} from 'lucide-react';
import Alert from '../components/Alert';

export default function LoginPage({ onLoginSuccess, onQuickLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onLoginSuccess({ email, password });
        } catch (err) {
            setError(err.message || 'Authentication failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                {/* School Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: 'var(--radius-lg)', 
                        background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#ffffff', 
                        margin: '0 auto 1rem', 
                        boxShadow: '0 8px 24px var(--primary-glow)' 
                    }}>
                        <GraduationCap size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        Ayala National High School
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Automated Teacher Schedule & Student Assessment Tracker
                    </p>
                </div>

                {/* Login Card */}
                <div className="panel" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                        Sign in to your account
                    </h2>

                    {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Gmail / DepEd Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="email" 
                                    className="form-input" 
                                    placeholder="name@anhs.edu.ph"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                    style={{ paddingLeft: '2.4rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    type="password" 
                                    className="form-input" 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                    style={{ paddingLeft: '2.4rem' }}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                            disabled={loading}
                        >
                            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                            <ArrowRight size={16} />
                        </button>
                    </form>

                    {/* Quick Demo Switcher */}
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                            Evaluation Quick Access (Demo Roles):
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ justifyContent: 'flex-start' }}
                                onClick={() => onQuickLogin('admin')}
                            >
                                <ShieldCheck size={16} color="var(--accent-gold-dark)" />
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>Administrator Portal</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>admin@anhs.edu.ph</div>
                                </div>
                            </button>

                            <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ justifyContent: 'flex-start' }}
                                onClick={() => onQuickLogin('teacher')}
                            >
                                <GraduationCap size={16} color="var(--royal-bright)" />
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>Teacher Portal (Dr. M. Santos)</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>m.santos@anhs.edu.ph</div>
                                </div>
                            </button>

                            <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ justifyContent: 'flex-start' }}
                                onClick={() => onQuickLogin('student')}
                            >
                                <BookOpen size={16} color="var(--accent-emerald)" />
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>Student Portal (Grade 10 - Rizal)</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>student@anhs.edu.ph</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
