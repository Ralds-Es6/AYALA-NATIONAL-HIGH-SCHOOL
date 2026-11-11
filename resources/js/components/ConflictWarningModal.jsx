import React from 'react';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import BaseModal from './modals/BaseModal';

export default function ConflictWarningModal({ isOpen, onClose, conflicts = [] }) {
    if (!isOpen || conflicts.length === 0) return null;

    return (
        <BaseModal 
            isOpen={isOpen} 
            title="Schedule Conflict Detected" 
            onClose={onClose}
            maxWidth="520px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header Banner */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '1rem', 
                    padding: '1rem', 
                    background: '#FEF2F2', 
                    border: '1px solid #FECACA', 
                    borderRadius: '12px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                        <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '9999px', 
                            background: '#FEE2E2', 
                            color: '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <AlertOctagon size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#B91C1C', marginBottom: '2px' }}>
                                Scheduling Collision Triggered
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: '#991B1B', lineHeight: 1.4 }}>
                                The proposed time slot overlaps with an existing schedule. According to Ayala National High School scheduling rules, assignments with collisions cannot be saved.
                            </div>
                        </div>
                    </div>

                </div>

                {/* Structured Conflict Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {conflicts.map((conflict, idx) => (
                        <div 
                            key={idx} 
                            style={{ 
                                background: '#F8FAFC', 
                                border: '1px solid var(--border-subtle)', 
                                borderRadius: '10px', 
                                padding: '0.85rem 1rem' 
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                <AlertTriangle size={15} />
                                <span>{conflict.title || 'Conflict Detected'}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {conflict.message}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={onClose}>
                        Modify Proposed Schedule
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
