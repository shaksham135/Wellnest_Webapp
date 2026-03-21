// src/pages/Trackers.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  createWorkout,
  createMeal,
  createWater,
  createSleep,
  createActivity,
  getWorkouts,
  getMeals,
  getWater,
  getSleep,
  getActivity,
  deleteWorkout,
  deleteMeal,
  deleteWater,
  deleteSleep,
  deleteActivity,
} from "../api/trackerApi";
import 'react-circular-progressbar/dist/styles.css';
import { FiTrash2, FiZap, FiZapOff, FiRefreshCw } from "react-icons/fi";

import toast from "react-hot-toast";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

// Capacitor Native Bridge setup (Conditional imports to avoid web crashes)
let Health = null;
let Capacitor = null;
try {
  if (window.Capacitor) {
    Capacitor = window.Capacitor;
  }
} catch (e) { console.log("Native bridge not found"); }

const Trackers = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "workout");

  // Support for deep linking via query params (?tab=water)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryTab = params.get("tab");
    if (queryTab && ["workout", "meal", "water", "sleep", "activity"].includes(queryTab)) {
      setTab(queryTab);
    }
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  // message state removed in favor of toast

  // Workout
  const [workout, setWorkout] = useState({
    type: "cardio",
    durationMinutes: 30,
    caloriesBurned: "",
    notes: "",
  });

  const [userWeight, setUserWeight] = useState(70);
  const [calculatedCalories, setCalculatedCalories] = useState(0);

  // Meal
  const [meal, setMeal] = useState({
    mealType: "breakfast",
    calories: 300,
    protein: "",
    carbs: "",
    fats: "",
    notes: "",
  });

  // Water
  const [water, setWater] = useState({
    amountLiters: 0.5,
    notes: "",
  });

  // Sleep
  const [sleep, setSleep] = useState({
    hours: 7,
    quality: "good",
    notes: "",
  });
  const [calculatedSleepQuality, setCalculatedSleepQuality] = useState({
    quality: "good",
    feedback: "",
    color: "#22c55e"
  });

  // Daily Activity
  const [activity, setActivity] = useState({
    steps: 0,
    activeCalories: 0,
    distanceKm: 0.0
  });

  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [recentWater, setRecentWater] = useState([]);
  const [recentSleep, setRecentSleep] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Goal Targets
  const [targets, setTargets] = useState({
    targetWorkoutsPerWeek: 4,
    targetWaterLiters: 2.0,
    targetSleepHours: 8.0,
    targetSteps: 10000,
    targetActiveCalories: 500,
    targetDistanceKm: 5.0
  });
  const [editingGoal, setEditingGoal] = useState(null);
  const [tempGoalValue, setTempGoalValue] = useState("");

  // Mobile Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveSteps, setLiveSteps] = useState(0);
  const [permissionState, setPermissionState] = useState("unsupported"); // unsupported, prompt, granted, active

  const handleOpenEditGoal = (goalKey, currentValue) => {
    setEditingGoal(goalKey);
    setTempGoalValue(currentValue);
  };

  const handleSaveGoal = async () => {
    try {
      const payload = { ...targets, [editingGoal]: Number(tempGoalValue) };
      const { updateUserTargets } = await import("../api/userApi");
      await updateUserTargets(payload);
      setTargets(payload);
      setEditingGoal(null);
      toast.success("Goal updated!", { style: { background: '#333', color: '#fff' }});
    } catch (err) {
      toast.error("Failed to update goal");
    }
  };

  // Helper functions for daily/weekly totals
  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return d >= startOfWeek;
  };

  // Live Aggregations
  const workoutsThisWeek = recentWorkouts.filter(w => isThisWeek(w.performedAt || w.createdAt)).length;
  const waterToday = recentWater.filter(w => isToday(w.loggedAt || w.createdAt || w.date)).reduce((sum, w) => sum + (w.liters || w.amountLiters || w.amount || 0), 0);
  
  const sleepLogsLast24h = recentSleep.filter(s => {
    const d = new Date(s.sleepDate || s.createdAt || s.date);
    return Date.now() - d.getTime() < 48 * 60 * 60 * 1000;
  });
  const recentSleepHours = sleepLogsLast24h.length > 0 ? sleepLogsLast24h[0].hours : 0;
  
  const activityToday = recentActivity.find(a => isToday(a.date || a.createdAt)) || { steps: 0, activeCalories: 0, distanceKm: 0 };

  // --- Step Counter Engine ---
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let threshold = 12; // Adjusted for walking/jogging
    let lastUpdate = 0;

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      const currentTime = Date.now();

      if ((currentTime - lastUpdate) > 100) {
        const diff = Math.abs(x + y + z - lastX - lastY - lastZ);
        if (diff > threshold) {
          setLiveSteps(prev => prev + 1);
        }
        lastX = x; lastY = y; lastZ = z;
        lastUpdate = currentTime;
      }
    };

    if (isSyncing) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isSyncing]);

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          setIsSyncing(true);
          setPermissionState("active");
        }
      } catch (err) {
        toast.error("Motion permission denied");
      }
    } else {
      setIsSyncing(true);
      setPermissionState("active");
    }
  };

  // --- Native Health Connect / HealthKit Engine ---
  const [healthStatus, setHealthStatus] = useState("disconnected"); // disconnected, authorized, syncing

  const requestHealthPermissions = async () => {
    if (!window.Capacitor || window.Capacitor.getPlatform() === 'web') {
      toast.error("Health Connect requires the Android/iOS app");
      return;
    }

    const toastId = toast.loading("Connecting to Health Apps...");
    try {
      // Dynamic import to avoid web build issues if plugin not installed
      const { Health } = await import('@capgo/capacitor-health');
      
      const permissions = {
        read: ['steps', 'active_calories', 'distance'],
        write: []
      };

      await Health.requestPermissions(permissions);
      setHealthStatus("authorized");
      toast.success("Health Apps connected!", { id: toastId });
      syncNativeHealthData();
    } catch (err) {
      console.error("Health permission error:", err);
      toast.error("Failed to connect to Health Apps", { id: toastId });
    }
  };

  const syncNativeHealthData = async () => {
    setHealthStatus("syncing");
    const toastId = toast.loading("Fetching latest health data...");
    try {
      const { Health } = await import('@capgo/capacitor-health');
      
      const now = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Start of today

      const options = {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        dataType: 'steps'
      };

      // Fetch Steps
      const stepData = await Health.queryAggregated({ ...options, dataType: 'steps' });
      const calorieData = await Health.queryAggregated({ ...options, dataType: 'active_calories' });
      const distanceData = await Health.queryAggregated({ ...options, dataType: 'distance' });

      const fetchedSteps = stepData.value || 0;
      const fetchedCalories = Math.round(calorieData.value || 0);
      const fetchedDistance = Number((distanceData.value / 1000 || 0).toFixed(2)); // m to km

      setActivity(prev => ({
        ...prev,
        steps: fetchedSteps,
        activeCalories: fetchedCalories,
        distanceKm: fetchedDistance
      }));

      // Auto-set them for saving
      setLiveSteps(fetchedSteps); 
      
      toast.success("Health data synced!", { id: toastId });
      setHealthStatus("authorized");
    } catch (err) {
      console.error("Health sync error:", err);
      toast.error("Failed to sync health data", { id: toastId });
      setHealthStatus("authorized");
    }
  };

  const handleSyncToCloud = async () => {
    const stepsToSync = healthStatus !== "disconnected" ? activity.steps : liveSteps;
    const caloriesToSync = healthStatus !== "disconnected" ? activity.activeCalories : Math.round(liveSteps * 0.04);
    const distanceToSync = healthStatus !== "disconnected" ? activity.distanceKm : Number((liveSteps * 0.0008).toFixed(2));

    if (stepsToSync === 0) {
      toast.error("No activity recorded to sync");
      return;
    }
    const toastId = toast.loading("Syncing to Wellnest Cloud...");
    try {
      const payload = {
        steps: stepsToSync,
        activeCalories: caloriesToSync,
        distanceKm: distanceToSync,
      };
      await createActivity(payload);
      toast.success(`Successfully synced ${stepsToSync} steps!`, { id: toastId });
      
      if (healthStatus === "disconnected") {
        setLiveSteps(0);
        setIsSyncing(false);
        setPermissionState("granted");
      }
      
      const res = await getActivity();
      setRecentActivity(res.data || []);
    } catch (err) {
      toast.error("Failed to sync activity", { id: toastId });
    }
  };

  // load data when tab changes
  useEffect(() => {
    const load = async () => {
      try {
        if (tab === "workout") {
          const res = await getWorkouts();
          setRecentWorkouts(res.data || []);
        } else if (tab === "meal") {
          const res = await getMeals();
          setRecentMeals(res.data || []);
        } else if (tab === "water") {
          const res = await getWater();
          setRecentWater(res.data || []);
        } else if (tab === "sleep") {
          const res = await getSleep();
          setRecentSleep(res.data || []);
        } else if (tab === "activity") {
          const res = await getActivity();
          setRecentActivity(res.data || []);
        }
      } catch (err) {
        console.error("Load trackers error:", err);
      }
    };
    load();
  }, [tab]);

  // Fetch user weight & targets from profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { fetchCurrentUser } = await import("../api/userApi");
        const res = await fetchCurrentUser();
        if (res.data) {
          if (res.data.weightKg) setUserWeight(res.data.weightKg);
          if (res.data.targets) {
            setTargets(prev => ({ 
              ...prev, 
              ...Object.fromEntries(Object.entries(res.data.targets).filter(([, v]) => v != null)) 
            }));
          }
        }
      } catch (err) {
        console.log("Could not fetch user profile details");
      }
    };
    fetchUserProfile();
  }, []);

  // Initialize sleep quality calculation
  useEffect(() => {
    if (sleep.hours > 0) {
      const qualityData = calculateSleepQuality(sleep.hours);
      setSleep(prev => ({ ...prev, quality: qualityData.quality }));
      setCalculatedSleepQuality(qualityData);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      if (type === 'workout') {
        await deleteWorkout(id);
        setRecentWorkouts(prev => prev.filter(i => i.id !== id));
      } else if (type === 'meal') {
        await deleteMeal(id);
        setRecentMeals(prev => prev.filter(i => i.id !== id));
      } else if (type === 'water') {
        await deleteWater(id);
        setRecentWater(prev => prev.filter(i => i.id !== id));
      } else if (type === 'sleep') {
        await deleteSleep(id);
        setRecentSleep(prev => prev.filter(i => i.id !== id));
      } else if (type === 'activity') {
        await deleteActivity(id);
        setRecentActivity(prev => prev.filter(i => i.id !== id));
      }
      toast.success("Deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
  };

  const calculateSleepQuality = (hours) => {
    if (hours < 4) {
      return { quality: "poor", feedback: "Severely insufficient sleep.", color: "#ef4444" };
    } else if (hours < 6) {
      return { quality: "poor", feedback: "Insufficient sleep.", color: "#ef4444" };
    } else if (hours < 7) {
      return { quality: "average", feedback: "Below recommended sleep.", color: "#f59e0b" };
    } else if (hours <= 9) {
      return { quality: "good", feedback: "Excellent! Optimal sleep.", color: "#22c55e" };
    } else if (hours <= 10) {
      return { quality: "average", feedback: "Slightly more than recommended.", color: "#f59e0b" };
    } else {
      return { quality: "poor", feedback: "Excessive sleep.", color: "#ef4444" };
    }
  };

  const calculateCaloriesBurned = (exerciseType, durationMinutes, weightKg) => {
    const metValues = {
      cardio: { walking: 3.5, jogging: 7.0, running: 9.8, cycling: 8.0, swimming: 8.3, dancing: 4.8, aerobics: 6.6, default: 6.0 },
      strength: { weightlifting: 6.0, bodyweight: 4.0, resistance: 5.0, powerlifting: 6.0, default: 5.0 },
      yoga: { hatha: 2.5, vinyasa: 4.0, power: 4.0, hot: 5.0, default: 3.0 },
      pilates: { default: 3.0 },
      sports: { basketball: 8.0, tennis: 7.3, soccer: 7.0, badminton: 5.5, default: 6.5 },
      flexibility: { stretching: 2.3, mobility: 2.5, default: 2.3 }
    };

    let met = metValues[exerciseType]?.default || 4.0;
    const hours = durationMinutes / 60;
    const calories = Math.round(met * weightKg * hours);

    return { calories, met, intensity: met < 3 ? "Light" : met < 6 ? "Moderate" : "Vigorous" };
  };


  const onSubmitWorkout = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving workout...");
    try {
      let finalCalories = workout.caloriesBurned;
      if (!finalCalories && workout.durationMinutes > 0) {
        const calorieData = calculateCaloriesBurned(workout.type, workout.durationMinutes, userWeight);
        finalCalories = calorieData.calories;
      }

      const payload = {
        type: workout.type,
        durationMinutes: workout.durationMinutes,
        caloriesBurned: finalCalories,
        notes: workout.notes,
      };
      await createWorkout(payload);
      toast.success(`Workout logged! Burned ${finalCalories} kcal`, { id: toastId });
      const res = await getWorkouts();
      setRecentWorkouts(res.data || []);
    } catch (err) {
      console.error("Save workout error:", err);
      const errMsg = err?.response?.data?.message || "Failed to save workout";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  const onSubmitMeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving meal...");
    try {
      const payload = {
        mealType: meal.mealType,
        calories: Number(meal.calories || 0),
        protein: meal.protein ? Number(meal.protein) : null,
        carbs: meal.carbs ? Number(meal.carbs) : null,
        fats: meal.fats ? Number(meal.fats) : null,
        notes: meal.notes,
      };
      await createMeal(payload);
      toast.success("Meal logged!", { id: toastId });
      const res = await getMeals();
      setRecentMeals(res.data || []);
    } catch (err) {
      console.error("Save meal error:", err);
      const errMsg = err?.response?.data?.message || "Failed to save meal";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitWater = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving water...");
    try {
      const parsed = Number(water.amountLiters);
      if (isNaN(parsed) || parsed <= 0) {
        toast.error("Please enter a valid amount", { id: toastId });
        setLoading(false);
        return;
      }

      const payload = {
        liters: parsed,
        notes: water.notes || null,
      };

      await createWater(payload);
      toast.success("Water intake logged!", { id: toastId });
      const res = await getWater();
      setRecentWater(res.data || []);
    } catch (err) {
      console.error("Save water error:", err);
      const errMsg = err?.response?.data?.message || "Failed to save water intake";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSleep = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving sleep...");
    try {
      const payload = {
        hours: Number(sleep.hours),
        quality: sleep.quality,
        notes: sleep.notes,
      };
      await createSleep(payload);
      toast.success("Sleep logged!", { id: toastId });
      const res = await getSleep();
      setRecentSleep(res.data || []);
    } catch (err) {
      console.error("Save sleep error:", err);
      const errMsg = err?.response?.data?.message || "Failed to save sleep";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitActivity = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving daily activity...");
    try {
      const payload = {
        steps: Number(activity.steps),
        activeCalories: Number(activity.activeCalories),
        distanceKm: Number(activity.distanceKm),
      };
      // For future integration, this is where @capacitor-community/health will be called
      // and sent instead of state when inside native env.
      await createActivity(payload);
      toast.success("Daily activity logged!", { id: toastId });
      const res = await getActivity();
      setRecentActivity(res.data || []);
    } catch (err) {
      console.error("Save activity error:", err);
      const errMsg = err?.response?.data?.message || "Failed to save activity";
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tracker-page container" style={{ position: 'relative' }}>
      
      {editingGoal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '30px', margin: '20px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '8px' }}>Update Daily Target</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Set a new goal for this tracker to personalize your journey.</p>
            <input 
              type="number" 
              step="any"
              value={tempGoalValue} 
              onChange={e => setTempGoalValue(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="ghost-btn" onClick={() => setEditingGoal(null)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveGoal}>Save Goal</button>
            </div>
          </div>
        </div>
      )}

      <h2 className="auth-title">Health Trackers</h2>

      <div className="tabs">
        <button className={tab === "workout" ? "active" : ""} onClick={() => setTab("workout")}>Workout</button>
        <button className={tab === "meal" ? "active" : ""} onClick={() => setTab("meal")}>Meal</button>
        <button className={tab === "water" ? "active" : ""} onClick={() => setTab("water")}>Water</button>
        <button className={tab === "sleep" ? "active" : ""} onClick={() => setTab("sleep")}>Sleep</button>
        <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Activity</button>
      </div>

      <div className="tab-content">
        {tab === "workout" && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
              <div style={{ width: '120px', height: '120px', marginBottom: '10px' }}>
                <CircularProgressbar 
                  value={Math.min((workoutsThisWeek / targets.targetWorkoutsPerWeek) * 100, 100)} 
                  text={`${workoutsThisWeek}/${targets.targetWorkoutsPerWeek}`}
                  styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)' })}
                />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Weekly Workouts</div>
              <button 
                type="button" 
                onClick={() => handleOpenEditGoal('targetWorkoutsPerWeek', targets.targetWorkoutsPerWeek)} 
                className="ghost-btn small" 
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Edit Target
              </button>
            </div>
            <form onSubmit={onSubmitWorkout} className="tracker-form">
              {/* ... fields identical ... */}
              <label>
                Your Weight (kg)
                <input
                  type="number"
                  step="0.1"
                  value={userWeight}
                  onChange={(e) => {
                    const weight = parseFloat(e.target.value || 70);
                    setUserWeight(weight);
                    if (workout.durationMinutes > 0) {
                      const calorieData = calculateCaloriesBurned(workout.type, workout.durationMinutes, weight);
                      setCalculatedCalories(calorieData.calories);
                      setWorkout(prev => ({ ...prev, caloriesBurned: calorieData.calories }));
                    }
                  }}
                  min="30"
                  max="200"
                />
              </label>

              <label>
                Exercise type
                <select
                  value={workout.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setWorkout({ ...workout, type: newType });
                    if (workout.durationMinutes > 0) {
                      const calorieData = calculateCaloriesBurned(newType, workout.durationMinutes, userWeight);
                      setCalculatedCalories(calorieData.calories);
                      setWorkout(prev => ({ ...prev, type: newType, caloriesBurned: calorieData.calories }));
                    }
                  }}
                >
                  <option value="cardio">Cardio (Running, Cycling, Swimming)</option>
                  <option value="strength">Strength Training</option>
                  <option value="yoga">Yoga</option>
                  <option value="pilates">Pilates</option>
                  <option value="sports">Sports</option>
                  <option value="flexibility">Flexibility</option>
                </select>
              </label>

              <label>
                Duration (minutes)
                <input
                  type="number"
                  value={workout.durationMinutes}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value || 0);
                    setWorkout({ ...workout, durationMinutes: duration });
                    if (duration > 0) {
                      const calorieData = calculateCaloriesBurned(workout.type, duration, userWeight);
                      setCalculatedCalories(calorieData.calories);
                      setWorkout(prev => ({ ...prev, durationMinutes: duration, caloriesBurned: calorieData.calories }));
                    }
                  }}
                  min="1"
                  max="300"
                />
              </label>

              {workout.durationMinutes > 0 && (
                <div style={{ marginTop: "12px", marginBottom: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(15, 23, 42, 0.5)", border: "2px solid #22c55e" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#e5e7eb" }}>Estimated Calories Burned:</span>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#22c55e" }}>{calculatedCalories} kcal</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#d1d5db", lineHeight: "1.4" }}>
                    🔥 Based on {workout.type} exercise for {workout.durationMinutes} minutes at {userWeight}kg body weight
                  </div>
                </div>
              )}

              <label>
                Notes
                <input
                  type="text"
                  value={workout.notes}
                  onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                  placeholder="How did the workout feel?"
                />
              </label>

              <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Workout"}</button>
            </form>
            {/* Recent Workouts List */}
            {recentWorkouts.length > 0 && (
              <div className="recent-list">
                <h4>Recent workouts</h4>
                {recentWorkouts.slice(0, 6).map((w) => {
                  const calorieData = calculateCaloriesBurned(w.type, w.durationMinutes || w.duration, userWeight);
                  return (
                    <div className="card" key={w.id || JSON.stringify(w)} style={{ borderLeft: `4px solid #22c55e`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ textTransform: "capitalize" }}>{w.type}</strong>
                          <span>• {w.durationMinutes || w.duration} min</span>
                          <span style={{ color: "#22c55e", fontWeight: "500" }}>• {w.caloriesBurned || calorieData.calories} kcal</span>
                        </div>
                        <div className="small" style={{ color: "#9ca3af" }}>{w.notes}</div>
                      </div>
                      <button className="ghost-btn icon-btn" onClick={() => handleDelete(w.id, 'workout')} style={{ color: '#ef4444' }}><FiTrash2 /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "meal" && (
          <>
            <form onSubmit={onSubmitMeal} className="tracker-form">
              <label>
                Meal type
                <select value={meal.mealType} onChange={(e) => setMeal({ ...meal, mealType: e.target.value })}>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </label>
              <label>Calories <input type="number" value={meal.calories} onChange={(e) => setMeal({ ...meal, calories: parseInt(e.target.value || 0) })} min="0" /></label>
              <label>Protein (g) <input type="number" value={meal.protein} onChange={(e) => setMeal({ ...meal, protein: parseInt(e.target.value || 0) })} min="0" /></label>
              <label>Carbs (g) <input type="number" value={meal.carbs} onChange={(e) => setMeal({ ...meal, carbs: parseInt(e.target.value || 0) })} min="0" /></label>
              <label>Fats (g) <input type="number" value={meal.fats} onChange={(e) => setMeal({ ...meal, fats: parseInt(e.target.value || 0) })} min="0" /></label>
              <label>Notes <input type="text" value={meal.notes} onChange={(e) => setMeal({ ...meal, notes: e.target.value })} /></label>
              <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Meal"}</button>
            </form>
            {recentMeals.length > 0 && (
              <div className="recent-list">
                <h4>Recent meals</h4>
                {recentMeals.slice(0, 6).map((m) => (
                  <div className="card" key={m.id || JSON.stringify(m)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div><strong>{m.mealType}</strong> — {m.calories} kcal</div>
                      <div>Protein {m.protein || "-"}g • Carbs {m.carbs || "-"}g • Fats {m.fats || "-"}g</div>
                      <div className="small">{m.notes}</div>
                    </div>
                    <button className="ghost-btn icon-btn" onClick={() => handleDelete(m.id, 'meal')} style={{ color: '#ef4444' }}><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "water" && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
              <div style={{ width: '120px', height: '120px', marginBottom: '10px' }}>
                <CircularProgressbar 
                  value={Math.min((waterToday / targets.targetWaterLiters) * 100, 100)} 
                  text={`${waterToday.toFixed(1)}L`}
                  styles={buildStyles({ pathColor: '#3b82f6', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)' })}
                />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Water Today (Target: {targets.targetWaterLiters}L)</div>
              <button 
                type="button" 
                onClick={() => handleOpenEditGoal('targetWaterLiters', targets.targetWaterLiters)} 
                className="ghost-btn small" 
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Edit Target
              </button>
            </div>
            <form onSubmit={onSubmitWater} className="tracker-form">
              <label>Amount (liters) <input type="number" step="0.1" value={water.amountLiters} onChange={(e) => setWater({ ...water, amountLiters: parseFloat(e.target.value || 0) })} min="0" /></label>
              <label>Notes <input type="text" value={water.notes} onChange={(e) => setWater({ ...water, notes: e.target.value })} /></label>
              <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Water Intake"}</button>
            </form>
            {recentWater.length > 0 && (
              <div className="recent-list">
                <h4>Recent water logs</h4>
                {recentWater.slice(0, 6).map((w) => (
                  <div className="card" key={w.id || JSON.stringify(w)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div>{(w.liters ?? w.amountLiters ?? w.amount ?? "-")} L</div>
                      <div className="small">{w.notes}</div>
                    </div>
                    <button className="ghost-btn icon-btn" onClick={() => handleDelete(w.id, 'water')} style={{ color: '#ef4444' }}><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "sleep" && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
              <div style={{ width: '120px', height: '120px', marginBottom: '10px' }}>
                <CircularProgressbar 
                  value={Math.min((recentSleepHours / targets.targetSleepHours) * 100, 100)} 
                  text={`${recentSleepHours}h`}
                  styles={buildStyles({ pathColor: '#8b5cf6', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)' })}
                />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Last Night's Sleep (Target: {targets.targetSleepHours}h)</div>
              <button 
                type="button" 
                onClick={() => handleOpenEditGoal('targetSleepHours', targets.targetSleepHours)} 
                className="ghost-btn small" 
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
              >
                Edit Target
              </button>
            </div>
            <form onSubmit={onSubmitSleep} className="tracker-form">
              <label>Hours slept <input type="number" step="0.1" value={sleep.hours} onChange={(e) => {
                const hours = parseFloat(e.target.value || 0);
                const qualityData = calculateSleepQuality(hours);
                setSleep({ ...sleep, hours: hours, quality: qualityData.quality });
                setCalculatedSleepQuality(qualityData);
              }} min="0" max="24" /></label>

              {sleep.hours > 0 && (
                <div style={{ marginTop: "12px", marginBottom: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "rgba(15, 23, 42, 0.5)", border: `2px solid ${calculatedSleepQuality.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#e5e7eb" }}>Sleep Quality:</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: calculatedSleepQuality.color, textTransform: "capitalize" }}>{calculatedSleepQuality.quality}</span>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: calculatedSleepQuality.color }} />
                  </div>
                  <div style={{ fontSize: "12px", color: "#d1d5db", lineHeight: "1.4" }}>💡 {calculatedSleepQuality.feedback}</div>
                </div>
              )}

              <label>Notes <input type="text" value={sleep.notes} onChange={(e) => setSleep({ ...sleep, notes: e.target.value })} placeholder="How did you feel?" /></label>
              <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Sleep"}</button>
            </form>

            {recentSleep.length > 0 && (
              <div className="recent-list">
                <h4>Recent sleep logs</h4>
                {recentSleep.slice(0, 6).map((s) => {
                  const qualityData = calculateSleepQuality(s.hours);
                  return (
                    <div className="card" key={s.id || JSON.stringify(s)} style={{ borderLeft: `4px solid ${qualityData.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{s.hours} hours</span>
                          <span style={{ color: qualityData.color, fontWeight: "500", textTransform: "capitalize" }}>• {s.quality}</span>
                        </div>
                        <div className="small" style={{ color: "#9ca3af" }}>{s.notes}</div>
                      </div>
                      <button className="ghost-btn icon-btn" onClick={() => handleDelete(s.id, 'sleep')} style={{ color: '#ef4444' }}><FiTrash2 /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "activity" && (
          <>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                
                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', marginBottom: '10px' }}>
                    <CircularProgressbar 
                      value={Math.min((activityToday.steps / targets.targetSteps) * 100, 100)} 
                      text={`${Math.round(activityToday.steps/1000)}k`}
                      styles={buildStyles({ pathColor: '#f59e0b', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)', textSize: '24px' })}
                    />
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Steps</div>
                  <button type="button" onClick={() => handleOpenEditGoal('targetSteps', targets.targetSteps)} className="ghost-btn small" style={{ color: '#3b82f6', textDecoration: 'underline', padding: 0 }}>Edit</button>
                </div>
                
                {/* Calories */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', marginBottom: '10px' }}>
                    <CircularProgressbar 
                      value={Math.min((activityToday.activeCalories / targets.targetActiveCalories) * 100, 100)} 
                      text={`${activityToday.activeCalories}`}
                      styles={buildStyles({ pathColor: '#ef4444', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)', textSize: '24px' })}
                    />
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>kcal</div>
                  <button type="button" onClick={() => handleOpenEditGoal('targetActiveCalories', targets.targetActiveCalories)} className="ghost-btn small" style={{ color: '#3b82f6', textDecoration: 'underline', padding: 0 }}>Edit</button>
                </div>

                {/* Distance */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '80px', height: '80px', marginBottom: '10px' }}>
                    <CircularProgressbar 
                      value={Math.min((activityToday.distanceKm / targets.targetDistanceKm) * 100, 100)} 
                      text={`${activityToday.distanceKm}`}
                      styles={buildStyles({ pathColor: '#06b6d4', textColor: 'var(--text-main)', trailColor: 'rgba(128,128,128,0.2)', textSize: '24px' })}
                    />
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>km</div>
                  <button type="button" onClick={() => handleOpenEditGoal('targetDistanceKm', targets.targetDistanceKm)} className="ghost-btn small" style={{ color: '#3b82f6', textDecoration: 'underline', padding: 0 }}>Edit</button>
                </div>

              </div>
            </div>
            <form onSubmit={onSubmitActivity} className="tracker-form">
              <label>Daily Steps <input type="number" value={activity.steps} onChange={(e) => setActivity({ ...activity, steps: parseInt(e.target.value || 0) })} min="0" placeholder="e.g. 10000" /></label>
              <label>Active Calories Burned <input type="number" value={activity.activeCalories} onChange={(e) => setActivity({ ...activity, activeCalories: parseInt(e.target.value || 0) })} min="0" placeholder="e.g. 450" /></label>
              <label>Distance (km) <input type="number" step="0.1" value={activity.distanceKm} onChange={(e) => setActivity({ ...activity, distanceKm: parseFloat(e.target.value || 0) })} min="0" placeholder="e.g. 5.5" /></label>
              
              <div style={{ marginTop: "12px", marginBottom: "12px", padding: "16px", borderRadius: "16px", background: 'var(--primary-light)', border: '1px solid var(--primary-border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                   <div style={{ padding: '8px', background: (isSyncing || healthStatus !== "disconnected") ? '#22c55e' : 'var(--text-muted)', borderRadius: '10px', color: '#fff', display: 'flex' }}>
                       {(isSyncing || healthStatus !== "disconnected") ? <FiZap aria-hidden="true" /> : <FiZapOff aria-hidden="true" />}
                   </div>
                   <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {healthStatus !== "disconnected" ? "Native Health Sync" : "Step Counter Sync"}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {healthStatus !== "disconnected" ? "Pulls data directly from Google Fit / Apple Health." : isSyncing ? "Tracking live movement..." : "Sync your device's real-time steps."}
                      </p>
                   </div>
                </div>

                {(isSyncing || healthStatus !== "disconnected") && (
                  <div style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px dashed rgba(255,255,255,0.1)', marginTop: '10px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#22c55e' }}>
                        {healthStatus !== "disconnected" ? activity.steps : liveSteps}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {healthStatus !== "disconnected" ? "Today's Total Steps" : "Current Steps"}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                   {window.Capacitor && window.Capacitor.getPlatform() !== 'web' ? (
                     // NATIVE UI
                     <>
                        {healthStatus === "disconnected" ? (
                          <button type="button" onClick={requestHealthPermissions} className="primary-btn" style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}>
                            Connect Health Apps
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={syncNativeHealthData} className="ghost-btn" style={{ flex: 1, padding: '8px' }}>
                              <FiRefreshCw style={{ marginRight: '6px' }} /> Update
                            </button>
                            <button type="button" onClick={handleSyncToCloud} className="primary-btn" style={{ flex: 2, height: '40px', background: '#22c55e' }}>
                              Save to Cloud
                            </button>
                          </>
                        )}
                     </>
                   ) : (
                     // WEB/BROWSER UI
                     <>
                        {!isSyncing ? (
                          <button type="button" onClick={requestMotionPermission} className="primary-btn" style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}>
                            Enable Live Sync
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={() => setIsSyncing(false)} className="ghost-btn" style={{ flex: 1, padding: '8px' }}>Stop</button>
                            <button type="button" onClick={handleSyncToCloud} className="primary-btn" style={{ flex: 2, height: '40px', background: '#22c55e' }}>
                              <FiRefreshCw style={{ marginRight: '6px' }} /> Sync to Cloud
                            </button>
                          </>
                        )}
                     </>
                   )}
                </div>
              </div>

              <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Daily Activity"}</button>
            </form>

            {recentActivity.length > 0 && (
              <div className="recent-list">
                <h4>Recent Activity Logs</h4>
                {recentActivity.slice(0, 6).map((a) => (
                  <div className="card" key={a.id || JSON.stringify(a)} style={{ borderLeft: `4px solid #3b82f6`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "700" }}>{new Date(a.date).toLocaleDateString()}</span>
                      </div>
                      <div className="small" style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                        👣 {a.steps} steps • 🔥 {a.activeCalories} kcal • 📍 {a.distanceKm} km
                      </div>
                    </div>
                    <button className="ghost-btn icon-btn" onClick={() => handleDelete(a.id, 'activity')} style={{ color: '#ef4444' }}><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {/* Footer message div removed */}
    </div>
  );
};
export default Trackers;
