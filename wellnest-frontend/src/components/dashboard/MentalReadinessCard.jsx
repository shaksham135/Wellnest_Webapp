import React from 'react';
import { useData } from '../../context/DataContext';
import { FiCpu, FiTrendingUp, FiActivity, FiZap } from 'react-icons/fi';
import './MentalReadinessCard.css';

const MentalReadinessCard = () => {
    const { latestMentalState, isMentalSyncing } = useData();

    if (isMentalSyncing) {
        return (
            <div className="stats-box cognitive-card syncing">
                <div className="sync-overlay">
                    <div className="neural-pulse"></div>
                    <h3>AI ANALYZING CLARITY...</h3>
                    <p>Fusing neural biomarkers with performance pulse</p>
                </div>
            </div>
        );
    }

    if (!latestMentalState || !latestMentalState.state) {
        return (
            <div className="stats-box cognitive-card empty">
                <div className="card-header">
                    <FiCpu className="icon" />
                    <h3>Mental Readiness</h3>
                </div>
                <div className="empty-state">
                    <p>Perform a 10s <strong>Clarity Scan</strong> above to generate your Neural Report. 🛡️</p>
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
        </div>
    );
};

export default MentalReadinessCard;
