import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import apiClient from '../../api/apiClient';
import './GoalProgress.css';

const GoalProgress = ({ data, onGoalSet }) => {
    const [targetWeight, setTargetWeight] = useState('');
    const [error, setError] = useState('');

    const handleSetGoal = async (e) => {
        e.preventDefault();
        if (!targetWeight || isNaN(targetWeight) || targetWeight <= 0) {
            setError('Please enter a valid target weight.');
            return;
        }
        try {
            await apiClient.put('/users/me/target-weight', { targetWeightKg: parseFloat(targetWeight) }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if(onGoalSet) onGoalSet(); // Callback to refresh analytics
        } catch (err) {
            console.error('Error setting goal:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Failed to set goal. Please try again.');
        }
    };

    if (!data || !data.targetValue) {
        return (
            <div className="goal-setup-container">
                <h3>Set a Weight Goal</h3>
                <p>Enter your target weight to get started.</p>
                <form onSubmit={handleSetGoal} className="goal-setup-form">
                    <input 
                        type="number" 
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        placeholder="Target Weight (kg)"
                        className="goal-setup-input"
                    />
                    <button type="submit" className="goal-setup-button">Set Goal</button>
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

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    const chartData = {
        labels: Object.keys(weeklyProgressTrend || {}),
        datasets: [
            {
                label: 'Progress Trend',
                data: Object.values(weeklyProgressTrend || {}),
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                fill: true,
                tension: 0.4,
            },
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
                    <div className="stat-value">{currentValue.toFixed(1)} {unit}</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Target</div>
                    <div className="stat-value">{targetValue.toFixed(1)} {unit}</div>
                </div>
            </div>

            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Progress Trend</h4>
                <Line options={chartOptions} data={chartData} />
            </div>

            <div style={{ marginTop: '1rem' }}>
                <p className="small" style={{ marginBottom: '4px' }}><strong>Status:</strong> <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>{status}</span></p>
                <p className="small"><strong>Recommendation:</strong> {recommendation}</p>
            </div>
        </div>
    );
};

export default GoalProgress;
