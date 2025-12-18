import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const NutritionAnalytics = ({ data }) => {
    if (!data) return <p className="muted">No nutrition analytics available.</p>;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#9ca3af' }
            },
            title: { display: false },
        },
        scales: {
            r: {
                angleLines: { color: 'rgba(148, 163, 184, 0.2)' },
                grid: { color: 'rgba(148, 163, 184, 0.2)' },
                pointLabels: {
                    color: '#cbd5e1',
                    font: { size: 12 }
                },
                ticks: {
                    color: '#9ca3af',
                    backdropColor: 'rgba(15, 23, 42, 0.8)',
                    stepSize: 25
                }
            }
        }
    };

    const macroData = {
        labels: ['Protein (g)', 'Carbs (g)', 'Fat (g)'],
        datasets: [
            {
                label: 'Actual Intake',
                data: [
                    data.macronutrientDistribution?.protein || 0,
                    data.macronutrientDistribution?.carbs || 0,
                    data.macronutrientDistribution?.fat || 0,
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
            {
                label: 'Target Intake',
                data: [
                    data.targetMacronutrients?.protein || 0,
                    data.targetMacronutrients?.carbs || 0,
                    data.targetMacronutrients?.fat || 0,
                ],
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1,
            }
        ],
    };

    return (
        <div>
            <h3>Nutrition Analytics</h3>
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Avg. Daily Calories</div>
                    <div className="stat-value">{data.avgDailyCalories.toFixed(0)}</div>
                </div>
            </div>

            <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Macronutrient Balance (Actual vs. Target)</h4>
                <Radar options={chartOptions} data={macroData} />
            </div>
        </div>
    );
};

export default NutritionAnalytics;
