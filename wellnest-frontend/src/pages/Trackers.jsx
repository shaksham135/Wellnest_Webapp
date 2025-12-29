// src/pages/Trackers.jsx
import { useState, useEffect } from "react";
import {
  createWorkout,
  createMeal,
  createWater,
  createSleep,
  createSteps, // NEW
  getWorkouts,
  getMeals,
  getWater,
  getSleep,
  getSteps, // NEW
} from "../api/trackerApi";


const Trackers = () => {
  const [tab, setTab] = useState("workout");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // success or error messages
  const [messageType, setMessageType] = useState("info"); // "info" | "error" | "success"

    // Workout
  const [workout, setWorkout] = useState({
    type: "cardio",
    durationMinutes: 30,
    caloriesBurned: "",
    notes: "",
  });

  const [userWeight, setUserWeight] = useState(70); // Default 70kg, will be fetched from user profile
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

    // Steps
  const [steps, setSteps] = useState({
    count: 0,
    distance: 0, // Will be calculated automatically
    caloriesBurned: 0, // Will be calculated automatically
    notes: "",
  });

  const [recentSteps, setRecentSteps] = useState([]);
  const [calculatedStepsData, setCalculatedStepsData] = useState({
    distance: 0,
    calories: 0,
    intensity: "Light"
  });

  // Step counting sensor states
  const [isCountingSteps, setIsCountingSteps] = useState(false);
  const [sensorSupported, setSensorSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [stepCountingError, setStepCountingError] = useState('');
  const [dailyStepCount, setDailyStepCount] = useState(0);
  const [stepThreshold] = useState(1.2); // Acceleration threshold for step detection

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

  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [recentWater, setRecentWater] = useState([]);
  const [recentSleep, setRecentSleep] = useState([]);

  // load data when tab changes
  useEffect(() => {
    const load = async () => {
      try {
        setMessage(""); // clear any previous messages when loading new tab
        setMessageType("info");

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
        }
      } catch (err) {
        // don't spam user with network errors here; show on submit
        console.error("Load trackers error:", err);
      }
    };
    load();
  }, [tab]);
  // Fetch user weight from profile
useEffect(() => {
  const fetchUserWeight = async () => {
    try {
      const { fetchCurrentUser } = await import("../api/userApi");
      const res = await fetchCurrentUser();
      if (res.data && res.data.weightKg) {
        setUserWeight(res.data.weightKg);
      }
    } catch (err) {
      // Keep default weight of 70kg if user weight fetch fails
    }
  };
  fetchUserWeight();
}, []);

  // Initialize sleep quality calculation
useEffect(() => {
  if (sleep.hours > 0) {
    const qualityData = calculateSleepQuality(sleep.hours);
    setSleep(prev => ({ ...prev, quality: qualityData.quality }));
    setCalculatedSleepQuality(qualityData);
  }
}, [sleep.hours]); // Run when sleep hours change

  // Check for sensor support and permissions on component mount
  useEffect(() => {
    const checkSensorSupport = async () => {
      try {
        // Check if DeviceMotionEvent is supported
        if (typeof DeviceMotionEvent !== 'undefined') {
          setSensorSupported(true);
          
          // For iOS 13+ devices, we need to request permission
          if (typeof DeviceMotionEvent.requestPermission === 'function') {
            const permission = await DeviceMotionEvent.requestPermission();
            setPermissionStatus(permission);
            if (permission !== 'granted') {
              setStepCountingError('Motion sensor permission denied. Please enable in browser settings.');
            }
          } else {
            setPermissionStatus('granted');
          }
        } else {
          setSensorSupported(false);
          setStepCountingError('Motion sensors not supported on this device.');
        }
      } catch (error) {
        console.error('Error checking sensor support:', error);
        setStepCountingError('Error accessing motion sensors: ' + error.message);
      }
    };

    const loadTodaysSteps = () => {
      const today = new Date().toDateString();
      const savedSteps = localStorage.getItem(`dailySteps_${today}`);
      if (savedSteps) {
        const stepCount = parseInt(savedSteps);
        setDailyStepCount(stepCount);
        setSteps(prev => ({ ...prev, count: stepCount }));
        
        // Calculate and update step data
        const stepsData = calculateStepsData(stepCount, userWeight);
        setCalculatedStepsData(stepsData);
      }
    };

    checkSensorSupport();
    loadTodaysSteps();
  }, [userWeight]);

  // Auto-save steps every 30 seconds when counting
  useEffect(() => {
    const autoSaveSteps = async () => {
      if (dailyStepCount > 0) {
        try {
          const stepsData = calculateStepsData(dailyStepCount, userWeight);
          
          const payload = {
            count: dailyStepCount,
            distance: Number(stepsData.distance),
            caloriesBurned: stepsData.calories,
            notes: `Auto-tracked: ${stepsData.intensity} activity level`,
          };
          
          await createSteps(payload);
        } catch (error) {
          console.error('Auto-save steps error:', error);
        }
      }
    };

    let interval;
    if (isCountingSteps && dailyStepCount > 0) {
      interval = setInterval(() => {
        autoSaveSteps();
      }, 30000); // Save every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCountingSteps, dailyStepCount, userWeight]);

  // Save today's steps to localStorage
  const saveTodaysSteps = (stepCount) => {
    const today = new Date().toDateString();
    localStorage.setItem(`dailySteps_${today}`, stepCount.toString());
  };

  // Start step counting using device motion sensors
  const startStepCounting = () => {
    if (!sensorSupported || permissionStatus !== 'granted') {
      setStepCountingError('Cannot start step counting. Sensor not supported or permission denied.');
      return;
    }

    setIsCountingSteps(true);
    setStepCountingError('');
    
    let stepCount = dailyStepCount;
    let lastStepTime = 0;
    let isStep = false;

    const handleMotion = (event) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      
      // Calculate total acceleration magnitude
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      
      // Detect step based on acceleration threshold and timing
      const currentTime = Date.now();
      const timeSinceLastStep = currentTime - lastStepTime;
      
      // Step detection logic: significant acceleration change + minimum time between steps
      if (totalAcceleration > stepThreshold && timeSinceLastStep > 300 && !isStep) {
        stepCount++;
        setDailyStepCount(stepCount);
        setSteps(prev => ({ ...prev, count: stepCount }));
        
        // Calculate and update step data
        const stepsData = calculateStepsData(stepCount, userWeight);
        setCalculatedStepsData(stepsData);
        
        // Save to localStorage
        saveTodaysSteps(stepCount);
        
        lastStepTime = currentTime;
        isStep = true;
        
        // Reset step flag after a short delay
        setTimeout(() => {
          isStep = false;
        }, 200);
      }
    };

    // Add event listener for device motion
    window.addEventListener('devicemotion', handleMotion);
    
    // Store the event listener reference for cleanup
    window.stepCountingHandler = handleMotion;
  };

  // Stop step counting
  const stopStepCounting = async () => {
    setIsCountingSteps(false);
    
    if (window.stepCountingHandler) {
      window.removeEventListener('devicemotion', window.stepCountingHandler);
      window.stepCountingHandler = null;
    }
    
    // Save final count to database
    if (dailyStepCount > 0) {
      try {
        const stepsData = calculateStepsData(dailyStepCount, userWeight);
        
        const payload = {
          count: dailyStepCount,
          distance: Number(stepsData.distance),
          caloriesBurned: stepsData.calories,
          notes: `Auto-tracked: ${stepsData.intensity} activity level`,
        };
        
        await createSteps(payload);
      } catch (error) {
        console.error('Final save steps error:', error);
      }
    }
  };

  // Reset daily step count
  const resetStepCount = () => {
    setDailyStepCount(0);
    setSteps(prev => ({ ...prev, count: 0 }));
    setCalculatedStepsData({ distance: 0, calories: 0, intensity: "Sedentary" });
    
    const today = new Date().toDateString();
    localStorage.removeItem(`dailySteps_${today}`);
  };
  // load data when tab changes
  useEffect(() => {
    const load = async () => {
      try {
        setMessage(""); // clear any previous messages when loading new tab
        setMessageType("info");

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
        } else if (tab === "steps") { // NEW
          const res = await getSteps();
          setRecentSteps(res.data || []);
        }
      } catch (err) {
        // don't spam user with network errors here; show on submit
        console.error("Load trackers error:", err);
      }
    };
    load();
  }, [tab]);


  // helper: show message
  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    // auto-hide success messages after 3.5s
    if (type === "success") {
      setTimeout(() => {
        setMessage("");
        setMessageType("info");
      }, 3500);
    }
  };
  // Calculate sleep quality based on hours
const calculateSleepQuality = (hours) => {
  if (hours < 4) {
    return {
      quality: "poor",
      feedback: "Severely insufficient sleep. This can seriously impact your health and cognitive function.",
      color: "#ef4444"
    };
  } else if (hours < 6) {
    return {
      quality: "poor", 
      feedback: "Insufficient sleep. You need more rest for optimal health and performance.",
      color: "#ef4444"
    };
  } else if (hours < 7) {
    return {
      quality: "average",
      feedback: "Below recommended sleep. Try to get at least 7-9 hours for better health.",
      color: "#f59e0b"
    };
  } else if (hours <= 9) {
    return {
      quality: "good",
      feedback: "Excellent! You're getting the recommended amount of sleep for optimal health.",
      color: "#22c55e"
    };
  } else if (hours <= 10) {
    return {
      quality: "average",
      feedback: "Slightly more than recommended. This might be fine if you're recovering or have higher sleep needs.",
      color: "#f59e0b"
    };
  } else {
    return {
      quality: "poor",
      feedback: "Excessive sleep. This might indicate underlying health issues or poor sleep quality.",
      color: "#ef4444"
    };
  }
};
// Calculate distance and calories from step count
const calculateStepsData = (stepCount, weightKg) => {
  // Average step length for adults: 0.762 meters (2.5 feet)
  const averageStepLength = 0.762; // meters
  
  // Calculate distance in kilometers
  const distanceKm = (stepCount * averageStepLength) / 1000;
  
  // Calculate calories burned from walking
  // Formula: Calories = MET × weight (kg) × time (hours)
  // For walking: MET = 3.5 (moderate pace)
  // Average walking speed: 5 km/h
  const walkingMET = 3.5;
  const averageWalkingSpeed = 5; // km/h
  const timeHours = distanceKm / averageWalkingSpeed;
  const caloriesBurned = Math.round(walkingMET * weightKg * timeHours);
  
  // Determine activity level based on step count
  let intensity = "Sedentary";
  let feedback = "";
  
  if (stepCount < 5000) {
    intensity = "Sedentary";
    feedback = "Try to increase your daily movement. Aim for at least 10,000 steps!";
  } else if (stepCount < 7500) {
    intensity = "Low Active";
    feedback = "Good start! You're on your way to a more active lifestyle.";
  } else if (stepCount < 10000) {
    intensity = "Somewhat Active";
    feedback = "Great progress! You're close to the recommended 10,000 steps.";
  } else if (stepCount < 12500) {
    intensity = "Active";
    feedback = "Excellent! You've reached the recommended daily step goal.";
  } else {
    intensity = "Highly Active";
    feedback = "Outstanding! You're exceeding daily activity recommendations.";
  }
  
  return {
    distance: distanceKm.toFixed(2),
    calories: caloriesBurned,
    intensity,
    feedback
  };
};


// Calculate calories burned based on exercise type, duration, and body weight
const calculateCaloriesBurned = (exerciseType, durationMinutes, weightKg) => {
  // MET (Metabolic Equivalent of Task) values for different exercises
  const metValues = {
    cardio: {
      walking: 3.5,
      jogging: 7.0,
      running: 9.8,
      cycling: 8.0,
      swimming: 8.3,
      dancing: 4.8,
      aerobics: 6.6,
      default: 6.0 // General cardio
    },
    strength: {
      weightlifting: 6.0,
      bodyweight: 4.0,
      resistance: 5.0,
      powerlifting: 6.0,
      default: 5.0 // General strength training
    },
    yoga: {
      hatha: 2.5,
      vinyasa: 4.0,
      power: 4.0,
      hot: 5.0,
      default: 3.0 // General yoga
    },
    pilates: {
      default: 3.0 // Pilates
    },
    sports: {
      basketball: 8.0,
      tennis: 7.3,
      soccer: 7.0,
      badminton: 5.5,
      default: 6.5 // General sports
    },
    flexibility: {
      stretching: 2.3,
      mobility: 2.5,
      default: 2.3 // General flexibility work
    }
  };

  // Get MET value for the exercise type
  let met = metValues[exerciseType]?.default || 4.0;
  
  // Formula: Calories = MET × weight (kg) × time (hours)
  const hours = durationMinutes / 60;
  const calories = Math.round(met * weightKg * hours);
  
  return {
    calories,
    met,
    intensity: met < 3 ? "Light" : met < 6 ? "Moderate" : "Vigorous"
  };
};


  const onSubmitWorkout = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");
  try {
    // Calculate calories if not already calculated
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
    showMessage(`Workout logged! Burned ${finalCalories} calories.`, "success");
    const res = await getWorkouts();
    setRecentWorkouts(res.data || []);
  } catch (err) {
    console.error("Save workout error:", err);
    const errMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to save workout";
    showMessage(errMsg, "error");
  } finally {
    setLoading(false);
  }
};


  const onSubmitMeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
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
      showMessage("Meal logged!", "success");
      const res = await getMeals();
      setRecentMeals(res.data || []);
    } catch (err) {
      console.error("Save meal error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save meal";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitWater = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // client-side validation - backend requires 'liters' (not amountLiters)
      const parsed = Number(water.amountLiters);
      if (isNaN(parsed) || parsed <= 0) {
        showMessage("Please enter a valid water amount in liters (e.g. 0.5).", "error");
        setLoading(false);
        return;
      }

      const payload = {
        liters: parsed, // IMPORTANT: backend expects 'liters'
        notes: water.notes || null,
      };

      await createWater(payload);
      showMessage("Water intake logged!", "success");
      const res = await getWater();
      setRecentWater(res.data || []);
    } catch (err) {
      console.error("Save water error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save water intake";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSleep = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        hours: Number(sleep.hours),
        quality: sleep.quality,
        notes: sleep.notes,
      };
      await createSleep(payload);
      showMessage("Sleep logged!", "success");
      const res = await getSleep();
      setRecentSleep(res.data || []);
    } catch (err) {
      console.error("Save sleep error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save sleep";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };
 const onSubmitSteps = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage("");
  try {
    const stepsData = calculateStepsData(dailyStepCount, userWeight);
    
    const payload = {
      count: dailyStepCount,
      distance: Number(stepsData.distance),
      caloriesBurned: stepsData.calories,
      notes: steps.notes || `Sensor-tracked: ${stepsData.intensity} activity level`,
    };
    
    await createSteps(payload);
    showMessage(`Steps logged! You walked ${stepsData.distance}km and burned ${stepsData.calories} calories.`, "success");
    const res = await getSteps();
    setRecentSteps(res.data || []);
  } catch (err) {
    console.error("Save steps error:", err);
    const errMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to save steps";
    showMessage(errMsg, "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="tracker-page container">
      <h2 className="auth-title">Health Trackers</h2>

            <div className="tabs">
        <button
          className={tab === "workout" ? "active" : ""}
          onClick={() => {
            setTab("workout");
            setMessage("");
          }}
        >
          Workout
        </button>
        <button
          className={tab === "meal" ? "active" : ""}
          onClick={() => {
            setTab("meal");
            setMessage("");
          }}
        >
          Meal
        </button>
        <button
          className={tab === "water" ? "active" : ""}
          onClick={() => {
            setTab("water");
            setMessage("");
          }}
        >
          Water
        </button>
        <button
          className={tab === "sleep" ? "active" : ""}
          onClick={() => {
            setTab("sleep");
            setMessage("");
          }}
        >
          Sleep
        </button>
        <button
          className={tab === "steps" ? "active" : ""}
          onClick={() => {
            setTab("steps");
            setMessage("");
          }}
        >
          Steps
        </button>
      </div>


      <div className="tab-content">
                {tab === "workout" && (
          <>
            <form onSubmit={onSubmitWorkout} className="tracker-form">
              <label>
                Your Weight (kg)
                <input
                  type="number"
                  step="0.1"
                  value={userWeight}
                  onChange={(e) => {
                    const weight = parseFloat(e.target.value || 70);
                    setUserWeight(weight);
                    // Recalculate calories when weight changes
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
                    // Recalculate calories when exercise type changes
                    if (workout.durationMinutes > 0) {
                      const calorieData = calculateCaloriesBurned(newType, workout.durationMinutes, userWeight);
                      setCalculatedCalories(calorieData.calories);
                      setWorkout(prev => ({ ...prev, type: newType, caloriesBurned: calorieData.calories }));
                    }
                  }}
                >
                  <option value="cardio">Cardio (Running, Cycling, Swimming)</option>
                  <option value="strength">Strength Training (Weights, Resistance)</option>
                  <option value="yoga">Yoga (Hatha, Vinyasa, Power)</option>
                  <option value="pilates">Pilates</option>
                  <option value="sports">Sports (Basketball, Tennis, Soccer)</option>
                  <option value="flexibility">Flexibility (Stretching, Mobility)</option>
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
                    // Recalculate calories when duration changes
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

              {/* Calorie Calculation Display */}
              {workout.durationMinutes > 0 && (
                <div style={{ 
                  marginTop: "12px", 
                  marginBottom: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  border: "2px solid #22c55e"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    marginBottom: "8px"
                  }}>
                    <span style={{ fontSize: "14px", color: "#e5e7eb" }}>Estimated Calories Burned:</span>
                    <span style={{ 
                      fontSize: "16px", 
                      fontWeight: "600",
                      color: "#22c55e"
                    }}>
                      {calculatedCalories} kcal
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#d1d5db",
                    lineHeight: "1.4"
                  }}>
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
                  placeholder="How did the workout feel? Any specific exercises?"
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Workout"}
              </button>
            </form>

            {recentWorkouts.length > 0 && (
              <div className="recent-list">
                <h4>Recent workouts</h4>
                {recentWorkouts.slice(0, 6).map((w) => {
                  // Recalculate calories for display consistency
                  const calorieData = calculateCaloriesBurned(w.type, w.durationMinutes || w.duration, userWeight);
                  return (
                    <div className="card" key={w.id || JSON.stringify(w)} style={{
                      borderLeft: `4px solid #22c55e`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ textTransform: "capitalize" }}>{w.type}</strong>
                        <span>• {w.durationMinutes || w.duration} min</span>
                        <span style={{ color: "#22c55e", fontWeight: "500" }}>
                          • {w.caloriesBurned || calorieData.calories} kcal
                        </span>
                      </div>
                      <div className="small" style={{ color: "#9ca3af" }}>
                        {w.notes}
                      </div>
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
                <select
                  value={meal.mealType}
                  onChange={(e) => setMeal({ ...meal, mealType: e.target.value })}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </label>

              <label>
                Calories
                <input
                  type="number"
                  value={meal.calories}
                  onChange={(e) => setMeal({ ...meal, calories: parseInt(e.target.value || 0) })}
                  min="0"
                />
              </label>

              <label>
                Protein (g)
                <input
                  type="number"
                  value={meal.protein}
                  onChange={(e) => setMeal({ ...meal, protein: parseInt(e.target.value || 0) })}
                  min="0"
                />
              </label>

              <label>
                Carbs (g)
                <input
                  type="number"
                  value={meal.carbs}
                  onChange={(e) => setMeal({ ...meal, carbs: parseInt(e.target.value || 0) })}
                  min="0"
                />
              </label>

              <label>
                Fats (g)
                <input
                  type="number"
                  value={meal.fats}
                  onChange={(e) => setMeal({ ...meal, fats: parseInt(e.target.value || 0) })}
                  min="0"
                />
              </label>

              <label>
                Notes
                <input
                  type="text"
                  value={meal.notes}
                  onChange={(e) => setMeal({ ...meal, notes: e.target.value })}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Meal"}
              </button>
            </form>

            {recentMeals.length > 0 && (
              <div className="recent-list">
                <h4>Recent meals</h4>
                {recentMeals.slice(0, 6).map((m) => (
                  <div className="card" key={m.id || JSON.stringify(m)}>
                    <div>
                      <strong>{m.mealType}</strong> — {m.calories} kcal
                    </div>
                    <div>
                      Protein {m.protein || "-"}g • Carbs {m.carbs || "-"}g • Fats {m.fats || "-"}g
                    </div>
                    <div className="small">{m.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "water" && (
          <>
            <form onSubmit={onSubmitWater} className="tracker-form">
              <label>
                Amount (liters)
                <input
                  type="number"
                  step="0.1"
                  value={water.amountLiters}
                  onChange={(e) =>
                    setWater({ ...water, amountLiters: parseFloat(e.target.value || 0) })
                  }
                  min="0"
                />
              </label>
              <label>
                Notes
                <input
                  type="text"
                  value={water.notes}
                  onChange={(e) => setWater({ ...water, notes: e.target.value })}
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Water Intake"}
              </button>
            </form>

            {recentWater.length > 0 && (
              <div className="recent-list">
                <h4>Recent water logs</h4>
                {recentWater.slice(0, 6).map((w) => (
                  <div className="card" key={w.id || JSON.stringify(w)}>
                    {/* backend may return liters, amountLiters, or amount - prefer liters */}
                    <div>{(w.liters ?? w.amountLiters ?? w.amount ?? "-")} L</div>
                    <div className="small">{w.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

                {tab === "sleep" && (
          <>
            <form onSubmit={onSubmitSleep} className="tracker-form">
              <label>
                Hours slept
                <input
                  type="number"
                  step="0.1"
                  value={sleep.hours}
                  onChange={(e) => {
                    const hours = parseFloat(e.target.value || 0);
                    const qualityData = calculateSleepQuality(hours);
                    setSleep({ 
                      ...sleep, 
                      hours: hours,
                      quality: qualityData.quality 
                    });
                    setCalculatedSleepQuality(qualityData);
                  }}
                  min="0"
                  max="24"
                />
              </label>

              {/* Sleep Quality Display - Auto-calculated */}
              {sleep.hours > 0 && (
                <div style={{ 
                  marginTop: "12px", 
                  marginBottom: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  border: `2px solid ${calculatedSleepQuality.color}`
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    marginBottom: "8px"
                  }}>
                    <span style={{ fontSize: "14px", color: "#e5e7eb" }}>Sleep Quality:</span>
                    <span style={{ 
                      fontSize: "14px", 
                      fontWeight: "600",
                      color: calculatedSleepQuality.color,
                      textTransform: "capitalize"
                    }}>
                      {calculatedSleepQuality.quality}
                    </span>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: calculatedSleepQuality.color
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#d1d5db",
                    lineHeight: "1.4"
                  }}>
                    💡 {calculatedSleepQuality.feedback}
                  </div>
                </div>
              )}

              <label>
                Notes
                <input 
                  type="text" 
                  value={sleep.notes} 
                  onChange={(e) => setSleep({ ...sleep, notes: e.target.value })} 
                  placeholder="How did you feel? Any sleep disturbances?"
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Sleep"}
              </button>
            </form>

            {recentSleep.length > 0 && (
              <div className="recent-list">
                <h4>Recent sleep logs</h4>
                {recentSleep.slice(0, 6).map((s) => {
                  const qualityData = calculateSleepQuality(s.hours);
                  return (
                    <div className="card" key={s.id || JSON.stringify(s)} style={{
                      borderLeft: `4px solid ${qualityData.color}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{s.hours} hours</span>
                        <span style={{ 
                          color: qualityData.color,
                          fontWeight: "500",
                          textTransform: "capitalize"
                        }}>
                          • {s.quality}
                        </span>
                      </div>
                      <div className="small" style={{ color: "#9ca3af" }}>
                        {s.notes}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
         
                 {tab === "steps" && (
          <>
            <div className="tracker-form">
              {/* Sensor Status Display */}
              <div style={{ 
                marginBottom: "20px",
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "rgba(15, 23, 42, 0.5)",
                border: `2px solid ${sensorSupported && permissionStatus === 'granted' ? '#22c55e' : '#ef4444'}`
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  marginBottom: "8px"
                }}>
                  <span style={{ fontSize: "14px", color: "#e5e7eb" }}>Sensor Status:</span>
                  <span style={{ 
                    fontSize: "14px", 
                    fontWeight: "600",
                    color: sensorSupported && permissionStatus === 'granted' ? '#22c55e' : '#ef4444'
                  }}>
                    {sensorSupported && permissionStatus === 'granted' ? 'Ready' : 'Not Available'}
                  </span>
                </div>
                {stepCountingError && (
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#ef4444",
                    lineHeight: "1.4"
                  }}>
                    ⚠️ {stepCountingError}
                  </div>
                )}
                {sensorSupported && permissionStatus === 'granted' && (
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#22c55e",
                    lineHeight: "1.4"
                  }}>
                    ✅ Motion sensors are active and ready to track your steps automatically
                  </div>
                )}
              </div>

              {/* Step Counter Display */}
              <div style={{ 
                marginBottom: "20px",
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                border: "2px solid #3b82f6",
                textAlign: "center"
              }}>
                <div style={{ 
                  fontSize: "48px", 
                  fontWeight: "bold",
                  color: "#3b82f6",
                  marginBottom: "8px"
                }}>
                  {dailyStepCount.toLocaleString()}
                </div>
                <div style={{ 
                  fontSize: "16px", 
                  color: "#e5e7eb",
                  marginBottom: "12px"
                }}>
                  Steps Today
                </div>
                
                {/* Control Buttons */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  {sensorSupported && permissionStatus === 'granted' && (
                    <>
                      {!isCountingSteps ? (
                        <button
                          type="button"
                          onClick={startStepCounting}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#22c55e",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}
                        >
                          🚀 Start Tracking
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopStepCounting}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}
                        >
                          ⏹️ Stop Tracking
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={resetStepCount}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}
                      >
                        🔄 Reset
                      </button>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          const { addSampleStepsData } = await import("../utils/sampleStepsData");
                          const success = await addSampleStepsData();
                          if (success) {
                            showMessage("Sample steps data added for analytics testing!", "success");
                            // Refresh the recent steps list
                            const res = await getSteps();
                            setRecentSteps(res.data || []);
                          } else {
                            showMessage("Failed to add sample data", "error");
                          }
                        }}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#8b5cf6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}
                      >
                        📊 Add Sample Data
                      </button>
                    </>
                  )}
                </div>
                
                {isCountingSteps && (
                  <div style={{ 
                    marginTop: "12px",
                    fontSize: "12px", 
                    color: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px"
                  }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      animation: "pulse 2s infinite"
                    }} />
                    Actively tracking your movement...
                  </div>
                )}
              </div>

              {/* Steps Calculation Display */}
              {dailyStepCount > 0 && (
                <div style={{ 
                  marginTop: "12px", 
                  marginBottom: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  border: `2px solid ${
                    calculatedStepsData.intensity === "Sedentary" ? "#ef4444" :
                    calculatedStepsData.intensity === "Low Active" ? "#f59e0b" :
                    calculatedStepsData.intensity === "Somewhat Active" ? "#eab308" :
                    calculatedStepsData.intensity === "Active" ? "#22c55e" : "#16a34a"
                  }`
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "16px",
                    marginBottom: "8px",
                    flexWrap: "wrap"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>Distance:</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#22c55e" }}>
                        {calculatedStepsData.distance} km
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>Calories:</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#f59e0b" }}>
                        {calculatedStepsData.calories} kcal
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af" }}>Activity Level:</span>
                      <span style={{ 
                        fontSize: "14px", 
                        fontWeight: "600",
                        color: calculatedStepsData.intensity === "Sedentary" ? "#ef4444" :
                               calculatedStepsData.intensity === "Low Active" ? "#f59e0b" :
                               calculatedStepsData.intensity === "Somewhat Active" ? "#eab308" :
                               calculatedStepsData.intensity === "Active" ? "#22c55e" : "#16a34a"
                      }}>
                        {calculatedStepsData.intensity}
                      </span>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#d1d5db",
                    lineHeight: "1.4"
                  }}>
                    🚶‍♀️ {calculatedStepsData.feedback}
                  </div>
                </div>
              )}

              {/* Manual Save Form */}
              <form onSubmit={onSubmitSteps} style={{ marginTop: "20px" }}>
                <label>
                  Notes (Optional)
                  <input
                    type="text"
                    value={steps.notes}
                    onChange={(e) => setSteps({ ...steps, notes: e.target.value })}
                    placeholder="Add notes about your activity..."
                  />
                </label>

                <button type="submit" disabled={loading || dailyStepCount === 0}>
                  {loading ? "Saving..." : "Save Today's Steps"}
                </button>
              </form>

              {/* Sensor Information */}
              {!sensorSupported && (
                <div style={{ 
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid #ef4444"
                }}>
                  <div style={{ color: "#ef4444", fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
                    📱 Device Not Supported
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.4" }}>
                    Your device doesn't support motion sensors for automatic step counting. 
                    This feature works best on mobile devices with accelerometers.
                  </div>
                </div>
              )}
            </div>

            {recentSteps.length > 0 && (
              <div className="recent-list">
                <h4>Recent step logs</h4>
                {recentSteps.slice(0, 6).map((s) => {
                  const stepsData = calculateStepsData(s.count, userWeight);
                  return (
                    <div className="card" key={s.id || JSON.stringify(s)} style={{
                      borderLeft: `4px solid ${
                        stepsData.intensity === "Sedentary" ? "#ef4444" :
                        stepsData.intensity === "Low Active" ? "#f59e0b" :
                        stepsData.intensity === "Somewhat Active" ? "#eab308" :
                        stepsData.intensity === "Active" ? "#22c55e" : "#16a34a"
                      }`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "600" }}>{s.count.toLocaleString()} steps</span>
                        <span style={{ color: "#22c55e" }}>• {s.distance || stepsData.distance}km</span>
                        <span style={{ color: "#f59e0b" }}>• {s.caloriesBurned || stepsData.calories} kcal</span>
                      </div>
                      <div style={{ 
                        fontSize: "12px", 
                        color: stepsData.intensity === "Sedentary" ? "#ef4444" :
                               stepsData.intensity === "Low Active" ? "#f59e0b" :
                               stepsData.intensity === "Somewhat Active" ? "#eab308" :
                               stepsData.intensity === "Active" ? "#22c55e" : "#16a34a",
                        fontWeight: "500"
                      }}>
                        {stepsData.intensity}
                      </div>
                      <div className="small" style={{ color: "#9ca3af" }}>
                        {s.notes}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {message && (
        <div className={`message ${messageType === "error" ? "error" : messageType === "success" ? "success" : ""}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Trackers;
