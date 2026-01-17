import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Line } from 'react-chartjs-2';
import './DetailedAnalytics.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

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

    const { targetValue, weeklyProgressTrend } = analyticsData;
    const historyValues = Object.values(weeklyProgressTrend || {});
    // Calculate min/max for better scaling
    const allValues = [...historyValues, targetValue];
    const minValue = Math.min(...allValues) - 2;
    const maxValue = Math.max(...allValues) + 2;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { color: '#9ca3af', font: { size: 12 } }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: 'rgba(75, 85, 99, 0.4)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                min: Math.floor(minValue),
                suggestedMax: Math.ceil(maxValue)
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    const chartData = {
        labels: Object.keys(weeklyProgressTrend || {}),
        datasets: [
            {
                label: 'Weight Trend',
                data: historyValues,
                borderColor: '#8b5cf6', // Violet
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
                    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8b5cf6',
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 3
            },
            {
                label: 'Target Goal',
                data: Array(historyValues.length).fill(targetValue),
                borderColor: '#10b981', // Emerald
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0
            }
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
