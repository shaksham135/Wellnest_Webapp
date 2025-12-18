import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Bar } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const WaterIntakeAnalyticsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.waterIntakeAnalytics);
            } catch (err) {
                setError('Failed to fetch water intake analytics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <DetailPage title="Water Intake Analytics"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Water Intake Analytics"><div>{error}</div></DetailPage>;
    }

    if (!analyticsData) {
        return <DetailPage title="Water Intake Analytics"><div>No data available.</div></DetailPage>;
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            annotation: {
                annotations: {
                    goalLine: {
                        type: 'line',
                        yMin: analyticsData.targetDailyIntake,
                        yMax: analyticsData.targetDailyIntake,
                        borderColor: '#34d399',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            content: `Goal: ${analyticsData.targetDailyIntake} ml`,
                            enabled: true,
                            position: 'end',
                            backgroundColor: 'rgba(52, 211, 153, 0.8)',
                            font: { size: 10 },
                            color: '#ffffff',
                        }
                    }
                }
            }
        },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        },
    };

    const chartData = {
        labels: Object.keys(analyticsData.weeklyIntakeTrend || {}),
        datasets: [
            {
                label: 'Water Intake (ml)',
                data: Object.values(analyticsData.weeklyIntakeTrend || {}),
                backgroundColor: 'rgba(96, 165, 250, 0.7)',
                borderColor: '#60a5fa',
                borderWidth: 1,
            },
        ],
    };

    return (
        <DetailPage title="Water Intake Analytics">
            <div className="detailed-analytics-grid">
                <div className="detailed-analytics-card">
                    <h3>Summary</h3>
                    <p>Average Daily Intake: {analyticsData.avgDailyIntake.toFixed(0)} ml</p>
                    <p>Daily Goal: {analyticsData.targetDailyIntake} ml</p>
                    <p>Days Goal Met: {analyticsData.daysMetGoal}</p>
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Weekly Intake Trend</h3>
                    <Bar options={chartOptions} data={chartData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Personalized Tips</h3>
                    <ul>
                        <li>You're doing a great job of staying hydrated! To make it even easier, try carrying a reusable water bottle with you throughout the day.</li>
                        <li>If you find it hard to drink plain water, try infusing it with fruits like lemon, cucumber, or berries for a natural flavor boost.</li>
                    </ul>
                </div>
            </div>
        </DetailPage>
    );
};

export default WaterIntakeAnalyticsDetail;
