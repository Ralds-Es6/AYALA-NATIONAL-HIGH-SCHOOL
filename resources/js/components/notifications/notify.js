import { resolveReaction } from '../mascot/mascotReactions';

// Global bridge for non-component files / callbacks
let globalNotifyHandler = null;

export const setGlobalNotifyHandler = (handler) => {
    globalNotifyHandler = handler;
};

export const getGlobalNotifyHandler = () => globalNotifyHandler;

export const notify = {
    success: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('success', title, message, options);
        console.log('[notify.success]', title, message);
    },
    error: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('error', title, message, options);
        console.error('[notify.error]', title, message);
    },
    warning: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('warning', title, message, options);
        console.warn('[notify.warning]', title, message);
    },
    info: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('info', title, message, options);
        console.log('[notify.info]', title, message);
    },
    loading: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('loading', title, message, { duration: 0, ...options });
        console.log('[notify.loading]', title, message);
    },
    deleteSuccess: (title, message, options = {}) => {
        if (globalNotifyHandler) {
            return globalNotifyHandler('delete', title, message, { 
                operation: 'delete',
                result: 'success',
                character: { expression: 'crying', motion: 'cry' },
                ...options 
            });
        }
        console.log('[notify.deleteSuccess]', title, message);
    },
    email: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('email', title, message, { 
            character: { expression: 'happy', motion: 'mail_reaction' },
            ...options 
        });
        console.log('[notify.email]', title, message);
    },
    schedule: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('schedule', title, message, { 
            character: { expression: 'happy', motion: 'celebrate' },
            ...options 
        });
        console.log('[notify.schedule]', title, message);
    },
    notFound: (title = 'Record Not Found', message = 'The requested record was not found.', options = {}) => {
        if (globalNotifyHandler) {
            return globalNotifyHandler('warning', title, message, {
                character: { expression: 'confused', motion: 'look_around' },
                ...options
            });
        }
        console.warn('[notify.notFound]', title, message);
    },
    conflict: (title = 'Schedule Conflict', message = 'The selected time slot overlaps with an existing schedule.', options = {}) => {
        if (globalNotifyHandler) {
            return globalNotifyHandler('error', title, message, {
                character: { expression: 'worried', motion: 'panic' },
                ...options
            });
        }
        console.error('[notify.conflict]', title, message);
    },
    createSuccess: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('success', title, message, { operation: 'create', result: 'success', ...options });
        console.log('[notify.createSuccess]', title, message);
    },
    updateSuccess: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('success', title, message, { operation: 'update', result: 'success', ...options });
        console.log('[notify.updateSuccess]', title, message);
    },
    saveSuccess: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('success', title, message, { operation: 'save', result: 'success', ...options });
        console.log('[notify.saveSuccess]', title, message);
    },
    deleteFailed: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('error', title, message, { operation: 'delete', result: 'error', ...options });
        console.error('[notify.deleteFailed]', title, message);
    },
    validationError: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('error', title, message, { result: 'validation_error', ...options });
        console.error('[notify.validationError]', title, message);
    },
    requestError: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('error', title, message, { result: 'error', ...options });
        console.error('[notify.requestError]', title, message);
    },
    badRequest: (title, message, options = {}) => {
        if (globalNotifyHandler) return globalNotifyHandler('error', title, message, { result: 'bad_request', ...options });
        console.error('[notify.badRequest]', title, message);
    },
    semantic: (semanticEvent, title, message, options = {}) => {
        const resolved = resolveReaction(semanticEvent);
        const type = (semanticEvent.includes('SUCCESS') || semanticEvent === 'SAVE') ? 'success'
                   : (semanticEvent.includes('DELETE') && semanticEvent.includes('SUCCESS')) ? 'delete'
                   : (semanticEvent.includes('ERROR') || semanticEvent.includes('CONFLICT')) ? 'error'
                   : (semanticEvent.includes('WARN') || semanticEvent.includes('NOT_FOUND')) ? 'warning'
                   : 'info';
        if (globalNotifyHandler) return globalNotifyHandler(type, title, message, { character: resolved, ...options });
        console.log(`[notify.${semanticEvent}]`, title, message);
    },
    fromApiResponse: (res, defaultTitle = 'Notification') => {
        if (!res) return;
        const op = res.operation || (res.status === 'delete_success' ? 'delete' : null);
        const result = res.status || (res.success ? 'success' : 'error');
        const type = op === 'delete' ? 'delete' : (res.status === 'conflict' ? 'error' : (res.status || (res.success ? 'success' : 'error')));
        const title = defaultTitle;
        const message = res.message || '';
        const character = res.character || null;
        if (globalNotifyHandler) {
            return globalNotifyHandler(type, title, message, { operation: op, result, character });
        }
    },
    dismiss: (id) => {
        if (globalNotifyHandler && globalNotifyHandler.dismiss) globalNotifyHandler.dismiss(id);
    }
};

export default notify;
