import storageService from "./storageService";

// Production URL hardcoded for native reliability
const baseURL = "https://wellnest-webapp.onrender.com/api";

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

  // Get token from unified storage (Native-aware)
  const token = await storageService.getItem("token");

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
