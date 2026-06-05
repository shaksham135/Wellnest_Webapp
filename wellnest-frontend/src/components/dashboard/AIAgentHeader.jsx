import React, { useState, useEffect } from 'react';
import CoinShopModal from './CoinShopModal';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import { getDailyBriefing } from '../../api/assistantApi';
import VoiceScanButton from './VoiceScanButton';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { calculateOverallStreak, toLocalDateString } from '../../utils/streakUtils';
import { speakMessage } from '../../utils/ttsService';


const AIAgentHeader = ({ user, activities, sleep, readinessScore, onUserRefresh }) => {
    const isTrainer = user?.role === 'ROLE_TRAINER' || user?.role === 'TRAINER';
    const [shopOpen, setShopOpen] = useState(false);
    const navigate = useNavigate();
    const { submitVoiceCommand, workouts, meals, water, sleep: contextSleep, activities: contextActivities } = useData();
    
    const currentWorkouts = workouts || [];
    const currentMeals = meals || [];
    const currentWater = water || [];
    const currentSleep = sleep || contextSleep || [];
    const currentActivities = activities || contextActivities || [];

    const overallStreak = calculateOverallStreak(
        currentWorkouts,
        currentMeals,
        currentWater,
        currentSleep,
        currentActivities,
        user?.streakShieldCount || 0
    );

    const [briefing, setBriefing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(() => localStorage.getItem('coach_voice_muted') === 'true');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textCommand, setTextCommand] = useState("");

    
    const toggleMute = () => {
        setIsMuted(prev => {
            const next = !prev;
            localStorage.setItem('coach_voice_muted', String(next));
            if (next && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            return next;
        });
    };

    const checkVoiceLimit = () => {
        const todayStr = toLocalDateString(new Date());
        const isVoiceLimitExceeded = !user?.isPremium && 
            (user?.lastVoiceDate === todayStr && user?.dailyVoiceCount >= 3);
        
        if (isVoiceLimitExceeded) {
            const msg = "You've reached your free daily limit of 3 AI commands. Upgrade to Premium for unlimited voice logs! 🚀";
            toast.error(msg);
            setBriefing(msg);
            speakMessage("You've reached your free daily limit of 3 AI commands. Upgrade to Premium for unlimited voice logs.", isMuted);
            navigate('/premium');
            return false;
        }
        return true;
    };

    const handleVoiceScanComplete = async (audioBlob) => {
        try {
            setLoading(true);
            const res = await submitVoiceCommand(audioBlob);
            
            setBriefing(res.displayMessage);
            
            // 🎙️ Enable Coach's Voice (TTS) - Using the clean voiceMessage
            if (res.voiceMessage) {
                speakMessage(res.voiceMessage, isMuted);
            }

            console.log("AIAgentHeader: AI Command Executed. ⚡", res);
        } catch (err) {
            console.error("AIAgentHeader: Voice Command failed.", err);
            setBriefing(err.message || "I couldn't quite catch that. Try saying 'Log 500ml water' or 'Maine do glass paani piya'.");
            
            const speakMsg = err.voiceMessage || "I couldn't quite catch that.";
            speakMessage(speakMsg, isMuted);
        } finally {
            setLoading(false);
        }
    };

    const handleTextCommandSubmit = async (e) => {
        e.preventDefault();
        const command = textCommand.trim();
        if (!command) return;

        if (!checkVoiceLimit()) return;

        try {
            setLoading(true);
            const res = await submitVoiceCommand(command);
            
            setBriefing(res.displayMessage);
            
            if (res.voiceMessage) {
                speakMessage(res.voiceMessage, isMuted);
            }
            setTextCommand("");
            setShowTextInput(false);
            toast.success("Command logged! ✨");
        } catch (err) {
            console.error("AIAgentHeader: Text Command failed.", err);
            setBriefing(err.message || "I couldn't quite catch that. Try writing 'Log 500ml water' or 'Maine do glass paani piya'.");
            const speakMsg = err.voiceMessage || "I couldn't quite catch that.";
            speakMessage(speakMsg, isMuted);
        } finally {
            setLoading(false);
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
                const localDate = toLocalDateString(new Date());
                
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
    }, [user?.id, user?.isPremium, (activities?.length || 0), (sleep?.length || 0)]); 

    const getGreeting = () => {
        if (hour < 12) {
            return "Good morning";
        }
        if (hour < 17) {
            return "Welcome back";
        }
        return "Ready for today's check-in?";
    };


    return (
        <>
        <div className="ai-agent-header card">
            <div className="header-text-section">
                <h2>
                    {getGreeting()}, {firstName}! {user?.hasPremiumBadge && <span style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} title="Elite Member">👑</span>}
                </h2>

                {!isTrainer && (
                    <div className="header-badges-row">
                        <span className="header-badge level-badge">LVL {user?.level || 1}</span>
                        <span 
                            className="header-badge streak-badge"
                            title="Continuous Active Streak"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                toast(`You have a ${overallStreak}-day active streak! Keep logging your trackers to maintain it. 🔥`, {
                                    icon: '🔥',
                                    style: {
                                        background: 'var(--card-bg)',
                                        color: 'var(--text-main)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)'
                                    }
                                });
                            }}
                        >
                            🔥 {overallStreak} Days
                        </span>
                        <span
                            className="header-badge coins-badge"
                            onClick={() => setShopOpen(true)}
                            title="Open Coin Shop"
                            style={{ cursor: 'pointer' }}
                        >
                            🪙 {user?.coins || 0}
                        </span>
                    </div>
                )}

                {/* Mini XP Progress Bar */}
                {!isTrainer && (
                    <div className="header-xp-container" title={`${user?.xp || 0} / ${(user?.level || 1) * 100} XP to Level Up`}>
                        <div className="header-xp-bar">
                            <div 
                                className="header-xp-fill" 
                                style={{ width: `${Math.min(100, ((user?.xp || 0) / ((user?.level || 1) * 100)) * 100)}%` }} 
                            />
                        </div>
                        <span className="header-xp-text">{user?.xp || 0} / {(user?.level || 1) * 100} XP</span>
                    </div>
                )}

                {user?.isPremium && (
                    <p style={{ marginTop: '16px' }}>
                        {loading ? (
                            <span style={{ opacity: 0.6, fontStyle: 'italic' }}>AI is analyzing your stats for today...</span>
                        ) : (
                            briefing || "Ready to log today?"
                        )}
                    </p>
                )}
            </div>

            {/* Performance Hub: Bottom Mic talk center */}
            <div className="neural-performance-hub" style={{ flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', width: '100%' }}>
                    <div style={{ width: '40px' }} /> {/* Balance space */}
                    <VoiceScanButton onScanComplete={handleVoiceScanComplete} onBeforeStart={checkVoiceLimit} mode="command" />
                    <button 
                        onClick={toggleMute}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            borderRadius: '50%',
                            transition: 'background 0.2s',
                            outline: 'none',
                            width: '40px',
                            height: '40px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                    >
                        {isMuted ? <FiVolumeX size={18} style={{ color: 'var(--text-muted)' }} /> : <FiVolume2 size={18} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                </div>
                
                <div className="voice-helper-text" style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.85, textAlign: 'center', lineHeight: '1.6', marginTop: '4px' }}>
                    <span style={{ display: 'block', fontWeight: '600', marginBottom: '2px' }}>🎤 Hold and speak naturally</span>
                    <span style={{ fontSize: '11px', opacity: 0.75 }}>
                        "Drank 500ml water" &bull; "Walked 30 mins" &bull; "Slept 7 hours"
                    </span>
                </div>
                
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                    {showTextInput ? (
                        <form onSubmit={handleTextCommandSubmit} style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                            <input 
                                type="text" 
                                placeholder="Type log (e.g. 500ml water)..." 
                                value={textCommand} 
                                onChange={(e) => setTextCommand(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    color: 'var(--text-main)',
                                    outline: 'none'
                                }}
                            />
                            <button 
                                type="submit" 
                                className="primary-btn small" 
                                style={{ width: 'auto', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', background: 'var(--primary)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                            >
                                Log
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { setShowTextInput(false); setTextCommand(""); }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    textDecoration: 'underline'
                                }}
                            >
                                Cancel
                            </button>
                        </form>
                    ) : (
                        <button 
                            onClick={() => setShowTextInput(true)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textDecoration: 'underline',
                                fontWeight: '600'
                            }}
                        >
                            ⌨️ Can't speak? Type instead
                        </button>
                    )}
                </div>
            </div>
        </div>
        <CoinShopModal
            isOpen={shopOpen}
            onClose={() => setShopOpen(false)}
            userCoins={user?.coins || 0}
            user={user}
            onPurchaseSuccess={() => {
                setShopOpen(false);
                if (onUserRefresh) onUserRefresh();
            }}
        />
    </>
    );
};

export default AIAgentHeader;
