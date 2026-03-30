import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const ReadinessGauge = ({ score }) => {
    // Determine color based on score
    const getColor = (s) => {
        if (s > 80) return '#5eead4'; // Mint
        if (s > 50) return '#a78bfa'; // Purple
        return '#f43f5e'; // Rose
    };

    const color = getColor(score);

    return (
        <div className="readiness-hero card" style={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--card-bg)',
            borderRadius: '32px',
            border: '1px solid var(--card-border)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Pulsing Background Glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120px',
                height: '120px',
                background: color,
                filter: 'blur(80px)',
                opacity: 0.2,
                borderRadius: '50%',
                animation: 'pulse-glow 4s infinite ease-in-out'
            }}></div>

            <div style={{ 
                width: '100%', 
                maxWidth: '180px', 
                height: 'auto', 
                aspectRatio: '1',
                position: 'relative', 
                zIndex: 2 
            }}>
                <CircularProgressbar
                    value={score}
                    text={`${score}%`}
                    styles={buildStyles({
                        pathColor: color,
                        textColor: 'var(--text-main)',
                        trailColor: 'rgba(255,255,255,0.05)',
                        textSize: '24px',
                        pathTransitionDuration: 1.5,
                        strokeLinecap: 'round'
                    })}
                />
            </div>

            <div style={{ marginTop: '20px', position: 'relative', zIndex: 2 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-main)' }}>
                    Ready to Go
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {score > 80 ? 'Peak Physical State' : 'Balanced Recovery'}
                </p>
            </div>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
                    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default ReadinessGauge;
