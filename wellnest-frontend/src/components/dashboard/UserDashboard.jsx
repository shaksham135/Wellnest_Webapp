import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FiActivity,
    FiClock,
    FiSun,
    FiAward,
    FiDroplet,
    FiMoon,
} from "react-icons/fi";

import { getWorkouts, getMeals, getWater, getSleep } from "../../api/trackerApi";
import apiClient from "../../api/apiClient";
import GoalProgress from "./GoalProgress";
import QuickActions from "./QuickActions";
import DailyProgress from "./DailyProgress";
import RecentActivity from "./RecentActivity";

const UserDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [workouts, setWorkouts] = useState([]);
    const [meals, setMeals] = useState([]);
    const [water, setWater] = useState([]);
    const [sleep, setSleep] = useState([]);
    const [goalData, setGoalData] = useState(null);
    const [streaks, setStreaks] = useState(null);

    const [healthTip, setHealthTip] = useState("");
    const [tipLoading, setTipLoading] = useState(true);

    /* ---------------- LOAD TRACKERS ---------------- */
    useEffect(() => {
        const loadTrackers = async () => {
            try {
                const [w, m, wa, s, g] = await Promise.all([
                    getWorkouts().catch(() => ({ data: [] })),
                    getMeals().catch(() => ({ data: [] })),
                    getWater().catch(() => ({ data: [] })),
                    getSleep().catch(() => ({ data: [] })),
                    apiClient.get('/analytics/summary').catch(() => ({ data: {} }))
                ]);

                setWorkouts(w.data || []);
                setMeals(m.data || []);
                setWater(wa.data || []);
                setSleep(s.data || []);

                const d = g.data || {};
                setGoalData(d.goalProgress || null);
                if (d.streaks) setStreaks(d.streaks);
            } catch { } finally {
                setLoading(false);
            }
        };

        loadTrackers();
    }, []);

    /* ---------------- DAILY HEALTH TIP ---------------- */
    useEffect(() => {
        const tips = [
            "Drink at least 8 glasses of water.",
            "Get 7–9 hours of sleep daily.",
            "Add fruits and vegetables to your meals.",
            "Walk or exercise for 30 minutes.",
            "Practice deep breathing to reduce stress."
        ];

        const tip = tips[new Date().getDate() % tips.length];
        setHealthTip(tip);
        setTipLoading(false);
    }, []);

    /* ---------------- CALCULATIONS ---------------- */
    const totalCaloriesBurned = workouts.reduce(
        (s, w) => s + (Number(w.caloriesBurned) || 0),
        0
    );

    const workoutStreak = workouts.length;
    const waterStreak = water.length;
    const sleepStreak = sleep.length;

    if (loading) {
        return <div className="dashboard-card">Loading stats...</div>;
    }

    // BMI Logic
    let bmi = "N/A";
    let bmiCategory = "Add Details";
    if (user && user.weightKg && user.heightCm) {
        const val = user.weightKg / Math.pow(user.heightCm / 100, 2);
        bmi = val.toFixed(1);
        if (val < 18.5) bmiCategory = "Underweight";
        else if (val < 25) bmiCategory = "Normal";
        else if (val < 30) bmiCategory = "Overweight";
        else bmiCategory = "Obese";
    }

    return (
        <>
            {/* 1. Dashboard Grid (Tracker, Streaks, BMI) */}
            <div className="dashboard-grid" style={{ marginBottom: '24px', maxWidth: '100%' }}>
                {/* Box 1: Tracker Summary */}
                <div className="dash-box">
                    <div className="dash-box-icon"><FiActivity /></div>
                    <h3>Tracker Summary</h3>
                    <ul>
                        <li>Workouts: <strong>{workouts.length}</strong></li>
                        <li>Calories Burned: <strong>{totalCaloriesBurned}</strong></li>
                        <li>Water Logs: <strong>{water.length}</strong></li>
                        <li>Sleep Logs: <strong>{sleep.length}</strong></li>
                    </ul>
                    <Link to="/trackers" className="link-btn">Open Trackers</Link>
                </div>

                {/* Box 2: Streaks & Goals */}
                <div className="dash-box">
                    <div className="dash-box-icon"><FiAward /></div>
                    <h3>Streaks & Goals</h3>
                    <div className="streaks-row">
                        <div className="streak">
                            <div className="streak-title"><FiActivity /> Active</div>
                            <div className="streak-value">{workoutStreak}d</div>
                        </div>
                        <div className="streak">
                            <div className="streak-title"><FiDroplet /> Hydration</div>
                            <div className="streak-value">{waterStreak}d</div>
                        </div>
                        <div className="streak">
                            <div className="streak-title"><FiMoon /> Sleep</div>
                            <div className="streak-value">{sleepStreak}d</div>
                        </div>
                    </div>
                    <Link to="/analytics" className="link-btn">View Analytics</Link>
                </div>

                {/* Box 3: BMI */}
                <div className="dash-box">
                    <div className="dash-box-icon"><FiClock /></div>
                    <h3>BMI</h3>
                    <div className="bmi-box-content">
                        <div className="bmi-value">{bmi}</div>
                        <div className="bmi-meta">
                            <div className="bmi-category">{bmiCategory}</div>
                            <div>Based on height/weight</div>
                        </div>
                    </div>
                    <Link to="/profile" className="link-btn">Calc</Link>
                </div>
            </div>

            {/* --- DIVIDER --- */}
            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--card-border)' }} />

            {/* 2. Daily Progress */}
            <DailyProgress workouts={workouts} meals={meals} water={water} />

            {/* --- DIVIDER --- */}
            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--card-border)' }} />

            {/* 3. Quick Actions */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <FiSun style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }} />
                    <h3 style={{ margin: 0 }}>Quick Actions</h3>
                </div>
                <QuickActions />
            </div>

            {/* ================= BOTTOM SECTION: Goal & Activity (Stacked Full Width) ================= */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

                {/* Row 1: Goal Progress (Full Width) */}
                <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden', maxWidth: '100%' }}>
                    <GoalProgress
                        data={goalData}
                        onGoalSet={() => {
                            apiClient.get('/analytics/summary').then(res => setGoalData(res.data.goalProgress));
                        }}
                    />
                </div>

                {/* Row 2: Recent Activity (Full Width) */}
                <div className="dashboard-card" style={{ maxWidth: '100%' }}>
                    <RecentActivity workouts={workouts} meals={meals} water={water} sleep={sleep} />
                </div>
            </div>

            {/* ================= DAILY HEALTH TIP ================= */}
            <div className="dashboard-card" style={{ maxWidth: '100%', marginTop: '24px' }}>
                <div className="dashboard-header">
                    <div className="flex gap-sm">
                        <FiSun style={{ color: "#fbbf24", fontSize: 26 }} />
                        <h3>Daily Health Tip</h3>
                    </div>
                    <p className="dashboard-subtitle">Your wellness tip for today</p>
                </div>

                {tipLoading
                    ? <p>Loading tip…</p>
                    : <p style={{ fontStyle: "italic", fontSize: 16 }}>
                        💡 {healthTip}
                    </p>}
            </div>
        </>
    );
};

export default UserDashboard;
