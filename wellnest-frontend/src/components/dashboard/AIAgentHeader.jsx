import React, { useState, useEffect } from 'react';
import { FiZap, FiMoon, FiActivity, FiArrowRight } from 'react-icons/fi';
import { getDailyBriefing } from '../../api/assistantApi';
import CognitiveAura from './CognitiveAura';
import VoiceScanButton from './VoiceScanButton';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

const AIAgentHeader = ({ user, readinessScore }) => {
    const navigate = useNavigate();
    const { energyForecast, submitVoiceScan } = useData();
    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const handleVoiceScanComplete = async (audioBlob) => {
        try {
            await submitVoiceScan(audioBlob);
            console.log("AIAgentHeader: Voice Clarity Scan Synchronized. 🛡️🧬");
        } catch (err) {
            console.error("AIAgentHeader: Voice Scan Sync failed.", err);
        }
    };
    
    const firstName = user?.name?.split(' ')[0] || 'User';
    const hour = new Date().getHours();
    
    useEffect(() => {
        let isMounted = true;
        
        const fetchBriefing = async () => {
            // Safety Check: If id is missing, we can't fetch.
            if (!user?.id) return;

            // If we already have a briefing, don't re-fetch unnecessarily
            if (briefing) return;

            try {
                setLoading(true);
                const localDate = new Date().toISOString().split('T')[0];
                
                // 7-second timeout for premium speed
                const timeoutPromise = new Promise((resolve) => 
                    setTimeout(() => resolve({ timeout: true }), 7000)
                );
                
                const res = await Promise.race([getDailyBriefing(localDate), timeoutPromise]);
                
                if (!isMounted) return;

                if (res && res.timeout) {
                    setBriefing("Focus on your goal today! Every small step brings you closer to peak vitality.");
                } else if (res && res.data && res.data.content) {
                    setBriefing(res.data.content);
                } else {
                    setBriefing("Dashboard synchronized. Performance data is mission-ready.");
                }
            } catch (err) {
                console.error("AI Header fetch error:", err);
                if (isMounted) {
                    setBriefing("Dashboard synchronized. Performance data is mission-ready.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchBriefing();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.isPremium]); // Added isPremium to re-fetch if they upgrade

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
            flexDirection: isMobile ? 'column' : 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
        {/* Performance Hub: The Neural Suite Control Panel (Refined Suite) */}
        <div className="neural-performance-hub" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            background: 'rgba(94, 234, 212, 0.05)',
            padding: '12px 24px',
            borderRadius: '24px',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            flexShrink: 0,
            justifyContent: 'center',
            width: isMobile ? '100%' : 'auto',
            order: 2
        }}>
            <VoiceScanButton onScanComplete={handleVoiceScanComplete} />

            {user?.isPremium && (
                <CognitiveAura reserve={energyForecast?.cognitiveReserve || 85} />
            )}
        </div>

            <div style={{ 
                flex: isMobile ? '0 1 auto' : '1 1 250px', 
                zIndex: 2, 
                order: 1,
                textAlign: isMobile ? 'center' : 'left'
            }}>
                <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    color: 'var(--text-main)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: isMobile ? 'center' : 'flex-start',
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
                    maxWidth: '500px',
                    marginLeft: isMobile ? 'auto' : '0',
                    marginRight: isMobile ? 'auto' : '0'
                }}>
                    {loading ? (
                        <span style={{ opacity: 0.6, fontStyle: 'italic' }}>AI is analyzing your stats for today...</span>
                    ) : (
                        briefing === "UNLOCKED_PREMIUM_ONLY" ? (
                            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                                <FiZap /> Upgrade to Premium to unlock AI daily briefing!
                            </span>
                        ) : (briefing || "Sync health data to unlock analysis!")
                    )}
                </p>
            </div>
            
            <div 
                onClick={() => { if (!user?.isPremium) navigate('/premium'); }}
                style={{
                padding: '6px 14px',
                background: user?.isPremium ? 'rgba(94, 234, 212, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                border: user?.isPremium ? '1px solid var(--primary-border)' : '1px solid #fbbf24',
                borderRadius: '14px',
                fontSize: '11px',
                fontWeight: 900,
                color: user?.isPremium ? 'var(--primary)' : '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                boxShadow: user?.isPremium ? '0 4px 12px rgba(94, 234, 212, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: user?.isPremium ? 'default' : 'pointer'
            }}>
                {user?.isPremium ? <><FiZap /> AI Active</> : <><FiZap /> Get Premium <FiArrowRight /></>}
            </div>
        </div>
    );
};

export default AIAgentHeader;
