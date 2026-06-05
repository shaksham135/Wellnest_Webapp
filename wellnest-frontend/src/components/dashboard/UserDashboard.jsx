import React from "react";
import { useData } from "../../context/DataContext";
import DailyProgress from "./DailyProgress";
import FocusAura from "./FocusAura";
import { calculateStreak, calculateOverallStreak } from "../../utils/streakUtils";

const UserDashboard = ({ user }) => {
    const { 
        workouts, 
        meals, 
        water, 
        sleep, 
        activities,
        energyForecast,
        isTrackersLoaded,
        isSyncing
    } = useData();

    // Use global loading state to prevent flickering
    if (!isTrackersLoaded && isSyncing) {
        return <div className="dashboard-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Syncing Neural Core...</div>;
    }

    const workoutStreak = calculateStreak(workouts || [], 'performedAt');
    const waterStreak = calculateStreak(water || [], 'loggedAt');
    const sleepStreak = calculateStreak(sleep || [], 'sleepDate');
    
    const overallStreak = calculateOverallStreak(
        workouts || [],
        meals || [],
        water || [],
        sleep || [],
        activities || [],
        user?.streakShieldCount || 0
    );

    const readiness = energyForecast?.dailyReadiness !== undefined ? energyForecast.dailyReadiness : (energyForecast?.cognitiveReserve || 70);
    const factors = energyForecast?.factors || { sleep: false, hydration: false, workout: false, mental: false };

    const factorList = [
        { name: 'Sleep', active: factors.sleep, icon: '💤' },
        { name: 'Hydrate', active: factors.hydration, icon: '💧' },
        { name: 'Workout', active: factors.workout, icon: '🏃‍♂️' },
        { name: 'Mood', active: factors.mental, icon: '🧠' }
    ];

    const userOnboardKey = `userFocusGoal_${user?.id || user?.email || 'default'}`;
    const userFocusGoal = localStorage.getItem(userOnboardKey) || "Stay Hydrated 💧";
    
    const getFocusState = (r, goal) => {
        const isHydration = goal.includes("Hydrated");
        const isMuscle = goal.includes("Muscle");
        const isClean = goal.includes("Clean");
        const isSleep = goal.includes("Sleep");
        
        if (r >= 80) {
            if (isHydration) return { label: 'Peak Hydration Flow', desc: 'Your daily readiness is fully charged and hydrated. Keep sipping water to sustain this peak state.', color: '#14b8a6' };
            if (isMuscle) return { label: 'Peak Physical Readiness', desc: 'Energy levels are maxed out. Your body is fully primed for high-performance training.', color: '#14b8a6' };
            if (isClean) return { label: 'Clean Metabolism Flow', desc: 'Nutritional resonance is clear. Your brain is running on high-quality fuel.', color: '#14b8a6' };
            if (isSleep) return { label: 'Peak Sleep Recovery', desc: 'Your sleep readiness is perfect. A clean recovery cycle is guaranteed tonight.', color: '#14b8a6' };
            return { label: 'Peak Focus Flow', desc: 'Your daily readiness is fully charged. Perfect time for deep sleep and recovery.', color: '#14b8a6' };
        }
        if (r >= 50) {
            if (isHydration) return { label: 'Stable Hydration State', desc: 'Mind is steady. Remember to drink water to keep your hydration levels optimal.', color: '#6366f1' };
            if (isMuscle) return { label: 'Stable Recovery State', desc: 'Physical energy is steady. Maintain healthy meals to keep muscles fueled.', color: '#6366f1' };
            if (isClean) return { label: 'Balanced Nutrition Aura', desc: 'Metabolic energy is stable. Keep eating clean meals to nourish your mind.', color: '#6366f1' };
            if (isSleep) return { label: 'Balanced Rest Aura', desc: 'Mind and body are in equilibrium. Keep maintaining proper wind-down routine.', color: '#6366f1' };
            return { label: 'Stable Focus State', desc: 'Your mind is stable and calm. Maintain your hydration and sleep.', color: '#6366f1' };
        }
        
        if (isHydration) return { label: 'Dehydrated Aura', desc: 'Daily readiness is taxed. Drink a glass of water immediately to restore focus.', color: '#f59e0b' };
        if (isMuscle) return { label: 'Low Energy Aura', desc: 'Muscles need fuel and rest. Log a nutritious meal or schedule recovery time.', color: '#f59e0b' };
        if (isClean) return { label: 'Unstable Nutrition State', desc: 'Metabolic reserve is depleted. Eat a nutritious snack or meal to recharge.', color: '#f59e0b' };
        if (isSleep) return { label: 'Deprived Sleep Aura', desc: 'Sleep reserve is running low. Prioritize winding down early and limit blue light.', color: '#f59e0b' };
        return { label: 'Taxed Daily Readiness', desc: 'Your focus is lower today. Try logging a short break or hydrating.', color: '#f59e0b' };
    };

    const focusInfo = getFocusState(readiness, userFocusGoal);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* HERO FOCUS AURA */}
            <div className="dash-box focus-aura-card" style={{
                background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(20, 184, 166, 0.03) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '24px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '16px'
            }}>
                <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    color: focusInfo.color, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1.5px' 
                }}>
                    Focus Aura
                </span>
                
                <FocusAura reserve={readiness} />



                {/* Factors checklist */}
                <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    flexWrap: 'wrap', 
                    justifyContent: 'center', 
                    marginTop: '2px',
                    maxWidth: '320px'
                }}>
                    {factorList.map((f, idx) => (
                        <span key={idx} style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            background: f.active ? 'rgba(16, 185, 129, 0.08)' : 'var(--input-bg)',
                            color: f.active ? '#10b981' : 'var(--text-muted)',
                            border: f.active ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid var(--input-border)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {f.active ? '✓' : '✗'} {f.icon} {f.name}
                        </span>
                    ))}
                </div>
                
                <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Primary Focus
                    </span>
                    <span style={{ 
                        fontSize: '13px', 
                        fontWeight: 800, 
                        background: 'rgba(20, 184, 166, 0.08)', 
                        border: '1px solid rgba(20, 184, 166, 0.15)', 
                        padding: '6px 14px', 
                        borderRadius: '16px',
                        color: 'var(--primary)',
                        display: 'inline-block'
                    }}>
                        {userFocusGoal}
                    </span>
                </div>
            </div>

            {/* NEURAL STREAKS */}
            <div className="dash-box" style={{ 
                background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(245, 158, 11, 0.03) 100%)',
                border: (overallStreak > 0) ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid var(--card-border)',
                width: '100%',
                borderRadius: '24px',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Neural Streaks</h3>
                        {overallStreak > 0 ? (
                            <span className="header-badge streak-badge" style={{ margin: 0 }}>
                                🔥 {overallStreak} Day{overallStreak !== 1 ? 's' : ''} Active
                            </span>
                        ) : (
                            <span className="header-badge" style={{ margin: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                No Active Streak
                            </span>
                        )}
                        {user?.streakShieldCount > 0 && (
                            <span className="header-badge" style={{ margin: 0, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }} title="Streak Shields Active">
                                🛡️ x{user.streakShieldCount}
                            </span>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'Fitness', val: workoutStreak, color: '#ef4444', total: 7 },
                        { label: 'Hydration', val: waterStreak, color: '#3b82f6', total: 7 },
                        { label: 'Recovery', val: sleepStreak, color: '#8b5cf6', total: 7 }
                    ].map(s => (
                        <div key={s.label}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{s.label} Streak</span>
                                <span style={{ fontWeight: 900, color: s.val > 0 ? s.color : 'var(--text-muted)' }}>{s.val} Day{s.val !== 1 ? 's' : ''}</span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${Math.min((s.val/s.total)*100, 100)}%`, 
                                    height: '100%', 
                                    background: s.color,
                                    boxShadow: `0 0 10px ${s.color}60`
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DAILY PROGRESS BARS */}
            <DailyProgress workouts={workouts} meals={meals} water={water} activities={activities} />

        </div>
    );
};

export default UserDashboard;
