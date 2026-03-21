import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
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

const DailyActivitySummary = ({ data }) => {
    if (!data) return <p>No activity data available.</p>;

    const chartOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
            y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
        }
    };

    const chartData = {
        labels: Object.keys(data.weeklyStepsTrend || {}),
        datasets: [{
            label: 'Steps',
            data: Object.values(data.weeklyStepsTrend || {}),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            fill: true,
            tension: 0.4
        }]
    };

    return (
        <div style={{ padding: '10px' }}>
            <h3 style={{ marginBottom: '15px' }}>Daily Activity</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ width: '70px', height: '70px', textAlign: 'center' }}>
                    <CircularProgressbar 
                        value={Math.min((data.avgDailySteps / data.targetSteps) * 100, 100)} 
                        text={`${Math.round(data.avgDailySteps/1000)}k`}
                        styles={buildStyles({ pathColor: '#f59e0b', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)', textSize: '24px' })}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Steps</div>
                </div>
                
                <div style={{ width: '70px', height: '70px', textAlign: 'center' }}>
                    <CircularProgressbar 
                        value={Math.min((data.avgDailyCalories / data.targetCalories) * 100, 100)} 
                        text={`${Math.round(data.avgDailyCalories)}`}
                        styles={buildStyles({ pathColor: '#ef4444', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)', textSize: '24px' })}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>kcal/day</div>
                </div>

                <div style={{ width: '70px', height: '70px', textAlign: 'center' }}>
                    <CircularProgressbar 
                        value={Math.min((data.avgDailyDistance / data.targetDistance) * 100, 100)} 
                        text={`${data.avgDailyDistance.toFixed(1)}`}
                        styles={buildStyles({ pathColor: '#06b6d4', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)', textSize: '24px' })}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>km/day</div>
                </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-main)', margin: '5px 0' }}><strong>Days Met Goals:</strong></p>
            <ul style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, paddingLeft: '20px' }}>
                <li>Steps: {data.daysMetStepsGoal} days</li>
                <li>Calories: {data.daysMetCaloriesGoal} days</li>
                <li>Distance: {data.daysMetDistanceGoal} days</li>
            </ul>

            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-main)' }}>Weekly Steps Trend</h4>
                <Line options={chartOptions} data={chartData} />
            </div>
        </div>
    );
};

export default DailyActivitySummary;
