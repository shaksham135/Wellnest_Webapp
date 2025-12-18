import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Doughnut } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const HealthMetricsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.healthMetrics);
            } catch (err) {
                setError('Failed to fetch health metrics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <DetailPage title="Health Metrics"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Health Metrics"><div>{error}</div></DetailPage>;
    }

    if (!analyticsData) {
        return <DetailPage title="Health Metrics"><div>No data available.</div></DetailPage>;
    }

    const bmiChartData = {
        labels: ['Underweight', 'Healthy', 'Overweight', 'Obesity'],
        datasets: [
            {
                data: [18.5, 6.5, 5, 5], // Ranges for BMI categories
                backgroundColor: ['#60a5fa', '#34d399', '#f59e0b', '#ef4444'],
                circumference: 180,
                rotation: 270,
                cutout: '70%',
            },
        ],
    };

    const bmiChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
    };

    return (
        <DetailPage title="Health Metrics">
            <div className="detailed-analytics-grid">
                <div className="detailed-analytics-card">
                    <h3>Body Mass Index (BMI)</h3>
                    <p>Your BMI: {analyticsData.bmi.toFixed(1)}</p>
                    <p>Category: <span style={{ color: analyticsData.bmiCategory === 'Healthy Weight' ? '#10b981' : analyticsData.bmiCategory === 'Underweight' || analyticsData.bmiCategory === 'Overweight' ? '#f59e0b' : '#ef4444' }}>{analyticsData.bmiCategory}</span></p>
                </div>
                <div className="detailed-analytics-card">
                    <h3>BMI Gauge</h3>
                    <Doughnut data={bmiChartData} options={bmiChartOptions} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Personalized Tips</h3>
                    <ul>
                        {analyticsData.bmiCategory === 'Underweight' && <li>Consider speaking with a nutritionist to ensure you are getting enough calories and nutrients.</li>}
                        {analyticsData.bmiCategory === 'Healthy Weight' && <li>You are in a healthy weight range! Maintain your current lifestyle to stay in this category.</li>}
                        {analyticsData.bmiCategory === 'Overweight' && <li>A combination of a balanced diet and regular exercise can help you reach a healthier weight.</li>}
                        {analyticsData.bmiCategory === 'Obesity' && <li>It's recommended to consult with a healthcare professional to create a safe and effective weight loss plan.</li>}
                    </ul>
                </div>
            </div>
        </DetailPage>
    );
};

export default HealthMetricsDetail;
