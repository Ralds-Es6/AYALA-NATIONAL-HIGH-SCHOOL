import React from 'react';

export default function LoadingSpinner({ text = 'Loading data...' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '1rem' }}>
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{text}</p>
        </div>
    );
}
