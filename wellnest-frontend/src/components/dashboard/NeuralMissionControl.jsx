import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCpu } from 'react-icons/fi';
import { toLocalDateString } from '../../utils/streakUtils';

const NeuralMissionControl = ({ user, activities, sleep, water, meals, onOpenChat }) => {
  const navigate = useNavigate();
  const today = toLocalDateString(new Date());
  
  // Safe checks for arrays
  const todayActivity = activities?.find(a => toLocalDateString(a.date) === today || toLocalDateString(a.createdAt) === today);
  const stepsToday = todayActivity ? (todayActivity.steps || 0) : 0;

  const waterTodayLogs = water?.filter(w => toLocalDateString(w.loggedAt || w.createdAt) === today) || [];
  const waterTotal = waterTodayLogs.reduce((acc, curr) => acc + (curr.liters || curr.amountLiters || curr.amount || 0), 0);

  const sleepToday = sleep?.find(s => toLocalDateString(s.sleepDate || s.createdAt) === today);
  const sleepHours = sleepToday ? (sleepToday.hours || 0) : 0;

  const mealsTodayLogs = meals?.filter(m => toLocalDateString(m.loggedAt || m.createdAt) === today) || [];
  const mealsCount = mealsTodayLogs.length;

  const targetWater = user?.targetWaterLiters || 2.0;
  const targetSteps = user?.targetSteps || 10000;
  const targetSleep = user?.targetSleepHours || 8.0;

  // Logic to determine the "Next Best Action"
  const getNextAction = () => {
    if (!sleepToday) {
      return {
        title: "Morning Sync Needed",
        description: "Log your sleep to unlock today's Neural Readiness score.",
        action: "Sync Sleep",
        route: "/trackers?tab=sleep",
        icon: "💤"
      };
    }

    if (waterTotal < targetWater) {
      return {
        title: "Hydration Alert",
        description: `Your hydration level is low (${waterTotal.toFixed(1)}L / ${targetWater}L). Drink water for metabolic focus.`,
        action: "Log Water",
        route: "/trackers?tab=water",
        icon: "💧"
      };
    }

    if (stepsToday < 3000) {
      return {
        title: "Physical Activation",
        description: "You've been sedentary. A quick 5-min walk will boost energy and step count.",
        action: "Track Steps",
        route: "/trackers?tab=activity",
        icon: "🚶‍♂️"
      };
    }

    if (mealsCount < 2) {
      return {
        title: "Nutritional Gaps",
        description: "Log your meals to ensure your protein and nutrient intake is tracked.",
        action: "Log Meal",
        route: "/trackers?tab=meal",
        icon: "🥗"
      };
    }

    return {
      title: "Resonance Achieved",
      description: "You are in the Optimal Zone. Keep this momentum for a 7-day streak!",
      action: "View Analytics",
      route: "/analytics",
      icon: "✨"
    };
  };

  const mission = getNextAction();

  // Calculate resonance based on targets
  const sleepProgress = targetSleep > 0 ? Math.min(sleepHours / targetSleep, 1.0) : 0;
  const waterProgress = targetWater > 0 ? Math.min(waterTotal / targetWater, 1.0) : 0;
  const stepsProgress = targetSteps > 0 ? Math.min(stepsToday / targetSteps, 1.0) : 0;
  const mealsProgress = Math.min(mealsCount / 3, 1.0);

  const resonancePercent = Math.round(((sleepProgress + waterProgress + stepsProgress + mealsProgress) / 4) * 100);

  return (
    <div className="neural-mission-card" style={{
      background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(99, 102, 241, 0.05) 100%)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid var(--card-border)',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px',
        width: '150px', height: '150px',
        background: 'var(--primary)', filter: 'blur(100px)',
        opacity: 0.1, pointerEvents: 'none'
      }} />

      <div className="mission-flex-container">
        <div style={{
          width: '56px', height: '56px', borderRadius: '18px',
          background: 'var(--bg-main)', border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {mission.icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
             <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                CURRENT MISSION
             </span>
             <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
             <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
             </span>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            {mission.title}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {mission.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => navigate(mission.route)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 20px', borderRadius: '14px',
                background: 'var(--primary)', color: '#fff',
                border: 'none', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
              }}
            >
              {mission.action} <FiArrowRight />
            </button>

            {onOpenChat && (
              <button 
                onClick={onOpenChat}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-muted)',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <FiCpu /> Ask AI
              </button>
            )}
          </div>
        </div>

        {/* Progress Circle (Mini) */}
        <div className="mission-resonance-wrapper">
             <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--card-border)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${resonancePercent}, 100`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {resonancePercent}%
                </div>
             </div>
             <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>RESONANCE</span>
        </div>
      </div>
    </div>
  );
};

export default NeuralMissionControl;
