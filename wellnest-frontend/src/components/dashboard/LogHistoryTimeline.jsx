import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { 
    deleteWorkout, 
    deleteMeal, 
    deleteWater, 
    deleteSleep,
    deleteActivity,
    updateWorkout,
    updateMeal,
    updateWater,
    updateSleep,
    createWorkout,
    createMeal,
    createWater,
    createSleep,
    createActivity
} from '../../api/trackerApi';
import apiClient from '../../api/apiClient';
import { FiTrash2, FiEdit2, FiActivity, FiCoffee, FiDroplet, FiMoon, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './LogHistoryTimeline.css';

const getFriendlyErrorMessage = (err, fallback = "Failed to complete request") => {
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

const LogHistoryTimeline = () => {
    const { 
        workouts, setWorkouts, 
        meals, setMeals, 
        water, setWater, 
        sleep, setSleep,
        activities, setActivities,
        mentalStates, setMentalStates,
        refreshTrackers, refreshUserData 
    } = useData();

    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [recentlyDeleted, setRecentlyDeleted] = useState(null);

    // Helper to format date
    const getLocalDateString = (dateVal) => {
        if (!dateVal) return "";
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isToday = (dateStr) => {
        const today = getLocalDateString(new Date());
        return dateStr === today;
    };

    const isYesterday = (dateStr) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        return dateStr === yesterdayStr;
    };

    const formatGroupHeader = (dateStr) => {
        if (isToday(dateStr)) return "Today";
        if (isYesterday(dateStr)) return "Yesterday";
        
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    const formatTimeLabel = (dateVal) => {
        if (!dateVal) return "";
        return new Date(dateVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Combine all lists
    const combineLogs = () => {
        const list = [];

        if (Array.isArray(workouts)) {
            workouts.forEach(w => list.push({
                id: w.id,
                type: 'workout',
                title: `${w.type ? w.type.charAt(0).toUpperCase() + w.type.slice(1) : "Workout"}`,
                subTitle: `🏃 Walk / Training`,
                time: w.performedAt || w.createdAt,
                value: `${w.durationMinutes} mins • ${w.caloriesBurned} kcal`,
                notes: w.notes,
                icon: <FiActivity />,
                color: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                raw: w
            }));
        }

        if (Array.isArray(meals)) {
            meals.forEach(m => list.push({
                id: m.id,
                type: 'meal',
                title: `${m.mealType ? m.mealType.toUpperCase() : "MEAL"}`,
                subTitle: `🍳 Nutrition Log`,
                time: m.loggedAt || m.createdAt,
                value: `${m.calories} kcal • P: ${m.protein || 0}g C: ${m.carbs || 0}g F: ${m.fats || 0}g`,
                notes: m.notes,
                icon: <FiCoffee />,
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.1)',
                raw: m
            }));
        }

        if (Array.isArray(water)) {
            water.forEach(w => list.push({
                id: w.id,
                type: 'water',
                title: `${w.liters >= 1.0 ? w.liters.toFixed(2) + 'L' : Math.round(w.liters * 1000) + 'ml'} Water`,
                subTitle: `💧 Hydration Intake`,
                time: w.loggedAt || w.createdAt,
                value: `${w.liters} Liters`,
                notes: w.notes,
                icon: <FiDroplet />,
                color: '#0ea5e9',
                bg: 'rgba(14, 165, 233, 0.1)',
                raw: w
            }));
        }

        if (Array.isArray(sleep)) {
            sleep.forEach(s => list.push({
                id: s.id,
                type: 'sleep',
                title: `Sleep Log`,
                subTitle: `😴 Recovery Cycle`,
                time: s.sleepDate || s.createdAt,
                value: `${s.hours} Hours • Quality: ${s.quality ? s.quality.toUpperCase() : "GOOD"}`,
                notes: s.notes,
                icon: <FiMoon />,
                color: '#8b5cf6',
                bg: 'rgba(139, 92, 246, 0.1)',
                raw: s
            }));
        }

        if (Array.isArray(mentalStates)) {
            mentalStates.forEach(ms => list.push({
                id: ms.id,
                type: 'mood',
                title: `Mood Check-in`,
                subTitle: `🧠 Mental Readiness`,
                time: ms.performedAt || ms.createdAt,
                value: `Mood State: ${ms.sentiment || "GOOD"}`,
                notes: ms.transcription,
                icon: <FiSmile />,
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.1)',
                raw: ms
            }));
        }

        if (Array.isArray(activities)) {
            activities.forEach(a => {
                const hasSteps = a.steps && a.steps > 0;
                const hasDistance = a.distanceKm && a.distanceKm > 0;
                if (hasSteps || hasDistance) {
                    const title = hasSteps ? `${a.steps} Steps` : `${(a.distanceKm || 0).toFixed(2)} km Walk`;
                    list.push({
                        id: a.id,
                        type: 'activity',
                        title: title,
                        subTitle: `👟 Daily Movement`,
                        time: a.createdAt || (a.date ? `${a.date}T00:00:00Z` : new Date().toISOString()),
                        value: `${a.activeCalories || 0} kcal • ${(a.distanceKm || 0).toFixed(2)} km`,
                        notes: "Daily Activity Log",
                        icon: <FiActivity />,
                        color: '#6366f1',
                        bg: 'rgba(99, 102, 241, 0.1)',
                        raw: a
                    });
                }
            });
        }

        // Sort descending (latest first)
        return list.sort((a, b) => new Date(b.time) - new Date(a.time));
    };

    const groupedLogs = () => {
        const sorted = combineLogs();
        const groups = {};

        sorted.forEach(item => {
            const dateStr = getLocalDateString(item.time);
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });

        return groups;
    };

    // handleDelete
    const handleDelete = async (item) => {
        const { id, type, raw } = item;
        
        // Save to recently deleted for Undo support
        setRecentlyDeleted({ type, raw });

        // Optimistic UI state update
        if (type === 'workout') setWorkouts(prev => prev.filter(w => w.id !== id));
        if (type === 'meal') setMeals(prev => prev.filter(m => m.id !== id));
        if (type === 'water') setWater(prev => prev.filter(w => w.id !== id));
        if (type === 'sleep') setSleep(prev => prev.filter(s => s.id !== id));
        if (type === 'activity') setActivities(prev => prev.filter(a => a.id !== id));
        if (type === 'mood') setMentalStates(prev => prev.filter(ms => ms.id !== id));

        try {
            if (type === 'workout') await deleteWorkout(id);
            if (type === 'meal') await deleteMeal(id);
            if (type === 'water') await deleteWater(id);
            if (type === 'sleep') await deleteSleep(id);
            if (type === 'activity') await deleteActivity(id);
            if (type === 'mood') await apiClient.delete(`/mental/${id}`).catch(() => {
                // If direct delete not supported, ignore or fallback
            });

            toast((t) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Deleted successfully.
                    <button 
                        onClick={() => handleUndo(t.id, { type, raw })} 
                        style={{ 
                            background: 'var(--primary)', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '4px 10px', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 700
                        }}
                    >
                        Undo
                    </button>
                </span>
            ), { duration: 5000 });

            await refreshUserData();
        } catch (e) {
            toast.error("Failed to delete log.");
            // Revert on error
            refreshTrackers();
        }
    };

    // handleUndo
    const handleUndo = async (toastId, deletedItem) => {
        const itemToRestore = deletedItem || recentlyDeleted;
        if (!itemToRestore) return;
        toast.dismiss(toastId);
        const { type, raw } = itemToRestore;
        const tid = toast.loading("Restoring log... 🔄");

        try {
            // Re-create the item using original payloads
            if (type === 'workout') {
                await createWorkout({
                    type: raw.type,
                    durationMinutes: raw.durationMinutes,
                    caloriesBurned: raw.caloriesBurned,
                    notes: raw.notes,
                    performedAt: raw.performedAt
                });
            }
            if (type === 'meal') {
                await createMeal({
                    mealType: raw.mealType,
                    calories: raw.calories,
                    protein: raw.protein,
                    carbs: raw.carbs,
                    fats: raw.fats,
                    notes: raw.notes,
                    loggedAt: raw.loggedAt
                });
            }
            if (type === 'water') {
                await createWater({
                    liters: raw.liters,
                    notes: raw.notes,
                    loggedAt: raw.loggedAt
                });
            }
            if (type === 'sleep') {
                await createSleep({
                    hours: raw.hours,
                    quality: raw.quality,
                    notes: raw.notes,
                    sleepDate: raw.sleepDate
                });
            }
            if (type === 'activity') {
                await createActivity({
                    steps: raw.steps,
                    activeCalories: raw.activeCalories,
                    distanceKm: raw.distanceKm,
                    date: raw.date
                });
            }
            if (type === 'mood') {
                await apiClient.post('/mental/mood-check');
            }

            toast.dismiss(tid);
            toast.success("Log restored!");
            setRecentlyDeleted(null);
            await Promise.all([
                refreshTrackers(),
                refreshUserData()
            ]);
        } catch (e) {
            toast.dismiss(tid);
            toast.error(getFriendlyErrorMessage(e, "Failed to restore log."));
        }
    };

    // handleEditClick
    const handleEditClick = (item) => {
        setEditingItem(item);
        const { type, raw } = item;
        // Prefill state values
        if (type === 'workout') {
            setEditForm({
                type: raw.type,
                durationMinutes: raw.durationMinutes,
                caloriesBurned: raw.caloriesBurned,
                notes: raw.notes || ""
            });
        }
        if (type === 'meal') {
            setEditForm({
                mealType: raw.mealType,
                calories: raw.calories,
                protein: raw.protein || "",
                carbs: raw.carbs || "",
                fats: raw.fats || "",
                notes: raw.notes || ""
            });
        }
        if (type === 'water') {
            setEditForm({
                liters: raw.liters,
                notes: raw.notes || ""
            });
        }
        if (type === 'sleep') {
            setEditForm({
                hours: raw.hours,
                quality: raw.quality || "good",
                notes: raw.notes || ""
            });
        }
    };

    // handleSaveEdit
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingItem) return;
        const { id, type } = editingItem;
        const tid = toast.loading("Updating log... 🧬");

        try {
            if (type === 'workout') {
                await updateWorkout(id, editForm);
            }
            if (type === 'meal') {
                await updateMeal(id, {
                    ...editForm,
                    calories: Number(editForm.calories),
                    protein: editForm.protein !== "" ? Number(editForm.protein) : null,
                    carbs: editForm.carbs !== "" ? Number(editForm.carbs) : null,
                    fats: editForm.fats !== "" ? Number(editForm.fats) : null
                });
            }
            if (type === 'water') {
                await updateWater(id, {
                    liters: Number(editForm.liters),
                    notes: editForm.notes
                });
            }
            if (type === 'sleep') {
                await updateSleep(id, {
                    hours: Number(editForm.hours),
                    quality: editForm.quality,
                    notes: editForm.notes
                });
            }

            toast.dismiss(tid);
            toast.success("Log updated successfully!");
            setEditingItem(null);
            await Promise.all([
                refreshTrackers(),
                refreshUserData()
            ]);
        } catch (err) {
            toast.dismiss(tid);
            toast.error(getFriendlyErrorMessage(err, "Failed to update log."));
        }
    };

    const groups = groupedLogs();
    const groupKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    return (
        <div className="timeline-container card">
            <h3 className="timeline-header-title">Recent Activity Logs</h3>
            <p className="timeline-header-subtitle">Instantly view and modify all logged activities for today and yesterday.</p>

            {groupKeys.length === 0 ? (
                <div className="timeline-empty-state">
                    <span className="empty-icon">📭</span>
                    <h4>No activity logs yet</h4>
                    <p>Log a habit using voice commands, quick actions, or the manual entry form below to get started!</p>
                </div>
            ) : (
                <div className="timeline-scroll-area">
                    {groupKeys.map(dateKey => (
                        <div key={dateKey} className="timeline-date-group">
                            <div className="timeline-group-header">
                                <span>{formatGroupHeader(dateKey)}</span>
                            </div>
                            
                            <div className="timeline-items-list">
                                {groups[dateKey].map((item, idx) => (
                                    <div key={item.type + item.id + idx} className="timeline-item-card hover-card">
                                        <div 
                                            className="timeline-item-icon" 
                                            style={{ background: item.bg, color: item.color }}
                                        >
                                            {item.icon}
                                        </div>

                                        <div className="timeline-item-details">
                                            <div className="timeline-item-row">
                                                <h4 className="timeline-item-title">{item.title}</h4>
                                                <span className="timeline-item-time">{formatTimeLabel(item.time)}</span>
                                            </div>
                                            <div className="timeline-item-row">
                                                <span className="timeline-item-value">{item.value}</span>
                                                <span className="timeline-item-category">{item.subTitle}</span>
                                            </div>
                                            {item.notes && (
                                                <p className="timeline-item-notes">"{item.notes}"</p>
                                            )}
                                        </div>

                                        {item.type !== 'mood' && (
                                            <div className="timeline-item-actions">
                                                <button 
                                                    onClick={() => handleEditClick(item)} 
                                                    className="action-btn edit-btn" 
                                                    title="Edit Entry"
                                                >
                                                    <FiEdit2 size={11} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item)} 
                                                    className="action-btn delete-btn" 
                                                    title="Delete Entry"
                                                >
                                                    <FiTrash2 size={11} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EDIT POPUP MODAL (Glassmorphic Layout) */}
            {editingItem && (
                <div className="timeline-edit-modal-overlay">
                    <div className="timeline-edit-modal card">
                        <div className="modal-header">
                            <h3>Edit {editingItem.title}</h3>
                            <button className="close-btn" onClick={() => setEditingItem(null)}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="modal-form">
                            {editingItem.type === 'workout' && (
                                <>
                                    <label>
                                        Workout Type
                                        <input 
                                            type="text" 
                                            value={editForm.type} 
                                            onChange={e => setEditForm({ ...editForm, type: e.target.value })} 
                                            required
                                        />
                                    </label>
                                    <label>
                                        Duration (minutes)
                                        <input 
                                            type="number" 
                                            value={editForm.durationMinutes} 
                                            onChange={e => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })} 
                                            required
                                        />
                                    </label>
                                    <label>
                                        Calories Burned (kcal)
                                        <input 
                                            type="number" 
                                            value={editForm.caloriesBurned} 
                                            onChange={e => setEditForm({ ...editForm, caloriesBurned: Number(e.target.value) })} 
                                            required
                                        />
                                    </label>
                                </>
                            )}

                            {editingItem.type === 'meal' && (
                                <>
                                    <label>
                                        Meal Type
                                        <select 
                                            value={editForm.mealType} 
                                            onChange={e => setEditForm({ ...editForm, mealType: e.target.value })}
                                        >
                                            <option value="breakfast">Breakfast</option>
                                            <option value="lunch">Lunch</option>
                                            <option value="dinner">Dinner</option>
                                            <option value="snack">Snack</option>
                                        </select>
                                    </label>
                                    <label>
                                        Calories (kcal)
                                        <input 
                                            type="number" 
                                            value={editForm.calories} 
                                            onChange={e => setEditForm({ ...editForm, calories: Number(e.target.value) })} 
                                            required
                                        />
                                    </label>
                                    <div className="form-grid-3">
                                        <label>
                                            Protein (g)
                                            <input 
                                                type="number" 
                                                value={editForm.protein} 
                                                onChange={e => setEditForm({ ...editForm, protein: e.target.value })} 
                                            />
                                        </label>
                                        <label>
                                            Carbs (g)
                                            <input 
                                                type="number" 
                                                value={editForm.carbs} 
                                                onChange={e => setEditForm({ ...editForm, carbs: e.target.value })} 
                                            />
                                        </label>
                                        <label>
                                            Fats (g)
                                            <input 
                                                type="number" 
                                                value={editForm.fats} 
                                                onChange={e => setEditForm({ ...editForm, fats: e.target.value })} 
                                            />
                                        </label>
                                    </div>
                                </>
                            )}

                            {editingItem.type === 'water' && (
                                <label>
                                    Liters (L)
                                    <input 
                                        type="number" 
                                        step="0.05"
                                        value={editForm.liters} 
                                        onChange={e => setEditForm({ ...editForm, liters: e.target.value })} 
                                        required
                                    />
                                </label>
                            )}

                            {editingItem.type === 'sleep' && (
                                <>
                                    <label>
                                        Hours
                                        <input 
                                            type="number" 
                                            step="0.5"
                                            value={editForm.hours} 
                                            onChange={e => setEditForm({ ...editForm, hours: e.target.value })} 
                                            required
                                        />
                                    </label>
                                    <label>
                                        Quality
                                        <select 
                                            value={editForm.quality} 
                                            onChange={e => setEditForm({ ...editForm, quality: e.target.value })}
                                        >
                                            <option value="poor">Poor</option>
                                            <option value="fair">Fair</option>
                                            <option value="good">Good</option>
                                            <option value="excellent">Excellent</option>
                                        </select>
                                    </label>
                                </>
                            )}

                            <label>
                                Notes
                                <input 
                                    type="text" 
                                    value={editForm.notes} 
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })} 
                                />
                            </label>

                            <div className="modal-actions">
                                <button type="button" className="ghost-btn" onClick={() => setEditingItem(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn icon-btn">
                                    <FiCheck /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogHistoryTimeline;
