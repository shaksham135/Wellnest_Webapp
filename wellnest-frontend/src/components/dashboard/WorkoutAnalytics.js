import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const WorkoutAnalytics = ({ data }) => {
    if (!data) return <p className="muted">No workout analytics available.</p>;

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
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    const doughnutChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#9ca3af',
                    padding: 10,
                }
            },
            title: { display: false },
        }
    };

    const weeklyTrendData = {
        labels: Object.keys(data.weeklyTrend || {}),
        datasets: [
            {
                label: 'Workout Duration (minutes)',
                data: Object.values(data.weeklyTrend || {}),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    const workoutTypeData = {
        labels: Object.keys(data.workoutsByType || {}),
        datasets: [
            {
                data: Object.values(data.workoutsByType || {}),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                ],
                borderColor: [
                    '#3b82f6',
                    '#ef4444',
                    '#f59e0b',
                    '#10b981',
                    '#8b5cf6',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div>
            <h3>Workout Analytics</h3>
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Total Workouts</div>
                    <div className="stat-value">{data.totalWorkouts}</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Total Duration</div>
                    <div className="stat-value">{data.totalDuration.toFixed(0)} min</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Avg. Duration</div>
                    <div className="stat-value">{data.avgDuration.toFixed(0)} min</div>
                </div>
            </div>

            <div className="analytics-split-view">
                <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Workout Distribution</h4>
                    {Object.keys(data.workoutsByType || {}).length > 0 ? (
                        <Doughnut options={doughnutChartOptions} data={workoutTypeData} />
                    ) : <p className="small muted">No workout types recorded.</p>}
                </div>

                <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Trend (Duration)</h4>
                    <Bar options={barChartOptions} data={weeklyTrendData} />
                </div>
            </div>
        </div>
    );
};

export default WorkoutAnalytics;
