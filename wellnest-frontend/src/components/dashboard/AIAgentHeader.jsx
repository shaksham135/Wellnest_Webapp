import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiZap, FiMoon, FiActivity } from 'react-icons/fi';
import { getDailyBriefing } from '../../api/assistantApi';

const AIAgentHeader = ({ user, readinessScore }) => {
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const firstName = user?.name?.split(' ')[0] || 'User';
    const hour = new Date().getHours();
    
    useEffect(() => {
        let isMounted = true;
        const fetchBriefing = async () => {
            // Safety: timeout if it takes too long
            const timeoutPromise = new Promise((resolve) => 
                setTimeout(() => resolve({ timeout: true }), 25000)
            );

            try {
                setLoading(true);
                // Race the API call against the timeout
                const res = await Promise.race([getDailyBriefing(), timeoutPromise]);
                
                if (!isMounted) return;

                if (res.timeout) {
                    console.warn("AI Briefing request timed out.");
                    setBriefing("Focus on your goal today! Every small step brings you closer to peak fitness.");
                } else if (res.data && res.data.content) {
                    setBriefing(res.data.content);
                }
            } catch (err) {
                console.error("AI Briefing fetch error:", err);
                if (isMounted) {
                    setBriefing("Keep pushing forward! Consistency is the key to your success.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (user) fetchBriefing();
        return () => { isMounted = false; };
    }, [user]);

    const getGreeting = () => {
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
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
                    {loading ? (
                        <span style={{ opacity: 0.6, fontStyle: 'italic' }}>AI is analyzing your stats for today...</span>
                    ) : briefing}
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
