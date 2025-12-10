// src/pages/Trackers.jsx
import React, { useState, useEffect } from "react";
import {
  createWorkout,
  createMeal,
  createWater,
  createSleep,
  getWorkouts,
  getMeals,
  getWater,
  getSleep,
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

  const onSubmitWorkout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        type: workout.type,
        durationMinutes: workout.durationMinutes,
        caloriesBurned:
          workout.caloriesBurned === "" ? null : Number(workout.caloriesBurned),
        notes: workout.notes,
      };
      await createWorkout(payload);
      showMessage("Workout logged!", "success");
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
                Exercise type
                <select
                  value={workout.type}
                  onChange={(e) => setWorkout({ ...workout, type: e.target.value })}
                >
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength</option>
                  <option value="yoga">Yoga</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label>
                Duration (minutes)
                <input
                  type="number"
                  value={workout.durationMinutes}
                  onChange={(e) =>
                    setWorkout({ ...workout, durationMinutes: parseInt(e.target.value || 0) })
                  }
                  min="1"
                />
              </label>

              <label>
                Calories burned (optional)
                <input
                  type="number"
                  value={workout.caloriesBurned}
                  onChange={(e) =>
                    setWorkout({
                      ...workout,
                      caloriesBurned: e.target.value === "" ? "" : parseInt(e.target.value),
                    })
                  }
                  min="0"
                />
              </label>

              <label>
                Notes
                <input
                  type="text"
                  value={workout.notes}
                  onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Workout"}
              </button>
            </form>

            {recentWorkouts.length > 0 && (
              <div className="recent-list">
                <h4>Recent workouts</h4>
                {recentWorkouts.slice(0, 6).map((w) => (
                  <div className="card" key={w.id || JSON.stringify(w)}>
                    <div>
                      <strong>{w.type}</strong> — {w.durationMinutes || w.duration} min
                    </div>
                    <div>Calories: {w.caloriesBurned || "-"}</div>
                    <div className="small">{w.notes}</div>
                  </div>
                ))}
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
                  onChange={(e) => setSleep({ ...sleep, hours: parseFloat(e.target.value || 0) })}
                  min="0"
                />
              </label>

              <label>
                Quality
                <select value={sleep.quality} onChange={(e) => setSleep({ ...sleep, quality: e.target.value })}>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="poor">Poor</option>
                </select>
              </label>

              <label>
                Notes
                <input type="text" value={sleep.notes} onChange={(e) => setSleep({ ...sleep, notes: e.target.value })} />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Sleep"}
              </button>
            </form>

            {recentSleep.length > 0 && (
              <div className="recent-list">
                <h4>Recent sleep logs</h4>
                {recentSleep.slice(0, 6).map((s) => (
                  <div className="card" key={s.id || JSON.stringify(s)}>
                    <div>{s.hours} hours • {s.quality}</div>
                    <div className="small">{s.notes}</div>
                  </div>
                ))}
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
