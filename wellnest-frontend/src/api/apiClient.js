import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
});

apiClient.interceptors.request.use((config) => {
  if (
    config.url &&
    (config.url.includes("/auth/login") ||
      config.url.includes("/auth/register") ||
      config.url.includes("/auth/forgot-password") ||
      config.url.includes("/auth/reset-password"))
  ) {
    return config;
  }


  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token invalid or expired
      // localStorage.removeItem("token"); 
      console.warn("API 401/403 Error:", error.response.data);
      // if (!window.location.pathname.includes("/login")) {
      //   window.location.href = "/";
      // }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
