import React from 'react';
import { FiZap, FiDroplet, FiPieChart } from 'react-icons/fi';

const DailyProgress = ({ workouts, meals, water }) => {
    // Filter for TODAY
    const isToday = (dateString) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    // --- CALORIES ---
    const todayBurned = workouts
        .filter(w => isToday(w.performedAt))
        .reduce((a, b) => a + (Number(b.caloriesBurned) || 0), 0);

    const todayConsumed = meals
        .filter(m => isToday(m.loggedAt))
        .reduce((a, b) => a + (Number(b.calories) || 0), 0);

    const netCalories = todayConsumed - todayBurned;

    // Target assumptions (can be dynamic later)
    const targetCalories = 2200;
    const progressPercent = Math.min((todayConsumed / targetCalories) * 100, 100);


    // --- WATER ---
    const todayWater = water
        .filter(w => isToday(w.loggedAt))
        .reduce((a, b) => a + (Number(b.liters) || Number(b.amountLiters) || 0), 0);

    const targetWater = 2.5; // L
    const waterPercent = Math.min((todayWater / targetWater) * 100, 100);

    // --- MACROS ---
    const todayMacros = meals
        .filter(m => isToday(m.loggedAt))
        .reduce((acc, m) => {
            acc.p += (Number(m.protein) || 0);
            acc.c += (Number(m.carbs) || 0);
            acc.f += (Number(m.fats) || 0);
            return acc;
        }, { p: 0, c: 0, f: 0 });

    return (
        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>

            {/* Calories Card */}
            <div className="analytics-box" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        <FiZap />
                    </div>
                    <h4 style={{ margin: 0 }}>Calories</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="muted">Consumed</span>
                    <span style={{ fontWeight: 'bold' }}>{todayConsumed} / {targetCalories}</span>
                </div>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: '#ef4444', borderRadius: '4px' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <div>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>Burned</div>
                        <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>{todayBurned} kcal</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>Net</div>
                        <div style={{ fontWeight: 'bold', color: netCalories > 0 ? '#10b981' : '#f59e0b' }}>
                            {netCalories > 0 ? '+' : ''}{netCalories}
                        </div>
                    </div>
                </div>
            </div>

            {/* Water Card */}
            <div className="analytics-box" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>
                        <FiDroplet />
                    </div>
                    <h4 style={{ margin: 0 }}>Hydration</h4>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9', lineHeight: 1 }}>{todayWater.toFixed(1)}</span>
                    <span className="muted" style={{ marginBottom: '6px' }}>/ {targetWater} L</span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: `${waterPercent}%`, height: '100%', background: '#0ea5e9', borderRadius: '4px' }}></div>
                </div>
                <p className="muted" style={{ fontSize: '0.85rem' }}>
                    {todayWater >= targetWater ? '🎉 Daily goal reached!' : 'Keep drinking water!'}
                </p>
            </div>

            {/* Macros Card */}
            <div className="analytics-box" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                        <FiPieChart />
                    </div>
                    <h4 style={{ margin: 0 }}>Macros (Today)</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#f87171' }}>{todayMacros.p}g</div>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>Protein</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--card-border)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fbbf24' }}>{todayMacros.c}g</div>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>Carbs</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--card-border)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#34d399' }}>{todayMacros.f}g</div>
                        <div className="muted" style={{ fontSize: '0.8rem' }}>Fats</div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DailyProgress;
