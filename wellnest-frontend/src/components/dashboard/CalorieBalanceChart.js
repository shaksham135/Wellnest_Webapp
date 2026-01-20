import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const CalorieBalanceChart = ({ burnedData, consumedData }) => {
    // Ensure data objects are not null/undefined to prevent access errors
    const safeBurnedData = burnedData || {};
    const safeConsumedData = consumedData || {};

    // Merge dates from both datasets to get a complete X-axis
    const burnedDates = Object.keys(safeBurnedData);
    const consumedDates = Object.keys(safeConsumedData);
    const allDates = [...new Set([...burnedDates, ...consumedDates])].sort();

    // Map data to the sorted dates
    const burnedValues = allDates.map(date => safeBurnedData[date] || 0);
    const consumedValues = allDates.map(date => safeConsumedData[date] || 0);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#9ca3af', // Using muted text color for legend always
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e6f3ff',
                bodyColor: '#e6f3ff',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                beginAtZero: true
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    const data = {
        labels: allDates,
        datasets: [
            {
                label: 'Calories Consumed',
                data: consumedValues,
                backgroundColor: 'rgba(244, 114, 182, 0.7)', // Pink
                borderColor: '#f472b6',
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
            },
            {
                label: 'Calories Burned',
                data: burnedValues,
                backgroundColor: 'rgba(56, 189, 248, 0.7)', // Light Blue
                borderColor: '#38bdf8',
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
            },
        ],
    };

    // Calculate Summary Stats
    const totalBurned = burnedValues.reduce((a, b) => a + b, 0);
    const totalConsumed = consumedValues.reduce((a, b) => a + b, 0);
    const netCalories = totalConsumed - totalBurned;
    const avgBurned = burnedValues.length ? (totalBurned / burnedValues.length).toFixed(0) : 0;
    const avgConsumed = consumedValues.length ? (totalConsumed / consumedValues.length).toFixed(0) : 0;

    return (
        <div className="analytics-box analytics-box-full-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Calorie Balance</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last 7 Days</div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: '10px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg. Consumed</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f472b6' }}>{avgConsumed} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kcal</span></div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg. Burned</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>{avgBurned} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kcal</span></div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Net Balance</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: netCalories > 0 ? '#f472b6' : '#34d399' }}>
                        {netCalories > 0 ? '+' : ''}{netCalories.toFixed(0)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kcal</span>
                    </div>
                </div>
            </div>

            <div style={{ height: '300px' }}>
                <Bar options={options} data={data} key={JSON.stringify(data)} />
            </div>
        </div>
    );
};

export default CalorieBalanceChart;
