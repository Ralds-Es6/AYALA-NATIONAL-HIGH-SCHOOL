import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', count = 1 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div 
                    key={i} 
                    style={{
                        width,
                        height,
                        borderRadius,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                />
            ))}
        </div>
    );
}
