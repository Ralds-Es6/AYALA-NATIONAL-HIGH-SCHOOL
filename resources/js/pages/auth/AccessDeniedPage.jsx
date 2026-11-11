import React from 'react';
import { 
    AlertOctagon, 
    ArrowLeft, 
    ShieldAlert, 
    Home,
    LogOut
} from 'lucide-react';

export default function AccessDeniedPage({ 
    currentUser, 
    attemptedPath = '', 
    onReturnToDashboard,
    onLogout 
}) {
    const roleTitle = currentUser?.role ? currentUser.role.toUpperCase() : 'USER';
    const authorizedDashboard = `/${currentUser?.role || 'admin'}/dashboard`;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: '#F8FAFC' }}>
            <div style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
                
                {/* 403 Panel */}
                <div className="panel" style={{ padding: '2.5rem 2rem', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 20px 35px rgba(0, 0, 0, 0.06)' }}>
                    
                    {/* Access denied icon */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldAlert size={30} />
                        </div>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.25)', color: '#DC2626', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                        <AlertOctagon size={14} />
                        HTTP 403 &bull; ACCESS FORBIDDEN
                    </div>

                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                        Access Denied
                    </h1>

                    <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, margin: '0 auto 1.5rem', maxWidth: '380px' }}>
                        You do not have permission to access <strong style={{ color: '#334155' }}>{attemptedPath || 'this area'}</strong>. 
                        Your account is authenticated as <strong style={{ color: '#0F172A' }}>{roleTitle}</strong>.
                    </p>

                    <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', fontSize: '0.8rem', color: '#991B1B', marginBottom: '1.75rem', textAlign: 'left' }}>
                        <strong>Role-Based Access Control (RBAC) Enforcement:</strong>
                        <div style={{ marginTop: '2px', color: '#7F1D1D' }}>
                            Administrative, Faculty, and Student modules are strictly isolated at both backend and application routing layers.
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <button
                            type="button"
                            onClick={onReturnToDashboard}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                        >
                            <Home size={16} />
                            <span>Return to Authorized Dashboard ({roleTitle})</span>
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="btn btn-secondary"
                            style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', fontSize: '0.85rem' }}
                        >
                            <LogOut size={15} />
                            <span>Sign Out & Switch Portal</span>
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                    Ayala National High School &bull; Automated Teacher Scheduling & Student Assessment Tracker
                </div>
            </div>
        </div>
    );
}
