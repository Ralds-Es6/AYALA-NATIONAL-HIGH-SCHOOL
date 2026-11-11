import React from 'react';
import BaseModal from './BaseModal';
import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * ConfirmationModal Component
 * Centered modal for destructive operations (e.g. delete teacher, delete schedule, delete load).
 * Clean confirmation dialog with message and actions.
 */
export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Deletion',
    message = 'Are you sure you want to perform this action? This cannot be undone.',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
    isLoading = false
}) {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={!isLoading}
            closeOnBackdrop={!isLoading}
            maxWidth="460px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header with Title and Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '9999px', 
                        background: '#FEE2E2', 
                        color: '#DC2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <AlertTriangle size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {title}
                    </h3>
                </div>

                {/* Message Container */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '1rem',
                    background: '#F8FAFC',
                    padding: '1rem 1.15rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{ minWidth: '96px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
