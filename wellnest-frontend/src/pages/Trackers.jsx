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
import { FiTrash2 } from "react-icons/fi";
import 'react-circular-progressbar/dist/styles.css';
import cacheService from "../api/cacheService";
// No simple icons used currently

import toast from "react-hot-toast";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useActivity } from "../context/ActivityContext";
import { FiActivity, FiRefreshCw } from "react-icons/fi";
import "./Trackers.css";

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


  
  // Connect to Global Activity Context
  const { 
    liveSteps, 
    isTracking, 
    isHealthConnected, 
    startTracking, 
    stopTracking, 
    connectHealth,
    syncHealthData 
  } = useActivity();

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

  const workoutsToday = recentWorkouts.filter(w => isToday(w.performedAt || w.createdAt)).length;
  const waterToday = recentWater.filter(w => isToday(w.loggedAt || w.createdAt)).reduce((sum, w) => sum + (w.liters || w.amountLiters || w.amount || 0), 0);
  
  const sleepLogsLast24h = recentSleep.filter(s => {
    const d = new Date(s.sleepDate || s.createdAt);
    return Date.now() - d.getTime() < 48 * 60 * 60 * 1000;
  });
  const recentSleepHours = sleepLogsLast24h.length > 0 ? sleepLogsLast24h[0].hours : 0;
  
  const activityToday = recentActivity.find(a => isToday(a.date || a.createdAt)) || { steps: 0, activeCalories: 0, distanceKm: 0 };







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
    const metValues = {
      cardio: 7.0, running: 9.8, walking: 3.5, cycling: 7.5, swimming: 8.0,
      strength: 5.0, hiit: 10.0, crossfit: 9.0, calisthenics: 5.5, rowing: 7.0,
      yoga: 3.0, pilates: 3.0, flexibility: 2.3, stretching: 2.0,
      boxing: 9.5, dancing: 5.5, sports: 6.5, jump_rope: 11.0
    };
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

  const onDeleteWorkout = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workout?")) return;
    try {
      await deleteWorkout(id);
      toast.success("Workout deleted");
      setRecentWorkouts(recentWorkouts.filter(w => w.id !== id));
      cacheService.set('/trackers/workouts', recentWorkouts.filter(w => w.id !== id));
    } catch (err) {
      toast.error("Failed to delete workout");
    }
  };

  const onDeleteMeal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meal?")) return;
    try {
      await deleteMeal(id);
      toast.success("Meal deleted");
      setRecentMeals(recentMeals.filter(m => m.id !== id));
      cacheService.set('/trackers/meals', recentMeals.filter(m => m.id !== id));
    } catch (err) {
      toast.error("Failed to delete meal");
    }
  };

  const onDeleteWater = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await deleteWater(id);
      toast.success("Log deleted");
      setRecentWater(recentWater.filter(w => w.id !== id));
      cacheService.set('/trackers/water', recentWater.filter(w => w.id !== id));
    } catch (err) {
      toast.error("Failed to delete log");
    }
  };

  const onDeleteSleep = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sleep log?")) return;
    try {
      await deleteSleep(id);
      toast.success("Sleep log deleted");
      setRecentSleep(recentSleep.filter(s => s.id !== id));
      cacheService.set('/trackers/sleep', recentSleep.filter(s => s.id !== id));
    } catch (err) {
      toast.error("Failed to delete sleep log");
    }
  };

  const onDeleteActivity = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      await deleteActivity(id);
      toast.success("Activity deleted");
      setRecentActivity(recentActivity.filter(a => a.id !== id));
      cacheService.set('/trackers/activity', recentActivity.filter(a => a.id !== id));
    } catch (err) {
      toast.error("Failed to delete activity");
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

      <div className="tracker-page container">
        <h2 className="auth-title">Health Trackers</h2>
        <div className="tabs">
          {["workout", "meal", "water", "sleep", "activity"].map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="tab-content">
          {tab === "workout" && (
            <div className="workout-tracker-content">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
                <div style={{ width: '120px', height: '120px', marginBottom: '10px' }}>
                  <CircularProgressbar value={Math.min((workoutsToday / targets.targetWorkoutsPerDay) * 100, 100)} text={`${workoutsToday}/${targets.targetWorkoutsPerDay}`} styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)' })} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Daily Workouts</div>
                <button type="button" onClick={() => handleOpenEditGoal('targetWorkoutsPerDay', targets.targetWorkoutsPerDay || 1)} className="ghost-btn small" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Edit Target</button>
              </div>
              <form onSubmit={onSubmitWorkout} className="tracker-form">
                <div className="tracker-grid-row grid-2-col">
                  <label>Weight (kg) <input type="number" value={userWeight} onChange={(e) => setUserWeight(parseFloat(e.target.value))} /></label>
                  <label>Type
                    <select value={workout.type} onChange={(e) => setWorkout({ ...workout, type: e.target.value })}>
                      <optgroup label="Cardio">
                        <option value="cardio">General Cardio</option>
                        <option value="running">Running</option>
                        <option value="walking">Walking</option>
                        <option value="cycling">Cycling</option>
                        <option value="swimming">Swimming</option>
                        <option value="jump_rope">Jump Rope</option>
                        <option value="rowing">Rowing</option>
                      </optgroup>
                      <optgroup label="Strength & HIIT">
                        <option value="strength">Strength Training</option>
                        <option value="hiit">HIIT</option>
                        <option value="crossfit">CrossFit</option>
                        <option value="calisthenics">Calisthenics</option>
                        <option value="boxing">Boxing</option>
                      </optgroup>
                      <optgroup label="Mind & Body">
                        <option value="yoga">Yoga</option>
                        <option value="pilates">Pilates</option>
                        <option value="flexibility">Flexibility</option>
                        <option value="stretching">Stretching</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="dancing">Dancing</option>
                        <option value="sports">Sports</option>
                      </optgroup>
                    </select>
                  </label>
                </div>
                <div className="tracker-grid-row">
                  <label>Duration (min) <input type="number" value={workout.durationMinutes} onChange={(e) => setWorkout({ ...workout, durationMinutes: parseInt(e.target.value) })} /></label>
                </div>
                <button type="submit">Save Workout</button>
              </form>
              <div className="recent-logs">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '32px 0 20px 0' }}>Recent Workouts</h3>
                {recentWorkouts.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent workouts.</p> : recentWorkouts.slice(0, 5).map((w, i) => (
                  <div key={i} className="log-card">
                    <div className="log-header">
                         <div className="log-title-area">
                              <span className="log-type">{w.type ? w.type.charAt(0).toUpperCase() + w.type.slice(1) : "Workout"}</span>
                              <span className="log-date">{new Date(w.performedAt || w.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="log-stats-area">
                              <div>
                                 <div>{w.durationMinutes} min</div>
                                 <div className="log-calories">{w.caloriesBurned} <small>kcal</small></div>
                              </div>
                              <button onClick={() => onDeleteWorkout(w.id)} className="delete-log-btn" title="Delete Workout">
                                 <FiTrash2 size={16} />
                              </button>
                         </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "meal" && (
            <div className="meal-tracker-content">
              {/* SMART MEAL AI SECTION */}
              <div className="smart-ai-section">
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center' }}>✨</span>
                    Smart AI Meal Logger
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Describe your meal (e.g., "2 paneer parathas and a bowl of curd") and our AI will estimate your macros instantly!
                  </p>
                  
                  <div className="ai-input-group">
                    <input 
                      type="text" 
                      placeholder="What did you eat?"
                      value={meal.notes || ""}
                      onChange={(e) => setMeal({ ...meal, notes: e.target.value })}
                    />
                    <button 
                      type="button" 
                      onClick={async () => {
                        const description = meal.notes?.trim();
                        if (!description) return toast.error("Please describe your meal first!");
                        
                        const normalized = description.toLowerCase().replace(/\s+/g, ' ');
                        const cacheKey = `meal_cache_${normalized}`;
                        
                        try {
                          toast.loading("Analyzing meal...", { id: "meal-ai" });
                          const { default: storageService } = await import("../api/storageService");
                          const cachedData = await storageService.getItem(cacheKey);
                          if (cachedData) {
                            const parsed = JSON.parse(cachedData);
                            setMeal(prev => ({ ...prev, ...parsed }));
                            toast.success("Loaded from cache! 🧠", { id: "meal-ai" });
                            return;
                          }
                          const { analyzeMeal: apiAnalyze } = await import("../api/trackerApi");
                          const res = await apiAnalyze(description);
                          let nutrition = res.data;
                          if (typeof nutrition === 'string') nutrition = JSON.parse(nutrition);
                          const result = {
                            calories: Number(nutrition.calories) || 0,
                            protein: Number(nutrition.protein) || 0,
                            carbs: Number(nutrition.carbs) || 0,
                            fats: Number(nutrition.fats) || 0
                          };
                          setMeal(prev => ({ ...prev, ...result }));
                          await storageService.setItem(cacheKey, JSON.stringify(result));
                          toast.success("AI Analysis complete! ✨", { id: "meal-ai" });
                        } catch (err) {
                          toast.error("AI Analysis failed. Please enter manually.", { id: "meal-ai" });
                        }
                      }}
                      className="ai-analyze-btn"
                    >
                      Analyze
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmitMeal} className="tracker-form">
                <div className="tracker-grid-row grid-2-col">
                  <label>Type <select value={meal.mealType} onChange={(e) => setMeal({ ...meal, mealType: e.target.value })}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label>
                  <label>Calories <input type="number" value={meal.calories} onChange={(e) => setMeal({ ...meal, calories: parseInt(e.target.value) })} /></label>
                </div>
                
                <div className="tracker-grid-row grid-3-col">
                  <label>Protein (g) <input type="number" placeholder="0" value={meal.protein} onChange={(e) => setMeal({ ...meal, protein: e.target.value })} /></label>
                  <label>Carbs (g) <input type="number" placeholder="0" value={meal.carbs} onChange={(e) => setMeal({ ...meal, carbs: e.target.value })} /></label>
                  <label>Fats (g) <input type="number" placeholder="0" value={meal.fats} onChange={(e) => setMeal({ ...meal, fats: e.target.value })} /></label>
                </div>

                <button type="submit">Save Log</button>
              </form>

              <div className="recent-logs">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '32px 0 20px 0' }}>Daily Nutrition History</h3>
                {recentMeals.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent meals.</p> : recentMeals.slice(0, 5).map((m, i) => (
                  <div key={i} className="log-card">
                    <div className="log-header">
                         <div className="log-title-area">
                              <span className="log-type">{m.mealType ? m.mealType.charAt(0).toUpperCase() + m.mealType.slice(1) : "Meal"}</span>
                              <span className="log-date">{new Date(m.loggedAt || m.createdAt).toLocaleDateString()} at {new Date(m.loggedAt || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <div className="log-stats-area">
                              <div className="log-calories">
                                 {m.calories} <small>kcal</small>
                              </div>
                              <button onClick={() => onDeleteMeal(m.id)} className="delete-log-btn" title="Delete Log">
                                 <FiTrash2 size={16} />
                              </button>
                         </div>
                    </div>
                    
                    <div className="macro-bars">
                        {[
                          { label: 'Protein', val: m.protein || 0, color: '#ef4444', short: 'P' },
                          { label: 'Carbs', val: m.carbs || 0, color: '#3b82f6', short: 'C' },
                          { label: 'Fats', val: m.fats || 0, color: '#f59e0b', short: 'F' }
                        ].map(macro => (
                          <div key={macro.label} className="macro-item">
                            <div className="macro-indicator" style={{ background: macro.color }}></div>
                            <span className="macro-label">{macro.label}: </span>
                            <span className="macro-value">{macro.val}g</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "water" && (
            <div className="water-tracker-content">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
                 <div style={{ width: '100px', height: '100px', marginBottom: '10px' }}>
                    <CircularProgressbar value={Math.min((waterToday / targets.targetWaterLiters) * 100, 100)} text={`${waterToday.toFixed(1)}L`} styles={buildStyles({ pathColor: '#3b82f6', textColor: 'var(--text-main)' })} />
                 </div>
                 <button onClick={() => handleOpenEditGoal('targetWaterLiters', targets.targetWaterLiters)} className="ghost-btn small">Edit Target</button>
              </div>
              <form onSubmit={onSubmitWater} className="tracker-form">
                <div className="tracker-grid-row">
                  <label>Liters <input type="number" step="0.1" value={water.amountLiters} onChange={(e) => setWater({ ...water, amountLiters: e.target.value })} /></label>
                </div>
                <button type="submit">Save Water</button>
              </form>
              <div className="recent-logs">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '32px 0 20px 0' }}>Recent Hydration</h3>
                {recentWater.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent water logs.</p> : recentWater.slice(0, 5).map((w, i) => (
                  <div key={i} className="log-card">
                    <div className="log-header">
                         <div className="log-title-area">
                              <span className="log-type">Water Intake</span>
                              <span className="log-date">{new Date(w.loggedAt || w.createdAt).toLocaleDateString()} {new Date(w.loggedAt || w.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                         <div className="log-stats-area">
                              <div style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 800 }}>
                                 {w.liters || w.amountLiters || w.amount} <small>L</small>
                              </div>
                              <button onClick={() => onDeleteWater(w.id)} className="delete-log-btn" title="Delete Log">
                                 <FiTrash2 size={16} />
                              </button>
                         </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "sleep" && (
            <div className="sleep-tracker-content">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', padding: '20px' }}>
                 <div style={{ width: '100px', height: '100px', marginBottom: '10px' }}>
                    <CircularProgressbar value={Math.min((recentSleepHours / targets.targetSleepHours) * 100, 100)} text={`${recentSleepHours}h`} styles={buildStyles({ pathColor: '#8b5cf6', textColor: 'var(--text-main)' })} />
                 </div>
                 <button onClick={() => handleOpenEditGoal('targetSleepHours', targets.targetSleepHours)} className="ghost-btn small">Edit Target</button>
              </div>
              <form onSubmit={onSubmitSleep} className="tracker-form">
                <div className="tracker-grid-row">
                  <label>Hours <input type="number" value={sleep.hours} onChange={(e) => setSleep({ ...sleep, hours: e.target.value })} /></label>
                </div>
                <button type="submit">Save Sleep</button>
              </form>
              <div className="recent-logs">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '32px 0 20px 0' }}>Recent Sleep Logs</h3>
                {recentSleep.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent sleep logs.</p> : recentSleep.slice(0, 5).map((s, i) => (
                  <div key={i} className="log-card">
                    <div className="log-header">
                         <div className="log-title-area">
                              <span className="log-type">Sleep Session</span>
                              <span className="log-date">{new Date(s.sleepDate || s.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div className="log-stats-area">
                              <div style={{ color: '#8b5cf6', fontSize: '1.2rem', fontWeight: 800 }}>
                                 {s.hours} <small>hours</small>
                              </div>
                              <button onClick={() => onDeleteSleep(s.id)} className="delete-log-btn" title="Delete Log">
                                 <FiTrash2 size={16} />
                              </button>
                         </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "activity" && (
            <div className="activity-tracker-content">
               <div className="card" style={{ display: 'flex', gap: '20px', padding: '24px', justifyContent: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgressbar value={Math.min((activityToday.steps / targets.targetSteps) * 100, 100)} text="Steps" styles={buildStyles({ pathColor: '#3b82f6', textColor: 'var(--text-main)' })} />
                    <span style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>{activityToday.steps}</span>
                  </div>
                  <div style={{ width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgressbar value={Math.min((activityToday.activeCalories / targets.targetActiveCalories) * 100, 100)} text="kcal" styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)' })} />
                    <span style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>{activityToday.activeCalories}</span>
                  </div>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', gap: '12px' }}>
                 <button type="button" onClick={() => isTracking ? stopTracking() : startTracking()} className={isTracking ? "secondary-btn" : "primary-btn"}>
                   {isTracking ? "Stop Live Tracking" : "Start Live Tracking"}
                 </button>
               </div>
               
               <div className="card" style={{ padding: '20px', marginBottom: '24px', border: isHealthConnected ? '1px solid #22c55e' : '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FiActivity size={24} color={isHealthConnected ? '#22c55e' : '#6366f1'} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>Health Connect</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {isHealthConnected ? "Connected & Syncing" : "Sync health data"}
                        </div>
                      </div>
                    </div>
                    {isHealthConnected ? (
                      <button onClick={syncHealthData} className="ghost-btn small" title="Sync Now">
                        <FiRefreshCw size={18} />
                      </button>
                    ) : (
                      <button onClick={connectHealth} className="primary-btn small" style={{ width: 'auto' }}>Connect</button>
                    )}
                  </div>
               </div>

               {isTracking && (
                 <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: 'var(--primary-light)', borderRadius: '16px' }}>
                   <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-1px' }}>{liveSteps}</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>Live Steps Today</div>
                 </div>
               )}

               <form onSubmit={onSubmitActivity} className="tracker-form">
                  <div className="tracker-grid-row">
                    <label>Manual Steps Entry <input type="number" value={activity.steps || ''} onChange={(e) => setActivity({ ...activity, steps: e.target.value })} /></label>
                  </div>
                  <button type="submit">Save Activity</button>
               </form>

               <div className="recent-logs">
                 <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '32px 0 20px 0' }}>Recent Activity</h3>
                 {recentActivity.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent activity logs.</p> : recentActivity.slice(0, 5).map((a, i) => (
                   <div key={i} className="log-card">
                     <div className="log-header">
                          <div className="log-title-area">
                               <span className="log-type">Activity Log</span>
                               <span className="log-date">{new Date(a.date || a.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="log-stats-area">
                               <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{a.steps} <small style={{ fontSize: '10px' }}>steps</small></div>
                                  <div style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'bold' }}>{a.activeCalories} kcal</div>
                               </div>
                               <button onClick={() => onDeleteActivity(a.id)} className="delete-log-btn" title="Delete Log">
                                  <FiTrash2 size={16} />
                               </button>
                          </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Trackers;
