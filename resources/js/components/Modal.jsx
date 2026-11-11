import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
    isOpen, 
    title, 
    subtitle = null,
    icon: Icon = null,
    maxWidth = '600px',
    onClose, 
    children 
}) {
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
            className="modal-overlay" 
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050,
                padding: '1.25rem'
            }}
        >
            <div 
                className="modal-card" 
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: maxWidth || '600px',
                    boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 10px 25px -5px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(226, 232, 240, 0.95)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'calc(100vh - 2.5rem)',
                    animation: 'modalSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <div 
                    className="modal-header"
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
                        flexShrink: 0
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {Icon && (
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                color: '#1D4ED8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #BFDBFE',
                                boxShadow: '0 2px 8px -1px rgba(37, 99, 235, 0.15)',
                                flexShrink: 0
                            }}>
                                <Icon size={20} />
                            </div>
                        )}
                        <div>
                            <h3 style={{ 
                                fontSize: '1.15rem', 
                                fontWeight: 700, 
                                color: '#0F172A',
                                letterSpacing: '-0.01em',
                                margin: 0,
                                lineHeight: 1.3
                            }}>
                                {title}
                            </h3>
                            {subtitle && (
                                <p style={{
                                    fontSize: '0.8rem',
                                    color: '#64748B',
                                    margin: '3px 0 0 0',
                                    fontWeight: 500
                                }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        style={{ 
                            border: '1px solid #E2E8F0', 
                            background: '#F8FAFC',
                            cursor: 'pointer', 
                            padding: '6px', 
                            borderRadius: '8px',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = '#F1F5F9';
                            e.currentTarget.style.color = '#0F172A';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                            e.currentTarget.style.color = '#64748B';
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div 
                    className="modal-body custom-scrollbar" 
                    style={{ 
                        overflowY: 'auto', 
                        flex: 1, 
                        padding: '1.25rem 1.5rem'
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
