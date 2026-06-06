// src/App.js
import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate
} from "react-router-dom";

// Icons removed

// Pages
import LandingPage from "./pages/LandingPage";
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
import HealthReport from "./pages/HealthReport";
import PremiumPage from "./pages/PremiumPage";

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
import { DataProvider, useData } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/common/SplashScreen";
import ChatbotWidget from "./components/common/ChatbotWidget";
import BottomNav from "./components/layout/BottomNav";
import { NotificationProvider } from "./context/NotificationContext";
import { ActivityProvider } from "./context/ActivityContext";
import storageService from "./api/storageService";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import QuickActionFAB from "./components/layout/QuickActionFAB";
import PWAInstallBanner from "./components/common/PWAInstallBanner";

// Styles
import "./index.css";
import "./trainer.css";

import { registerPushNotifications } from "./services/pushNotificationService";

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
const MainLayout = ({ children, isLoggedIn, userRole, isMenuOpen, toggleMenu, closeMenu, onOpenChat }) => {
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
                    onOpenChat={onOpenChat}
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

const AppContent = ({ 
  isLoggedIn, setIsLoggedIn, 
  userRole, setUserRole, 
  isMenuOpen, setIsMenuOpen, 
  toggleMenu, closeMenu,
  isAuthReady, isSplashFinished,
  handleSplashFinish
}) => {
  const { clearAllData } = useData();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- NATIVE PUSH SYNC ---
  useEffect(() => {
    if (isLoggedIn) {
      console.log("AppContent: Initializing industry-ready push notifications...");
      registerPushNotifications();
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await storageService.clearAuth();
    if (typeof clearAllData === 'function') clearAllData();
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/");
  };

  const handleLoginSuccess = async () => {
    const token = await storageService.getItem("token");
    setIsLoggedIn(true);
    setUserRole(getUserRole(token));
    // Push sync will be triggered by useEffect
  };

  const openChat = () => { setIsChatOpen(true); closeMenu(); };

  if (!isAuthReady || !isSplashFinished) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px', fontWeight: 500 } }} />
      <MainLayout 
        isLoggedIn={isLoggedIn} 
        userRole={userRole} 
        isMenuOpen={isMenuOpen} 
        toggleMenu={toggleMenu} 
        closeMenu={closeMenu}
        onLogout={handleLogout}
        onOpenChat={openChat}
      >
        <ChatbotWidget 
            isLoggedIn={isLoggedIn} 
            forceOpen={isChatOpen} 
            setForceOpen={setIsChatOpen}
            hideFloatingButton={true}
        />
        <QuickActionFAB />
        <PWAInstallBanner />

        <main>
          <Routes>
            <Route path="/" element={
              isLoggedIn ? 
                <Navigate to={userRole === "ROLE_ADMIN" ? "/admin-dashboard" : "/dashboard"} replace /> : 
                <LandingPage />
            } />
            
            <Route path="/login" element={
              isLoggedIn ? 
                <Navigate to={userRole === "ROLE_ADMIN" ? "/admin-dashboard" : "/dashboard"} replace /> : 
                <Login onLoginSuccess={handleLoginSuccess} />
            } />
            
            <Route path="/register" element={
              isLoggedIn ? 
                <Navigate to={userRole === "ROLE_ADMIN" ? "/admin-dashboard" : "/dashboard"} replace /> : 
                <Register onLoginSuccess={handleLoginSuccess} />
            } />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Dashboard onLogout={handleLogout} onOpenChat={openChat} />
              </ProtectedRoute>
            } />

            <Route path="/admin-dashboard" element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <AdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <Profile onLogout={handleLogout} />
              </ProtectedRoute>
            } />

            <Route path="/premium" element={
              <ProtectedRoute isLoggedIn={isLoggedIn}>
                <PremiumPage />
              </ProtectedRoute>
            } />

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

            {/* analytics sub-routes */}
            <Route path="/analytics/workout" element={<ProtectedRoute isLoggedIn={isLoggedIn}><WorkoutAnalyticsDetail /></ProtectedRoute>} />
            <Route path="/analytics/nutrition" element={<ProtectedRoute isLoggedIn={isLoggedIn}><NutritionAnalyticsDetail /></ProtectedRoute>} />
            <Route path="/analytics/sleep" element={<ProtectedRoute isLoggedIn={isLoggedIn}><SleepAnalyticsDetail /></ProtectedRoute>} />
            <Route path="/analytics/water" element={<ProtectedRoute isLoggedIn={isLoggedIn}><WaterIntakeAnalyticsDetail /></ProtectedRoute>} />
            <Route path="/analytics/activity" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ActivityAnalyticsDetail /></ProtectedRoute>} />
            <Route path="/analytics/goals" element={<ProtectedRoute isLoggedIn={isLoggedIn}><GoalProgressDetail /></ProtectedRoute>} />
            <Route path="/analytics/health" element={<ProtectedRoute isLoggedIn={isLoggedIn}><HealthMetricsDetail /></ProtectedRoute>} />

            <Route path="/leaderboard" element={<ProtectedRoute isLoggedIn={isLoggedIn}><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/blog" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Blog isLoggedIn={isLoggedIn} /></ProtectedRoute>} />
            <Route path="/blog/:id" element={<ProtectedRoute isLoggedIn={isLoggedIn}><BlogPost /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute isLoggedIn={isLoggedIn}><CommunityPage isLoggedIn={isLoggedIn} /></ProtectedRoute>} />

            <Route
              path="/trainers"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  {userRole === 'ROLE_TRAINER' ? <ClientDetails /> : <TrainerMatching />}
                </ProtectedRoute>
              }
            />

            <Route path="/trainers/client/:clientId/analytics" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ClientAnalyticsPage /></ProtectedRoute>} />
            <Route path="/my-trainers" element={<ProtectedRoute isLoggedIn={isLoggedIn}><MyTrainers /></ProtectedRoute>} />
            <Route path="/setup-profile" element={<ProtectedRoute isLoggedIn={isLoggedIn}><SetupProfile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Notifications /></ProtectedRoute>} />
            <Route path="/bmi-calculator" element={<ProtectedRoute isLoggedIn={isLoggedIn}><BmiCalculator /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute isLoggedIn={isLoggedIn}><HealthReport /></ProtectedRoute>} />

            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/support" element={<Support />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </MainLayout>
    </>
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    // --- OAuth Relay Check (Only on Web) ---
    // If we're in a browser (not Capacitor) and have an OAuth token in hash, 
    // try to 'relay' it back to the native app using the custom scheme.
    const isActuallyNative = (window.Capacitor && window.Capacitor.getPlatform() !== 'web');
    const hasOAuthHash = window.location.hash.includes('access_token');
    
    if (!isActuallyNative && hasOAuthHash) {
        console.log("Web Relay: Detected OAuth token, attempting to open native app...");
        const customSchemeUrl = `com.wellnest.app://oauth${window.location.hash}`;
        // Attempt automatic redirect first
        window.location.href = customSchemeUrl;
        
        // Return simple overlay for manual trigger if auto fails
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 99999, color: 'white', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
                <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Authenticated Successfully!</h1>
                <p style={{ opacity: 0.9, marginBottom: '30px' }}>We are redirecting you back to the Wellnest app.</p>
                <a 
                    href={customSchemeUrl}
                    style={{
                        background: 'white', color: '#4f46e5', padding: '12px 30px', 
                        borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                >
                    Return to Wellnest App
                </a>
            </div>
        );
    }

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
          try {
            const url = new URL(data.url);
            // Case 1: Token in Hash (#access_token=...)
            if (url.hash && url.hash.includes('access_token')) {
                window.location.hash = url.hash.substring(1);
            } 
            // Case 2: Token in Search (?access_token=...)
            else if (url.search && url.search.includes('access_token')) {
                window.location.hash = url.search.substring(1);
            }
          } catch (e) {
            console.error("Failed to parse App URL:", e);
          }
        });
      });
    }
    const handleStorage = async () => {
      const token = await storageService.getItem("token");
      setIsLoggedIn(!!token);
      setUserRole(getUserRole(token));
    };

    window.addEventListener("storage", handleStorage);

    // --- PWA Installation Support ---
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      window.dispatchEvent(new Event('pwa-install-available'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      window.deferredPrompt = null;
      console.log('PWA was installed');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

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
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (backListener) backListener.remove();
    };
  }, []);

  const handleSplashFinish = () => setIsSplashFinished(true);

  return (
    <NotificationProvider>
      <DataProvider>
        <ActivityProvider>
          <Router>
            <ErrorBoundary>
              <AppContent 
                isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}
                userRole={userRole} setUserRole={setUserRole}
                isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen}
                toggleMenu={toggleMenu} closeMenu={closeMenu}
                isAuthReady={isAuthReady} isSplashFinished={isSplashFinished}
                handleSplashFinish={handleSplashFinish}
              />
            </ErrorBoundary>
          </Router>
        </ActivityProvider>
      </DataProvider>
    </NotificationProvider>
  );
};

export default App;
