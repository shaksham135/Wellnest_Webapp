import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Line } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const ActivityAnalyticsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.dailyActivityAnalytics);
            } catch (err) {
                setError('Failed to fetch activity analytics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) return <DetailPage title="Activity Analytics"><div>Loading...</div></DetailPage>;
    if (error) return <DetailPage title="Activity Analytics"><div>{error}</div></DetailPage>;
    if (!analyticsData) return <DetailPage title="Activity Analytics"><div>No data available.</div></DetailPage>;

    const createChartOptions = (yTitle, color) => ({
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
            y: {
                type: 'linear', display: true, position: 'left',
                title: { display: true, text: yTitle, color: color },
                ticks: { color: color },
                grid: { color: 'rgba(148, 163, 184, 0.15)' }
            }
        }
    });

    const labels = Object.keys(analyticsData.weeklyStepsTrend || {});

    const stepsData = {
        labels,
        datasets: [{
            label: 'Steps',
            data: Object.values(analyticsData.weeklyStepsTrend || {}),
            borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.2)', fill: true, tension: 0.4,
        }],
    };

    const caloriesData = {
        labels,
        datasets: [{
            label: 'Active Calories',
            data: Object.values(analyticsData.weeklyCaloriesTrend || {}),
            borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: true, tension: 0.4,
        }],
    };

    const distanceData = {
        labels,
        datasets: [{
            label: 'Distance (km)',
            data: Object.values(analyticsData.weeklyDistanceTrend || {}),
            borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.2)', fill: true, tension: 0.4,
        }],
    };

    return (
        <DetailPage title="Daily Activity Analytics">
            <div className="detailed-analytics-grid">
                
                <div className="detailed-analytics-card full-width" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Average Steps</h4>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{Math.round(analyticsData.avgDailySteps).toLocaleString()}</div>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Average Cals</h4>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{Math.round(analyticsData.avgDailyCalories).toLocaleString()} kcal</div>
                    </div>
                    <div>
                        <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Average Dist</h4>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>{analyticsData.avgDailyDistance.toFixed(2)} km</div>
                    </div>
                </div>

                <div className="detailed-analytics-card">
                    <h3>Steps Trend</h3>
                    <Line options={createChartOptions('Steps', '#f59e0b')} data={stepsData} />
                </div>

                <div className="detailed-analytics-card">
                    <h3>Calories Trend</h3>
                    <Line options={createChartOptions('Calories', '#ef4444')} data={caloriesData} />
                </div>

                <div className="detailed-analytics-card">
                    <h3>Distance Trend</h3>
                    <Line options={createChartOptions('Distance (km)', '#06b6d4')} data={distanceData} />
                </div>

                <div className="detailed-analytics-card full-width">
                    <h3>Goal Achievement</h3>
                    <ul>
                        <li><b>Steps:</b> You hit your goal on {analyticsData.daysMetStepsGoal} days this week.</li>
                        <li><b>Calories:</b> Goal reached on {analyticsData.daysMetCaloriesGoal} days.</li>
                        <li><b>Distance:</b> Target completed on {analyticsData.daysMetDistanceGoal} days.</li>
                    </ul>
                    <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        To edit these goals, visit the "Activity" tab on the Health Trackers page.
                    </p>
                </div>
            </div>
        </DetailPage>
    );
};

export default ActivityAnalyticsDetail;
