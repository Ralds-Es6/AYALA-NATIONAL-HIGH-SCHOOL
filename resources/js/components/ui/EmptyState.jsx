import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '3.5rem 1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--text-secondary)'
        }}>
            {Icon && (
                <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '1rem',
                    color: 'var(--text-muted)'
                }}>
                    <Icon size={28} />
                </div>
            )}
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                {title}
            </h4>
            {description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.5, marginBottom: actionText ? '1.25rem' : 0 }}>
                    {description}
                </p>
            )}
            {actionText && onAction && (
                <button className="btn btn-primary btn-sm" onClick={onAction}>
                    {actionText}
                </button>
            )}
        </div>
    );
}
