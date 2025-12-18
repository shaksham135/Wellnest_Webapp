import React from 'react';
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

const SleepAnalytics = ({ data }) => {
    if (!data) return <p className="muted">No sleep analytics available.</p>;

    const chartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { 
                position: 'bottom',
                labels: { color: '#9ca3af' }
            },
            title: { display: false },
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
                title: { display: true, text: 'Quality (1-5)', color: '#f59e0b' },
                ticks: { color: '#f59e0b' },
                grid: { drawOnChartArea: false },
                min: 1,
                max: 5
            }
        }
    };

    const chartData = {
        labels: Object.keys(data.weeklySleepTrend || {}),
        datasets: [
            {
                label: 'Duration (hours)',
                data: Object.values(data.weeklySleepTrend || {}),
                borderColor: 'rgba(167, 139, 250, 1)',
                backgroundColor: 'rgba(167, 139, 250, 0.2)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Quality (1-5)',
                data: Object.values(data.weeklyQualityTrend || {}),
                borderColor: 'rgba(245, 158, 11, 1)',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ],
    };

    return (
        <div>
            <h3>Sleep Analytics</h3>
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Avg. Duration</div>
                    <div className="stat-value">{data.avgSleepDuration.toFixed(1)} h</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Avg. Quality</div>
                    <div className="stat-value">{data.avgSleepQuality.toFixed(1)} / 5</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Consistency</div>
                    <div className="stat-value">{data.sleepConsistency}</div>
                </div>
            </div>

            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Weekly Sleep Trend</h4>
                <Line options={chartOptions} data={chartData} />
            </div>
        </div>
    );
};

export default SleepAnalytics;
