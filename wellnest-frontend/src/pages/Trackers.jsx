// src/pages/Trackers.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import cacheService from "../api/cacheService";
import { useData } from "../context/DataContext";
import { toLocalDateString } from "../utils/streakUtils";
import apiClient from "../api/apiClient";
import toast from "react-hot-toast";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useActivity } from "../context/ActivityContext";
import { FiActivity, FiRefreshCw } from "react-icons/fi";
import ResonancePulse from "../components/shared/ResonancePulse";
import VoiceScanButton from "../components/dashboard/VoiceScanButton";
import LogHistoryTimeline from "../components/dashboard/LogHistoryTimeline";
import { speakMessage } from "../utils/ttsService";
import "./Trackers.css";

const getFriendlyErrorMessage = (err, fallback = "Failed to log details.") => {
  if (err?.response?.data) {
    const data = err.response.data;
    if (data.message && typeof data.message === 'string') {
      if (
        data.message.includes("Glitch") || 
        data.message.toLowerCase().includes("unexpected neural") || 
        data.message.includes("SQL") || 
        data.message.includes("Exception") || 
        data.message.includes("Internal Server Error") ||
        data.message.includes("jakarta") ||
        data.message.includes("hibernate")
      ) {
        return "An unexpected neural glitch occurred. Please try again later.";
      }
      return data.message;
    }
    if (data.error && typeof data.error === 'string') {
      if (data.error.includes("Internal Server Error")) {
        return "An unexpected neural glitch occurred. Please try again later.";
      }
      return data.error;
    }
  }
  if (err?.message && typeof err.message === 'string') {
    if (err.message.includes("Network Error") || err.message.toLowerCase().includes("network")) {
      return "Network connection issue. Please check your internet connection.";
    }
    if (!err.message.includes("Internal Server Error") && !err.message.includes("Exception") && !err.message.includes("SQL")) {
      return err.message;
    }
  }
  return fallback;
};

const Trackers = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    refreshUserData, 
    userData,
    workouts: recentWorkouts,
    setWorkouts: setRecentWorkouts,
    meals: recentMeals,
    setMeals: setRecentMeals,
    water: recentWater,
    setWater: setRecentWater,
    sleep: recentSleep,
    setSleep: setRecentSleep,
    activities: recentActivity,
    setActivities: setRecentActivity,
    refreshTrackers,
    submitVoiceCommand
  } = useData();
  const [tab, setTab] = useState(location.state?.tab || "workout");
  const [logMode, setLogMode] = useState("voice"); // "voice" or "manual"
  const [resonanceData, setResonanceData] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textCommand, setTextCommand] = useState("");
  const [floatingXps, setFloatingXps] = useState([]);

  const handleRefreshUser = async () => {
    try {
      const prevLevel = userData?.level || 1;
      const updatedUser = await refreshUserData();
      if (updatedUser && updatedUser.level > prevLevel) {
        toast.success(`🎉 LEVEL UP! You reached Level ${updatedUser.level}! 🪙 Awarded ${updatedUser.level * 5} coins!`, {
          duration: 6000,
          style: {
            border: '2px solid #fbbf24',
            padding: '16px',
            color: '#fff',
            background: '#0f172a',
          },
          iconTheme: {
            primary: '#fbbf24',
            secondary: '#0f172a',
          },
        });
      }
    } catch (err) {
      console.error("Failed to refresh user data", err);
    }
  };

  const triggerXpBubble = (target, xpAmount) => {
    let element = target;
    if (target && target.currentTarget) {
      element = target.currentTarget;
    } else if (target && target.target) {
      element = target.target;
    }
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const newBubble = {
      id: Date.now() + Math.random(),
      x: rect.left + rect.width / 2,
      y: rect.top,
      amount: xpAmount
    };
    setFloatingXps(prev => [...prev, newBubble]);
    setTimeout(() => {
      setFloatingXps(prev => prev.filter(x => x.id !== newBubble.id));
    }, 1000);
  };

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
  const [isSyncingHealth, setIsSyncingHealth] = useState(false);


  
  // Connect to Global Activity Context
  const { 
    liveSteps, 
    isTracking, 
    isHealthConnected, 
    startTracking, 
    stopTracking, 
    connectHealth,
    syncHealthData: globalSyncHealthData 
  } = useActivity();

  const handleSyncHealth = async () => {
    if (isSyncingHealth) return;
    try {
      setIsSyncingHealth(true);
      toast.loading("Syncing physical vitality... 🧬", { id: "health-sync" });
      await globalSyncHealthData();
      
      // REFRESH DATA FROM BACKEND
      const res = await getActivity();
      setRecentActivity(res.data || []);
      cacheService.set('/trackers/activity', res.data || []);
      
      toast.success("Vitality Synced! ✨", { id: "health-sync" });
    } catch (err) {
      toast.error("Sync partial or failed. Try again.", { id: "health-sync" });
    } finally {
      setIsSyncingHealth(false);
    }
  };

  const handleTextCommandSubmit = async (e) => {
    e.preventDefault();
    const command = textCommand.trim();
    if (!command) return;

    const tid = toast.loading("Processing text command... 🧬");
    const isMuted = localStorage.getItem('coach_voice_muted') === 'true';
    try {
      const res = await submitVoiceCommand(command);
      toast.dismiss(tid);
      toast.success(res.displayMessage || "Log synchronized! ✨");
      if (res.voiceMessage) {
        speakMessage(res.voiceMessage, isMuted);
      }
      setTextCommand("");
      setShowTextInput(false);
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.message || "Failed to process text command.");
      const speakMsg = err.voiceMessage || "I couldn't quite catch that.";
      speakMessage(speakMsg, isMuted);
    }
  };

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
  }, [tab, setRecentWorkouts, setRecentMeals, setRecentSleep, setRecentWater, setRecentActivity]);

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
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    const tid = toast.loading("Syncing workout with Neural Core... 🧬");
    try {
      const { calories } = calculateCaloriesBurned(workout.type, workout.durationMinutes, userWeight);
      const res = await createWorkout({ ...workout, caloriesBurned: calories });
      toast.dismiss(tid);
      const duration = workout.durationMinutes || 30;
      const xpGained = 5 + Math.floor(duration / 5);
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(`Workout logged! +${xpGained} XP`);
      triggerXpBubble(submitBtn, xpGained);
      const listRes = await getWorkouts();
      setRecentWorkouts(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to save workout"), { id: tid });
    }
  };

  const onSubmitMeal = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    const tid = toast.loading("Analyzing nutritional resonance... 🥗");
    try {
      const localDate = toLocalDateString(new Date());
      const res = await createMeal({ ...meal, date: localDate });
      toast.dismiss(tid);
      const protein = Number(meal.protein) || 0;
      const xpGained = 5 + (protein > 0 ? Math.min(5, Math.floor(protein / 10)) : 0);
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(`Meal logged! +${xpGained} XP`);
      triggerXpBubble(submitBtn, xpGained);
      const listRes = await getMeals();
      setRecentMeals(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to save meal"), { id: tid });
    }
  };

  const onSubmitWater = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    const tid = toast.loading("Logging hydration pulse... 💧");
    try {
      const localDate = toLocalDateString(new Date());
      const res = await createWater({ ...water, liters: Number(water.amountLiters), notes: water.notes, date: localDate });
      toast.dismiss(tid);
      const amtLiters = Number(water.amountLiters || 0.25);
      const normalizedLiters = amtLiters > 2.0 ? amtLiters / 1000.0 : amtLiters;
      const logXp = 2 + Math.round(normalizedLiters * 4.0);
      const isBonus = (waterToday < targets.targetWaterLiters) && (waterToday + normalizedLiters >= targets.targetWaterLiters);
      const xpGained = isBonus ? (logXp + 15) : logXp;
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(isBonus ? `Water intake logged! +${xpGained} XP (Daily Goal Achieved! 🏆)` : `Water intake logged! +${xpGained} XP`);
      triggerXpBubble(submitBtn, xpGained);
      const listRes = await getWater();
      setRecentWater(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to save water"), { id: tid });
    }
  };

  const onSubmitSleep = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    const tid = toast.loading("Syncing sleep cycle data... 🌙");
    try {
      const localDate = toLocalDateString(new Date());
      const res = await createSleep({ ...sleep, date: localDate });
      toast.dismiss(tid);
      const hoursVal = Number(sleep.hours || 8.0);
      const xpGained = 5 + Math.round(hoursVal * 0.5);
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(`Sleep logged! +${xpGained} XP`);
      triggerXpBubble(submitBtn, xpGained);
      const listRes = await getSleep();
      setRecentSleep(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to save sleep"), { id: tid });
    }
  };

  const onSubmitActivity = async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    const tid = toast.loading("Syncing activity with Neural Core... ⚡");
    try {
      // Send local date for accurate sync
      const localDate = toLocalDateString(new Date());
      const stepsVal = Number(activity.steps || 0);
      const calculatedCals = Math.round(stepsVal * 0.04);
      const calculatedDist = Math.round(stepsVal * 0.00075 * 100) / 100;

      const res = await createActivity({
        steps: stepsVal,
        activeCalories: calculatedCals,
        distanceKm: calculatedDist,
        date: localDate
      });
      toast.dismiss(tid);
      const logXp = 2 + Math.floor(stepsVal / 2000);
      const isBonus = (activityToday.steps < targets.targetSteps) && (activityToday.steps + stepsVal >= targets.targetSteps);
      const xpGained = isBonus ? (logXp + 15) : logXp;
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(isBonus ? `Activity logged! +${xpGained} XP (Daily Goal Achieved! 🏆)` : `Activity logged! +${xpGained} XP`);
      triggerXpBubble(submitBtn, xpGained);
      const listRes = await getActivity();
      setRecentActivity(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to save activity"), { id: tid });
    }
  };

  const quickLogWater = async (liters, element) => {
    const tid = toast.loading(`Logging ${liters}L water... 💧`);
    try {
      const localDate = toLocalDateString(new Date());
      const res = await createWater({ liters: Number(liters), notes: "Quick Log", date: localDate });
      toast.dismiss(tid);
      const amtLiters = Number(liters);
      const normalizedLiters = amtLiters > 2.0 ? amtLiters / 1000.0 : amtLiters;
      const logXp = 2 + Math.round(normalizedLiters * 4.0);
      const isBonus = (waterToday < targets.targetWaterLiters) && (waterToday + normalizedLiters >= targets.targetWaterLiters);
      const xpGained = isBonus ? (logXp + 15) : logXp;
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(isBonus ? `Logged ${liters}L water! +${xpGained} XP (Daily Goal Achieved! 🏆)` : `Logged ${liters}L water! +${xpGained} XP`);
      triggerXpBubble(element, xpGained);
      const listRes = await getWater();
      setRecentWater(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to log water"), { id: tid });
    }
  };

  const quickLogSleep = async (hours, quality, element) => {
    const tid = toast.loading(`Logging ${hours}h sleep... 💤`);
    try {
      const localDate = toLocalDateString(new Date());
      const res = await createSleep({ hours, quality, notes: "Quick Log", date: localDate });
      toast.dismiss(tid);
      const xpGained = 5 + Math.round(hours * 0.5);
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(`Sleep logged! +${xpGained} XP`);
      triggerXpBubble(element, xpGained);
      const listRes = await getSleep();
      setRecentSleep(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to log sleep"), { id: tid });
    }
  };

  const quickLogSteps = async (steps, element) => {
    const tid = toast.loading(`Logging ${steps} steps... 🚶‍♂️`);
    try {
      const localDate = toLocalDateString(new Date());
      const res = await createActivity({ steps, activeCalories: Math.round(steps * 0.04), distanceKm: Math.round(steps * 0.00075 * 100) / 100, date: localDate });
      toast.dismiss(tid);
      const logXp = 2 + Math.floor(steps / 2000);
      const isBonus = (activityToday.steps < targets.targetSteps) && (activityToday.steps + steps >= targets.targetSteps);
      const xpGained = isBonus ? (logXp + 15) : logXp;
      if (res.data?.neuralInsight) {
        setResonanceData(res.data);
      }
      toast.success(isBonus ? `Steps logged! +${xpGained} XP (Daily Goal Achieved! 🏆)` : `Steps logged! +${xpGained} XP`);
      triggerXpBubble(element, xpGained);
      const listRes = await getActivity();
      setRecentActivity(listRes.data || []);
      await handleRefreshUser();
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err, "Failed to log steps"), { id: tid });
    }
  };

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
  const _onDeleteActivity = async (id) => {
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

  const handleQuickWater = async () => {
    const amount = 0.25;
    const tid = toast.loading("Logging water intake... 💧");
    try {
      const localDate = toLocalDateString(new Date());
      await createWater({ liters: amount, notes: "Quick Action", date: localDate });
      toast.dismiss(tid);
      
      const isBonus = (waterToday < targets.targetWaterLiters) && (waterToday + amount >= targets.targetWaterLiters);
      if (isBonus) {
        toast.success("Daily Water Target Achieved! +15 XP Bonus! 🏆🎉", { duration: 5000 });
      } else {
        toast.success("250ml Water logged! 💧");
      }
      
      await Promise.all([
        refreshTrackers(),
        handleRefreshUser()
      ]);
    } catch (e) {
      toast.dismiss(tid);
      toast.error(getFriendlyErrorMessage(e, "Failed to log water."));
    }
  };

  const handleQuickSteps = async () => {
    const amount = 1000;
    const tid = toast.loading("Adding steps... 🚶‍♂️");
    try {
      const localDate = toLocalDateString(new Date());
      await createActivity({ steps: amount, activeCalories: Math.round(amount * 0.04), distanceKm: 0.75, date: localDate });
      toast.dismiss(tid);
      
      const isBonus = (activityToday.steps < targets.targetSteps) && (activityToday.steps + amount >= targets.targetSteps);
      if (isBonus) {
        toast.success("Daily Steps Target Achieved! +15 XP Bonus! 🏆🎉", { duration: 5000 });
      } else {
        toast.success("1,000 Steps logged! 🚶‍♂️");
      }
      
      await Promise.all([
        refreshTrackers(),
        handleRefreshUser()
      ]);
    } catch (e) {
      toast.dismiss(tid);
      toast.error(getFriendlyErrorMessage(e, "Failed to log steps."));
    }
  };

  const handleQuickWorkout = async () => {
    const duration = 30;
    const calories = 150;
    const tid = toast.loading("Logging workout... 🏃‍♂️");
    try {
      await createWorkout({ type: "General", durationMinutes: duration, caloriesBurned: calories, notes: "Quick Action" });
      toast.dismiss(tid);
      toast.success("30 Min Workout logged! 🏃‍♂️");
      
      await Promise.all([
        refreshTrackers(),
        handleRefreshUser()
      ]);
    } catch (e) {
      toast.dismiss(tid);
      toast.error(getFriendlyErrorMessage(e, "Failed to log workout."));
    }
  };

  const handleQuickMood = async () => {
    const tid = toast.loading("Logging mood... 🧠");
    try {
      await apiClient.post('/mental/mood-check');
      toast.dismiss(tid);
      toast.success("Mood check completed! 🧠");
      
      await Promise.all([
        refreshTrackers(),
        handleRefreshUser()
      ]);
    } catch (e) {
      toast.dismiss(tid);
      toast.error(getFriendlyErrorMessage(e, "Failed to log mood."));
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

      <div className="tracker-page container" style={{ paddingBottom: '100px' }}>
        <h2 className="auth-title">Health Trackers & Log Center</h2>

        {/* LOG MODE TOGGLE (Voice vs Manual) */}
        <div className="log-mode-selector-wrapper" style={{ marginBottom: '24px' }}>
          <div className="log-mode-selector" style={{ 
            display: 'flex', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '4px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <button 
              onClick={() => setLogMode("voice")}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '12px',
                background: logMode === "voice" ? 'var(--primary)' : 'transparent',
                color: logMode === "voice" ? '#000' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              🎙️ Voice Logging (AI)
            </button>
            <button 
              onClick={() => setLogMode("manual")}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '12px',
                background: logMode === "manual" ? 'var(--primary)' : 'transparent',
                color: logMode === "manual" ? '#000' : 'var(--text-muted)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              ✍️ Advanced Manual Logger
            </button>
          </div>
        </div>

        {logMode === "voice" ? (
          <>
            {/* QUICK ACTIONS ROW */}
            <div className="card quick-actions-container" style={{ marginBottom: '20px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800 }}>⚡ Quick Actions</h3>
              <div className="quick-actions-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <button className="quick-action-btn water-btn" onClick={handleQuickWater} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '16px', color: '#0ea5e9', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  <span className="btn-icon">💧</span>
                  <span className="btn-text">+250ml Water</span>
                </button>
                <button className="quick-action-btn steps-btn" onClick={handleQuickSteps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px', color: '#6366f1', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  <span className="btn-icon">👣</span>
                  <span className="btn-text">+1000 Steps</span>
                </button>
                <button className="quick-action-btn workout-btn" onClick={handleQuickWorkout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  <span className="btn-icon">🏃</span>
                  <span className="btn-text">+30m Workout</span>
                </button>
                <button className="quick-action-btn mood-btn" onClick={handleQuickMood} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', color: '#10b981', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                  <span className="btn-icon">🧠</span>
                  <span className="btn-text">+Mood Check</span>
                </button>
              </div>
            </div>

            {/* VOICE LOGGING CARD */}
            <div className="card voice-logging-container" style={{ marginBottom: '20px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(99, 102, 241, 0.03) 100%)' }}>
              <div style={{ maxWidth: '380px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800 }}>🎙️ AI Voice Journaling</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Hold the button and speak naturally to log water, sleep, meals, or workouts in English or Hinglish!
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '10px 0' }}>
                <VoiceScanButton 
                  onScanComplete={async (audioBlob) => {
                    const tid = toast.loading("Processing voice command... 🧬");
                    const isMuted = localStorage.getItem('coach_voice_muted') === 'true';
                    try {
                      const res = await submitVoiceCommand(audioBlob);
                      toast.dismiss(tid);
                      toast.success(res.displayMessage || "Voice log synchronized! ✨");
                      if (res.voiceMessage) {
                        speakMessage(res.voiceMessage, isMuted);
                      }
                    } catch (e) {
                      toast.dismiss(tid);
                      toast.error(e.message || "Failed to process voice command.");
                      const speakMsg = e.voiceMessage || "I couldn't quite catch that.";
                      speakMessage(speakMsg, isMuted);
                    }
                  }} 
                  mode="command" 
                />
              </div>

              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                  {showTextInput ? (
                      <form onSubmit={handleTextCommandSubmit} style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                          <input 
                              type="text" 
                              placeholder="Type log (e.g. 500ml water)..." 
                              value={textCommand} 
                              onChange={(e) => setTextCommand(e.target.value)}
                              style={{
                                  flex: 1,
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '8px',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  color: 'var(--text-main)',
                                  outline: 'none'
                              }}
                          />
                          <button 
                              type="submit" 
                              className="primary-btn small" 
                              style={{ width: 'auto', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', background: 'var(--primary)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                          >
                              Log
                          </button>
                          <button 
                              type="button" 
                              onClick={() => { setShowTextInput(false); setTextCommand(""); }}
                              style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  textDecoration: 'underline'
                              }}
                          >
                              Cancel
                          </button>
                      </form>
                  ) : (
                      <button 
                          onClick={() => setShowTextInput(true)}
                          style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              textDecoration: 'underline',
                              fontWeight: '600'
                          }}
                      >
                          ⌨️ Can't speak? Type instead
                      </button>
                  )}
              </div>
            </div>
          </>
        ) : (
          /* EXPANDED MANUAL LOG FORMS */
          <div className="card manual-log-container-card" style={{ marginBottom: '20px', padding: '24px' }}>
             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>✍️ Advanced Manual Logger</h3>
             <div className="tabs">
               {["workout", "meal", "water", "sleep", "activity"].map(t => (
                 <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
               ))}
             </div>
             
             <div className="tab-content" style={{ marginTop: '24px' }}>
                {tab === "workout" && (
                  <div className="workout-tracker-content">
                    <div className="tracker-progress-card card">
                      <div className="tracker-progress-circle-container">
                        <CircularProgressbar value={Math.min((workoutsToday / targets.targetWorkoutsPerDay) * 100, 100)} text={`${workoutsToday}/${targets.targetWorkoutsPerDay}`} styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)', trailColor: 'rgba(128, 128, 128, 0.1)', strokeLinecap: 'round' })} />
                      </div>
                      <div className="tracker-progress-info">
                        <div className="tracker-progress-label">Daily Workouts</div>
                        <div className="tracker-progress-sublabel">Target: {targets.targetWorkoutsPerDay || 1} workouts/day</div>
                        <button type="button" onClick={() => handleOpenEditGoal('targetWorkoutsPerDay', targets.targetWorkoutsPerDay || 1)} className="tracker-edit-btn">Edit Target</button>
                      </div>
                    </div>

                    <div className="quick-logs-container">
                      <span className="quick-logs-label">⚡ Quick Logs:</span>
                      <div className="quick-pills-row">
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setWorkout({ type: "walking", durationMinutes: 30, caloriesBurned: "", notes: "Quick walk" });
                          toast.success("Walking loaded! Click 'Save Workout' to log.");
                        }}>🚶‍♂️ 30m Walk</button>
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setWorkout({ type: "cardio", durationMinutes: 30, caloriesBurned: "", notes: "Quick cardio" });
                          toast.success("Cardio loaded! Click 'Save Workout' to log.");
                        }}>🏃‍♂️ 30m Cardio</button>
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setWorkout({ type: "strength", durationMinutes: 45, caloriesBurned: "", notes: "Quick strength" });
                          toast.success("Strength loaded! Click 'Save Workout' to log.");
                        }}>🏋️‍♂️ 45m Gym</button>
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setWorkout({ type: "yoga", durationMinutes: 20, caloriesBurned: "", notes: "Quick yoga" });
                          toast.success("Yoga loaded! Click 'Save Workout' to log.");
                        }}>🧘‍♀️ 20m Yoga</button>
                      </div>
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
                  </div>
                )}

                {tab === "meal" && (
                  <div className="meal-tracker-content">
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
                                
                                const userRes = await apiClient.get("/users/me");
                                const isPremium = userRes.data?.isPremium;
                                if (!isPremium) {
                                    const hasUsedAI = await storageService.getItem("aiMealUsed");
                                    if (hasUsedAI === "true") {
                                        toast.error("Free trial exhausted! Upgrade to Premium for unlimited AI tracking! 🚀", { duration: 4000 });
                                        navigate('/premium');
                                        return;
                                    } else {
                                        await storageService.setItem("aiMealUsed", "true");
                                    }
                                }

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

                    <div className="quick-logs-container">
                      <span className="quick-logs-label">🥗 Quick Load:</span>
                      <div className="quick-pills-row">
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setMeal({ mealType: "breakfast", calories: 250, protein: 12, carbs: 30, fats: 8, notes: "Oats with Milk" });
                          toast.success("Oats & Milk loaded! Click 'Save Log' to save.");
                        }}>🥣 Oats & Milk</button>
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setMeal({ mealType: "lunch", calories: 450, protein: 35, carbs: 40, fats: 12, notes: "Chicken Rice" });
                          toast.success("Chicken Rice loaded! Click 'Save Log' to save.");
                        }}>🍗 Chicken Rice</button>
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setMeal({ mealType: "snack", calories: 150, protein: 12, carbs: 0, fats: 10, notes: "2 Boiled Eggs" });
                          toast.success("2 Eggs loaded! Click 'Save Log' to save.");
                        }}>🥚 2 Eggs</button>
                        <button type="button" className="quick-pill-btn" onClick={() => {
                          setMeal({ mealType: "snack", calories: 120, protein: 24, carbs: 3, fats: 1.5, notes: "Protein Shake" });
                          toast.success("Protein Shake loaded! Click 'Save Log' to save.");
                        }}>🥤 Whey Shake</button>
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
                  </div>
                )}

                {tab === "water" && (
                  <div className="water-tracker-content">
                    <div className="tracker-progress-card card">
                       <div className="tracker-progress-circle-container">
                          <CircularProgressbar value={Math.min((waterToday / targets.targetWaterLiters) * 100, 100)} text={`${waterToday.toFixed(1)}L`} styles={buildStyles({ pathColor: '#3b82f6', textColor: 'var(--text-main)', trailColor: 'rgba(128, 128, 128, 0.1)', strokeLinecap: 'round' })} />
                       </div>
                       <div className="tracker-progress-info">
                         <div className="tracker-progress-label">Water Intake</div>
                         <div className="tracker-progress-sublabel">Daily target: {targets.targetWaterLiters}L</div>
                         <button onClick={() => handleOpenEditGoal('targetWaterLiters', targets.targetWaterLiters)} className="tracker-edit-btn">Edit Target</button>
                       </div>
                    </div>

                    <div className="quick-logs-container">
                       <span className="quick-logs-label">💧 Fast Log:</span>
                       <div className="quick-pills-row">
                         <button type="button" className="quick-pill-btn" onClick={(e) => quickLogWater(0.25, e.currentTarget)}>🥛 250ml</button>
                         <button type="button" className="quick-pill-btn" onClick={(e) => quickLogWater(0.5, e.currentTarget)}>🍼 500ml</button>
                         <button type="button" className="quick-pill-btn" onClick={(e) => quickLogWater(1.0, e.currentTarget)}>🍾 1.0L</button>
                       </div>
                     </div>

                    <form onSubmit={onSubmitWater} className="tracker-form">
                      <div className="tracker-grid-row">
                        <label>Liters <input type="number" step="0.1" value={water.amountLiters} onChange={(e) => setWater({ ...water, amountLiters: e.target.value })} /></label>
                      </div>
                      <button type="submit">Save Water</button>
                    </form>
                  </div>
                )}

                {tab === "sleep" && (
                  <div className="sleep-tracker-content">
                    <div className="tracker-progress-card card">
                       <div className="tracker-progress-circle-container">
                          <CircularProgressbar value={Math.min((recentSleepHours / targets.targetSleepHours) * 100, 100)} text={`${recentSleepHours}h`} styles={buildStyles({ pathColor: '#8b5cf6', textColor: 'var(--text-main)', trailColor: 'rgba(128, 128, 128, 0.1)', strokeLinecap: 'round' })} />
                       </div>
                       <div className="tracker-progress-info">
                         <div className="tracker-progress-label">Sleep Duration</div>
                         <div className="tracker-progress-sublabel">Daily target: {targets.targetSleepHours}h</div>
                         <button onClick={() => handleOpenEditGoal('targetSleepHours', targets.targetSleepHours)} className="tracker-edit-btn">Edit Target</button>
                       </div>
                    </div>

                    <div className="quick-logs-container">
                       <span className="quick-logs-label">💤 Fast Log:</span>
                       <div className="quick-pills-row">
                         <button type="button" className="quick-pill-btn" onClick={(e) => quickLogSleep(7, "good", e.currentTarget)}>🌙 7 hrs (Good)</button>
                         <button type="button" className="quick-pill-btn" onClick={(e) => quickLogSleep(8, "good", e.currentTarget)}>✨ 8 hrs (Good)</button>
                         <button type="button" className="quick-pill-btn" onClick={(e) => quickLogSleep(6, "poor", e.currentTarget)}>⚠️ 6 hrs (Poor)</button>
                       </div>
                     </div>

                    <form onSubmit={onSubmitSleep} className="tracker-form">
                      <div className="tracker-grid-row">
                        <label>Hours <input type="number" value={sleep.hours} onChange={(e) => setSleep({ ...sleep, hours: e.target.value })} /></label>
                      </div>
                      <button type="submit">Save Sleep</button>
                    </form>
                  </div>
                )}

                {tab === "activity" && (
                  <div className="activity-tracker-content">
                     <div className="tracker-progress-card card" style={{ justifyContent: 'center', gap: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                           <div className="tracker-progress-circle-container">
                             <CircularProgressbar value={Math.min((activityToday.steps / targets.targetSteps) * 100, 100)} text="Steps" styles={buildStyles({ pathColor: '#3b82f6', textColor: 'var(--text-main)', trailColor: 'rgba(128, 128, 128, 0.1)', strokeLinecap: 'round' })} />
                           </div>
                           <span style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>{activityToday.steps} / {targets.targetSteps}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                           <div className="tracker-progress-circle-container">
                             <CircularProgressbar value={Math.min((activityToday.activeCalories / targets.targetActiveCalories) * 100, 100)} text="kcal" styles={buildStyles({ pathColor: '#22c55e', textColor: 'var(--text-main)', trailColor: 'rgba(128, 128, 128, 0.1)', strokeLinecap: 'round' })} />
                           </div>
                           <span style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>{activityToday.activeCalories} / {targets.targetActiveCalories} kcal</span>
                        </div>
                     </div>
                     
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                       <button 
                         type="button" 
                         onClick={() => isTracking ? stopTracking() : startTracking()} 
                         className={isTracking ? "secondary-btn" : "primary-btn"}
                         style={{ opacity: isHealthConnected ? 0.6 : 1, cursor: isHealthConnected ? 'not-allowed' : 'pointer' }}
                       >
                         {isTracking ? "Stop Live Tracking" : "Start Live Tracking"}
                       </button>
                       {isHealthConnected && (
                         <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                           Live tracking disabled. Health Connect is providing your activity data. 🧬
                         </span>
                       )}
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
                            <button 
                              onClick={handleSyncHealth} 
                              className={`ghost-btn small ${isSyncingHealth ? 'spinning' : ''}`} 
                              title="Sync Now"
                              disabled={isSyncingHealth}
                            >
                              <FiRefreshCw size={18} style={{ 
                                animation: isSyncingHealth ? 'spin 1s linear infinite' : 'none' 
                              }} />
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

                     <div className="quick-logs-container">
                        <span className="quick-logs-label">👟 Fast Log:</span>
                        <div className="quick-pills-row">
                          <button type="button" className="quick-pill-btn" onClick={(e) => quickLogSteps(1000, e.currentTarget)}>🚶‍♂️ +1k steps</button>
                          <button type="button" className="quick-pill-btn" onClick={(e) => quickLogSteps(5000, e.currentTarget)}>🏃‍♂️ +5k steps</button>
                          <button type="button" className="quick-pill-btn" onClick={(e) => quickLogSteps(10000, e.currentTarget)}>🏆 +10k steps</button>
                        </div>
                      </div>

                     <form onSubmit={onSubmitActivity} className="tracker-form">
                        <div className="tracker-grid-row">
                          <label>Manual Steps Entry <input type="number" value={activity.steps || ''} onChange={(e) => setActivity({ ...activity, steps: e.target.value })} /></label>
                        </div>
                        <button type="submit">Save Activity</button>
                     </form>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* LOG HISTORY TIMELINE */}
        <LogHistoryTimeline />
      </div>
      {resonanceData && (
        <ResonancePulse 
          score={resonanceData.resonanceScore}
          insight={resonanceData.neuralInsight}
          category={resonanceData.resonanceCategory}
          onClose={() => setResonanceData(null)}
        />
      )}
      {floatingXps.map(fx => (
        <div
          key={fx.id}
          className="floating-xp-bubble"
          style={{
            left: `${fx.x}px`,
            top: `${fx.y}px`
          }}
        >
          +{fx.amount} XP
        </div>
      ))}
    </>
  );
};

export default Trackers;
