import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from "../api/apiClient";
import GoalProgress from "../components/dashboard/GoalProgress";
import WorkoutAnalytics from "../components/dashboard/WorkoutAnalytics";
import NutritionAnalytics from "../components/dashboard/NutritionAnalytics";
import SleepAnalytics from "../components/dashboard/SleepAnalytics";
import WaterIntakeAnalytics from "../components/dashboard/WaterIntakeAnalytics";
import HealthMetrics from "../components/dashboard/HealthMetrics";
import WorkoutConsistency from "../components/dashboard/WorkoutConsistency";
import './AnalyticsPage.css';

const AnalyticsPage = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/analytics/summary');
            setAnalyticsData(response.data);
        } catch (err) {
            setError('Failed to fetch analytics data.');
            console.error(err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return <div className="dashboard-page"><div className="dashboard-card">Loading analytics...</div></div>;
    }

    if (error) {
        return <div className="dashboard-page"><div className="dashboard-card">{error}</div></div>;
    }

    if (!analyticsData) {
        return <div className="dashboard-page"><div className="dashboard-card">No analytics data available.</div></div>;
    }

    return (
        <div className="analytics-page-container">
            <div className="dashboard-header">
                <h2>Analytics Dashboard</h2>
                <p className="dashboard-subtitle">Your detailed health and fitness summary for the last 7 days.</p>
            </div>
            <div className="analytics-grid">
                <div className="analytics-box">
                    <GoalProgress data={analyticsData.goalProgress} onGoalSet={fetchAnalytics} />
                    <Link to="/analytics/goals" className="view-details-button">View Details</Link>
                </div>
                <div className="analytics-box">
                    <WorkoutAnalytics data={analyticsData.workoutAnalytics} />
                    <Link to="/analytics/workout" className="view-details-button">View Details</Link>
                </div>
                <div className="analytics-box">
                    <NutritionAnalytics data={analyticsData.nutritionAnalytics} />
                    <Link to="/analytics/nutrition" className="view-details-button">View Details</Link>
                </div>
                <div className="analytics-box">
                    <SleepAnalytics data={analyticsData.sleepAnalytics} />
                    <Link to="/analytics/sleep" className="view-details-button">View Details</Link>
                </div>
                <div className="analytics-box">
                    <WaterIntakeAnalytics data={analyticsData.waterIntakeAnalytics} />
                    <Link to="/analytics/water" className="view-details-button">View Details</Link>
                </div>
                {analyticsData.healthMetrics && 
                    <div className="analytics-box">
                        <HealthMetrics data={analyticsData.healthMetrics} />
                        <Link to="/analytics/health" className="view-details-button">View Details</Link>
                    </div>
                }
                {analyticsData.workoutConsistency && <div className="analytics-box analytics-box-full-width"><WorkoutConsistency data={analyticsData.workoutConsistency} /></div>}
            </div>
        </div>
    );
};

export default AnalyticsPage;
