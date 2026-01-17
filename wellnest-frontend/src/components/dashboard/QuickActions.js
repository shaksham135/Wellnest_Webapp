import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiCoffee, FiDroplet, FiMoon } from 'react-icons/fi';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        { label: 'Log Workout', icon: <FiActivity />, tab: 'workout', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
        { label: 'Log Meal', icon: <FiCoffee />, tab: 'meal', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
        { label: 'Log Water', icon: <FiDroplet />, tab: 'water', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' },
        { label: 'Log Sleep', icon: <FiMoon />, tab: 'sleep', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {actions.map((action) => (
                <button
                    key={action.tab}
                    onClick={() => navigate('/trackers', { state: { tab: action.tab } })}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '16px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    className="hover-card"
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: action.bg,
                        color: action.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        {action.icon}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default QuickActions;
