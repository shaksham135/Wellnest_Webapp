import React, { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Radar, Line } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const NutritionAnalyticsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.nutritionAnalytics);
            } catch (err) {
                setError('Failed to fetch nutrition analytics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <DetailPage title="Nutrition Analytics"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Nutrition Analytics"><div>{error}</div></DetailPage>;
    }

    if (!analyticsData) {
        return <DetailPage title="Nutrition Analytics"><div>No data available.</div></DetailPage>;
    }

    const radarChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#9ca3af' } },
        },
        scales: {
            r: {
                angleLines: { color: 'rgba(148, 163, 184, 0.2)' },
                grid: { color: 'rgba(148, 163, 184, 0.2)' },
                pointLabels: { color: '#cbd5e1', font: { size: 12 } },
                ticks: { color: '#9ca3af', backdropColor: 'rgba(15, 23, 42, 0.8)' },
            },
        },
    };

    const macroData = {
        labels: ['Protein (g)', 'Carbs (g)', 'Fat (g)'],
        datasets: [
            {
                label: 'Actual Intake',
                data: [
                    analyticsData.macronutrientDistribution?.protein || 0,
                    analyticsData.macronutrientDistribution?.carbs || 0,
                    analyticsData.macronutrientDistribution?.fat || 0,
                ],
                backgroundColor: 'rgba(167, 139, 250, 0.2)',
                borderColor: '#a78bfa',
                borderWidth: 1,
            },
            {
                label: 'Target Intake',
                data: [
                    analyticsData.targetMacronutrients?.protein || 0,
                    analyticsData.targetMacronutrients?.carbs || 0,
                    analyticsData.targetMacronutrients?.fat || 0,
                ],
                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                borderColor: '#60a5fa',
                borderWidth: 1,
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        },
    };

    const weeklyCalorieData = {
        labels: Object.keys(analyticsData.weeklyCalorieTrend || {}),
        datasets: [
            {
                label: 'Daily Calories',
                data: Object.values(analyticsData.weeklyCalorieTrend || {}),
                borderColor: '#f472b6',
                backgroundColor: 'rgba(244, 114, 182, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    return (
        <DetailPage title="Nutrition Analytics">
            <div className="detailed-analytics-grid">
                <div className="detailed-analytics-card">
                    <h3>Average Daily Intake</h3>
                    <p>Calories: {analyticsData.avgDailyCalories.toFixed(0)} kcal</p>
                    <p>Protein: {analyticsData.avgDailyProtein.toFixed(0)} g</p>
                    <p>Carbs: {analyticsData.avgDailyCarbs.toFixed(0)} g</p>
                    <p>Fat: {analyticsData.avgDailyFat.toFixed(0)} g</p>
                </div>
                <div className="detailed-analytics-card">
                    <h3>Macronutrient Balance</h3>
                    <Radar options={radarChartOptions} data={macroData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Weekly Calorie Trend</h3>
                    <Line options={lineChartOptions} data={weeklyCalorieData} />
                </div>
                <div className="detailed-analytics-card full-width">
                    <h3>Personalized Tips</h3>
                    <ul>
                        <li>Your protein intake is looking good! To support muscle growth, aim for a consistent intake of 1.6-2.2g of protein per kg of body weight.</li>
                        <li>Consider incorporating more complex carbohydrates like oats and brown rice for sustained energy throughout the day.</li>
                    </ul>
                </div>
            </div>
        </DetailPage>
    );
};

export default NutritionAnalyticsDetail;
