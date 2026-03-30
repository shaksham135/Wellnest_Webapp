import React from 'react';
import { FiMessageSquare, FiZap, FiMoon, FiActivity } from 'react-icons/fi';

const AIAgentHeader = ({ user, activities, sleep, water, readinessScore }) => {
    const firstName = user?.name?.split(' ')[0] || 'User';
    const hour = new Date().getHours();
    
    const getGreeting = () => {
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const getInsight = () => {
        if (!readinessScore) return "Let's log your sleep to calculate your daily readiness.";
        if (readinessScore > 80) return "Your recovery is excellent. Today is perfect for a peak performance session!";
        if (readinessScore > 60) return "You're in good shape. A steady workout will keep your momentum going.";
        return "Your body needs some rest. Focus on active recovery and hydration today.";
    };

    const getStatusIcon = () => {
        if (hour < 12) return <FiZap style={{ color: '#fbbf24' }} />;
        if (hour < 17) return <FiActivity style={{ color: '#5eead4' }} />;
        return <FiMoon style={{ color: '#818cf8' }} />;
    };

    return (
        <div className="ai-agent-header card" style={{
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            marginBottom: '24px'
        }}>
            <div className="ai-avatar" style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                color: 'white',
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                flexShrink: 0
            }}>
                <FiMessageSquare />
            </div>

            <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getGreeting()}, {firstName}! {getStatusIcon()}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>
                    {getInsight()}
                </p>
            </div>
            
            {user.isPremium && (
                <div style={{
                    padding: '4px 12px',
                    background: 'rgba(94, 234, 212, 0.1)',
                    border: '1px solid var(--primary)',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    A.I. Active
                </div>
            )}
        </div>
    );
};

export default AIAgentHeader;
