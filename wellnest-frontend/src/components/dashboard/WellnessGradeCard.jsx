import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const WellnessGradeCard = ({ score }) => {
    const getGrade = (s) => {
        if (s >= 90) return 'A+';
        if (s >= 80) return 'A';
        if (s >= 70) return 'B+';
        if (s >= 60) return 'B';
        if (s >= 50) return 'C';
        return 'D';
    };

    const getColor = (s) => {
        if (s >= 80) return 'var(--primary)'; // Mint
        if (s >= 60) return 'var(--secondary)'; // Purple
        return 'var(--accent-red)'; // Rose
    };

    const grade = getGrade(score);
    const color = getColor(score);

    return (
        <div className="card wellness-grade-card" style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: `linear-gradient(135deg, ${color}1a, transparent)`,
            cursor: 'pointer',
            minHeight: '180px',
            justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px' }}>
                    <CircularProgressbar
                        value={score}
                        text={grade}
                        styles={buildStyles({
                            pathColor: color,
                            textColor: 'var(--text-main)',
                            trailColor: 'rgba(255,255,255,0.05)',
                            textSize: '32px',
                            strokeLinecap: 'round'
                        })}
                    />
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-muted)', 
                        fontWeight: 900, 
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        Wellness Grade
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{score}%</div>
                </div>
            </div>

            <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Current Standing</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {score >= 80 ? '🏆 Elite Recovery' : score >= 60 ? '⚡ Balanced state' : '💤 Needs Focus'}
                </div>
            </div>
        </div>
    );
};

export default WellnessGradeCard;
