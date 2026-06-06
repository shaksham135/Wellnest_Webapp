import React from 'react';
import { FiZap, FiTrendingUp, FiAward } from 'react-icons/fi';

const StreakCard = ({ workouts = [], meals = [], water = [] }) => {
    
    const calculateStreak = () => {
        let streak = 0;
        const today = new Date();
        
        // Loop backwards for the last 30 days
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date();
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toLocaleDateString('en-CA');

            const hasWorkout = workouts.some(w => w.date === dateStr);
            const hasMeal = meals.some(m => m.date === dateStr);
            const hasWater = water.some(w => w.date === dateStr);

            if (hasWorkout || hasMeal || hasWater) {
                streak++;
            } else {
                // If we miss today, streak might still be alive from yesterday
                if (i === 0) continue; 
                break;
            }
        }
        return streak;
    };

    const currentStreak = calculateStreak();

    const getStreakMessage = (count) => {
        if (count === 0) return "Let's start your streak today! 💪";
        if (count === 1) return "First step taken! Keep it up. 🔥";
        if (count < 3) return "You're on fire! Don't break it. 🚀";
        return `${count} days strong! You're becoming consistent. 🏆`;
    };

    return (
        <div className="card layered-glass streak-card" style={{ 
            padding: '24px', 
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(255, 69, 0, 0.02) 100%)',
            border: '1px solid rgba(255, 165, 0, 0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '12px', 
                    background: '#f59e0b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                }}>
                    <FiZap style={{ fontSize: '20px', color: 'white' }} />
                </div>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#f59e0b', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Active Streak
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)' }}>
                        {currentStreak} Day{currentStreak !== 1 ? 's' : ''} 🔥
                    </div>
                </div>
            </div>
            
            <p style={{ margin: '16px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {getStreakMessage(currentStreak)}
            </p>

            {currentStreak > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                    <FiAward /> Consistency Achievement Unlocked
                </div>
            )}
        </div>
    );
};

export default StreakCard;
