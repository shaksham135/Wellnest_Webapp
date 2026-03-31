import React from 'react';
import './EnergyCrystal.css';

const EnergyCrystal = ({ energy, status }) => {
    // 0-100 energy
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (energy / 100) * circumference;

    const getColor = (s) => {
        switch (s) {
            case 'PEAK': return '#f59e0b'; // Radiant Gold
            case 'FLOW': return '#14b8a6'; // Electric Teal
            case 'RECOVERY': return '#6366f1'; // Deep Indigo
            case 'DIP': return '#ef4444'; // Alarm Red
            default: return '#8b5cf6';    // Stable Purple
        }
    };

    const color = getColor(status);

    return (
        <div className="energy-crystal-container">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                
                {/* Background Track */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="rgba(128,128,128,0.1)"
                    strokeWidth="6"
                    fill="none"
                />
                
                {/* Progress Ring */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#glow)"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 1s ease' }}
                />

                {/* Inner Glow Center */}
                <circle
                    cx="50"
                    cy="50"
                    r="28"
                    fill={color}
                    fillOpacity="0.1"
                    className="pulse-aura"
                />

                <text
                    x="50"
                    y="45"
                    textAnchor="middle"
                    fill="var(--text-main)"
                    fontSize="18"
                    fontWeight="900"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                    {energy}%
                </text>
                <text
                    x="50"
                    y="62"
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="8"
                    fontWeight="800"
                    letterSpacing="1"
                >
                    ENERGY
                </text>
            </svg>
        </div>
    );
};

export default EnergyCrystal;
