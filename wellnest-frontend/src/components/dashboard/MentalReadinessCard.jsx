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

    if (!latestMentalState || !latestMentalState.focusScore) {
        return (
            <div className="stats-box cognitive-card empty" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '20px' }}>
                <div className="card-header" style={{ position: 'absolute', top: '24px', left: '24px' }}>
                    <FiCpu className="icon" />
                    <h3>Mental Readiness</h3>
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

            <div className="metrics-grid">
                <div className="metric-item">
                    <div className="metric-label">
                        <FiZap /> Focus
                    </div>
                    <div className="metric-bar">
                        <div className="bar-fill focus" style={{ width: `${state.focusScore * 10}%` }}></div>
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">
                        <FiActivity /> Stress
                    </div>
                    <div className="metric-bar">
                        <div className="bar-fill stress" style={{ width: `${state.stressScore * 10}%` }}></div>
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">
                        <FiTrendingUp /> Mood
                    </div>
                    <div className="metric-bar">
                        <div className="bar-fill mood" style={{ width: `${state.moodScore * 10}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="ai-directive">
                <strong>AI COMMAND:</strong> {state.note || 'Neural patterns are optimal. Proceed with your high-intensity block.'}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <VoiceScanButton onScanComplete={submitVoiceScan} mode="scan" />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: 600, alignSelf: 'center' }}>RECALIBRATE NEURAL PATTERNS</span>
            </div>
        </div>
    );
};

export default MentalReadinessCard;
