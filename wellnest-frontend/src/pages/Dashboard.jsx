// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiActivity,
  FiTrendingUp,
  FiTarget,
  FiClock,
  FiSun,
  FiAward,
  FiDroplet,
  FiMoon
} from "react-icons/fi";

import { fetchCurrentUser } from "../api/userApi";
import { getWorkouts, getMeals, getWater, getSleep } from "../api/trackerApi";
import apiClient from "../api/apiClient";
import GoalProgress from "../components/dashboard/GoalProgress";

/**
 * Dashboard.jsx
 * - Tracker Summary (left) - enhanced with sparklines
 * - Streaks & Goals (center) - streaks + progress bars
 * - BMI Calculator (right) - shows calculated BMI if profile has data
 * - Daily Health Tip card below
 *
 * Be sure api functions (getWorkouts, getMeals, ...) exist in src/api/trackerApi.js
 */

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // tracker states
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [water, setWater] = useState([]);
  const [sleep, setSleep] = useState([]);
  const [loadingTrackers, setLoadingTrackers] = useState(true);

  // health tip states
  const [healthTip, setHealthTip] = useState("");
  const [tipLoading, setTipLoading] = useState(true);
  const [tipBackground, setTipBackground] = useState("");

  // goal progress state
  const [goalData, setGoalData] = useState(null);
  const [loadingGoal, setLoadingGoal] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const loadUser = async () => {
      try {
        const res = await fetchCurrentUser();
        setUser(res.data);
      } catch (err) {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  // load trackers
  useEffect(() => {
    const loadTrackers = async () => {
      setLoadingTrackers(true);
      try {
        const [wRes, mRes, waRes, sRes] = await Promise.all([
          getWorkouts().catch(() => ({ data: [] })),
          getMeals().catch(() => ({ data: [] })),
          getWater().catch(() => ({ data: [] })),
          getSleep().catch(() => ({ data: [] })),
        ]);
        setWorkouts(wRes.data || []);
        setMeals(mRes.data || []);
        setWater(waRes.data || []);
        setSleep(sRes.data || []);
      } finally {
        setLoadingTrackers(false);
      }
    };
    loadTrackers();
  }, []);

  // health tip (light fallback)
  useEffect(() => {
    const cachedTip = localStorage.getItem("dailyHealthTip");
    const cachedDate = localStorage.getItem("healthTipDate");
    const cachedBackground = localStorage.getItem("healthTipBackground");
    const today = new Date().toDateString();

    if (cachedTip && cachedDate === today && cachedBackground !== null) {
      setHealthTip(cachedTip);
      setTipBackground(cachedBackground);
      setTipLoading(false);
      return;
    }

    // simple deterministic fallback tip
    const tips = [
      "Drink at least 8 glasses of water.",
      "Get 7–9 hours of sleep daily.",
      "Add fruits and greens to your meals.",
      "Walk or exercise for 30 minutes.",
      "Practice deep breathing to reduce stress."
    ];
    const idx = new Date().getDate() % tips.length;
    const tip = tips[idx];
    const bg = ""; // keep blank to avoid heavy remote images
    setHealthTip(tip);
    setTipBackground(bg);
    localStorage.setItem('dailyHealthTip', tip);
    localStorage.setItem('healthTipDate', today);
    localStorage.setItem('healthTipBackground', bg);
    setTipLoading(false);
  }, []);

  // load goal progress data
  useEffect(() => {
    const loadGoalProgress = async () => {
      setLoadingGoal(true);
      try {
        const res = await apiClient.get("/analytics/summary");
        setGoalData(res.data.goalProgress);
      } catch (err) {
        console.error("Failed to load goal progress data:", err);
      } finally {
        setLoadingGoal(false);
      }
    };
    loadGoalProgress();
  }, []);

  // ---------- Helper functions for parsing dates, streaks, and metrics ----------

  // Parse common date fields in backend entries
  const parseEntryDate = (entry) => {
    if (!entry) return null;
    const dateKeys = ["performedAt","loggedAt","logged_at","performed_at","createdAt","created_at","date","sleepDate","loggedDate","timestamp"];
    for (const k of dateKeys) {
      if (entry[k]) {
        const d = new Date(entry[k]);
        if (!isNaN(d)) return d;
      }
    }
    // if entry itself is string ISO
    if (typeof entry === "string") {
      const d = new Date(entry);
      if (!isNaN(d)) return d;
    }
    return null;
  };

  // day key for local date: YYYY-MM-DD
  const dayKey = (date) => {
    if (!(date instanceof Date)) date = new Date(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // build a set of dayKeys from entries
  const buildDaySet = (entries) => {
    const s = new Set();
    (entries || []).forEach(e => {
      const d = parseEntryDate(e);
      if (d) s.add(dayKey(d));
    });
    return s;
  };

  // calculate consecutive-day streak up to today (inclusive)
  const calcStreakUpToToday = (daysSet) => {
    let count = 0;
    let cur = new Date();
    while (true) {
      const k = dayKey(cur);
      if (daysSet.has(k)) {
        count += 1;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }
    return count;
  };

  // get numeric liters from a water entry tolerant to field names
  const litersFromEntry = (e) => {
    if (!e) return 0;
    const keys = ["amountLiters","amount","liters","volume"];
    for (const k of keys) {
      if (e[k] !== undefined && e[k] !== null && e[k] !== "") {
        const v = Number(e[k]);
        if (!isNaN(v)) return v;
      }
    }
    return 0;
  };

  // start of week (Monday) for given date
  const startOfWeek = (d) => {
    const day = new Date(d);
    const diff = (day.getDay() + 6) % 7; // Monday = 0
    day.setDate(day.getDate() - diff);
    day.setHours(0,0,0,0);
    return day;
  };

  // volume of water this week (sum)
  const thisWeekStart = startOfWeek(new Date());
  const waterThisWeek = (water || []).reduce((sum, w) => {
    const d = parseEntryDate(w);
    if (!d) return sum;
    if (d >= thisWeekStart) return sum + litersFromEntry(w);
    return sum;
  }, 0);

  // avg sleep hours in recent ~2 weeks
  const avgSleepHours = (() => {
    if (!sleep || sleep.length === 0) return 0;
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
    let total = 0, count = 0;
    for (const s of sleep) {
      const d = parseEntryDate(s);
      if (!d) continue;
      if (d >= twoWeeksAgo) {
        const hours = (s.hours !== undefined && s.hours !== null) ? Number(s.hours) : (s.durationHours || s.hoursSlept || null);
        if (hours !== null && !isNaN(hours)) {
          total += hours; count++;
        }
      }
    }
    return count ? (total / count) : 0;
  })();

  // build day sets for streaks
  const workoutDays = buildDaySet(workouts);
  const waterDays = buildDaySet(water);
  const sleepDays = buildDaySet(sleep);

  const workoutStreak = calcStreakUpToToday(workoutDays);
  const waterStreak = calcStreakUpToToday(waterDays);
  const sleepStreak = calcStreakUpToToday(sleepDays);

  // Goals (tweakable constants)
  const WORKOUT_MONTH_TARGET = 20;
  const WATER_WEEK_TARGET_LITERS = 21;
  const SLEEP_TARGET_HOURS = 7;

  // workouts this calendar month
  const workoutsThisMonth = (workouts || []).filter(w => {
    const d = parseEntryDate(w);
    if (!d) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // helper % clamp
  const pct = (value, target) => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((value / target) * 100)));
  };

  // quick totals
  const totalCaloriesBurned = workouts.reduce((s, w) => s + (Number(w.caloriesBurned) || 0), 0);
  const totalCaloriesConsumed = meals.reduce((s, m) => s + (Number(m.calories) || 0), 0);

  // ---------- Render ----------
  if (loading) return <div className="dashboard-page"><div className="dashboard-card">Loading dashboard…</div></div>;
  if (error || !user) return <div className="dashboard-page"><div className="dashboard-card">{error || "Something went wrong"}</div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1>Hey, {user.name}</h1>
            <p className="dashboard-subtitle">Welcome to your smart health & fitness hub</p>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* ---------- Tracker Summary (left) ---------- */}
          <div className="dash-box">
            <div className="dash-box-icon"><FiActivity /></div>
            <h3>Tracker Summary</h3>

            {loadingTrackers ? <p>Loading tracker data…</p> : (
              <>
                <div className="stats-grid">

                  {/* Workouts */}
                  <div className="stat">
                    <div className="stat-left">
                      <div className="stat-icon-circle"><FiActivity /></div>
                      <div>
                        <div className="stat-label">Workouts</div>
                        <div className="stat-value">{workouts.length}</div>
                      </div>
                    </div>
                    <div className="stat-right">
                      <div className="stat-sub">Calories: <strong>{totalCaloriesBurned}</strong></div>
                      <div className="sparkline">
                        {workouts.length ? (() => {
                          const points = workouts.slice(-8).map(w => Number(w.durationMinutes ?? w.duration ?? 0));
                          const max = Math.max(...points, 1);
                          const path = points.map((v,i) => `${(i/(points.length-1||1))*100},${100 - (v/max*100)}`).join(' ');
                          return <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><polyline points={path} fill="none" stroke="rgba(96,165,250,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
                        })() : <div className="sparkline-placeholder">No data</div>}
                      </div>
                    </div>
                  </div>

                  {/* Meals */}
                  <div className="stat">
                    <div className="stat-left">
                      <div className="stat-icon-circle alt"><FiTrendingUp /></div>
                      <div>
                        <div className="stat-label">Meals</div>
                        <div className="stat-value">{meals.length}</div>
                      </div>
                    </div>
                    <div className="stat-right">
                      <div className="stat-sub">Calories: <strong>{totalCaloriesConsumed}</strong></div>
                      <div className="sparkline">
                        {meals.length ? (() => {
                          const points = meals.slice(-8).map(m => Number(m.calories ?? 0));
                          const max = Math.max(...points, 1);
                          const path = points.map((v,i) => `${(i/(points.length-1||1))*100},${100 - (v/max*100)}`).join(' ');
                          return <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={path} fill="none" stroke="rgba(52,211,153,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
                        })() : <div className="sparkline-placeholder">No data</div>}
                      </div>
                    </div>
                  </div>

                  {/* Water */}
                  <div className="stat">
                    <div className="stat-left">
                      <div className="stat-icon-circle water"><FiDroplet /></div>
                      <div>
                        <div className="stat-label">Water</div>
                        <div className="stat-value">{waterThisWeek.toFixed(2)} L</div>
                      </div>
                    </div>
                    <div className="stat-right">
                      <div className="stat-sub">This week</div>
                      <div className="sparkline">
                        {water.length ? (() => {
                          const points = water.slice(-8).map(w => litersFromEntry(w));
                          const max = Math.max(...points, 1);
                          const path = points.map((v,i) => `${(i/(points.length-1||1))*100},${100 - (v/max*100)}`).join(' ');
                          return <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={path} fill="none" stroke="rgba(59,130,246,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
                        })() : <div className="sparkline-placeholder">No data</div>}
                      </div>
                    </div>
                  </div>

                  {/* Sleep */}
                  <div className="stat">
                    <div className="stat-left">
                      <div className="stat-icon-circle sleep"><FiMoon /></div>
                      <div>
                        <div className="stat-label">Sleep</div>
                        <div className="stat-value">{avgSleepHours ? avgSleepHours.toFixed(1) : 0} h</div>
                      </div>
                    </div>
                    <div className="stat-right">
                      <div className="stat-sub">Avg (recent)</div>
                      <div className="sparkline">
                        {sleep.length ? (() => {
                          const points = sleep.slice(-8).map(s => Number(s.hours ?? s.durationHours ?? 0));
                          const max = Math.max(...points, 1);
                          const path = points.map((v,i) => `${(i/(points.length-1||1))*100},${100 - (v/max*100)}`).join(' ');
                          return <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={path} fill="none" stroke="rgba(99,102,241,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
                        })() : <div className="sparkline-placeholder">No data</div>}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="summary-cta" style={{ marginTop: 12 }}>
                  <Link to="/trackers" className="link-btn primary">Open Trackers</Link>
                  <Link to="/bmi-calculator" className="link-btn outline">BMI</Link>
                </div>
              </>
            )}
          </div>

          {/* ---------- Streaks & Goals (center) ---------- */}
          <div className="dash-box">
            <div className="dash-box-icon"><FiAward /></div>
            <h3>Streaks & Goals</h3>

            <div className="streaks-row" style={{ marginTop: 8, marginBottom: 10 }}>
              <div className="streak">
                <div className="streak-title"><FiActivity /> Workouts</div>
                <div className="streak-value">{workoutStreak} <span className="small">days</span></div>
              </div>

              <div className="streak">
                <div className="streak-title"><FiDroplet /> Water</div>
                <div className="streak-value">{waterStreak} <span className="small">days</span></div>
              </div>

              <div className="streak">
                <div className="streak-title"><FiMoon /> Sleep</div>
                <div className="streak-value">{sleepStreak} <span className="small">days</span></div>
              </div>
            </div>

            <hr style={{ margin: "12px 0", opacity: 0.06 }} />

            <div className="goal-row">
              <div className="goal-label">Workouts this month</div>
              <div className="goal-progress">
                <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${pct(workoutsThisMonth, WORKOUT_MONTH_TARGET)}%` }} /></div>
                <div className="goal-meta">{workoutsThisMonth} / {WORKOUT_MONTH_TARGET}</div>
              </div>

              <div className="goal-label">Water (week)</div>
              <div className="goal-progress">
                <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${pct(waterThisWeek, WATER_WEEK_TARGET_LITERS)}%` }} /></div>
                <div className="goal-meta">{waterThisWeek.toFixed(1)} L / {WATER_WEEK_TARGET_LITERS} L</div>
              </div>

              <div className="goal-label">Avg Sleep (recent)</div>
              <div className="goal-progress">
                <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${pct(avgSleepHours, SLEEP_TARGET_HOURS)}%` }} /></div>
                <div className="goal-meta">{avgSleepHours ? avgSleepHours.toFixed(1) : 0} / {SLEEP_TARGET_HOURS} hrs</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Link to="/trackers" className="link-btn">View full trackers</Link>
            </div>
          </div>

          {/* ---------- BMI Calculator (right) ---------- */}
          <div className="dash-box bmi-box">
            <div className="dash-box-icon"><FiClock /></div>
            <h3>BMI Calculator</h3>
            <p className="muted">Calculate your Body Mass Index and check your health</p>

            {user && user.weightKg && user.heightCm ? (() => {
              const weight = Number(user.weightKg);
              const heightMeters = Number(user.heightCm) / 100;
              const bmi = (weight / (heightMeters * heightMeters));
              const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
              return (
                <div className="bmi-box-content">
                  <div className="bmi-value">{bmi.toFixed(1)}</div>
                  <div className="bmi-category">{category}</div>
                  <div className="bmi-meta small">Weight {weight}kg • Height {user.heightCm}cm</div>
                  <Link to="/bmi-calculator" className="link-btn">Recalculate</Link>
                </div>
              );
            })() : (
              <div className="bmi-empty">
                <p className="small">We don't have height & weight on file. Add them to profile to see your BMI here.</p>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Link to="/profile" className="link-btn outline">Update Profile</Link>
                  <Link to="/bmi-calculator" className="link-btn">Calculate Manually</Link>
                </div>
              </div>
            )}
          </div>

        </div>

        <p className="role-pill">Logged in as {user?.role ? user.role.replace("ROLE_","") : "User"}</p>
      </div>

      {/* Goal Progress Summary */}
      {!loadingGoal && goalData && (
          <div className="dashboard-card" style={{ marginTop: 20 }}>
              <div className="dash-box">
                  <GoalProgress data={goalData} />
                  <div style={{ marginTop: 12 }}>
                      <Link to="/analytics" className="link-btn">View Detailed Analytics</Link>
                  </div>
              </div>
          </div>
      )}

      {/* ---------- Health Tip card ---------- */}
      <div className="dashboard-card" style={{
        marginTop: 20,
        minHeight: 220,
        backgroundImage: tipBackground ? `url(${tipBackground})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}>
        <div className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiSun style={{ color: "#fbbf24", fontSize: 28 }} />
            <h2>Daily Health Tip</h2>
          </div>
          <p className="dashboard-subtitle">Your wellness tip for today</p>
        </div>
        <div style={{ padding: "20px 26px", marginTop: "auto" }}>
          {tipLoading ? <p>Loading tip…</p> : <p style={{ fontSize: 16, fontStyle: "italic" }}>💡 {healthTip}</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
