import axios from "axios";
import storageService from "./storageService";
import toast from "react-hot-toast";

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

  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Inject user's local timezone offset (in minutes) and timezone name
  config.headers["X-Timezone-Offset"] = new Date().getTimezoneOffset();
  try {
    config.headers["X-Timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.warn("Failed to resolve local timezone name", e);
  }

  // Centrally inject local date range for /analytics/summary to avoid UTC date offsets
  if (config.url && config.url.includes("/analytics/summary")) {
    config.params = config.params || {};
    if (!config.params.startDate || !config.params.endDate) {
      const today = new Date();
      const format = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      config.params.endDate = format(today);
      const start = new Date();
      start.setDate(today.getDate() - 6);
      config.params.startDate = format(start);
    }
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
      toast.error("Request timed out. Please check your connection.");
    }
    
    if (error.response) {
      if (error.response.status === 401) {
        console.warn("API 401 Unauthorized:", error.config.url);
        
        // Skip redirect for auth routes (like login/register errors)
        if (!error.config.url.includes("/auth/")) {
            const token = localStorage.getItem("token");
            if (token) {
                // If we HAVE a token but got 401, it's a genuine expiry.
                storageService.removeItem("token").then(() => {
                    toast.error("Session expired. Please log in again.");
                    // Small delay to let the toast be seen and state to settle
                    setTimeout(() => {
                        if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
                            window.location.href = "/";
                        }
                    }, 500);
                });
            } else if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
                // If NO token and not on login page, go to login
                window.location.href = "/";
            }
        }
      } else if (error.response.status === 403) {
        console.error("API 403 Forbidden:", error.config.url);
        const serverMsg = error.response.data?.displayMessage || error.response.data?.error || "You don't have permission to perform this action.";
        toast.error(serverMsg);
      } else if (error.response.status === 500) {
        toast.error("An unexpected server error occurred. Our team has been notified.");
      }
    } else if (error.message === 'Network Error') {
        // --- SAAS RETRY LOGIC ---
        const { config } = error;
        // Only retry GET requests to avoid duplicate POST/PUT operations
        if (config && config.method === 'get' && (!config.retryCount || config.retryCount < 3)) {
            config.retryCount = (config.retryCount || 0) + 1;
            console.log(`Retrying API [${config.retryCount}/3]...`);
            
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, config.retryCount - 1) * 1000;
            return new Promise(resolve => setTimeout(() => resolve(apiClient(config)), delay));
        }
        toast.error("Network error. Server might be down.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
