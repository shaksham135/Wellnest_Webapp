// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute
 * - rejects null/undefined/"undefined"/"" tokens
 * - performs optional JWT expiry check when token appears to be a JWT
 * - if token is invalid it clears it from localStorage to avoid redirect loops
 *
 * Note: This is backwards-compatible with your existing code.
 */

const isProbablyJwt = (token) => {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  return parts.length === 3;
};

const isValidToken = (token) => {
  if (!token) return false;
  if (typeof token !== "string") return false;
  const t = token.trim();
  if (!t) return false;
  if (t === "undefined" || t === "null") return false;

  // If token looks like a JWT, try expiry check (best-effort, won't throw)
  if (isProbablyJwt(t)) {
    try {
      const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
        // token expired
        return false;
      }
    } catch (e) {
      // malformed JWT payload — treat as "unknown" but don't fail here,
      // we'll fall back to returning true (so token string presence still grants access).
      // If you want stricter behavior, return false here.
    }
  }

  return true;
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!isValidToken(token)) {
    // Helpful debug log (remove in production)
    // eslint-disable-next-line no-console
    console.warn("ProtectedRoute: invalid or missing token — redirecting to login.", { token });

    // Optional: clear obviously-bad token to avoid repeated redirects
    if (token) {
      try {
        // only remove tokens that are clearly not usable
        if (token === "undefined" || token === "null") {
          localStorage.removeItem("token");
        } else if (isProbablyJwt(token)) {
          // if JWT and expired, remove it
          try {
            const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
            if (payload && payload.exp && Date.now() >= payload.exp * 1000) {
              localStorage.removeItem("token");
            }
          } catch (_) {
            // ignore parse errors
          }
        }
      } catch (_) {
        // ignore any storage errors
      }
    }

    // Optional hook (global) for apps that want to run extra cleanup
    try {
      if (typeof window.onAuthFail === "function") window.onAuthFail();
    } catch (e) {
      /* ignore */
    }

    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
