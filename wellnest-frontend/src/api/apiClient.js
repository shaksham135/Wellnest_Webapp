import axios from "axios";

// Capacitor bridge for persistent storage
let Preferences = null;
try {
  if (window.Capacitor) {
    import('@capacitor/preferences').then(m => {
      Preferences = m.Preferences;
    });
  }
} catch (e) { console.log("Preferences plugin not available"); }

const baseURL = (process.env.REACT_APP_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const apiClient = axios.create({
  baseURL,
});

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

  let token = localStorage.getItem("token");

  // If on Native, try pulling from Preferences (Source of Truth)
  if (window.Capacitor && Preferences) {
    const { value } = await Preferences.get({ key: 'token' });
    if (value) {
      token = value;
      // Keep localStorage in sync for other parts of the app
      localStorage.setItem("token", value); 
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("API 401/403 Error:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
