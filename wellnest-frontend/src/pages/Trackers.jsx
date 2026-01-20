// src/pages/Trackers.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  createWorkout,
  createMeal,
  createWater,
  createSleep,
  getWorkouts,
  getMeals,
  getWater,
  getSleep,
  deleteWorkout,
  deleteMeal,
  deleteWater,
  deleteSleep,
} from "../api/trackerApi";
import { FiTrash2 } from "react-icons/fi";

const Trackers = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || "workout");
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
        console.log("Could not fetch user weight, using default 70kg");
        // Keep default weight of 70kg
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


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
      }
      showMessage("Deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete", "error");
    }
  };

  // Calculate sleep quality based on hours
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
                      borderLeft: `4px solid #22c55e`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
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
                      <button className="ghost-btn icon-btn" onClick={() => handleDelete(w.id, 'workout')} style={{ color: '#ef4444' }}>
                        <FiTrash2 />
                      </button>
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
                  <div className="card" key={m.id || JSON.stringify(m)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div>
                        <strong>{m.mealType}</strong> — {m.calories} kcal
                      </div>
                      <div>
                        Protein {m.protein || "-"}g • Carbs {m.carbs || "-"}g • Fats {m.fats || "-"}g
                      </div>
                      <div className="small">{m.notes}</div>
                    </div>
                    <button className="ghost-btn icon-btn" onClick={() => handleDelete(m.id, 'meal')} style={{ color: '#ef4444' }}>
                      <FiTrash2 />
                    </button>
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
                  <div className="card" key={w.id || JSON.stringify(w)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {/* backend may return liters, amountLiters, or amount - prefer liters */}
                      <div>{(w.liters ?? w.amountLiters ?? w.amount ?? "-")} L</div>
                      <div className="small">{w.notes}</div>
                    </div>
                    <button className="ghost-btn icon-btn" onClick={() => handleDelete(w.id, 'water')} style={{ color: '#ef4444' }}>
                      <FiTrash2 />
                    </button>
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
                      borderLeft: `4px solid ${qualityData.color}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
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
                      <button className="ghost-btn icon-btn" onClick={() => handleDelete(s.id, 'sleep')} style={{ color: '#ef4444' }}>
                        <FiTrash2 />
                      </button>
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
