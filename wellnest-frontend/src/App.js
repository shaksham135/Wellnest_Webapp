// src/App.js
import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

// Icons removed

// Pages
// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SetupProfile from "./pages/SetupProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/layout/Navbar";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import TrainerMatching from "./pages/TrainerMatching";
import ClientDetails from "./pages/ClientDetails"; // Import ClientDetails
import MyTrainers from "./pages/MyTrainers"; // Import MyTrainers
import Trackers from "./pages/Trackers";
import LeaderboardPage from "./pages/LeaderboardPage";
import BmiCalculator from "./pages/BmiCalculator";
import AnalyticsPage from "./pages/AnalyticsPage";
import Notifications from "./pages/Notifications";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import AdminDashboard from "./pages/AdminDashboard";
import CommunityPage from "./pages/CommunityPage";

// Analytics Detail Pages
import WorkoutAnalyticsDetail from "./pages/detailed-analytics/WorkoutAnalyticsDetail";
import NutritionAnalyticsDetail from "./pages/detailed-analytics/NutritionAnalyticsDetail";
import ClientAnalyticsPage from "./pages/ClientAnalyticsPage";
import SleepAnalyticsDetail from "./pages/detailed-analytics/SleepAnalyticsDetail";
import WaterIntakeAnalyticsDetail from "./pages/detailed-analytics/WaterIntakeAnalyticsDetail";
import GoalProgressDetail from "./pages/detailed-analytics/GoalProgressDetail";
import HealthMetricsDetail from "./pages/detailed-analytics/HealthMetricsDetail";
import ActivityAnalyticsDetail from "./pages/detailed-analytics/ActivityAnalyticsDetail";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/common/SplashScreen";
import ChatbotWidget from "./components/common/ChatbotWidget";
import BottomNav from "./components/layout/BottomNav";
import { NotificationProvider } from "./context/NotificationContext";
import storageService from "./api/storageService";

// Styles
import "./index.css";
import "./trainer.css";

const getUserRole = (providedToken) => {
    const token = providedToken || localStorage.getItem("token");
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role;
    } catch (e) {
        return null;
    }
};

// MainLayout moved outside to prevent re-mounting on every App render
const MainLayout = ({ children, isLoggedIn, userRole, isMenuOpen, toggleMenu, closeMenu }) => {
    const location = useLocation();
    const hideNavbar = location.pathname.startsWith('/admin-dashboard');

    return (
        <>
            {!hideNavbar && (
                <Navbar
                    isLoggedIn={isLoggedIn}
                    userRole={userRole}
                    isOpen={isMenuOpen}
                    onToggle={toggleMenu}
                    onClose={closeMenu}
                />
            )}
            {children}
            <BottomNav
                isLoggedIn={isLoggedIn}
                userRole={userRole}
                onToggleMenu={toggleMenu}
            />
        </>
    );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = await storageService.getItem("token");
      if (token) {
        setIsLoggedIn(true);
        setUserRole(getUserRole(token));
        // Sync other keys for synchronous access
        await storageService.getItem("role");
        await storageService.getItem("userId");
      }
      setIsAuthReady(true);
    };

    initAuth();

    // Native App URL Listener (Deep Links for Google Auth)
    if (window.Capacitor && window.Capacitor.getPlatform() !== 'web') {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appUrlOpen', (data) => {
          console.log('App opened with URL:', data.url);
          const url = new URL(data.url);
          if (url.hash && url.hash.includes('access_token')) {
            // Redirect to Login page with the hash so it can be parsed there
            window.location.hash = url.hash.substring(1);
          }
        });
      });
    }
    const handleStorage = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUserRole(getUserRole());
    };

    window.addEventListener("storage", handleStorage);

    // Native Back Button Handler
    let backListener = null;
    if (window.Capacitor && window.Capacitor.getPlatform() !== 'web') {
      import('@capacitor/app').then(m => {
        backListener = m.App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // If at root, the OS handles it (usually exits or minimizes)
          }
        });
      });
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (backListener) backListener.remove();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserRole(getUserRole());
  };

  const handleLogout = async () => {
    await storageService.clearAuth();
    setIsLoggedIn(false);
    setUserRole(null);
  };

  const handleSplashFinish = () => {
    setIsSplashFinished(true);
  };

  // Only hide the overall loading screen when BOTH Auth check and Splash animation are done
  useEffect(() => {
    if (isAuthReady && isSplashFinished) {
      setIsAppLoading(false);
    }
  }, [isAuthReady, isSplashFinished]);

  if (isAppLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NotificationProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px', fontWeight: 500 } }} />
      <MainLayout 
        isLoggedIn={isLoggedIn} 
        userRole={userRole} 
        isMenuOpen={isMenuOpen} 
        toggleMenu={toggleMenu} 
        closeMenu={closeMenu}
      >
        <ChatbotWidget isLoggedIn={isLoggedIn} />

        <main>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to={userRole === "ROLE_ADMIN" ? "/admin-dashboard" : "/dashboard"} replace />
                ) : (
                  <Login onLoginSuccess={handleLoginSuccess} />
                )
              }
            />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/support" element={<Support />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Dashboard onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trackers"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Trackers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
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
              path="/analytics/activity"
              element={
                <ProtectedRoute>
                  <ActivityAnalyticsDetail />
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
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
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
              path="/community"
              element={
                <ProtectedRoute>
                  <CommunityPage />
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
              path="/trainers/client/:clientId/analytics"
              element={
                <ProtectedRoute>
                  <ClientAnalyticsPage />
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
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Profile onLogout={handleLogout} />
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
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
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
              path="/admin-dashboard"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <AdminDashboard onLogout={handleLogout} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </MainLayout>
    </Router>
    </NotificationProvider>
  );
};

export default App;
