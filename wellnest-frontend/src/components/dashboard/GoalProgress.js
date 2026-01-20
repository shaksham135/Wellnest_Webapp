import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchCurrentUser, updateUserProfile } from '../../api/userApi';
import apiClient from '../../api/apiClient';
import { FiEdit2, FiCheck, FiX, FiTarget, FiActivity } from 'react-icons/fi';
import './GoalProgress.css';

const GoalProgress = ({ data, onGoalSet }) => {
    const [targetWeight, setTargetWeight] = useState('');
    const [targetGoalType, setTargetGoalType] = useState('WEIGHT_LOSS');
    const [error, setError] = useState('');
    const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
    const [newCurrentWeight, setNewCurrentWeight] = useState('');

    const handleResetHistory = async () => {
        if (window.confirm("Are you sure? This will delete all past weight history and reset your progress calculation to start from today.")) {
            try {
                await apiClient.delete('/weight-logs');
                if (onGoalSet) onGoalSet(); // Refresh data
            } catch (err) {
                console.error("Error resetting history:", err);
                setError("Failed to reset history.");
            }
        }
    };

    const handleSetGoal = async (e) => {
        e.preventDefault();
        if (!targetWeight || isNaN(targetWeight) || targetWeight <= 0) {
            setError('Please enter a valid target weight.');
            return;
        }
        try {
            // 1. Fetch current user to get existing profile data
            const userRes = await fetchCurrentUser();
            const user = userRes.data;

            // 2. Prepare profile update (preserve existing fields, update fitnessGoal)
            const profileUpdate = {
                age: user.age,
                heightCm: user.heightCm,
                weightKg: user.weightKg,
                gender: user.gender,
                phone: user.phone,
                fitnessGoal: targetGoalType
            };

            // 3. Update Profile with new fitness goal
            await updateUserProfile(profileUpdate);

            // 4. Update Target Weight
            await apiClient.put('/users/me/target-weight', { targetWeightKg: parseFloat(targetWeight) }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (onGoalSet) onGoalSet(); // Callback to refresh analytics
        } catch (err) {
            console.error('Error setting goal:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to set goal. Please try again.');
        }
    };

    const handleUpdateWeight = async (e) => {
        e.preventDefault();
        if (!newCurrentWeight || isNaN(newCurrentWeight) || newCurrentWeight <= 0) {
            setError('Please enter a valid weight.');
            return;
        }

        try {
            await apiClient.post('/weight-logs', { weightKg: parseFloat(newCurrentWeight) });
            setIsUpdatingWeight(false);
            setNewCurrentWeight('');
            if (onGoalSet) onGoalSet(); // Refresh data
        } catch (err) {
            console.error('Error updating weight:', err);
            setError('Failed to update weight.');
        }
    };

    if (!data || !data.targetValue) {
        return (
            <div className="goal-setup-container" style={{ padding: '40px 20px' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#3b82f6', fontSize: '24px' }}>
                    <FiTarget />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Set Your Goal</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>define your target to start tracking progress.</p>
                <form onSubmit={handleSetGoal} className="goal-setup-form" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <select
                            value={targetGoalType}
                            onChange={(e) => setTargetGoalType(e.target.value)}
                            className="goal-setup-input"
                            style={{ flex: 1, background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
                        >
                            <option value="WEIGHT_LOSS">Lose Weight</option>
                            <option value="MUSCLE_GAIN">Gain Muscle</option>
                        </select>
                        <input
                            type="number"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            placeholder="Target (kg)"
                            className="goal-setup-input"
                            style={{ flex: 1, background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
                        />
                    </div>
                    <button type="submit" className="goal-setup-button" style={{ fontWeight: 600 }}>Start Tracking</button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        );
    }

    const { goalType, currentValue, targetValue, unit, percentageComplete, status, recommendation, weeklyProgressTrend } = data;

    const getStatusColor = () => {
        if (status === 'On Track') return '#10b981';
        if (status === 'Needs Improvement') return '#f59e0b';
        if (status === 'At Risk') return '#ef4444';
        return '#94a3b8';
    };

    const historyValues = Object.values(weeklyProgressTrend || {});
    const labels = Object.keys(weeklyProgressTrend || {});
    // Add current value to chart if it's the latest
    const chartLabels = [...labels];
    const chartDataValues = [...historyValues];

    // Chart Configuration
    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Weight',
                data: chartDataValues,
                borderColor: '#6366f1',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            },
            {
                label: 'Goal',
                data: Array(chartLabels.length).fill(targetValue),
                borderColor: '#10b981',
                borderDash: [5, 5],
                pointRadius: 0,
                borderWidth: 1,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
            }
        },
        scales: {
            x: { display: false },
            y: {
                display: true,
                border: { display: false },
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="goal-card-content p-6-responsive">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px', color: '#6366f1' }}>
                            <FiActivity />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {goalType ? goalType.replace('_', ' ').toLowerCase() : 'Goal Progress'}
                        </h3>
                    </div>
                </div>
                <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: `${getStatusColor()}20`,
                    color: getStatusColor(),
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: `1px solid ${getStatusColor()}40`
                }}>
                    {status}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Current Weight */}
                <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Weight</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        {isUpdatingWeight ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    value={newCurrentWeight}
                                    onChange={e => setNewCurrentWeight(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: '80px', background: 'var(--card-bg)', border: '1px solid var(--primary)',
                                        color: 'var(--text-main)', borderRadius: '6px', padding: '4px 8px', fontSize: '1.2rem', fontWeight: 700
                                    }}
                                />
                                <button onClick={handleUpdateWeight} className="icon-btn-small" style={{ color: '#10b981' }}><FiCheck /></button>
                                <button onClick={() => setIsUpdatingWeight(false)} className="icon-btn-small" style={{ color: '#ef4444' }}><FiX /></button>
                            </div>
                        ) : (
                            <>
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{currentValue}</span>
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>
                                <button
                                    onClick={() => setIsUpdatingWeight(true)}
                                    className="edit-weight-btn"
                                    title="Update Weight"
                                >
                                    <FiEdit2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Target Weight */}
                <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Goal</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{targetValue}</span>
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>
                    </div>
                </div>
            </div>

            {/* Reset History (Debug/Fix Tool) */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleResetHistory}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Reset Progress History
                </button>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{percentageComplete}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${Math.min(100, Math.max(0, percentageComplete))}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--primary), #818cf8)',
                        borderRadius: '4px',
                        transition: 'width 1s ease-out'
                    }}></div>
                </div>
            </div>

            {/* Chart Area */}
            <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                <Line data={chartData} options={chartOptions} />
            </div>

            {/* Recommendation Footer */}
            {recommendation && (
                <div style={{
                    marginTop: '20px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderLeft: '4px solid var(--primary)',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5'
                }}>
                    <strong>Tip:</strong> {recommendation}
                </div>
            )}

            <style>{`
                .edit-weight-btn {
                    margin-left: 8px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    opacity: 0.6;
                }
                .edit-weight-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: var(--primary);
                    opacity: 1;
                }
                .icon-btn-small {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    width: 28px; height: 28px;
                    border-radius: 6px;
                    display: flex; align-items: center; justifyContent: center;
                    cursor: pointer;
                }
                .icon-btn-small:hover {
                    background: rgba(255,255,255,0.2);
                }
            `}</style>
        </div>
    );
};

export default GoalProgress;
