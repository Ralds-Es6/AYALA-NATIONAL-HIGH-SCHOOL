/**
 * MascotController Class & Global Event Hub
 * Manages character expression, body motion, triggers, and auto-idle transitions.
 */

import { mascotStates, resolveMascotState } from './mascotStates';
import { resolveReaction } from './mascotReactions';
import { MASCOT_CONFIG } from './mascotConfig';

class MascotController {
    constructor() {
        this.current = {
            expression: 'neutral',
            motion: 'idle',
            status: 'idle'
        };
        this.listeners = new Set();
        this.resetTimer = null;
    }

    /**
     * Subscribe to character state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        // Immediately notify with current state
        listener(this.current);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach((listener) => {
            try {
                listener(this.current);
            } catch (err) {
                console.error('[MascotController] Listener error:', err);
            }
        });
    }

    /**
     * Trigger a new character reaction from an application event: separates OPERATION from RESULT
     * e.g. triggerEvent('delete', 'success') -> crying + cry
     *      triggerEvent('update', 'success') -> happy + celebrate
     *      triggerEvent('schedule', 'conflict') -> worried + panic
     */
    triggerEvent(operation, result = 'success', extra = {}, autoReset = true) {
        const reaction = resolveReaction(operation, result, extra);
        return this.trigger({
            expression: reaction.expression,
            motion: reaction.motion,
            status: `${operation || 'op'}_${result || 'res'}`
        }, autoReset);
    }

    /**
     * Trigger a new character reaction from an API response or status string
     * @param {string|object} statusOrConfig e.g. 'success', 'conflict', { expression: 'happy', motion: 'celebrate' }
     * @param {boolean} autoReset Whether to automatically return to idle after reaction duration
     */
    trigger(statusOrConfig, autoReset = true, extraMessage = '', extraTitle = '') {
        // Clear any pending reset
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }

        // If object has operation and result
        let resolved;
        if (statusOrConfig && typeof statusOrConfig === 'object' && (statusOrConfig.operation || statusOrConfig.result)) {
            resolved = resolveReaction(statusOrConfig.operation, statusOrConfig.result, statusOrConfig);
        } else {
            resolved = resolveMascotState(statusOrConfig);
        }

        const statusKey = typeof statusOrConfig === 'string' ? statusOrConfig.toLowerCase() : (resolved.label || 'custom');
        const msg = (statusOrConfig && typeof statusOrConfig === 'object' && statusOrConfig.message) ? statusOrConfig.message : extraMessage;
        const ttl = (statusOrConfig && typeof statusOrConfig === 'object' && statusOrConfig.title) ? statusOrConfig.title : extraTitle;

        this.current = {
            expression: resolved.expression,
            motion: resolved.motion,
            status: statusKey,
            message: msg,
            title: ttl,
            timestamp: Date.now()
        };

        this.notifyListeners();

        // Auto-revert to idle unless it's loading or disabled
        if (autoReset && resolved.motion !== 'thinking' && resolved.motion !== 'idle') {
            this.resetTimer = setTimeout(() => {
                this.resetToIdle();
            }, MASCOT_CONFIG.timings.REACTION_RESET_MS);
        }
    }

    /**
     * Set explicit expression
     */
    setExpression(expression) {
        this.current = { ...this.current, expression };
        this.notifyListeners();
    }

    /**
     * Set explicit motion
     */
    setMotion(motion) {
        this.current = { ...this.current, motion };
        this.notifyListeners();
    }

    /**
     * Reset character back to default idle state
     */
    resetToIdle() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
        this.current = {
            expression: 'neutral',
            motion: 'idle',
            status: 'idle',
            timestamp: Date.now()
        };
        this.notifyListeners();
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.current };
    }
}

export const mascotController = new MascotController();
export default mascotController;
