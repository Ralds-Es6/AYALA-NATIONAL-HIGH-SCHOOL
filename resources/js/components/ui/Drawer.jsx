import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, title, onClose, children, width = '480px' }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 60,
                display: 'flex',
                justifyContent: 'flex-end',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    width: '100%',
                    maxWidth: width,
                    height: '100%',
                    backgroundColor: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--border-subtle)',
                    boxShadow: '-10px 0 25px -5px rgba(15, 23, 42, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header */}
                <div style={{ 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: '#FFFFFF'
                }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {title}
                    </h3>
                    <button 
                        className="btn-ghost" 
                        onClick={onClose}
                        style={{ border: 'none', cursor: 'pointer', padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Drawer Content */}
                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
