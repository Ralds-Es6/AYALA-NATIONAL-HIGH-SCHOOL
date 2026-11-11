import React from 'react';
import { X } from 'lucide-react';
import NotificationIcon from './NotificationIcon';

/**
 * AppToast Component
 * Implements the official SRNHS Toast structure:
 * - Icon, Title, Description, and Close Button
 * - SRNHS palette colors and typography specifications
 */
export default function AppToast({
    id,
    type = 'info', // 'success' | 'warning' | 'error' | 'info' | 'loading' | 'email' | 'schedule'
    title,
    message,
    character = null, // { expression, motion } from Laravel API
    mascot = null,    // status shortcut override
    duration = 4000,
    onDismiss,
    isExiting = false
}) {
    // Visual theme mapping with WCAG AAA contrast for ultra-readable notification text
    const getTheme = () => {
        switch (type) {
            case 'delete':
                return {
                    bg: '#FFF1F2',
                    border: '#FDA4AF',
                    titleColor: '#9F1239',
                    descColor: '#4C0519',
                    glow: 'rgba(225, 29, 72, 0.14)'
                };
            case 'success':
                return {
                    bg: '#F0FDF4',
                    border: '#86EFAC',
                    titleColor: '#065F46',
                    descColor: '#064E3B',
                    glow: 'rgba(5, 150, 105, 0.14)'
                };
            case 'warning':
                return {
                    bg: '#FFFBEB',
                    border: '#FCD34D',
                    titleColor: '#92400E',
                    descColor: '#78350F',
                    glow: 'rgba(217, 119, 6, 0.14)'
                };
            case 'error':
            case 'danger':
                return {
                    bg: '#FEF2F2',
                    border: '#FCA5A5',
                    titleColor: '#991B1B',
                    descColor: '#7F1D1D',
                    glow: 'rgba(220, 38, 38, 0.14)'
                };
            case 'email':
                return {
                    bg: '#F0FDF4',
                    border: '#86EFAC',
                    titleColor: '#00563F',
                    descColor: '#064E3B',
                    glow: 'rgba(0, 86, 63, 0.14)'
                };
            case 'schedule':
            case 'info':
            default:
                return {
                    bg: '#F0F9FF',
                    border: '#BAE6FD',
                    titleColor: '#0369A1',
                    descColor: '#0C4A6E',
                    glow: 'rgba(2, 132, 199, 0.14)'
                };
        }
    };

    const theme = getTheme();

    return (
        <div 
            className={`srnhs-toast ${isExiting ? 'srnhs-toast-exit' : 'srnhs-toast-enter'}`}
            style={{
                backgroundColor: theme.bg,
                border: `1.5px solid ${theme.border}`,
                boxShadow: `0 8px 20px -2px ${theme.glow}, 0 2px 6px -1px rgba(0, 0, 0, 0.05)`,
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.85rem',
                minHeight: '64px',
                width: '100%',
                transition: 'all 0.2s ease-out'
            }}
            role="alert"
        >
            {/* Left Column: Notification Details (Icon, Title, Message) */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                    <NotificationIcon type={type} size={19} />
                    <h4 
                        style={{ 
                            margin: 0, 
                            fontSize: '0.95rem', 
                            fontWeight: 700, 
                            color: theme.titleColor,
                            letterSpacing: '-0.01em',
                            lineHeight: 1.2
                        }}
                    >
                        {title}
                    </h4>
                </div>
                <p 
                    style={{ 
                        margin: 0, 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        color: theme.descColor,
                        lineHeight: 1.45,
                        wordBreak: 'break-word'
                    }}
                >
                    {message}
                </p>
            </div>

            {/* Close Button at top-right */}
            <button
                onClick={() => onDismiss && onDismiss(id)}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.titleColor,
                    opacity: 0.65,
                    padding: '3px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.65';
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close notification"
            >
                <X size={14} />
            </button>
        </div>
    );
}
