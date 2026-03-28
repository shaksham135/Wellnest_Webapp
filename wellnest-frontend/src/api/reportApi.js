// src/api/reportApi.js
import axios from "axios";
import storageService from "./storageService";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const getAuthHeaders = async () => {
  const token = await storageService.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const getWeeklyReport = async () => {
  const headers = await getAuthHeaders();
  return axios.get(`${BASE_URL}/api/report/weekly`, { headers });
};
