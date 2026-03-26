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
} from "../api/trackerApi";
import 'react-circular-progressbar/dist/styles.css';
import cacheService from "../api/cacheService";
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

  const [recentWorkouts, setRecentWorkouts] = useState(cacheService.get('/trackers/workouts') || []);
  const [recentMeals, setRecentMeals] = useState(cacheService.get('/trackers/meals') || []);
  const [recentWater, setRecentWater] = useState(cacheService.get('/trackers/water') || []);
  const [recentSleep, setRecentSleep] = useState(cacheService.get('/trackers/sleep') || []);
  const [recentActivity, setRecentActivity] = useState(cacheService.get('/trackers/activity') || []);

  const [targets, setTargets] = useState({
    targetWorkoutsPerDay: 1,
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

  const workoutsToday = recentWorkouts.filter(w => isToday(w.performedAt || w.createdAt)).length;
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
          cacheService.set('/trackers/workouts', res.data || []);
        } else if (tab === "meal") {
          const res = await getMeals();
          setRecentMeals(res.data || []);
          cacheService.set('/trackers/meals', res.data || []);
        } else if (tab === "water") {
          const res = await getWater();
          setRecentWater(res.data || []);
          cacheService.set('/trackers/water', res.data || []);
        } else if (tab === "sleep") {
          const res = await getSleep();
          setRecentSleep(res.data || []);
          cacheService.set('/trackers/sleep', res.data || []);
        } else if (tab === "activity") {
          const res = await getActivity();
          setRecentActivity(res.data || []);
          cacheService.set('/trackers/activity', res.data || []);
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
      const res = await getMeals();
      setRecentMeals(res.data || []);
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
                  <CircularProgressbar value={Math.min((workoutsToday / targets.targetWorkoutsPerDay) * 100, 100)} text={`${workoutsToday}/${targets.targetWorkoutsPerDay}`} styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)' })} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Daily Workouts</div>
                <button type="button" onClick={() => handleOpenEditGoal('targetWorkoutsPerDay', targets.targetWorkoutsPerDay || 1)} className="ghost-btn small" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Edit Target</button>
              </div>
              <form onSubmit={onSubmitWorkout} className="tracker-form">
                <label>Weight (kg) <input type="number" value={userWeight} onChange={(e) => setUserWeight(parseFloat(e.target.value))} /></label>
                <label>Type <select value={workout.type} onChange={(e) => setWorkout({ ...workout, type: e.target.value })}><option value="cardio">Cardio</option><option value="strength">Strength</option><option value="yoga">Yoga</option></select></label>
                <label>Duration (min) <input type="number" value={workout.durationMinutes} onChange={(e) => setWorkout({ ...workout, durationMinutes: parseInt(e.target.value) })} /></label>
                <button type="submit">Save Workout</button>
              </form>
              <div className="recent-logs" style={{ marginTop: '24px' }}>
                <h3>Recent Workouts</h3>
                {recentWorkouts.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent workouts.</p> : recentWorkouts.slice(0, 5).map((w, i) => (
                  <div key={i} className="card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                         <strong>{w.type ? w.type.charAt(0).toUpperCase() + w.type.slice(1) : "Workout"}</strong>
                         <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(w.performedAt || w.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                         <div>{w.durationMinutes} min</div>
                         <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>{w.caloriesBurned} kcal</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "meal" && (
            <>
              <form onSubmit={onSubmitMeal} className="tracker-form">
                <label>Meal <select value={meal.mealType} onChange={(e) => setMeal({ ...meal, mealType: e.target.value })}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label>
                <label>Calories <input type="number" value={meal.calories} onChange={(e) => setMeal({ ...meal, calories: parseInt(e.target.value) })} /></label>
                <button type="submit">Save Meal</button>
              </form>
              <div className="recent-logs" style={{ marginTop: '24px' }}>
                <h3>Recent Meals</h3>
                {recentMeals.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent meals.</p> : recentMeals.slice(0, 5).map((m, i) => (
                  <div key={i} className="card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                         <strong>{m.mealType ? m.mealType.charAt(0).toUpperCase() + m.mealType.slice(1) : "Meal"}</strong>
                         <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(m.loggedAt || m.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#f59e0b', fontSize: '16px', fontWeight: 'bold' }}>
                         {m.calories} kcal
                    </div>
                  </div>
                ))}
              </div>
            </>
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
              <div className="recent-logs" style={{ marginTop: '24px' }}>
                <h3>Recent Hydration</h3>
                {recentWater.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent water logs.</p> : recentWater.slice(0, 5).map((w, i) => (
                  <div key={i} className="card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                         <strong>Water</strong>
                         <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(w.loggedAt || w.createdAt).toLocaleDateString()} {new Date(w.loggedAt || w.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#3b82f6', fontSize: '16px', fontWeight: 'bold' }}>
                         {w.liters || w.amountLiters || w.amount} L
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="recent-logs" style={{ marginTop: '24px' }}>
                <h3>Recent Sleep Logs</h3>
                {recentSleep.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent sleep logs.</p> : recentSleep.slice(0, 5).map((s, i) => (
                  <div key={i} className="card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                         <strong>Sleep</strong>
                         <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(s.sleepDate || s.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#8b5cf6', fontSize: '16px', fontWeight: 'bold' }}>
                         {s.hours} hours
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "activity" && (
            <>
               <div className="card" style={{ display: 'flex', gap: '20px', padding: '20px', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '80px' }}><CircularProgressbar value={Math.min((activityToday.steps / targets.targetSteps) * 100, 100)} text="Steps" /></div>
                  <div style={{ width: '80px', height: '80px' }}><CircularProgressbar value={Math.min((activityToday.activeCalories / targets.targetActiveCalories) * 100, 100)} text="kcal" /></div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
                 <button type="button" onClick={() => setIsSyncing(!isSyncing)} className={isSyncing ? "ghost-btn" : "primary-btn"}>
                   {isSyncing ? "Pause Tracking" : "Start Live Tracking"}
                 </button>
               </div>
               {isSyncing && (
                 <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                   <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{liveSteps}</div>
                   <div style={{ color: 'var(--text-muted)' }}>Live Steps</div>
                 </div>
               )}
               {liveSteps > 0 && !isSyncing && (
                 <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                   <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>{liveSteps}</div>
                   <div style={{ color: 'var(--text-muted)' }}>Steps to Sync</div>
                 </div>
               )}
               <form onSubmit={onSubmitActivity} className="tracker-form">
                  <label>Manual Steps Entry <input type="number" value={activity.steps || ''} onChange={(e) => setActivity({ ...activity, steps: e.target.value })} /></label>
                  <button type="submit">Save Manual Activity</button>
                  {liveSteps > 0 && (
                     <button type="button" onClick={handleSyncToCloud} className="primary-btn" style={{ marginTop: '10px', backgroundColor: '#3b82f6', color: '#fff' }}>Sync Live Steps to Cloud</button>
                  )}
               </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Trackers;
