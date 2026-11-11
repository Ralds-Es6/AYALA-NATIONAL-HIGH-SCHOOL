import React, { useState } from 'react';
import { 
    ShieldCheck, 
    Lock, 
    KeyRound, 
    CheckCircle2, 
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { srnhsApi } from '../../api/endpoints';
import { notify } from '../notifications/notify';

export default function FirstTimePasswordChangeModal({ isOpen, user, onSuccess }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }

        if (newPassword === currentPassword) {
            setError('Your new permanent password cannot be identical to your temporary password.');
            return;
        }

        setLoading(true);

        try {
            const res = await srnhsApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });

            notify.saveSuccess(
                'Password Established!',
                'Your permanent private password is now active. Welcome to your Ayala National High School student timetable portal!'
            );

            if (onSuccess) {
                onSuccess(res.user);
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || err.message;
            setError(serverMsg || 'Failed to update password. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem'
            }}
        >
            <div 
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                    border: '1.5px solid #E2E8F0',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Header Banner */}
                <div 
                    style={{
                        padding: '1.5rem 1.75rem',
                        background: 'linear-gradient(135deg, #00563F 0%, #003829 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px'
                    }}
                >
                    <div 
                        style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        <KeyRound size={24} color="#A7F3D0" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Security Requirement &bull; First Login
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
                            Establish Permanent Password
                        </h3>
                    </div>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.75rem' }}>
                    <div 
                        style={{
                            padding: '0.85rem 1rem',
                            background: '#F0FDF4',
                            borderRadius: '10px',
                            border: '1px solid #BBF7D0',
                            color: '#166534',
                            fontSize: '0.825rem',
                            lineHeight: 1.45,
                            marginBottom: '1.25rem'
                        }}
                    >
                        <strong>Welcome, {user?.name || 'Student'}!</strong> Your account was provisioned by the school administrator with temporary credentials. To ensure your student record privacy, please create a new permanent password.
                    </div>

                    {error && (
                        <div 
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '0.85rem 1rem',
                                background: '#FEF2F2',
                                borderRadius: '10px',
                                border: '1px solid #FCA5A5',
                                color: '#991B1B',
                                fontSize: '0.825rem',
                                marginBottom: '1.25rem'
                            }}
                        >
                            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                                Current Temporary Password *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter initial password provided by admin"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.4rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                                New Permanent Password *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    style={{ paddingLeft: '2.4rem' }}
                                />
                            </div>
                            <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
                                Must be at least 8 characters and known only to you.
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                                Confirm Permanent Password *
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Re-type new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    style={{ paddingLeft: '2.4rem' }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '0.925rem',
                                fontWeight: 700,
                                background: '#00563F',
                                borderColor: '#004B37',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Securing Student Account...' : 'Set Password & Access Timetable'}
                            <ArrowRight size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
