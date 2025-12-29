import { useState, useEffect } from 'react';
import DetailPage from '../../components/DetailPage';
import apiClient from '../../api/apiClient';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './DetailedAnalytics.css';

const StepsAnalyticsDetail = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get('/analytics/summary');
                setAnalyticsData(response.data.stepsAnalytics);
            } catch (err) {
                setError('Failed to fetch steps analytics data.');
                console.error(err);
            }
            setLoading(false);
        };

        fetchAnalytics();
    }, []);

    // Mock data for testing when no real data is available
    const mockData = {
        totalSteps: 65000,
        avgDailySteps: 9285,
        totalDistance: 49.5,
        avgDailyDistance: 7.1,
        totalCaloriesBurned: 2600,
        avgDailyCalories: 371,
        weeklySteps: {
            "2025-12-17": 8500,
            "2025-12-18": 12000,
            "2025-12-19": 6200,
            "2025-12-20": 10500,
            "2025-12-21": 15000,
            "2025-12-22": 7800,
            "2025-12-23": 5000
        },
        weeklyDistance: {
            "2025-12-17": 6.5,
            "2025-12-18": 9.1,
            "2025-12-19": 4.7,
            "2025-12-20": 8.0,
            "2025-12-21": 11.4,
            "2025-12-22": 5.9,
            "2025-12-23": 3.8
        },
        weeklyCalories: {
            "2025-12-17": 340,
            "2025-12-18": 480,
            "2025-12-19": 250,
            "2025-12-20": 420,
            "2025-12-21": 600,
            "2025-12-22": 310,
            "2025-12-23": 200
        },
        activityLevel: "Somewhat Active",
        dailyGoal: 10000,
        goalAchievementRate: 42.8,
        insights: [
            "Good progress! You're close to the 10,000 daily step goal.",
            "Your most active day was 2025-12-21 (15000 steps).",
            "Your daily step count varies significantly. Try to maintain more consistency.",
            "You walked a total of 49.5 km this week, burning 2600 calories."
        ]
    };

    if (loading) {
        return <DetailPage title="Steps Analytics"><div>Loading...</div></DetailPage>;
    }

    if (error) {
        return <DetailPage title="Steps Analytics"><div>{error}</div></DetailPage>;
    }

    // Use real data if available, otherwise use mock data
    const displayData = analyticsData || mockData;

    if (!displayData) {
        return <DetailPage title="Steps Analytics"><div>No data available.</div></DetailPage>;
    }

    // Chart options
    const barChartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.parsed.y.toLocaleString()} steps`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { 
                    color: '#9ca3af',
                    callback: function(value) {
                        return value.toLocaleString();
                    }
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    const lineChartOptions = {
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
                title: { display: true, text: 'Distance (km)', color: '#10b981' },
                ticks: { color: '#10b981' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Calories', color: '#f59e0b' },
                ticks: { color: '#f59e0b' },
                grid: { drawOnChartArea: false }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#9ca3af' }
            }
        }
    };

    // Chart data
    const stepsBarData = {
        labels: Object.keys(displayData.weeklySteps || {}),
        datasets: [
            {
                label: 'Daily Steps',
                data: Object.values(displayData.weeklySteps || {}),
                backgroundColor: (ctx) => {
                    const value = ctx.parsed?.y || 0;
                    if (value >= 10000) return 'rgba(34, 197, 94, 0.7)';
                    if (value >= 7500) return 'rgba(245, 158, 11, 0.7)';
                    if (value >= 5000) return 'rgba(59, 130, 246, 0.7)';
                    return 'rgba(239, 68, 68, 0.7)';
                },
                borderColor: (ctx) => {
                    const value = ctx.parsed?.y || 0;
                    if (value >= 10000) return '#22c55e';
                    if (value >= 7500) return '#f59e0b';
                    if (value >= 5000) return '#3b82f6';
                    return '#ef4444';
                },
                borderWidth: 2,
            },
        ],
    };

    const distanceCaloriesData = {
        labels: Object.keys(displayData.weeklyDistance || {}),
        datasets: [
            {
                label: 'Distance (km)',
                data: Object.values(displayData.weeklyDistance || {}),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Calories Burned',
                data: Object.values(displayData.weeklyCalories || {}),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ],
    };

    // Activity level distribution (mock data for visualization)
    const activityDistribution = {
        labels: ['Sedentary (<5k)', 'Low Active (5k-7.5k)', 'Somewhat Active (7.5k-10k)', 'Active (10k+)'],
        datasets: [
            {
                data: [1, 2, 2, 2], // Based on weekly data
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(34, 197, 94, 0.7)'
                ],
                borderColor: [
                    '#ef4444',
                    '#3b82f6',
                    '#f59e0b',
                    '#22c55e'
                ],
                borderWidth: 2,
            },
        ],
    };

    // Calculate activity level color
    const getActivityLevelColor = (level) => {
        switch (level) {
            case 'Highly Active': return '#16a34a';
            case 'Active': return '#22c55e';
            case 'Somewhat Active': return '#eab308';
            case 'Low Active': return '#f59e0b';
            default: return '#ef4444';
        }
    };

    return (
        <DetailPage title={`Steps Analytics ${!analyticsData ? '(Demo Data)' : ''}`}>
            <div className="detailed-analytics-grid">
                {/* Summary Statistics */}
                <div className="detailed-analytics-card">
                    <h3>Weekly Summary</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong>Total Steps:</strong> {displayData.totalSteps.toLocaleString()}
                        </div>
                        <div>
                            <strong>Daily Average:</strong> {Math.round(displayData.avgDailySteps).toLocaleString()} steps
                        </div>
                        <div>
                            <strong>Total Distance:</strong> {displayData.totalDistance.toFixed(1)} km
                        </div>
                        <div>
                            <strong>Total Calories:</strong> {displayData.totalCaloriesBurned.toLocaleString()} kcal
                        </div>
                        <div>
                            <strong>Activity Level:</strong> 
                            <span style={{ 
                                color: getActivityLevelColor(displayData.activityLevel),
                                fontWeight: 'bold',
                                marginLeft: '8px'
                            }}>
                                {displayData.activityLevel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Goal Progress */}
                <div className="detailed-analytics-card">
                    <h3>Goal Progress</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong>Daily Goal:</strong> {displayData.dailyGoal.toLocaleString()} steps
                        </div>
                        <div>
                            <strong>Achievement Rate:</strong> {displayData.goalAchievementRate.toFixed(1)}%
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{
                                width: '100%',
                                height: '12px',
                                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                                borderRadius: '6px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${Math.min(displayData.goalAchievementRate, 100)}%`,
                                    height: '100%',
                                    backgroundColor: displayData.goalAchievementRate >= 80 ? '#22c55e' : 
                                                   displayData.goalAchievementRate >= 60 ? '#f59e0b' : '#ef4444',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                            {displayData.goalAchievementRate >= 80 ? '🎉 Excellent progress!' :
                             displayData.goalAchievementRate >= 60 ? '👍 Good progress!' :
                             '💪 Keep pushing towards your goal!'}
                        </div>
                    </div>
                </div>

                {/* Daily Steps Chart */}
                <div className="detailed-analytics-card full-width">
                    <h3>Daily Steps Breakdown</h3>
                    <Bar options={barChartOptions} data={stepsBarData} />
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '20px', 
                        marginTop: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#ef4444', 
                                borderRadius: '3px' 
                            }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sedentary (&lt;5k)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#3b82f6', 
                                borderRadius: '3px' 
                            }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Low Active (5k-7.5k)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#f59e0b', 
                                borderRadius: '3px' 
                            }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Somewhat Active (7.5k-10k)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: '#22c55e', 
                                borderRadius: '3px' 
                            }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Active (10k+)</span>
                        </div>
                    </div>
                </div>

                {/* Distance and Calories Trend */}
                <div className="detailed-analytics-card full-width">
                    <h3>Distance & Calories Trend</h3>
                    <Line options={lineChartOptions} data={distanceCaloriesData} />
                </div>

                {/* Activity Distribution */}
                <div className="detailed-analytics-card">
                    <h3>Activity Level Distribution</h3>
                    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                        <Doughnut options={doughnutOptions} data={activityDistribution} />
                    </div>
                </div>

                {/* Weekly Insights */}
                <div className="detailed-analytics-card">
                    <h3>📊 Weekly Insights</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                        {displayData.insights.map((insight, index) => (
                            <li key={index} style={{ marginBottom: '12px', lineHeight: '1.5' }}>
                                {insight}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Personalized Tips */}
                <div className="detailed-analytics-card full-width">
                    <h3>💡 Personalized Recommendations</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <h4 style={{ color: '#22c55e', marginBottom: '8px' }}>🎯 Goal Achievement</h4>
                            <ul style={{ paddingLeft: '20px' }}>
                                {displayData.avgDailySteps < displayData.dailyGoal ? (
                                    <>
                                        <li>Try to add 1,000-2,000 more steps daily to reach your goal</li>
                                        <li>Take the stairs instead of elevators when possible</li>
                                        <li>Park further away or get off public transport one stop early</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Great job meeting your daily step goal!</li>
                                        <li>Consider increasing your goal to 12,000-15,000 steps for extra challenge</li>
                                        <li>Focus on maintaining consistency across all days</li>
                                    </>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ color: '#3b82f6', marginBottom: '8px' }}>⚡ Activity Optimization</h4>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li>Break up long periods of sitting with 5-minute walking breaks</li>
                                <li>Try to spread your steps throughout the day rather than one long walk</li>
                                <li>Use a fitness tracker or phone app to monitor real-time progress</li>
                                <li>Find walking buddies or join walking groups for motivation</li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>🏃‍♀️ Health Benefits</h4>
                            <ul style={{ paddingLeft: '20px' }}>
                                <li>Walking 10,000+ steps daily reduces cardiovascular disease risk</li>
                                <li>Regular walking improves mental health and reduces stress</li>
                                <li>Consistent step counts help maintain healthy weight</li>
                                <li>Walking strengthens bones and improves balance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DetailPage>
    );
};

export default StepsAnalyticsDetail;