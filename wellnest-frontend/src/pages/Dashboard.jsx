// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiX } from "react-icons/fi";

import storageService from "../api/storageService";
import { useData } from "../context/DataContext";
import { useNotifications } from "../context/NotificationContext";
import { markAsRead } from "../api/notificationApi";
import UserDashboard from "../components/dashboard/UserDashboard";
import TrainerDashboard from "../components/dashboard/TrainerDashboard";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import AIAgentHeader from "../components/dashboard/AIAgentHeader";
import UndoBanner from "../components/dashboard/UndoBanner";
import OnboardingFlow from "../components/dashboard/OnboardingFlow";
import { speakMessage } from "../utils/ttsService";
import { toLocalDateString } from "../utils/streakUtils";

const Dashboard = ({ onLogout, onOpenChat }) => {
    const navigate = useNavigate();
    const { 
        userData, isUserDataLoaded, refreshUserData, 
        activities, isTrackersLoaded, refreshTrackers, isSyncing,
        energyForecast, refreshEnergyForecast,
        sleep, workouts, water, meals 
    } = useData();

    const [user, setUser] = useState(userData);
    const [loading, setLoading] = useState(!isUserDataLoaded && !isTrackersLoaded);
    const [error, setError] = useState("");
    const [retryTrigger, setRetryTrigger] = useState(0);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const { notifications, refreshNotifications } = useNotifications();
    const [premiumNotif, setPremiumNotif] = useState(null);

    useEffect(() => {
        const unreadPremium = notifications?.find(n => 
            !n.read && 
            n.type !== 'TIP' && 
            (n.title.includes("Premium") || n.message.includes("Premium"))
        );
        if (unreadPremium && unreadPremium.id !== premiumNotif?.id) {
            setPremiumNotif(unreadPremium);
        }
    }, [notifications, premiumNotif]);

    const handleDismissPremiumNotif = async () => {
        if (!premiumNotif) return;
        await markAsRead(premiumNotif.id);
        setPremiumNotif(null);
        refreshNotifications();
    };

    // Sync local user with context
    useEffect(() => {
        if (userData) {
            setUser(userData);
            setLoading(false);
            const isTrainer = userData.role === 'ROLE_TRAINER' || userData.role === 'TRAINER';
            const userOnboardKey = `hasOnboarded_${userData.id || userData.email}`;
            if (!isTrainer && localStorage.getItem(userOnboardKey) !== 'true') {
                setShowOnboarding(true);
            }
        }
    }, [userData]);

    // INDUSTRY-READY BACKGROUND REFRESH
    useEffect(() => {
        let isMounted = true;
        const syncData = async () => {
            if (isSyncing) return; // Prevent local loop

            // If we have no data, show initial loading
            if (!isUserDataLoaded && !isTrackersLoaded) {
                setLoading(true);
            }
            
            try {
                const token = await storageService.getItem("token");
                if (!token) {
                    if (isMounted) navigate("/login");
                    return;
                }

                console.log("Dashboard: Initiating Parallel Neural Sync... 🧬");
                // Fire requests in parallel
                await Promise.all([
                    refreshUserData().catch(e => console.error("Sync User failed", e)),
                    refreshTrackers().catch(e => console.error("Sync Trackers failed", e)),
                    user?.isPremium ? refreshEnergyForecast().catch(e => console.error("Sync Energy failed", e)) : Promise.resolve()
                ]);

                if (isMounted) setLoading(false);
            } catch (err) {
                if (isMounted) {
                    setError("Sync failed. Using cached data.");
                    setLoading(false);
                }
            }
        };

        syncData();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, retryTrigger, refreshUserData, refreshTrackers, user?.isPremium]);

    if (loading) {
        return <DashboardSkeleton />;
    }

  if (error || !user) {
    return (
      <div className="dashboard-page container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-main)', marginBottom: '20px' }}>{error || "Something went wrong"}</p>
          <button
            className="primary-btn"
            onClick={() => setRetryTrigger(prev => prev + 1)}
            style={{ width: 'auto', padding: '10px 24px' }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isTrainer = user.role === 'ROLE_TRAINER' || user.role === 'TRAINER';

  // Find today's activity (Moved to component scope)
  const today = toLocalDateString(new Date());
  const todayActivity = activities?.find(a => toLocalDateString(a.date) === today || toLocalDateString(a.createdAt) === today);

    const getUnifiedVitalityScore = () => {
        if (isTrainer) return null;

        // --- 1. PREMIUM LIVE PULSE (Energy Forecast) ---
        if (user?.isPremium && energyForecast) {
            return energyForecast.currentEnergy;
        }

        // --- 2. BASE READINESS FOUNDATION (Free/Fallback) ---
        // Check if we have sleep for today
        const todayDate = new Date();
        const hasSleepToday = sleep?.some(s => {
            const d = new Date(s.sleepDate || s.createdAt);
            return d.getDate() === todayDate.getDate() && d.getMonth() === todayDate.getMonth();
        });

        if (!hasSleepToday) return null; // Readiness is Locked until sleep is logged

        // Algorithm: Sleep Hours (40%) + Steps (40%) + Water (20%)
        const lastSleep = sleep[0]?.hours || 0;
        const sleepScore = Math.min((lastSleep / 8) * 40, 40);
        const stepsScore = Math.min(((todayActivity?.steps || 0) / 10000) * 40, 40);
        const waterScore = 20;

        return Math.round(sleepScore + stepsScore + waterScore);
    };

  const readinessScore = getUnifiedVitalityScore();
  
  // Traditional Readiness Score for the Wellness Grade (Structural Foundation)
  const structuralReadiness = (() => {
        const lastSleep = sleep[0]?.hours || 0;
        const sleepScore = Math.min((lastSleep / 8) * 40, 40);
        const stepsScore = Math.min(((todayActivity?.steps || 0) / 10000) * 40, 40);
        return Math.round(sleepScore + stepsScore + 20);
  })();

  return (
    <div className="dashboard-page container" style={{ paddingBottom: '100px', paddingTop: '24px' }}>
      {showOnboarding && (
        <OnboardingFlow 
          user={user}
          onComplete={() => setShowOnboarding(false)}
          onTriggerMic={() => {
            speakMessage("Welcome! Hold the AI button and speak in English, Hindi, or Hinglish to log your habit.");
          }}
        />
      )}
      <div className="dashboard-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* PREMIUM SUBSCRIPTION BANNER */}
        {premiumNotif && (
            <div className="premium-banner" style={{
                 background: premiumNotif.title.includes("Welcome") || premiumNotif.title.includes("Premium!") ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.05))' : 'rgba(239, 68, 68, 0.1)',
                 border: premiumNotif.title.includes("Welcome") || premiumNotif.title.includes("Premium!") ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)',
                 borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px',
                 boxShadow: premiumNotif.title.includes("Welcome") || premiumNotif.title.includes("Premium!") ? '0 4px 20px rgba(251, 191, 36, 0.1)' : 'none',
                 animation: 'slideDown 0.5s ease-out'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ fontSize: '24px' }}>
                         {(premiumNotif.title.includes("Welcome") || premiumNotif.title.includes("Premium!")) ? '👑' : '⚠️'}
                     </div>
                     <div>
                         <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: (premiumNotif.title.includes("Welcome") || premiumNotif.title.includes("Premium!")) ? '#f59e0b' : '#ef4444' }}>
                             {premiumNotif.title}
                         </h3>
                         <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{premiumNotif.message}</p>
                     </div>
                </div>
                <button onClick={handleDismissPremiumNotif} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', display: 'flex', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <FiX size={20} />
                </button>
            </div>
        )}

        {/* 1. COMPANION HEADER */}
        <div style={{ position: 'relative' }}>
            <AIAgentHeader
                user={user}
                activities={activities}
                sleep={sleep}
                readinessScore={readinessScore}
            />
            {isSyncing && (
                <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '12px',
                    background: 'rgba(52, 211, 153, 0.1)',
                    color: '#34d399',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    backdropFilter: 'blur(4px)',
                    animation: 'pulse 2s infinite'
                }}>
                    <FiRefreshCw className="spin" style={{ fontSize: '12px' }} />
                    SYNCING...
                </div>
            )}
        </div>

        {/* 4. CONTENT SWITCHER */}
        {isTrainer ? (
          <TrainerDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}

      </div>
      <UndoBanner />
    </div>
  );
};

export default Dashboard;
