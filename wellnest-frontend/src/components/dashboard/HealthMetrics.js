import React from 'react';

const HealthMetrics = ({ data }) => {
    if (!data) return <p className="muted">No health metrics available.</p>;

    const { bmi, bmiCategory } = data;

    const getBmiColor = () => {
        if (bmiCategory === 'Healthy Weight') return '#34d399';
        if (bmiCategory === 'Underweight' || bmiCategory === 'Overweight') return '#f59e0b';
        if (bmiCategory === 'Obesity') return '#ef4444';
        return '#9ca3af';
    };

    return (
        <div>
            <h3>Health Metrics</h3>
            <div className="stats-grid" style={{ marginTop: '1rem' }}>
                <div className="stat">
                    <div className="stat-label">Body Mass Index (BMI)</div>
                    <div className="stat-value">{bmi.toFixed(1)}</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Category</div>
                    <div className="stat-value" style={{ color: getBmiColor() }}>{bmiCategory}</div>
                </div>
            </div>
            <p className="small" style={{ marginTop: '1rem' }}>BMI is a measure of body fat based on height and weight that applies to adult men and women.</p>
        </div>
    );
};

export default HealthMetrics;
