import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Line } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const SleepAnalyticsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.sleepAnalytics);
            } catch (err) {
                setError('Failed to fetch sleep analytics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <DetailPage title="Sleep Analytics"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Sleep Analytics"><div>{error}</div></DetailPage>;
    }

    if (!analyticsData) {
        return <DetailPage title="Sleep Analytics"><div>No data available.</div></DetailPage>;
    }

    const chartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { 
                position: 'bottom',
                labels: { color: '#9ca3af' }
            },
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Duration (h)', color: '#a78bfa' },
                ticks: { color: '#a78bfa' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Quality (1-5)', color: '#f472b6' },
                ticks: { color: '#f472b6' },
                grid: { drawOnChartArea: false },
                min: 1,
                max: 5
            }
        }
    };

    const chartData = {
        labels: Object.keys(analyticsData.weeklySleepTrend || {}),
        datasets: [
            {
                label: 'Duration (hours)',
                data: Object.values(analyticsData.weeklySleepTrend || {}),
                borderColor: 'rgba(167, 139, 250, 1)',
                backgroundColor: 'rgba(167, 139, 250, 0.2)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Quality (1-5)',
                data: Object.values(analyticsData.weeklyQualityTrend || {}),
                borderColor: '#f472b6',
                backgroundColor: 'rgba(244, 114, 182, 0.2)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ],
    };

    return (
        <DetailPage title="Sleep Analytics">
            <div className="detailed-analytics-grid">
                <div className="detailed-analytics-card">
                    <h3>Averages</h3>
                    <p>Average Duration: {analyticsData.avgSleepDuration.toFixed(1)} hours</p>
                    <p>Average Quality: {analyticsData.avgSleepQuality.toFixed(1)} / 5</p>
                    <p>Sleep Consistency: {analyticsData.sleepConsistency}</p>
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Weekly Sleep Trend</h3>
                    <Line options={chartOptions} data={chartData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Personalized Tips</h3>
                    <ul>
                        <li>Your sleep consistency is fair. Try to go to bed and wake up around the same time each day, even on weekends, to improve your circadian rhythm.</li>
                        <li>To improve sleep quality, avoid screens (phones, TVs, computers) for at least an hour before bed. The blue light can interfere with melatonin production.</li>
                    </ul>
                </div>
            </div>
        </DetailPage>
    );
};

export default SleepAnalyticsDetail;
