/**
 * Centralized Semantic Character Reactions System
 * San Roque National High School (SRNHS) Teaching Loads System
 *
 * Distinguishes OPERATION from RESULT to determine the appropriate
 * anime mascot reaction (expression + body motion).
 *
 * Rules:
 * - CREATE_SUCCESS / UPDATE_SUCCESS -> happy + celebrate
 * - DELETE_SUCCESS                  -> crying + cry (deliberate UX: mourning lost data)
 * - REQUEST_ERROR / VALIDATION_ERROR -> sad + disappointed
 * - NOT_FOUND                       -> confused + look_around
 * - SCHEDULE_CONFLICT               -> worried + panic
 * - WARNING                         -> concerned + concerned
 * - LOADING                         -> thinking + thinking
 * - EMAIL_SENT                      -> happy + mail_reaction
 */

export const CHARACTER_REACTIONS = {
    CREATE_SUCCESS: {
        expression: "happy",
        motion: "celebrate",
        label: "Create Success (Happy / Excited)"
    },

    UPDATE_SUCCESS: {
        expression: "happy",
        motion: "celebrate",
        label: "Update Success (Happy / Satisfied)"
    },

    SAVE_SUCCESS: {
        expression: "happy",
        motion: "celebrate",
        label: "Save Success (Smile / Celebration)"
    },

    DELETE_SUCCESS: {
        expression: "crying",
        motion: "cry",
        label: "Delete Success (Crying / Tears)"
    },

    DELETE_FAILED: {
        expression: "worried",
        motion: "disappointed",
        label: "Delete Failed (Sad / Worried)"
    },

    REQUEST_ERROR: {
        expression: "sad",
        motion: "disappointed",
        label: "Failed Request (Sad / Disappointed)"
    },

    VALIDATION_ERROR: {
        expression: "sad",
        motion: "disappointed",
        label: "Validation Error (Sad / Frustrated)"
    },

    BAD_REQUEST: {
        expression: "sad",
        motion: "look_around",
        label: "Bad Request (Sad / Confused)"
    },

    NOT_FOUND: {
        expression: "confused",
        motion: "look_around",
        label: "Record Not Found (Confused / Looking Around)"
    },

    SCHEDULE_CONFLICT: {
        expression: "worried",
        motion: "panic",
        label: "Schedule Conflict (Shocked / Worried / Panic)"
    },

    WARNING: {
        expression: "concerned",
        motion: "concerned",
        label: "Warning (Concerned)"
    },

    LOADING: {
        expression: "thinking",
        motion: "thinking",
        label: "Loading (Thinking / Waiting)"
    },

    INFO: {
        expression: "neutral",
        motion: "idle",
        label: "General Information (Neutral / Attentive)"
    },

    EMAIL_SENT: {
        expression: "happy",
        motion: "mail_reaction",
        label: "Notification Dispatched (Mail)"
    },

    IDLE: {
        expression: "neutral",
        motion: "idle",
        label: "Idle / Neutral"
    }
};

/**
 * Resolves character reaction by separating OPERATION from RESULT or via semantic event string.
 *
 * @param {string|null} operation - 'create' | 'update' | 'delete' | 'CREATE_SUCCESS' | etc.
 * @param {string} result - 'success' | 'error' | 'not_found' | 'conflict' | 'warning' | 'loading'
 * @param {object} extra - Optional overrides { expression, motion }
 * @returns {object} { expression, motion, label }
 */
export function resolveReaction(operation = null, result = 'success', extra = {}) {
    // 1. Direct explicit override takes highest priority
    if (extra && extra.expression && extra.motion) {
        return {
            expression: extra.expression,
            motion: extra.motion,
            label: extra.label || 'Custom Override'
        };
    }

    const op = (operation || '').trim();
    const upperOp = op.toUpperCase();

    // 2. Direct semantic event string match (e.g. resolveReaction('DELETE_SUCCESS'))
    if (CHARACTER_REACTIONS[upperOp]) {
        return CHARACTER_REACTIONS[upperOp];
    }

    const lowerOp = op.toLowerCase();
    const res = (result || 'success').toLowerCase().trim();
    const upperRes = res.toUpperCase();

    if (CHARACTER_REACTIONS[upperRes]) {
        return CHARACTER_REACTIONS[upperRes];
    }

    // 3. Specialized outcomes independent of operation
    if (res === 'not_found' || res === 'notfound') {
        return CHARACTER_REACTIONS.NOT_FOUND;
    }

    if (res === 'conflict' || res === 'schedule_conflict') {
        return CHARACTER_REACTIONS.SCHEDULE_CONFLICT;
    }

    if (res === 'warning' || res === 'warn') {
        return CHARACTER_REACTIONS.WARNING;
    }

    if (res === 'loading' || res === 'processing') {
        return CHARACTER_REACTIONS.LOADING;
    }

    if (res === 'validation_error') {
        return CHARACTER_REACTIONS.VALIDATION_ERROR;
    }

    if (res === 'bad_request') {
        return CHARACTER_REACTIONS.BAD_REQUEST;
    }

    if (res === 'info') {
        return CHARACTER_REACTIONS.INFO;
    }

    // 4. Operation-specific resolutions when result is ERROR / FAILED
    if (res === 'error' || res === 'failed' || res === 'danger') {
        if (lowerOp === 'delete' || lowerOp === 'destroy' || lowerOp === 'remove') {
            return CHARACTER_REACTIONS.DELETE_FAILED;
        }
        return CHARACTER_REACTIONS.REQUEST_ERROR;
    }

    // 5. Operation-specific resolutions when result is SUCCESS
    if (lowerOp === 'delete' || lowerOp === 'destroy' || lowerOp === 'remove' || res === 'delete_success') {
        return CHARACTER_REACTIONS.DELETE_SUCCESS;
    }

    if (lowerOp === 'create' || lowerOp === 'store' || lowerOp === 'add') {
        return CHARACTER_REACTIONS.CREATE_SUCCESS;
    }

    if (lowerOp === 'update' || lowerOp === 'edit') {
        return CHARACTER_REACTIONS.UPDATE_SUCCESS;
    }

    if (lowerOp === 'save') {
        return CHARACTER_REACTIONS.SAVE_SUCCESS;
    }

    if (lowerOp === 'email' || lowerOp === 'notification' || res === 'email') {
        return CHARACTER_REACTIONS.EMAIL_SENT;
    }

    // Default fallback for routine success
    return CHARACTER_REACTIONS.CREATE_SUCCESS;
}

export default CHARACTER_REACTIONS;
