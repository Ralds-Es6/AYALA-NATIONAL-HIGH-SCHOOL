import React from 'react';
import NotificationIcon from './NotificationIcon';

/**
 * MascotNotification Component
 * Reusable banner/card connecting the SRNHS Mascot to inline operational feedback.
 */
export default function MascotNotification({
    type = 'info',
    title,
    message,
    mascotState = null,
    action = null,
    className = '',
    style = {}
}) {
    const state = mascotState || (type === 'danger' ? 'error' : type);

    return (
        <div 
            className={`mascot-notification-banner ${className}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                boxShadow: 'var(--shadow-sm)',
                gap: '1rem',
                ...style
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                <NotificationIcon type={type} size={22} />
                <div>
                    {title && <h5 style={{ margin: '0 0 2px 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h5>}
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{message}</p>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                {action}
            </div>
        </div>
    );
}
