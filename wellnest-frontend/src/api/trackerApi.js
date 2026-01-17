// src/api/trackerApi.js
import apiClient from "./apiClient";

/*
  NOTE: If your backend field names differ (for example "duration" vs "durationMinutes"),
  change the frontend payload keys in the Trackers component before sending.
*/

export const createWorkout = (data) => apiClient.post("/trackers/workouts", data);
export const getWorkouts = () => apiClient.get("/trackers/workouts");

export const createMeal = (data) => apiClient.post("/trackers/meals", data);
export const getMeals = () => apiClient.get("/trackers/meals");

export const createWater = (data) => apiClient.post("/trackers/water", data);
export const getWater = () => apiClient.get("/trackers/water");

export const createSleep = (data) => apiClient.post("/trackers/sleep", data);
export const getSleep = () => apiClient.get("/trackers/sleep");

// Delete
export const deleteWorkout = (id) => apiClient.delete(`/trackers/workouts/${id}`);
export const deleteMeal = (id) => apiClient.delete(`/trackers/meals/${id}`);
export const deleteWater = (id) => apiClient.delete(`/trackers/water/${id}`);
export const deleteSleep = (id) => apiClient.delete(`/trackers/sleep/${id}`);
