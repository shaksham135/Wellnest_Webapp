import storageService from "../api/storageService";
import { Navigate, useLocation } from "react-router-dom";

const isProbablyJwt = (token) => {
  if (!token || typeof token !== "string") return false;
  return token.split(".").length === 3;
};

const isValidToken = (token) => {
  if (!token) return false;
  if (typeof token !== "string") return false;
  const t = token.trim();
  if (!t) return false;
  if (t === "undefined" || t === "null") return false;

  try {
    const parts = t.split(".");
    if (parts.length !== 3) return true; // Not JWT, skip expiry
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn("Token expired");
      return false;
    }
  } catch (e) {
    // ignore
  }
  return true;
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!isValidToken(token)) {
    console.warn("ProtectedRoute: invalid or missing token");

    if (token && isProbablyJwt(token)) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.exp && Date.now() >= payload.exp * 1000) {
          storageService.clearAuth();
        }
      } catch (_) {}
    }

    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
