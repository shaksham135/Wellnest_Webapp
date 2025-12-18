// src/App.js
import React, { useState, useEffect } from "react";
import BmiCalculator from "./pages/BmiCalculator";
import Trackers from "./pages/Trackers";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import { FiHome, FiUserPlus, FiUser, FiBarChart2, FiActivity, FiTrendingUp } from "react-icons/fi";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SetupProfile from "./pages/SetupProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AnalyticsPage from "./pages/AnalyticsPage";
import WorkoutAnalyticsDetail from "./pages/detailed-analytics/WorkoutAnalyticsDetail";
import NutritionAnalyticsDetail from "./pages/detailed-analytics/NutritionAnalyticsDetail";
import SleepAnalyticsDetail from "./pages/detailed-analytics/SleepAnalyticsDetail";
import WaterIntakeAnalyticsDetail from "./pages/detailed-analytics/WaterIntakeAnalyticsDetail";
import GoalProgressDetail from "./pages/detailed-analytics/GoalProgressDetail";
import HealthMetricsDetail from "./pages/detailed-analytics/HealthMetricsDetail";

import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // In case token changes from other tabs (optional but good)
  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <Router>
      <header className="top-nav">
        <div className="logo">
          <span className="logo-dot" />
          Wellnest
        </div>

        <nav>
          {/* Not logged in -> show Login / Register only */}
          {!isLoggedIn && (
            <>
              <NavLink to="/" className="nav-link">
                <FiHome />
                <span>Login</span>
              </NavLink>
              <NavLink to="/register" className="nav-link">
                <FiUserPlus />
                <span>Register</span>
              </NavLink>
            </>
          )}

          {/* Logged in -> show Dashboard / Trackers / Profile */}
          {isLoggedIn && (
            <>
              <NavLink to="/dashboard" className="nav-link">
                <FiBarChart2 />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/trackers" className="nav-link">
                <FiActivity />
                <span>Trackers</span>
              </NavLink>

              <NavLink to="/analytics" className="nav-link">
                <FiTrendingUp />
                <span>Analytics</span>
              </NavLink>

              <NavLink to="/profile" className="nav-link">
                <FiUser />
                <span>Profile</span>
              </NavLink>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard onLogout={() => setIsLoggedIn(false)} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trackers"
            element={
              <ProtectedRoute>
                <Trackers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/setup-profile"
            element={
              <ProtectedRoute>
                <SetupProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bmi-calculator"
            element={
              <ProtectedRoute>
                <BmiCalculator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/analytics/workout" element={<ProtectedRoute><WorkoutAnalyticsDetail /></ProtectedRoute>} />
          <Route path="/analytics/nutrition" element={<ProtectedRoute><NutritionAnalyticsDetail /></ProtectedRoute>} />
          <Route path="/analytics/sleep" element={<ProtectedRoute><SleepAnalyticsDetail /></ProtectedRoute>} />
          <Route path="/analytics/water" element={<ProtectedRoute><WaterIntakeAnalyticsDetail /></ProtectedRoute>} />
          <Route path="/analytics/goals" element={<ProtectedRoute><GoalProgressDetail /></ProtectedRoute>} />
          <Route path="/analytics/health" element={<ProtectedRoute><HealthMetricsDetail /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;