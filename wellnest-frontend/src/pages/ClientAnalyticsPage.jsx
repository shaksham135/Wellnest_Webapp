import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientAnalytics, getClientDetails } from '../api/trainerApi';
import CalorieBalanceChart from '../components/dashboard/CalorieBalanceChart';
import { FiArrowLeft, FiUser } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const ClientAnalyticsPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, clientRes] = await Promise.all([
                    getClientAnalytics(clientId),
                    getClientDetails(clientId)
                ]);
                setAnalytics(analyticsRes.data);
                setClient(clientRes.data);
            } catch (error) {
                console.error("Failed to fetch client analytics", error);
            } finally {
                setLoading(false);
            }
        };

        if (clientId) {
            fetchData();
        }
    }, [clientId]);

    if (loading) return <div className="dashboard-page" style={{ justifyContent: 'center' }}><div className="dashboard-card">Loading client analytics...</div></div>;
    if (!analytics) return <div className="dashboard-page" style={{ justifyContent: 'center' }}><div className="dashboard-card">Failed to load data.</div></div>;

    // Prepare Weight Data for Line Chart
    const weightTrend = analytics.goalProgress?.weeklyProgressTrend || {};
    const weightLabels = Object.keys(weightTrend).sort();
    const weightValues = weightLabels.map(date => weightTrend[date]);

    const weightChartData = {
        labels: weightLabels,
        datasets: [
            {
                label: 'Weight (kg)',
                data: weightValues,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    // Chart Options
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#9ca3af' } },
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    return (
        <div className="dashboard-page">
            <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginBottom: '8px',
                        width: 'fit-content'
                    }}
                >
                    <FiArrowLeft style={{ marginRight: '8px' }} /> Back to Clients
                </button>

                {/* Header Card */}
                <div className="dashboard-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px', fontWeight: 'bold'
                        }}>
                            {client?.name?.charAt(0) || <FiUser />}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>{client?.name}'s Analytics</h1>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Track progress and health metrics</p>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div className="dashboard-card" style={{ padding: '24px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>BMI</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.healthMetrics?.bmi?.toFixed(1) || '-'}</div>
                        <div style={{ color: '#3b82f6', fontSize: '14px', marginTop: '4px' }}>{analytics.healthMetrics?.bmiCategory || '-'}</div>
                    </div>
                    <div className="dashboard-card" style={{ padding: '24px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Workouts (7d)</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.workoutAnalytics?.totalWorkouts || 0}</div>
                    </div>
                    <div className="dashboard-card" style={{ padding: '24px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Avg. Sleep</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.sleepAnalytics?.avgSleepDuration?.toFixed(1) || 0} <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-muted)' }}>hrs</span></div>
                    </div>
                    <div className="dashboard-card" style={{ padding: '24px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Avg. Calories</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.nutritionAnalytics?.avgDailyCalories?.toFixed(0) || 0} <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-muted)' }}>kcal</span></div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* Calorie Balance Chart */}
                    <div className="dashboard-card" style={{ minHeight: '300px', height: 'auto' }}>
                        <CalorieBalanceChart
                            burnedData={analytics.workoutAnalytics?.dailyCaloriesBurned}
                            consumedData={analytics.nutritionAnalytics?.weeklyCalorieTrend}
                        />
                    </div>

                    {/* Weight Trend */}
                    <div className="dashboard-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>Weight Trend</h3>
                        <div style={{ flex: 1, minHeight: '300px' }}>
                            {weightValues.length > 0 ? (
                                <Line data={weightChartData} options={lineOptions} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    No weight data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Macros */}
                <div className="dashboard-card">
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>Macronutrient Distribution (Daily Avg)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>Protein</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.nutritionAnalytics?.avgDailyProtein?.toFixed(1)}g</div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#eab308', fontWeight: '600', marginBottom: '8px' }}>Carbs</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.nutritionAnalytics?.avgDailyCarbs?.toFixed(1)}g</div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '8px' }}>Fats</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>{analytics.nutritionAnalytics?.avgDailyFat?.toFixed(1)}g</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ClientAnalyticsPage;
