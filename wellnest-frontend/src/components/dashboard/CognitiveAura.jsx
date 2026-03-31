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
    const size = 60 + (reserve / 10); // Aura grows with clarity

    return (
        <div className="cognitive-aura-container">
            <svg width="80" height="80" viewBox="0 0 100 100">
                <defs>
                    <radialGradient id="auraGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </radialGradient>
                    <filter id="neuralGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Pulsing Aura Background */}
                <circle
                    cx="50"
                    cy="50"
                    r={size / 2}
                    fill="url(#auraGradient)"
                    className="neural-pulse"
                />

                {/* Abstract Brain/Neural Network Shape */}
                <g filter="url(#neuralGlow)" opacity="0.8">
                    <path
                        d="M50 30 C65 30 75 40 75 55 C75 70 65 80 50 80 C35 80 25 70 25 55 C25 40 35 30 50 30 Z"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        className="neural-spin"
                    />
                    <path
                        d="M40 40 Q50 35 60 40 T60 70"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        opacity="0.6"
                    />
                    <circle cx="50" cy="55" r="4" fill={color} />
                    <circle cx="35" cy="50" r="2" fill={color} opacity="0.5" />
                    <circle cx="65" cy="50" r="2" fill={color} opacity="0.5" />
                </g>
            </svg>
            <div className="reserve-label" style={{ color: color }}>
                {reserve}%
            </div>
        </div>
    );
};

export default CognitiveAura;
