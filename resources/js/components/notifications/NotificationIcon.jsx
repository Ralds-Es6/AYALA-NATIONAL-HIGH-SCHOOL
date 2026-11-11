import React from 'react';
import { 
    CheckCircle2, 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    Loader2, 
    Mail, 
    Calendar,
    Trash2
} from 'lucide-react';

/**
 * NotificationIcon
 * Renders status icon matching the official SRNHS palette specifications.
 */
export default function NotificationIcon({ type = 'info', size = 20, className = '' }) {
    switch (type) {
        case 'delete':
            return (
                <div style={{ color: '#E11D48', display: 'flex', alignItems: 'center' }} className={className}>
                    <Trash2 size={size} />
                </div>
            );
        case 'success':
            return (
                <div style={{ color: '#059669', display: 'flex', alignItems: 'center' }} className={className}>
                    <CheckCircle2 size={size} />
                </div>
            );
        case 'warning':
            return (
                <div style={{ color: '#D97706', display: 'flex', alignItems: 'center' }} className={className}>
                    <AlertTriangle size={size} />
                </div>
            );
        case 'error':
        case 'danger':
            return (
                <div style={{ color: '#DC2626', display: 'flex', alignItems: 'center' }} className={className}>
                    <AlertCircle size={size} />
                </div>
            );
        case 'loading':
            return (
                <div style={{ color: '#0D9488', display: 'flex', alignItems: 'center' }} className={`spinner-icon ${className}`}>
                    <Loader2 size={size} className="animate-spin" />
                </div>
            );
        case 'email':
            return (
                <div style={{ color: '#0D9488', display: 'flex', alignItems: 'center' }} className={className}>
                    <Mail size={size} />
                </div>
            );
        case 'schedule':
            return (
                <div style={{ color: '#0284C7', display: 'flex', alignItems: 'center' }} className={className}>
                    <Calendar size={size} />
                </div>
            );
        case 'info':
        default:
            return (
                <div style={{ color: '#0284C7', display: 'flex', alignItems: 'center' }} className={className}>
                    <Info size={size} />
                </div>
            );
    }
}
