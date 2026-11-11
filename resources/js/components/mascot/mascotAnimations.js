/**
 * SRNHS Anime Mascot Animation Tokens and State Mappings
 * Project: San Roque National High School (SRNHS) Teaching Loads System
 */

export const MASCOT_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    EMAIL: 'email',
    SCHEDULE: 'schedule',
};

export const MASCOT_TIMINGS = {
    ENTRANCE_MS: 200,
    EXIT_MS: 150,
    STATE_REACTION_MS: 300,
    IDLE_CYCLE_MS: 3600,
};

export const MASCOT_PALETTE = {
    skin: '#FFE4D6',
    skinShadow: '#FBCBB7',
    hairDark: '#0F172A',
    hairHighlight: '#38BDF8',
    blush: '#FDA4AF',
    eyes: '#0D9488',
    eyesPupil: '#0F172A',
    blazer: '#00563F', // Official Landbank / SRNHS Green
    blazerTrim: '#10B981',
    shirt: '#FFFFFF',
    tie: '#0D9488',
    goldPin: '#F59E0B',
};

/**
 * State metadata configuration for expressions, props, and indicators
 */
export const STATE_CONFIG = {
    [MASCOT_STATES.IDLE]: {
        expression: 'neutral',
        eyes: 'open',
        mouth: 'smile_gentle',
        prop: null,
        indicator: null,
        badgeColor: '#0D9488',
        label: 'Aoi is ready'
    },
    [MASCOT_STATES.LOADING]: {
        expression: 'focused',
        eyes: 'focused',
        mouth: 'focused_small',
        prop: 'pencil_notepad',
        indicator: 'spinner',
        badgeColor: '#06B6D4',
        label: 'Processing request...'
    },
    [MASCOT_STATES.SUCCESS]: {
        expression: 'happy',
        eyes: 'curved_happy',
        mouth: 'open_happy',
        prop: 'sparkles',
        indicator: 'checkmark',
        badgeColor: '#16A34A',
        label: 'Success!'
    },
    [MASCOT_STATES.WARNING]: {
        expression: 'surprised',
        eyes: 'wide',
        mouth: 'wavy_small',
        prop: 'exclamation',
        indicator: 'warning_sign',
        badgeColor: '#D97706',
        label: 'Attention required'
    },
    [MASCOT_STATES.ERROR]: {
        expression: 'concerned',
        eyes: 'worried',
        mouth: 'frown_small',
        prop: 'error_cross',
        indicator: 'error_sign',
        badgeColor: '#DC2626',
        label: 'Action failed'
    },
    [MASCOT_STATES.EMAIL]: {
        expression: 'happy',
        eyes: 'looking_left',
        mouth: 'smile_open',
        prop: 'envelope_letter',
        indicator: 'mail_flight',
        badgeColor: '#0D9488',
        label: 'Dispatching Gmail notice...'
    },
    [MASCOT_STATES.SCHEDULE]: {
        expression: 'organized',
        eyes: 'looking_schedule',
        mouth: 'smile_confident',
        prop: 'calendar_clock',
        indicator: 'clock_tick',
        badgeColor: '#0284C7',
        label: 'Updating timetable...'
    }
};
