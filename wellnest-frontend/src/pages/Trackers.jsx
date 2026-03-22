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
} from "../api/trackerApi";
import 'react-circular-progressbar/dist/styles.css';
// No simple icons used currently

import toast from "react-hot-toast";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Trackers = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "workout");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryTab = params.get("tab");
    if (queryTab && ["workout", "meal", "water", "sleep", "activity"].includes(queryTab)) {
      setTab(queryTab);
    }
  }, [location.search]);



  const [workout, setWorkout] = useState({
    type: "cardio",
    durationMinutes: 30,
    caloriesBurned: "",
    notes: "",
  });

  const [userWeight, setUserWeight] = useState(70);


  const [meal, setMeal] = useState({
    mealType: "breakfast",
    calories: 300,
    protein: "",
    carbs: "",
    fats: "",
    notes: "",
  });

  const [water, setWater] = useState({
    amountLiters: 0.5,
    notes: "",
  });

  const [sleep, setSleep] = useState({
    hours: 7,
    quality: "good",
    notes: "",
  });


  const [activity, setActivity] = useState({
    steps: 0,
    activeCalories: 0,
    distanceKm: 0.0
  });

  const [recentWorkouts, setRecentWorkouts] = useState([]);

  const [recentWater, setRecentWater] = useState([]);
  const [recentSleep, setRecentSleep] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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

  const [isSyncing, setIsSyncing] = useState(false);
  const [liveSteps, setLiveSteps] = useState(0);

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
      toast.success("Goal updated!");
    } catch (err) {
      toast.error("Failed to update goal");
    }
  };

  const isToday = (dateStringOrInstant) => {
    if (!dateStringOrInstant) return false;
    const d = new Date(dateStringOrInstant);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isThisWeek = (dateStringOrInstant) => {
    if (!dateStringOrInstant) return false;
    const d = new Date(dateStringOrInstant);
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  };

  const workoutsThisWeek = recentWorkouts.filter(w => isThisWeek(w.performedAt || w.createdAt)).length;
  const waterToday = recentWater.filter(w => isToday(w.loggedAt || w.createdAt)).reduce((sum, w) => sum + (w.liters || w.amountLiters || w.amount || 0), 0);
  
  const sleepLogsLast24h = recentSleep.filter(s => {
    const d = new Date(s.sleepDate || s.createdAt);
    return Date.now() - d.getTime() < 48 * 60 * 60 * 1000;
  });
  const recentSleepHours = sleepLogsLast24h.length > 0 ? sleepLogsLast24h[0].hours : 0;
  
  const activityToday = recentActivity.find(a => isToday(a.date || a.createdAt)) || { steps: 0, activeCalories: 0, distanceKm: 0 };

  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let threshold = 12;
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





  const handleSyncToCloud = async () => {
    const stepsToSync = liveSteps;
    const caloriesToSync = Math.round(liveSteps * 0.04);
    const distanceToSync = Number((liveSteps * 0.0008).toFixed(2));

    if (stepsToSync === 0) {
      toast.error("No activity recorded to sync");
      return;
    }
    const toastId = toast.loading("Syncing to Cloud...");
    try {
      const payload = { steps: stepsToSync, activeCalories: caloriesToSync, distanceKm: distanceToSync };
      await createActivity(payload);
      toast.success("Synced to cloud!", { id: toastId });
      setLiveSteps(0);
      setIsSyncing(false);
      const res = await getActivity();
      setRecentActivity(res.data || []);
    } catch (err) {
      toast.error("Failed to sync activity", { id: toastId });
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (tab === "workout") {
          const res = await getWorkouts();
          setRecentWorkouts(res.data || []);
        } else if (tab === "meal") {
          await getMeals();
          // Meals not currently displayed in list
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
      } catch (err) {}
    };
    load();
  }, [tab]);

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
      } catch (err) {}
    };
    fetchUserProfile();
  }, []);



  const calculateCaloriesBurned = (type, duration, weight) => {
    const metValues = { cardio: 7.0, strength: 5.0, yoga: 3.0, pilates: 3.0, sports: 6.5, flexibility: 2.3 };
    const met = metValues[type] || 4.0;
    const calories = Math.round(met * weight * (duration / 60));
    return { calories };
  };

  const onSubmitWorkout = async (e) => {
    e.preventDefault();
    try {
      const { calories } = calculateCaloriesBurned(workout.type, workout.durationMinutes, userWeight);
      await createWorkout({ ...workout, caloriesBurned: calories });
      toast.success("Workout logged!");
      const res = await getWorkouts();
      setRecentWorkouts(res.data || []);
    } catch (err) {
      toast.error("Failed to save workout");
    }
  };

  const onSubmitMeal = async (e) => {
    e.preventDefault();
    try {
      await createMeal(meal);
      toast.success("Meal logged!");
      await getMeals();
    } catch (err) {
      toast.error("Failed to save meal");
    }
  };

  const onSubmitWater = async (e) => {
    e.preventDefault();
    try {
      await createWater({ liters: Number(water.amountLiters), notes: water.notes });
      toast.success("Water intake logged!");
      const res = await getWater();
      setRecentWater(res.data || []);
    } catch (err) {
      toast.error("Failed to save water");
    }
  };

  const onSubmitSleep = async (e) => {
    e.preventDefault();
    try {
      await createSleep(sleep);
      toast.success("Sleep logged!");
      const res = await getSleep();
      setRecentSleep(res.data || []);
    } catch (err) {
      toast.error("Failed to save sleep");
    }
  };

  const onSubmitActivity = async (e) => {
    e.preventDefault();
    try {
      await createActivity(activity);
      toast.success("Activity logged!");
      const res = await getActivity();
      setRecentActivity(res.data || []);
    } catch (err) {
      toast.error("Failed to save activity");
    }
  };

  return (
    <>
      {editingGoal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '30px', margin: '20px', width: '90%', maxWidth: '400px', zIndex: 10000 }}>
            <h3 style={{ marginTop: 0 }}>Update Daily Target</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>Personalize your journey.</p>
            <input type="number" step="any" value={tempGoalValue} onChange={e => setTempGoalValue(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="ghost-btn" onClick={() => setEditingGoal(null)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveGoal}>Save Goal</button>
            </div>
          </div>
        </div>
      )}

      <div className="tracker-page container" style={{ position: 'relative' }}>
        <h2 className="auth-title">Health Trackers</h2>
        <div className="tabs">
          {["workout", "meal", "water", "sleep", "activity"].map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        <div className="tab-content">
          {tab === "workout" && (
            <>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
                <div style={{ width: '120px', height: '120px', marginBottom: '10px' }}>
                  <CircularProgressbar value={Math.min((workoutsThisWeek / targets.targetWorkoutsPerWeek) * 100, 100)} text={`${workoutsThisWeek}/${targets.targetWorkoutsPerWeek}`} styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)' })} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Weekly Workouts</div>
                <button type="button" onClick={() => handleOpenEditGoal('targetWorkoutsPerWeek', targets.targetWorkoutsPerWeek)} className="ghost-btn small" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Edit Target</button>
              </div>
              <form onSubmit={onSubmitWorkout} className="tracker-form">
                <label>Weight (kg) <input type="number" value={userWeight} onChange={(e) => setUserWeight(parseFloat(e.target.value))} /></label>
                <label>Type <select value={workout.type} onChange={(e) => setWorkout({ ...workout, type: e.target.value })}><option value="cardio">Cardio</option><option value="strength">Strength</option><option value="yoga">Yoga</option></select></label>
                <label>Duration (min) <input type="number" value={workout.durationMinutes} onChange={(e) => setWorkout({ ...workout, durationMinutes: parseInt(e.target.value) })} /></label>
                <button type="submit">Save Workout</button>
              </form>
            </>
          )}

          {tab === "meal" && (
            <form onSubmit={onSubmitMeal} className="tracker-form">
              <label>Meal <select value={meal.mealType} onChange={(e) => setMeal({ ...meal, mealType: e.target.value })}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option></select></label>
              <label>Calories <input type="number" value={meal.calories} onChange={(e) => setMeal({ ...meal, calories: parseInt(e.target.value) })} /></label>
              <button type="submit">Save Meal</button>
            </form>
          )}

          {tab === "water" && (
            <>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
                 <div style={{ width: '100px', height: '100px', marginBottom: '10px' }}>
                    <CircularProgressbar value={Math.min((waterToday / targets.targetWaterLiters) * 100, 100)} text={`${waterToday.toFixed(1)}L`} styles={buildStyles({ pathColor: '#3b82f6', textColor: 'var(--text-main)' })} />
                 </div>
                 <button onClick={() => handleOpenEditGoal('targetWaterLiters', targets.targetWaterLiters)} className="ghost-btn small">Edit Target</button>
              </div>
              <form onSubmit={onSubmitWater} className="tracker-form">
                <label>Liters <input type="number" step="0.1" value={water.amountLiters} onChange={(e) => setWater({ ...water, amountLiters: e.target.value })} /></label>
                <button type="submit">Save Water</button>
              </form>
            </>
          )}

          {tab === "sleep" && (
            <>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
                 <div style={{ width: '100px', height: '100px', marginBottom: '10px' }}>
                    <CircularProgressbar value={Math.min((recentSleepHours / targets.targetSleepHours) * 100, 100)} text={`${recentSleepHours}h`} styles={buildStyles({ pathColor: '#8b5cf6', textColor: 'var(--text-main)' })} />
                 </div>
                 <button onClick={() => handleOpenEditGoal('targetSleepHours', targets.targetSleepHours)} className="ghost-btn small">Edit Target</button>
              </div>
              <form onSubmit={onSubmitSleep} className="tracker-form">
                <label>Hours <input type="number" value={sleep.hours} onChange={(e) => setSleep({ ...sleep, hours: e.target.value })} /></label>
                <button type="submit">Save Sleep</button>
              </form>
            </>
          )}

          {tab === "activity" && (
            <>
               <div className="card" style={{ display: 'flex', gap: '20px', padding: '20px', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '80px' }}><CircularProgressbar value={Math.min((activityToday.steps / targets.targetSteps) * 100, 100)} text="Steps" /></div>
                  <div style={{ width: '80px', height: '80px' }}><CircularProgressbar value={Math.min((activityToday.activeCalories / targets.targetActiveCalories) * 100, 100)} text="kcal" /></div>
               </div>
               <form onSubmit={onSubmitActivity} className="tracker-form">
                  <label>Steps <input type="number" value={activity.steps} onChange={(e) => setActivity({ ...activity, steps: e.target.value })} /></label>
                  <button type="submit">Save Activity</button>
                  <button type="button" onClick={handleSyncToCloud} className="primary-btn" style={{ marginTop: '10px' }}>Sync to Cloud</button>
               </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Trackers;
