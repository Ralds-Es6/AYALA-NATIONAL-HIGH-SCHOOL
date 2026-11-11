/**
 * SRNHS Anime Mascot States & Semantic Mapping
 * Project: San Roque National High School (SRNHS) Teaching Loads System
 */

import { CHARACTER_REACTIONS, resolveReaction } from './mascotReactions';

export { CHARACTER_REACTIONS, resolveReaction };

export const EXPRESSIONS = {
    HAPPY: 'happy',
    SAD: 'sad',
    CRYING: 'crying',
    CONFUSED: 'confused',
    WORRIED: 'worried',
    CONCERNED: 'concerned',
    THINKING: 'thinking',
    NEUTRAL: 'neutral'
};

export const MOTIONS = {
    CELEBRATE: 'celebrate',
    DISAPPOINTED: 'disappointed',
    CRY: 'cry',
    LOOK_AROUND: 'look_around',
    PANIC: 'panic',
    CONCERNED: 'concerned',
    THINKING: 'thinking',
    MAIL_REACTION: 'mail_reaction',
    IDLE: 'idle'
};

/**
 * Centralized mapping of API status codes to character expression and body motion
 */
export const mascotStates = {
    success: {
        expression: "happy",
        motion: "celebrate",
        label: "Success Celebration"
    },

    create_success: {
        expression: "happy",
        motion: "celebrate",
        label: "Create Success"
    },

    update_success: {
        expression: "happy",
        motion: "celebrate",
        label: "Update Success"
    },

    delete_success: {
        expression: "crying",
        motion: "cry",
        label: "Delete Success (Crying)"
    },

    delete: {
        expression: "crying",
        motion: "cry",
        label: "Delete Operation (Crying)"
    },

    error: {
        expression: "sad",
        motion: "disappointed",
        label: "Disappointed Error"
    },

    request_error: {
        expression: "sad",
        motion: "disappointed",
        label: "Request Error"
    },

    validation_error: {
        expression: "sad",
        motion: "disappointed",
        label: "Validation Error"
    },

    not_found: {
        expression: "confused",
        motion: "look_around",
        label: "Confused / Looking Around"
    },

    conflict: {
        expression: "worried",
        motion: "panic",
        label: "Worried Schedule Conflict"
    },

    warning: {
        expression: "concerned",
        motion: "concerned",
        label: "Cautious Warning"
    },

    loading: {
        expression: "thinking",
        motion: "thinking",
        label: "Thinking / Processing"
    },

    email: {
        expression: "happy",
        motion: "mail_reaction",
        label: "Gmail Notice Dispatched"
    },

    idle: {
        expression: "neutral",
        motion: "idle",
        label: "Idle / Ready"
    }
};

/**
 * Normalizes input status or API character object into a standard { expression, motion } pair
 */
export function resolveMascotState(input) {
    if (!input) return mascotStates.idle;

    // If an object with operation and result
    if (typeof input === 'object') {
        if (input.operation || input.result) {
            return resolveReaction(input.operation, input.result, input);
        }

        if (input.expression && input.motion) {
            return {
                expression: input.expression,
                motion: input.motion
            };
        }

        if (input.status && mascotStates[input.status.toLowerCase()]) {
            return mascotStates[input.status.toLowerCase()];
        }
    }

    // If a string key
    if (typeof input === 'string') {
        const key = input.toLowerCase();
        if (mascotStates[key]) return mascotStates[key];
        if (key === 'danger') return mascotStates.error;
        if (key === 'schedule') return mascotStates.success;
        if (key === 'remove' || key === 'destroy') return mascotStates.delete_success;
    }

    return mascotStates.idle;
}
