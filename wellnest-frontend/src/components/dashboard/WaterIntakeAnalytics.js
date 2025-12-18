import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, annotationPlugin);

const WaterIntakeAnalytics = ({ data }) => {
    if (!data) return <p className="muted">No water intake analytics available.</p>;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
            annotation: {
                annotations: {
                    goalLine: {
                        type: 'line',
                        yMin: data.targetDailyIntake,
                        yMax: data.targetDailyIntake,
                        borderColor: '#34d399',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            content: `Goal: ${data.targetDailyIntake} ml`,
                            enabled: true,
                            position: 'end',
                            backgroundColor: 'rgba(52, 211, 153, 0.8)',
                            font: { size: 10 },
                            color: '#ffffff',
                        }
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
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    const chartData = {
        labels: Object.keys(data.weeklyIntakeTrend || {}),
        datasets: [
            {
                label: 'Water Intake (ml)',
                data: Object.values(data.weeklyIntakeTrend || {}),
                backgroundColor: 'rgba(96, 165, 250, 0.5)',
                borderColor: 'rgba(96, 165, 250, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div>
            <h3>Water Intake Analytics</h3>
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Avg. Daily Intake</div>
                    <div className="stat-value">{data.avgDailyIntake.toFixed(0)} ml</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Daily Goal</div>
                    <div className="stat-value">{data.targetDailyIntake} ml</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Days Goal Met</div>
                    <div className="stat-value">{data.daysMetGoal}</div>
                </div>
            </div>

            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Intake Trend</h4>
                <Bar options={chartOptions} data={chartData} />
            </div>
        </div>
    );
};

export default WaterIntakeAnalytics;
