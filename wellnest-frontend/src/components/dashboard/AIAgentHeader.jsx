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
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            marginBottom: '24px'
        }}>
            <div className="ai-avatar" style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                boxShadow: '0 8px 24px var(--primary-glow)',
                flexShrink: 0
            }}>
                <FiMessageSquare />
            </div>

            <div style={{ flex: '1 1 250px' }}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    color: 'var(--text-main)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    {getGreeting()}, {firstName}! {getStatusIcon()}
                </h2>
                <p style={{ 
                    margin: '6px 0 0', 
                    fontSize: '14px', 
                    color: 'var(--text-muted)', 
                    lineHeight: 1.5, 
                    fontWeight: 500,
                    maxWidth: '500px'
                }}>
                    {getInsight()}
                </p>
            </div>
            
            {user.isPremium && (
                <div style={{
                    padding: '6px 14px',
                    background: 'var(--primary-light)',
                    border: '1px solid var(--primary-border)',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    boxShadow: '0 4px 12px rgba(94, 234, 212, 0.1)'
                }}>
                    A.I. Active
                </div>
            )}
        </div>
    );
};

export default AIAgentHeader;
