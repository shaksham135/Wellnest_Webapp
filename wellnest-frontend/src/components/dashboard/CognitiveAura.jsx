import React from 'react';
import './CognitiveAura.css';

const CognitiveAura = ({ reserve }) => {
    // 0-100 reserve
    const getColor = (r) => {
        if (r >= 80) return '#14b8a6'; // Electric Teal (Peak Focus)
        if (r >= 50) return '#6366f1'; // Deep Indigo (Stable)
        return '#f59e0b';             // Radiant Amber (Stressed/Taxed)
    };

    const color = getColor(reserve);

    return (
        <div className="cognitive-aura-container">
            <svg width="80" height="80" viewBox="0 0 100 100">
                <defs>
                    <filter id="energyGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Outer Energy Ring (Track) */}
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="8"
                />

                {/* Segmented Energy Bar */}
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={`${reserve * 2.51} 251.2`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="energy-fill-pulse"
                    filter="url(#energyGlow)"
                    transform="rotate(-90 50 50)"
                />

                {/* Experimental Neural Pulse Waves */}
                <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.2"
                    className="neural-wave-one"
                />
            </svg>
            <div className="reserve-label-central" style={{ 
                color: color,
                textShadow: `0 0 10px ${color}`
            }}>
                {reserve}<span style={{ fontSize: '8px', opacity: 0.8 }}>%</span>
            </div>
        </div>
    );
};

export default CognitiveAura;
