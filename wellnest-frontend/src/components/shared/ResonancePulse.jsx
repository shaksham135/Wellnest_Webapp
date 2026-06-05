import React, { useEffect, useState } from 'react';
import { FiZap } from 'react-icons/fi';

const ResonancePulse = ({ score, insight, category, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500);
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const getCategoryColor = () => {
        switch (category?.toLowerCase()) {
            case 'peak': return '#5eead4';
            case 'optimal': return '#3b82f6';
            case 'neutral': return '#94a3b8';
            case 'low': return '#ef4444';
            default: return '#5eead4';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: `translate(-50%, ${visible ? '0' : '100px'})`,
            opacity: visible ? 1 : 0,
            zIndex: 10000,
            width: '90%',
            maxWidth: '400px',
            transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: '24px',
                padding: '24px',
                border: `1px solid ${getCategoryColor()}40`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${getCategoryColor()}20`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: `${getCategoryColor()}20`, color: getCategoryColor(),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                        }}>
                            <FiZap />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Neural Resonance</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{category}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: getCategoryColor() }}>{score}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Score</div>
                    </div>
                </div>

                <div style={{ 
                    padding: '12px 16px', background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '12px', fontSize: '14px', color: '#e2e8f0', 
                    lineHeight: '1.5', borderLeft: `3px solid ${getCategoryColor()}`
                }}>
                    {insight}
                </div>

                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${score}%`, height: '100%', 
                        background: `linear-gradient(90deg, ${getCategoryColor()}, #fff)`,
                        transition: 'width 1s ease-out'
                    }} />
                </div>
            </div>
        </div>
    );
};

export default ResonancePulse;
