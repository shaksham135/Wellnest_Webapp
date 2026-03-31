import axios from "axios";
import storageService from "./storageService";

// Dynamic Backend Detection (Native + Web)
const getBaseURL = () => {
    // If we're on localhost web, point to local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return "http://localhost:8080/api";
    }
    // Default to production for Live site + Native mobile (Capacitor handles proxies)
    return "https://wellnest-webapp.onrender.com/api";
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, 
});

// Debug logging for production if needed
apiClient.interceptors.request.use((config) => {
  config.metadata = { startTime: new Date() };
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.request.use(async (config) => {
  if (
    config.url &&
    (config.url.includes("/auth/login") ||
      config.url.includes("/auth/register") ||
      config.url.includes("/auth/forgot-password") ||
      config.url.includes("/auth/reset-password"))
  ) {
    return config;
  }

  // Get token from unified storage (Native-aware)
  const token = await storageService.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`API [${response.config.method.toUpperCase()}] ${response.config.url} took ${duration}ms`);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error("API Request Timeout:", error.config.url);
    }
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("API Auth Error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
