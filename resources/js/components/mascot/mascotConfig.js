/**
 * SRNHS Anime Mascot Configuration Tokens
 */

export const MASCOT_CONFIG = {
    // Rive asset path
    rivSrc: '/assets/mascot/srnhs-mascot.riv',
    stateMachineName: 'SRNHS_Mascot',

    // State machine input names
    inputs: {
        EXPRESSION: 'expression', // String: 'happy', 'sad', 'confused', 'worried', 'concerned', 'thinking', 'neutral'
        MOTION: 'motion',         // String: 'celebrate', 'disappointed', 'look_around', 'panic', 'concerned', 'thinking', 'mail_reaction', 'idle'
        TRIGGER_SUCCESS: 'trigger_success',
        TRIGGER_ERROR: 'trigger_error',
        TRIGGER_CONFLICT: 'trigger_conflict',
        TRIGGER_NOT_FOUND: 'trigger_not_found',
        TRIGGER_WARNING: 'trigger_warning',
        TRIGGER_EMAIL: 'trigger_email'
    },

    // Timing parameters
    timings: {
        ENTRANCE_MS: 200,
        EXIT_MS: 150,
        REACTION_RESET_MS: 3400,
        BLINK_INTERVAL_MS: 3800
    },

    // Visual theme
    palette: {
        blazer: '#00563F',       // Landbank / SRNHS Forest Green
        blazerTrim: '#10B981',   // Emerald Green
        tie: '#0D9488',          // Teal
        pin: '#F59E0B',          // Gold
        hair: '#0F172A',         // Navy Dark
        hairHighlight: '#38BDF8',// Cyan Highlight
        blush: '#FDA4AF',        // Soft Anime Blush
        skin: '#FFE4D6',
        skinShadow: '#FBCBB7'
    }
};
