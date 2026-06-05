export const toLocalDateString = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === 'string') {
    // If it's already a clean YYYY-MM-DD string
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    // If it's an ISO string containing time
    if (dateVal.includes('T')) {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // Try substring if it starts with YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      return dateVal.substring(0, 10);
    }
  }
  
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the current consecutive day streak from an array of data.
 * @param {Array} data - Array of objects containing a date field.
 * @param {String} dateField - The name of the date field (e.g., 'loggedAt', 'sleepDate').
 * @returns {Number} The current streak in days.
 */
export const calculateStreak = (data, dateField = 'createdAt') => {
  if (!data || data.length === 0) return 0;

  // 1. Extract and sort unique dates (ignoring time)
  const uniqueDates = [...new Set(data.map(item => {
    return toLocalDateString(item[dateField]);
  }))].filter(Boolean).sort((a, b) => new Date(b) - new Date(a)); // Sort descending (latest first)

  if (uniqueDates.length === 0) return 0;

  const todayStr = toLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  // 2. Check if the latest log is today or yesterday (otherwise streak is broken)
  const latestDate = uniqueDates[0];
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return 0;
  }

  // 3. Count consecutive days
  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    
    // Check if next date is exactly 1 day before current
    const diffTime = Math.abs(current - next);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
};

/**
 * Calculates the overall continuous active streak for the user across workouts, meals, water, sleep, and activities.
 * Can also utilize streak shields to bridge gaps in activity.
 */
export const calculateOverallStreak = (workouts = [], meals = [], water = [], sleep = [], activities = [], streakShieldCount = 0) => {
  const currentWorkouts = Array.isArray(workouts) ? workouts : [];
  const currentMeals = Array.isArray(meals) ? meals : [];
  const currentWater = Array.isArray(water) ? water : [];
  const currentSleep = Array.isArray(sleep) ? sleep : [];
  const currentActivities = Array.isArray(activities) ? activities : [];

  const dateSet = new Set();

  const addDate = (dateVal) => {
    const localStr = toLocalDateString(dateVal);
    if (localStr) {
      dateSet.add(localStr);
    }
  };

  currentWorkouts.forEach(w => addDate(w.performedAt));
  currentMeals.forEach(m => addDate(m.loggedAt || m.createdAt));
  currentWater.forEach(w => addDate(w.loggedAt));
  currentSleep.forEach(s => addDate(s.sleepDate || s.createdAt));
  currentActivities.forEach(a => addDate(a.date || a.createdAt));

  const sortedDates = [...dateSet].sort((a, b) => new Date(b) - new Date(a)); // Sort descending (latest first)

  if (sortedDates.length === 0) return 0;

  const todayStr = toLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  let latestDate = sortedDates[0];
  let remainingShields = streakShieldCount;

  // If latest date is not today or yesterday, check if shields can bridge it to today/yesterday
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    const latestTime = new Date(latestDate);
    const todayTime = new Date(todayStr);
    const diffTime = Math.abs(todayTime - latestTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const neededShields = diffDays - 1; // e.g., if latest was 2 days ago, we need 1 shield for yesterday
    if (neededShields > 0 && neededShields <= remainingShields) {
      remainingShields -= neededShields;
    } else {
      return 0; // Streak broken, cannot bridge
    }
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);

    const diffTime = Math.abs(current - next);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      const gapDays = diffDays - 1;
      if (gapDays > 0 && gapDays <= remainingShields) {
        remainingShields -= gapDays;
        streak += diffDays; // include bridged days
      } else {
        break; // Streak broken
      }
    }
  }

  return streak;
};

