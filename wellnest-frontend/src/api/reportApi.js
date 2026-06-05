// src/api/reportApi.js
import apiClient from "./apiClient";

export const getWeeklyReport = () => apiClient.get("/report/weekly");
export const refreshWeeklyReport = () => apiClient.post("/report/weekly/refresh");
