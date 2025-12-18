import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Bar, Doughnut } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const WorkoutAnalyticsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.workoutAnalytics);
            } catch (err) {
                setError('Failed to fetch workout analytics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <DetailPage title="Workout Analytics"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Workout Analytics"><div>{error}</div></DetailPage>;
    }

    if (!analyticsData) {
        return <DetailPage title="Workout Analytics"><div>No data available.</div></DetailPage>;
    }

    const doughnutChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#9ca3af',
                    padding: 20,
                }
            },
            title: { display: false },
        }
    };

    const workoutTypeData = {
        labels: Object.keys(analyticsData.workoutsByType || {}),
        datasets: [
            {
                data: Object.values(analyticsData.workoutsByType || {}),
                backgroundColor: [
                    'rgba(167, 139, 250, 0.7)',
                    'rgba(96, 165, 250, 0.7)',
                    'rgba(45, 212, 191, 0.7)',
                    'rgba(244, 114, 182, 0.7)',
                    'rgba(52, 211, 153, 0.7)',
                ],
                borderColor: [
                    '#a78bfa',
                    '#60a5fa',
                    '#2dd4bf',
                    '#f472b6',
                    '#34d399',
                ],
                borderWidth: 1,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        },
    };

    const weeklyTrendData = {
        labels: Object.keys(analyticsData.weeklyTrend || {}),
        datasets: [
            {
                label: 'Workout Duration (minutes)',
                data: Object.values(analyticsData.weeklyTrend || {}),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <DetailPage title="Workout Analytics">
            <div className="detailed-analytics-grid">
                <div className="detailed-analytics-card">
                    <h3>Summary</h3>
                    <p>Total Workouts: {analyticsData.totalWorkouts}</p>
                    <p>Total Duration: {analyticsData.totalDuration.toFixed(0)} minutes</p>
                    <p>Average Duration: {analyticsData.avgDuration.toFixed(0)} minutes</p>
                </div>
                <div className="detailed-analytics-card">
                    <h3>Workout Distribution</h3>
                    <Doughnut options={doughnutChartOptions} data={workoutTypeData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Workout Duration Trend (Last 7 Days)</h3>
                    <Bar options={barChartOptions} data={weeklyTrendData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Personalized Tips</h3>
                    <ul>
                        <li>Great job on your consistency! To maximize results, try to incorporate at least 2-3 different types of workouts each week.</li>
                        <li>Your average workout duration is healthy. Consider adding a 5-10 minute cool-down with stretching to improve flexibility and reduce muscle soreness.</li>
                    </ul>
                </div>
            </div>
        </DetailPage>
    );
};

export default WorkoutAnalyticsDetail;
