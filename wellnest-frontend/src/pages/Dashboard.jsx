// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiActivity,
  FiTrendingUp,
  FiClock,
  FiSun,
  FiAward,
  FiDroplet,
  FiMoon
} from "react-icons/fi";

import { fetchCurrentUser } from "../api/userApi";
import { getWorkouts, getMeals, getWater, getSleep } from "../api/trackerApi";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [water, setWater] = useState([]);
  const [sleep, setSleep] = useState([]);

  const [healthTip, setHealthTip] = useState("");
  const [tipLoading, setTipLoading] = useState(true);

  /* ---------------- AUTH CHECK ---------------- */
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
      } catch {
        setError("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  /* ---------------- LOAD TRACKERS ---------------- */
  useEffect(() => {
    const loadTrackers = async () => {
      try {
        const [w, m, wa, s] = await Promise.all([
          getWorkouts().catch(() => ({ data: [] })),
          getMeals().catch(() => ({ data: [] })),
          getWater().catch(() => ({ data: [] })),
          getSleep().catch(() => ({ data: [] }))
        ]);

        setWorkouts(w.data || []);
        setMeals(m.data || []);
        setWater(wa.data || []);
        setSleep(s.data || []);
      } catch { }
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

  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">Loading dashboard…</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">{error}</div>
      </div>
    );
  }

  /* ===================== RENDER ===================== */
  return (
    <div className="dashboard-page">

      {/* ================= TOP DASHBOARD ================= */}
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1>Hey, {user.name}</h1>
            <p className="dashboard-subtitle">
              Welcome to your smart health & fitness hub
            </p>
          </div>
        </div>

        {/* ====== TOP 3 CARDS ONLY ====== */}
        <div className="dashboard-grid">

          {/* Tracker Summary */}
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

          {/* Streaks & Goals */}
          <div className="dash-box">
            <div className="dash-box-icon"><FiAward /></div>
            <h3>Streaks & Goals</h3>

            <div className="streaks-row">
              <div className="streak">
                <div className="streak-title"><FiActivity /> Workouts</div>
                <div className="streak-value">{workoutStreak} days</div>
              </div>

              <div className="streak">
                <div className="streak-title"><FiDroplet /> Water</div>
                <div className="streak-value">{waterStreak} days</div>
              </div>

              <div className="streak">
                <div className="streak-title"><FiMoon /> Sleep</div>
                <div className="streak-value">{sleepStreak} days</div>
              </div>
            </div>

            <Link to="/analytics" className="link-btn">View Analytics</Link>
          </div>

          {/* BMI */}
          <div className="dash-box bmi-box">
            <div className="dash-box-icon"><FiClock /></div>
            <h3>BMI Calculator</h3>

            {user.weightKg && user.heightCm ? (() => {
              const bmi =
                user.weightKg /
                Math.pow(user.heightCm / 100, 2);

              const category =
                bmi < 18.5 ? "Underweight" :
                  bmi < 25 ? "Normal" :
                    bmi < 30 ? "Overweight" : "Obese";

              return (
                <>
                  <div className="bmi-box-content">
                    <div className="bmi-value">{bmi.toFixed(1)}</div>
                    <div className="bmi-category">{category}</div>
                  </div>
                  <div className="bmi-meta">
                    Weight {user.weightKg}kg • Height {user.heightCm}cm
                  </div>
                </>
              );
            })() : (
              <p className="muted">Add height & weight to see BMI</p>
            )}

            <Link to="/bmi-calculator" className="link-btn">Recalculate</Link>
          </div>

        </div>

        <p className="role-pill">
          Logged in as {user.role?.replace("ROLE_", "")}
        </p>
      </div>

      {/* ================= SET WEIGHT GOAL ================= */}
      <div className="dashboard-card" style={{ marginTop: 24 }}>
        <h3>Set a Weight Goal</h3>
        <p className="muted">Enter your target weight to get started.</p>

        <input
          type="number"
          placeholder="Target Weight (kg)"
          style={{ marginTop: 12 }}
        />

        <button className="primary-btn" style={{ marginTop: 16 }}>
          Set Goal
        </button>
      </div>

      {/* ================= TRAINER SETTINGS ================= */}
      {(user.role === 'ROLE_TRAINER' || user.role === 'TRAINER') && (
        <div className="dashboard-card" style={{ marginTop: 24, border: '1px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
          <div className="dashboard-header">
            <div className="flex gap-sm">
              <FiActivity style={{ color: "var(--primary)", fontSize: 26 }} />
              <h3>Trainer Profile Settings</h3>
            </div>
            <p className="dashboard-subtitle">Update your availability and details for clients</p>
          </div>

          <TrainerSettingsForm userEmail={user.email} />
        </div>
      )}

      {/* ================= DAILY HEALTH TIP ================= */}
      <div className="dashboard-card" style={{ marginTop: 24 }}>
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

    </div>
  );
};

const TrainerSettingsForm = () => {
  const [formData, setFormData] = useState({
    location: '',
    specialties: '',
    bio: ''
  });
  const [msg, setMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      // Convert comma string to list
      const payload = {
        ...formData,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s)
      };
      await import("../api/trainerApi").then(mod => mod.updateTrainerProfile(payload));
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setMsg('Failed to update.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="input-group">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Location (City or 'Online')</label>
        <input
          type="text"
          name="location"
          className="auth-input"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g. New York"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
        />
      </div>
      <div className="input-group">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Specialties (comma separated)</label>
        <input
          type="text"
          name="specialties"
          className="auth-input"
          value={formData.specialties}
          onChange={handleChange}
          placeholder="e.g. Yoga, Weight Loss, HIIT"
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
        />
      </div>
      <div className="input-group">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell clients about yourself..."
          rows={3}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
        />
      </div>
      <button className="primary-btn" onClick={handleSubmit}>Save Changes</button>
      {msg && <p style={{ color: msg.includes('Failed') ? 'red' : 'green', marginTop: '8px' }}>{msg}</p>}
    </div>
  );
};

export default Dashboard;
