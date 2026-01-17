import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fetchCurrentUser, updateUserProfile } from '../../api/userApi';
import apiClient from '../../api/apiClient';
import './GoalProgress.css';

const GoalProgress = ({ data, onGoalSet }) => {
    const [targetWeight, setTargetWeight] = useState('');
    const [targetGoalType, setTargetGoalType] = useState('WEIGHT_LOSS');
    const [error, setError] = useState('');
    const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
    const [newCurrentWeight, setNewCurrentWeight] = useState('');

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
            <div className="goal-setup-container">
                <h3>Set a Weight Goal</h3>
                <p>Enter your target weight to get started.</p>
                <form onSubmit={handleSetGoal} className="goal-setup-form">
                    <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
                        <select
                            value={targetGoalType}
                            onChange={(e) => setTargetGoalType(e.target.value)}
                            className="goal-setup-input"
                            style={{ flex: 1 }}
                        >
                            <option value="WEIGHT_LOSS">Lose Weight</option>
                            <option value="MUSCLE_GAIN">Gain Muscle</option>
                        </select>
                        <input
                            type="number"
                            value={targetWeight}
                            onChange={(e) => setTargetWeight(e.target.value)}
                            placeholder="Target Weight (kg)"
                            className="goal-setup-input"
                            style={{ flex: 1 }}
                        />
                    </div>
                    <button type="submit" className="goal-setup-button">Set Goal</button>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                        * This will update your profile's fitness goal.
                    </p>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        );
    }

    const { goalType, currentValue, targetValue, unit, percentageComplete, status, recommendation, weeklyProgressTrend } = data;

    const getStatusColor = () => {
        if (status === 'On Track') return '#34d399'; // green
        if (status === 'Needs Improvement') return '#f59e0b'; // amber
        if (status === 'At Risk') return '#ef4444'; // red
        return '#9ca3af'; // grey
    };

    const historyValues = Object.values(weeklyProgressTrend || {});
    const allValues = [...historyValues, targetValue];
    const minValue = Math.min(...allValues) - 2;
    const maxValue = Math.max(...allValues) + 2;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db'
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af', font: { size: 10 } },
                grid: { color: 'rgba(148, 163, 184, 0.05)' }
            },
            y: {
                ticks: { color: '#9ca3af', font: { size: 10 }, maxTicksLimit: 5 },
                grid: { color: 'rgba(148, 163, 184, 0.05)' },
                min: Math.floor(minValue),
                suggestedMax: Math.ceil(maxValue)
            }
        },
        elements: {
            point: {
                radius: 3,
                hoverRadius: 5
            }
        }
    };

    const chartData = {
        labels: Object.keys(weeklyProgressTrend || {}),
        datasets: [
            {
                label: 'Weight',
                data: historyValues,
                borderColor: '#8b5cf6',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
                    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                borderWidth: 2
            },
            {
                label: 'Target',
                data: Array(historyValues.length).fill(targetValue),
                borderColor: '#10b981', // Green target line
                borderWidth: 1.5,
                borderDash: [4, 4],
                pointRadius: 0,
                fill: false,
                tension: 0
            }
        ],
    };

    return (
        <div className="goal-analytics-container">
            <h3>{goalType ? goalType.replace('_', ' ') : 'Goal Progress'}</h3>

            <div className="goal-row" style={{ marginTop: '1rem' }}>
                <div className="goal-label">Progress</div>
                <div className="goal-progress">
                    <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${percentageComplete}%` }} /></div>
                    <div className="goal-meta">{percentageComplete}%</div>
                </div>
            </div>

            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Current</div>
                    {isUpdatingWeight ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <input
                                type="number"
                                value={newCurrentWeight}
                                onChange={(e) => setNewCurrentWeight(e.target.value)}
                                style={{ width: '60px', padding: '2px', fontSize: '12px' }}
                                placeholder="kg"
                            />
                            <button onClick={handleUpdateWeight} style={{ padding: '2px 5px', fontSize: '10px', background: '#34d399', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>✓</button>
                            <button onClick={() => setIsUpdatingWeight(false)} style={{ padding: '2px 5px', fontSize: '10px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>✕</button>
                        </div>
                    ) : (
                        <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {currentValue.toFixed(1)} {unit}
                            <button
                                onClick={() => setIsUpdatingWeight(true)}
                                style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '4px',
                                    color: '#cbd5e1',
                                    cursor: 'pointer'
                                }}
                            >
                                Update
                            </button>
                        </div>
                    )}
                </div>
                <div className="stat">
                    <div className="stat-label">Target</div>
                    <div className="stat-value">{targetValue.toFixed(1)} {unit}</div>
                </div>
            </div>

            <div className="chart-container" style={{ marginTop: '1.5rem', height: '250px', position: 'relative' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Progress Trend</h4>
                <Line options={chartOptions} data={chartData} />
            </div>

            <div style={{ marginTop: '1rem' }}>
                <p className="small" style={{ marginBottom: '4px' }}><strong>Status:</strong> <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>{status}</span></p>
                <p className="small"><strong>Recommendation:</strong> {recommendation}</p>
                {error && <p className="error-message" style={{ fontSize: '12px', marginTop: '5px' }}>{error}</p>}
            </div>
        </div>
    );
};

export default GoalProgress;
