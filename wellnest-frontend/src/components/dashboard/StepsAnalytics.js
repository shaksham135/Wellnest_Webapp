import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const StepsAnalytics = ({ data }) => {
    // For testing purposes, if no data is available, use mock data
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
    
    // Use real data if available, otherwise use mock data for testing
    const displayData = data || mockData;
    
    if (!displayData) {
        return (
            <div>
                <h3>Steps Analytics</h3>
                <div className="stats-grid" style={{ marginTop: '1rem' }}>
                    <div className="stat">
                        <div className="stat-label">Total Steps</div>
                        <div className="stat-value">0</div>
                    </div>
                    <div className="stat">
                        <div className="stat-label">Daily Average</div>
                        <div className="stat-value">0</div>
                    </div>
                    <div className="stat">
                        <div className="stat-label">Total Distance</div>
                        <div className="stat-value">0.0 km</div>
                    </div>
                    <div className="stat">
                        <div className="stat-label">Activity Level</div>
                        <div className="stat-value" style={{ color: '#ef4444' }}>
                            Sedentary
                        </div>
                    </div>
                </div>
                <div style={{ 
                    marginTop: '1.5rem',
                    padding: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        📱 No steps data available yet. Start tracking your steps to see analytics here!
                    </p>
                </div>
            </div>
        );
    }

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
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
        plugins: {
            legend: { display: false },
            title: { display: false },
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
                        return value.toFixed(1) + ' km';
                    }
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    // Weekly steps data
    const weeklyStepsData = {
        labels: Object.keys(displayData.weeklySteps || {}),
        datasets: [
            {
                label: 'Daily Steps',
                data: Object.values(displayData.weeklySteps || {}),
                backgroundColor: (ctx) => {
                    const value = ctx.parsed?.y || 0;
                    if (value >= 10000) return 'rgba(34, 197, 94, 0.7)'; // Green for 10k+
                    if (value >= 7500) return 'rgba(245, 158, 11, 0.7)'; // Orange for 7.5k+
                    if (value >= 5000) return 'rgba(59, 130, 246, 0.7)'; // Blue for 5k+
                    return 'rgba(239, 68, 68, 0.7)'; // Red for <5k
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

    // Weekly distance data
    const weeklyDistanceData = {
        labels: Object.keys(displayData.weeklyDistance || {}),
        datasets: [
            {
                label: 'Distance (km)',
                data: Object.values(displayData.weeklyDistance || {}),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
            },
        ],
    };

    // Calculate activity level based on average steps
    const getActivityLevel = (avgSteps) => {
        if (avgSteps >= 12500) return { level: 'Highly Active', color: '#16a34a' };
        if (avgSteps >= 10000) return { level: 'Active', color: '#22c55e' };
        if (avgSteps >= 7500) return { level: 'Somewhat Active', color: '#eab308' };
        if (avgSteps >= 5000) return { level: 'Low Active', color: '#f59e0b' };
        return { level: 'Sedentary', color: '#ef4444' };
    };

    const activityLevel = getActivityLevel(displayData.avgDailySteps || 0);

    return (
        <div>
            <h3>Steps Analytics {!data && <span style={{ fontSize: '12px', color: '#f59e0b' }}>(Demo Data)</span>}</h3>
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Total Steps</div>
                    <div className="stat-value">{(displayData.totalSteps || 0).toLocaleString()}</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Daily Average</div>
                    <div className="stat-value">{Math.round(displayData.avgDailySteps || 0).toLocaleString()}</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Total Distance</div>
                    <div className="stat-value">{(displayData.totalDistance || 0).toFixed(1)} km</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Activity Level</div>
                    <div className="stat-value" style={{ color: activityLevel.color }}>
                        {activityLevel.level}
                    </div>
                </div>
            </div>

            {/* Goal Progress Bar */}
            {displayData.dailyGoal && (
                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <span style={{ fontSize: '14px', color: '#9ca3af' }}>Daily Goal Progress</span>
                        <span style={{ fontSize: '14px', color: '#9ca3af' }}>
                            {Math.round((displayData.avgDailySteps / displayData.dailyGoal) * 100)}%
                        </span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(148, 163, 184, 0.2)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${Math.min((displayData.avgDailySteps / displayData.dailyGoal) * 100, 100)}%`,
                            height: '100%',
                            backgroundColor: displayData.avgDailySteps >= displayData.dailyGoal ? '#22c55e' : '#3b82f6',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280', 
                        marginTop: '4px',
                        textAlign: 'center'
                    }}>
                        Goal: {displayData.dailyGoal.toLocaleString()} steps/day
                    </div>
                </div>
            )}

            <div className="analytics-split-view">
                <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Steps Trend</h4>
                    {Object.keys(displayData.weeklySteps || {}).length > 0 ? (
                        <Bar options={barChartOptions} data={weeklyStepsData} />
                    ) : <p className="small muted">No steps data recorded.</p>}
                    
                    {/* Legend for step colors */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '16px', 
                        marginTop: '12px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: '#ef4444', 
                                borderRadius: '2px' 
                            }} />
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>&lt;5k</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: '#3b82f6', 
                                borderRadius: '2px' 
                            }} />
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>5k-7.5k</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: '#f59e0b', 
                                borderRadius: '2px' 
                            }} />
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>7.5k-10k</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: '#22c55e', 
                                borderRadius: '2px' 
                            }} />
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>10k+</span>
                        </div>
                    </div>
                </div>

                <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Distance Trend</h4>
                    {Object.keys(displayData.weeklyDistance || {}).length > 0 ? (
                        <Line options={lineChartOptions} data={weeklyDistanceData} />
                    ) : <p className="small muted">No distance data recorded.</p>}
                </div>
            </div>

            {/* Additional insights */}
            {displayData.insights && (
                <div style={{ 
                    marginTop: '1.5rem',
                    padding: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: '#3b82f6' }}>
                        📊 Weekly Insights
                    </h4>
                    <ul style={{ 
                        margin: 0, 
                        paddingLeft: '16px',
                        fontSize: '12px',
                        color: '#6b7280',
                        lineHeight: '1.5'
                    }}>
                        {displayData.insights.map((insight, index) => (
                            <li key={index}>{insight}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default StepsAnalytics;