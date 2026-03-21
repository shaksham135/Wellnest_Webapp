import React, { useState, useEffect, useRef } from 'react';
import { FiRefreshCw } from 'react-icons/fi';

const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef(null);
    const touchStartRef = useRef(0);
    const pullingRef = useRef(false);

    const pullThreshold = 80; // Distance to trigger refresh

    const handleStart = (pageY) => {
        if (disabled || isRefreshing || window.scrollY > 5) return; // Buffer for small scrolls
        touchStartRef.current = pageY;
        pullingRef.current = true;
    };

    const handleMove = (pageY, e) => {
        if (!pullingRef.current) return;
        
        const diff = pageY - touchStartRef.current;
        
        if (diff > 0) {
            // Add some resistance
            const dampenedDiff = Math.pow(diff, 0.85);
            setPullDistance(dampenedDiff);
            
            // Prevent scrolling when pulling past a small deadzone
            if (diff > 5 && e.cancelable) {
                e.preventDefault();
            }
        } else {
            // If they pull up, cancel the pull
            setPullDistance(0);
        }
    };

    const handleEnd = async () => {
        if (!pullingRef.current) return;
        pullingRef.current = false;

        if (pullDistance > pullThreshold) {
            setIsRefreshing(true);
            setPullDistance(pullThreshold);
            try {
                await onRefresh();
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 300); // Small delay for smooth feel
            }
        } else {
            setPullDistance(0);
        }
    };

    useEffect(() => {
        const target = containerRef.current;
        if (!target) return;

        // Touch Events
        const onTouchStart = (e) => handleStart(e.touches[0].pageY);
        const onTouchMove = (e) => handleMove(e.touches[0].pageY, e);
        
        // Mouse Events (for Desktop testing)
        const onMouseDown = (e) => handleStart(e.pageY);
        const onMouseMove = (e) => {
            if (e.buttons === 1) handleMove(e.pageY, e); // Only if left mouse button is held
            else pullingRef.current = false; // Reset if button released elsewhere
        };
        const onMouseUp = () => handleEnd();

        target.addEventListener('touchstart', onTouchStart, { passive: true });
        target.addEventListener('touchmove', onTouchMove, { passive: false });
        target.addEventListener('touchend', handleEnd);
        
        target.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            target.removeEventListener('touchstart', onTouchStart);
            target.removeEventListener('touchmove', onTouchMove);
            target.removeEventListener('touchend', handleEnd);

            target.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [pullDistance, isRefreshing, disabled, onRefresh]);

    return (
        <div ref={containerRef} style={{ position: 'relative', minHeight: '100%' }}>
            {/* Pull Indicator */}
            <div style={{
                position: 'absolute',
                top: `${pullDistance - 50}px`,
                left: 0,
                right: 0,
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: Math.min(pullDistance / pullThreshold, 1),
                transition: pullingRef.current ? 'none' : 'top 0.3s ease, opacity 0.3s ease',
                zIndex: 10,
                pointerEvents: 'none'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--card-border)',
                    transform: `rotate(${pullDistance * 2}deg)`
                }}>
                    <FiRefreshCw 
                        style={{ 
                            color: 'var(--primary)',
                            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                        }} 
                    />
                </div>
            </div>

            {/* Content Container */}
            <div style={{
                transform: `translateY(${pullDistance}px)`,
                transition: pullingRef.current ? 'none' : 'transform 0.3s ease'
            }}>
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
