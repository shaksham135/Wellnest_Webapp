import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Line } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const GoalProgressDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.goalProgress);
            } catch (err) {
                setError('Failed to fetch goal progress data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <DetailPage title="Goal Progress"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Goal Progress"><div>{error}</div></DetailPage>;
    }

    if (!analyticsData) {
        return <DetailPage title="Goal Progress"><div>No goal set.</div></DetailPage>;
    }

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        },
    };

    const chartData = {
        labels: Object.keys(analyticsData.weeklyProgressTrend || {}),
        datasets: [
            {
                label: 'Progress Trend',
                data: Object.values(analyticsData.weeklyProgressTrend || {}),
                borderColor: '#a78bfa',
                backgroundColor: 'rgba(167, 139, 250, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    return (
        <DetailPage title="Goal Progress">
            <div className="detailed-analytics-grid">
                <div className="detailed-analytics-card">
                    <h3>{analyticsData.goalType.replace('_', ' ')}</h3>
                    <p>Current: {analyticsData.currentValue.toFixed(1)} {analyticsData.unit}</p>
                    <p>Target: {analyticsData.targetValue.toFixed(1)} {analyticsData.unit}</p>
                    <p>Status: <span style={{ color: analyticsData.status === 'On Track' ? '#34d399' : analyticsData.status === 'Needs Improvement' ? '#f59e0b' : '#ef4444' }}>{analyticsData.status}</span></p>
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Weekly Progress Trend</h3>
                    <Line options={chartOptions} data={chartData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Personalized Tips</h3>
                    <p>{analyticsData.recommendation}</p>
                </div>
            </div>
        </DetailPage>
    );
};

export default GoalProgressDetail;
