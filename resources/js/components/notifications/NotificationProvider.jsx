import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AppToast from './AppToast';
import { mascotController } from '../mascot/mascotEventHub';
import { resolveReaction } from '../mascot/mascotReactions';

// Context for React component tree
const NotificationContext = createContext(null);

import notify, { setGlobalNotifyHandler } from './notify';

/**
 * NotificationProvider
 * Central Toast Container & Context Provider.
 * Stacks notifications vertically at Top-Right with accurate timings,
 * entrance/exit animations, and synchronized anime mascot reactions.
 */
export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    // Dismiss a toast with exit animation
    const dismiss = useCallback((id) => {
        // Clear active timer
        if (timersRef.current.has(id)) {
            clearTimeout(timersRef.current.get(id));
            timersRef.current.delete(id);
        }

        // Trigger exit animation
        setToasts((prev) => 
            prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
        );

        // Remove from DOM after 150ms animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 150);
    }, []);

    // Add a toast notification
    const addToast = useCallback((type, title, message, options = {}) => {
        const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Resolve duration per specification
        let duration = options.duration;
        if (duration === undefined) {
            switch (type) {
                case 'delete':
                    duration = 5000;
                    break;
                case 'success':
                    duration = 4000;
                    break;
                case 'info':
                    duration = 3800;
                    break;
                case 'warning':
                    duration = 4800;
                    break;
                case 'error':
                case 'danger':
                    duration = 6000;
                    break;
                case 'email':
                case 'schedule':
                    duration = 4200;
                    break;
                case 'loading':
                    duration = 0; // Persistent until dismissed
                    break;
                default:
                    duration = 4000;
            }
        }

        // Resolve character reaction from operation + result if available
        let character = options.character;
        if (!character) {
            if (options.operation || options.result) {
                character = resolveReaction(options.operation, options.result || 'success', options);
            } else if (type === 'delete') {
                character = resolveReaction('delete', 'success');
            } else if (options.mascot) {
                character = { expression: options.mascot, motion: options.mascot };
            } else {
                character = resolveReaction(null, type);
            }
        }

        // Synchronize global mascot animation controller with notification text
        mascotController.trigger({
            expression: character?.expression,
            motion: character?.motion,
            status: type,
            title,
            message
        });

        const newToast = {
            id,
            type,
            title,
            message: message || '',
            character,
            mascot: options.mascot || null,
            duration,
            isExiting: false
        };

        setToasts((prev) => {
            // Check if already exists (e.g. updating a loading toast)
            const exists = prev.some((t) => t.id === id);
            if (exists) {
                return prev.map((t) => (t.id === id ? newToast : t));
            }
            // Max 4 visible toasts to keep UI clean and uncluttered
            const trimmed = prev.length >= 4 ? prev.slice(prev.length - 3) : prev;
            return [...trimmed, newToast];
        });

        // Set auto-dismiss timer if duration > 0
        if (duration > 0) {
            const timerId = setTimeout(() => {
                dismiss(id);
            }, duration);
            timersRef.current.set(id, timerId);
        }

        return id;
    }, [dismiss]);

    // Connect global bridge
    useEffect(() => {
        addToast.dismiss = dismiss;
        setGlobalNotifyHandler(addToast);
        return () => {
            setGlobalNotifyHandler(null);
        };
    }, [addToast, dismiss]);

    const contextValue = {
        notify,
        success: (title, message, opt) => addToast('success', title, message, opt),
        deleteSuccess: (title, message, opt) => addToast('delete', title, message, { operation: 'delete', result: 'success', ...opt }),
        error: (title, message, opt) => addToast('error', title, message, opt),
        warning: (title, message, opt) => addToast('warning', title, message, opt),
        info: (title, message, opt) => addToast('info', title, message, opt),
        loading: (title, message, opt) => addToast('loading', title, message, opt),
        email: (title, message, opt) => addToast('email', title, message, opt),
        schedule: (title, message, opt) => addToast('schedule', title, message, opt),
        notFound: (title, message, opt) => notify.notFound(title, message, opt),
        conflict: (title, message, opt) => notify.conflict(title, message, opt),
        dismiss
    };

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}

            {/* Top-Right Notification Toast Container */}
            <div 
                className="srnhs-toast-container"
                aria-live="polite"
                aria-label="System notifications"
            >
                {toasts.map((toast) => (
                    <AppToast 
                        key={toast.id}
                        {...toast}
                        onDismiss={dismiss}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotify() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        return notify;
    }
    return ctx;
}
