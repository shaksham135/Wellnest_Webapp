// src/api/reportApi.js
import apiClient from "./apiClient";

export const getWeeklyReport = () => apiClient.get("/report/weekly");
