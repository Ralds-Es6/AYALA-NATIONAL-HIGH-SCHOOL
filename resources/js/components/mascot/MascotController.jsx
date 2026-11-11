import React, { useState, useEffect } from 'react';
import Mascot from './Mascot';
import { MASCOT_STATES, MASCOT_TIMINGS } from './mascotAnimations';

/**
 * MascotController
 * Central state coordinator for the SRNHS Anime Mascot.
 * Maps operational states (SUCCESS, ERROR, WARNING, LOADING, EMAIL, SCHEDULE, IDLE)
 * to consistent character animations and handles auto-reversion to idle.
 */
export default function MascotController({
    state = MASCOT_STATES.IDLE,
    size = 64,
    autoRevertMs = null,
    onStateChange = null,
    className = '',
    style = {},
    showIndicator = true
}) {
    const [currentState, setCurrentState] = useState(state);

    useEffect(() => {
        // Map input string to valid MASCOT_STATES enum
        const normalized = Object.values(MASCOT_STATES).includes(state?.toLowerCase())
            ? state.toLowerCase()
            : MASCOT_STATES.IDLE;

        setCurrentState(normalized);
        if (onStateChange) onStateChange(normalized);

        // Optional auto-reversion to IDLE after reaction duration
        if (autoRevertMs && normalized !== MASCOT_STATES.IDLE && normalized !== MASCOT_STATES.LOADING) {
            const timer = setTimeout(() => {
                setCurrentState(MASCOT_STATES.IDLE);
                if (onStateChange) onStateChange(MASCOT_STATES.IDLE);
            }, autoRevertMs);
            return () => clearTimeout(timer);
        }
    }, [state, autoRevertMs]);

    return (
        <Mascot 
            state={currentState} 
            size={size} 
            className={className} 
            style={style} 
            showIndicator={showIndicator}
        />
    );
}

export { MASCOT_STATES, MASCOT_TIMINGS };
