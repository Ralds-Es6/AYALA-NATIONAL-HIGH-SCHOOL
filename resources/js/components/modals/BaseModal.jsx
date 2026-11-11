import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * BaseModal Component
 * Centered modal dialog with backdrop blur, entrance/exit scaling, and keyboard ESC dismissal.
 */
export default function BaseModal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = '520px',
    showCloseButton = true,
    closeOnBackdrop = true
}) {
    const [mounted, setMounted] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setIsClosing(false);
            document.body.style.overflow = 'hidden';
        } else if (mounted) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setMounted(false);
                setIsClosing(false);
                document.body.style.overflow = '';
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            if (onClose) onClose();
            setIsClosing(false);
            setMounted(false);
            document.body.style.overflow = '';
        }, 150);
    };

    if (!mounted && !isOpen) return null;

    return (
        <div 
            className={`srnhs-modal-overlay ${isClosing ? 'srnhs-overlay-exit' : 'srnhs-overlay-enter'}`}
            onClick={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) {
                    handleClose();
                }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
        >
            <div 
                className={`srnhs-modal-box ${isClosing ? 'srnhs-modal-exit' : 'srnhs-modal-enter'}`}
                style={{ maxWidth }}
            >
                {/* Header if title or close button provided */}
                {(title || showCloseButton) && (
                    <div className="srnhs-modal-header">
                        {title && (
                            <h3 id="modal-title" className="srnhs-modal-title">
                                {title}
                            </h3>
                        )}
                        {showCloseButton && (
                            <button 
                                className="srnhs-modal-close-btn"
                                onClick={handleClose}
                                aria-label="Close dialog"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Modal Body */}
                <div className="srnhs-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
