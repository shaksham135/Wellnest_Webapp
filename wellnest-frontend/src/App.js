// src/App.js
import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import {
  FiHome,
  FiUserPlus,
  FiUser,
  FiBarChart2,
  FiActivity,
  FiBookOpen,
  FiUsers,
  FiTrendingUp,
  FiCheck,
} from "react-icons/fi";

// Pages
// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SetupProfile from "./pages/SetupProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import TrainerMatching from "./pages/TrainerMatching";
import ClientDetails from "./pages/ClientDetails"; // Import ClientDetails
import MyTrainers from "./pages/MyTrainers"; // Import MyTrainers
import Trackers from "./pages/Trackers";
import BmiCalculator from "./pages/BmiCalculator";
import AnalyticsPage from "./pages/AnalyticsPage";

// Analytics Detail Pages
import WorkoutAnalyticsDetail from "./pages/detailed-analytics/WorkoutAnalyticsDetail";
import NutritionAnalyticsDetail from "./pages/detailed-analytics/NutritionAnalyticsDetail";
import SleepAnalyticsDetail from "./pages/detailed-analytics/SleepAnalyticsDetail";
import WaterIntakeAnalyticsDetail from "./pages/detailed-analytics/WaterIntakeAnalyticsDetail";
import GoalProgressDetail from "./pages/detailed-analytics/GoalProgressDetail";
import HealthMetricsDetail from "./pages/detailed-analytics/HealthMetricsDetail";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import ThemeToggle from "./components/ThemeToggle";

// Styles
import "./index.css";
import "./trainer.css";

const getUserRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );
  const [userRole, setUserRole] = useState(getUserRole());

  useEffect(() => {
    const handleStorage = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUserRole(getUserRole());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserRole(getUserRole());
  };

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px', fontWeight: 500 } }} />
      <header className="top-nav">
        <div className="logo">
          <span className="logo-dot" />
          Wellnest
        </div>

        <nav>
          {/* Not logged in */}
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

              {/* Theme toggle even on login page (optional) */}
              <ThemeToggle />
            </>
          )}

          {/* Logged in */}
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

              <NavLink to="/blog" className="nav-link">
                <FiBookOpen />
                <span>Health Blog</span>
              </NavLink>

              <NavLink to="/trainers" className="nav-link">
                <FiUsers />
                <span>{userRole === 'ROLE_TRAINER' ? 'My Clients' : 'Trainer Matching'}</span>
              </NavLink>

              {userRole === 'ROLE_USER' && (
                <NavLink to="/my-trainers" className="nav-link">
                  <FiCheck />
                  <span>My Trainers</span>
                </NavLink>
              )}

              {/* 🌗 THEME TOGGLE */}
              <ThemeToggle />
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
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
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          {/* ... analytics sub-routes ... */}
          <Route
            path="/analytics/workout"
            element={
              <ProtectedRoute>
                <WorkoutAnalyticsDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/nutrition"
            element={
              <ProtectedRoute>
                <NutritionAnalyticsDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/sleep"
            element={
              <ProtectedRoute>
                <SleepAnalyticsDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/water"
            element={
              <ProtectedRoute>
                <WaterIntakeAnalyticsDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/goals"
            element={
              <ProtectedRoute>
                <GoalProgressDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics/health"
            element={
              <ProtectedRoute>
                <HealthMetricsDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/blog"
            element={
              <ProtectedRoute>
                <Blog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blog/:id"
            element={
              <ProtectedRoute>
                <BlogPost />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trainers"
            element={
              <ProtectedRoute>
                {userRole === 'ROLE_TRAINER' ? <ClientDetails /> : <TrainerMatching />}
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-trainers"
            element={
              <ProtectedRoute>
                <MyTrainers />
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
        </Routes>
      </main>
    </Router>
  );
};

export default App;
