import React from 'react';
import { useData } from '../../context/DataContext';
import { FiCpu, FiTrendingUp, FiActivity, FiZap } from 'react-icons/fi';
import VoiceScanButton from './VoiceScanButton';
import './MentalReadinessCard.css';

const MentalReadinessCard = () => {
    const { latestMentalState, isMentalSyncing, submitVoiceScan } = useData();

    if (isMentalSyncing) {
        return (
            <div className="stats-box cognitive-card syncing" style={{ minHeight: '300px' }}>
                <div className="sync-overlay">
                    <div className="neural-pulse"></div>
                    <h3>AI ANALYZING CLARITY...</h3>
                    <p>Fusing neural biomarkers with performance pulse</p>
                </div>
            </div>
        );
    }

    if (!latestMentalState || !latestMentalState.state || !latestMentalState.state.focusScore) {
        return (
            <div className="stats-box cognitive-card empty" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '20px' }}>
                <div className="card-header" style={{ padding: '24px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiCpu className="icon" style={{ fontSize: '20px', color: 'var(--primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Mental Readiness</h3>
                </div>
                
                <VoiceScanButton onScanComplete={submitVoiceScan} mode="scan" />
                
                <div className="empty-state" style={{ padding: '0 20px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '240px' }}>
                        Perform a 10s <strong>Neural Scan</strong> to analyze your focus, stress, and mood biomarkers.
                    </p>
                </div>
            </div>
        );
    }

    const { state, reserve } = latestMentalState;

    return (
        <div className="stats-box cognitive-card result">
            <div className="card-header">
                <div className="header-left">
                    <FiCpu className="icon" />
                    <h3>Neural Report</h3>
                </div>
                <div className="sentiment-badge">
                    {state.sentiment || 'ANALYZED'}
                </div>
            </div>

            <div className="reserve-section">
                <div className="reserve-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className="circle"
                            strokeDasharray={`${reserve}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{reserve}%</text>
                    </svg>
                </div>
                <div className="reserve-info">
                    <h4>Cognitive Reserve</h4>
                    <p>Current brainpower available for physical focus.</p>
                </div>
            </div>

            <div className="metrics-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                gap: '16px',
                marginTop: '24px'
            }}>
                {[
                    { label: 'Focus', icon: <FiZap />, val: state.focusScore, color: 'var(--primary)', class: 'focus' },
                    { label: 'Stress', icon: <FiActivity />, val: state.stressScore, color: '#f43f5e', class: 'stress' },
                    { label: 'Mood', icon: <FiTrendingUp />, val: state.moodScore, color: '#a78bfa', class: 'mood' }
                ].map((m, i) => (
                    <div key={i} className="metric-glass-item" style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '12px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {m.icon} {m.label}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                            {m.val}/10
                        </div>
                        <div className="metric-bar" style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div className={`bar-fill ${m.class}`} style={{ width: `${m.val * 10}%`, height: '100%', background: m.color, borderRadius: '2px' }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="ai-directive" style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(94, 234, 212, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(94, 234, 212, 0.1)',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--text-main)'
            }}>
                <span style={{ fontWeight: 900, color: 'var(--primary)', marginRight: '8px' }}>AI DIRECTIVE:</span> 
                {state.note || 'Neural patterns are optimal. Proceed with your high-intensity block.'}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <VoiceScanButton onScanComplete={submitVoiceScan} mode="scan" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: 600, alignSelf: 'center' }}>RECALIBRATE NEURAL PATTERNS</span>
            </div>
        </div>
    );
};

export default MentalReadinessCard;
