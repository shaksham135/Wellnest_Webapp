import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PremiumGate from "../components/shared/PremiumGate";
import apiClient from "../api/apiClient";
import cacheService from "../api/cacheService";
import GoalProgress from "../components/dashboard/GoalProgress";
import WorkoutAnalytics from "../components/dashboard/WorkoutAnalytics";
import NutritionAnalytics from "../components/dashboard/NutritionAnalytics";
import SleepAnalytics from "../components/dashboard/SleepAnalytics";
import WaterIntakeAnalytics from "../components/dashboard/WaterIntakeAnalytics";
import HealthMetrics from "../components/dashboard/HealthMetrics";
import WorkoutConsistency from "../components/dashboard/WorkoutConsistency";
import CalorieBalanceChart from "../components/dashboard/CalorieBalanceChart";
import DailyActivitySummary from "../components/dashboard/DailyActivitySummary";
import PremiumPaywall from "../components/common/PremiumPaywall";
import { useData } from "../context/DataContext";
import WeeklySummaryCard from "../components/dashboard/WeeklySummaryCard";
import PersonalizedInsights from "../components/dashboard/PersonalizedInsights";
import ConsistencyHeatmap from "../components/dashboard/ConsistencyHeatmap";
import { getActiveDays } from "../api/trackerApi";
import './AnalyticsPage.css';

const AnalyticsPage = () => {
    const cacheKey = '/analytics/summary';
    const [analyticsData, setAnalyticsData] = useState(cacheService.get(cacheKey) || null);
    const [activeDays, setActiveDays] = useState([]);
    const [loading, setLoading] = useState(!cacheService.get(cacheKey));
    const [error, setError] = useState(null);
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const { userData } = useData();
    const isPremium = userData?.isPremium;

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, activeDaysRes] = await Promise.all([
                apiClient.get('/analytics/summary'),
                getActiveDays().catch(() => ({ data: [] }))
            ]);
            setAnalyticsData(summaryRes.data);
            setActiveDays(activeDaysRes.data || []);
            cacheService.set(cacheKey, summaryRes.data);
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
            <PremiumPaywall 
                isOpen={isPaywallOpen} 
                onClose={() => setIsPaywallOpen(false)} 
                featureName="Neural Core Insights" 
            />
            
            <div className="dashboard-header" style={{ marginBottom: '16px', paddingBottom: '12px' }}>
                <h2>Analytics</h2>
                <p className="dashboard-subtitle">Last 7 days</p>
            </div>
            <div className="analytics-grid">
                {/* 📊 WEEKLY SUMMARY & REFLECTION (Free for all) */}
                <div className="analytics-box analytics-box-full-width">
                    <WeeklySummaryCard activeDays={activeDays} analyticsData={analyticsData} />
                </div>

                {/* 🗓️ 30-DAY CONSISTENCY HEATMAP (Premium Gated) */}
                <div className="analytics-box analytics-box-full-width">
                    <ConsistencyHeatmap isPremium={isPremium} activeDays={activeDays} />
                </div>

                {/* 🧠 NEURAL CORE PERSONALIZED INSIGHTS (Premium Gated) */}
                <div className="analytics-box analytics-box-full-width">
                    <PersonalizedInsights isPremium={isPremium} analyticsData={analyticsData} />
                </div>

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
                <div className="analytics-box">
                    <DailyActivitySummary data={analyticsData.dailyActivityAnalytics} />
                    <Link to="/analytics/activity" className="view-details-button">View Details</Link>
                </div>
                {analyticsData.healthMetrics &&
                    <div className="analytics-box">
                        <HealthMetrics data={analyticsData.healthMetrics} />
                        <Link to="/analytics/health" className="view-details-button">View Details</Link>
                    </div>
                }
                <CalorieBalanceChart
                    burnedData={analyticsData.workoutAnalytics?.dailyCaloriesBurned}
                    consumedData={analyticsData.nutritionAnalytics?.weeklyCalorieTrend}
                />
                {analyticsData.workoutConsistency && <div className="analytics-box analytics-box-full-width"><WorkoutConsistency data={analyticsData.workoutConsistency} /></div>}
            </div>
        </div>
    );
};

export default AnalyticsPage;
