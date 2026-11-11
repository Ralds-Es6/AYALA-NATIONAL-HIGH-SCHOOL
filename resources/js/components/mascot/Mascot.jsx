import React from 'react';
import AnimeMascot from './AnimeMascot';

/**
 * Mascot Component (Alias to AnimeMascot)
 * Maintains backward compatibility while delegating to the rigged 2D anime character engine.
 */
export default function Mascot({ 
    state = 'idle', 
    size = 64, 
    className = '',
    style = {},
    showIndicator = true,
    ...props
}) {
    return (
        <AnimeMascot
            status={state}
            size={size}
            className={className}
            style={style}
            showBadge={showIndicator}
            {...props}
        />
    );
}
