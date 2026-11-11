import React from 'react';

/**
 * Ayala National High School Official Chibi Mascot Component
 * Features the official ANHS Mascot dressed in Royal Blue blazer uniform with gold accents.
 */
export default function AnimeMascot({
    size = 58,
    className = '',
    style = {},
    interactive = false,
    onClick = null,
    title = 'Aoi • Ayala NHS Mascot',
    state = 'idle',
    showBadge = false,
    ...props
}) {
    return (
        <div 
            className={`anhs-mascot-wrapper mascot-breathe ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                cursor: interactive ? 'pointer' : 'default',
                flexShrink: 0,
                ...style
            }}
            onClick={onClick}
            title={title}
            role="img"
            aria-label="Ayala National High School Chibi Mascot"
        >
            <img 
                src="/assets/mascot/anhs-mascot.jpg" 
                alt="Ayala NHS Mascot"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    filter: 'drop-shadow(0 4px 8px rgba(15, 39, 68, 0.16))',
                    pointerEvents: 'none'
                }}
            />
            {showBadge && (
                <span 
                    style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        backgroundColor: '#D97706',
                        color: '#FFFFFF',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '1px 5px',
                        borderRadius: '9999px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                >
                    ANHS
                </span>
            )}
        </div>
    );
}
