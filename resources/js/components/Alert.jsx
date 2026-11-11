import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Alert({ type = 'success', message, onClose }) {
    if (!message) return null;

    const isSuccess = type === 'success';

    return (
        <div className={`alert-banner ${isSuccess ? 'success' : 'danger'}`}>
            {isSuccess ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div style={{ flex: 1 }}>{message}</div>
            {onClose && (
                <button 
                    onClick={onClose} 
                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}
