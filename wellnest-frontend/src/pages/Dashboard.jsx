// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiArrowRight, FiFileText } from "react-icons/fi";

import storageService from "../api/storageService";
import { useData } from "../context/DataContext";
import UserDashboard from "../components/dashboard/UserDashboard";
import TrainerDashboard from "../components/dashboard/TrainerDashboard";
import SkeletonUI from "../components/common/SkeletonUI";
import AIAgentHeader from "../components/dashboard/AIAgentHeader";
import EnergyForecastCard from "../components/dashboard/EnergyForecastCard";
import ReadinessGauge from "../components/dashboard/ReadinessGauge";
import WellnessGradeCard from "../components/dashboard/WellnessGradeCard";

const Dashboard = () => {
    const navigate = useNavigate();
    const { 
        userData, isUserDataLoaded, refreshUserData, 
        activities, isTrackersLoaded, refreshTrackers, isSyncing,
        energyForecast, refreshEnergyForecast,
        sleep, workouts 
    } = useData();

    const [user, setUser] = useState(userData);
    const [loading, setLoading] = useState(!isUserDataLoaded && !isTrackersLoaded);
    const [error, setError] = useState("");
    const [retryTrigger, setRetryTrigger] = useState(0);

    // Sync local user with context
    useEffect(() => {
        if (userData) {
            setUser(userData);
            setLoading(false);
        }
    }, [userData]);

    // INDUSTRY-READY BACKGROUND REFRESH
    useEffect(() => {
        let isMounted = true;
        const syncData = async () => {
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
    }, [navigate, retryTrigger, refreshUserData, refreshTrackers]);

    if (loading) {
    return (
      <div className="dashboard-page container" style={{ padding: '24px' }}>
        <SkeletonUI variant="card" style={{ height: '120px', marginBottom: '20px' }} />
        <SkeletonUI variant="card" style={{ height: '300px', marginBottom: '20px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <SkeletonUI variant="card" style={{ height: '100px' }} />
          <SkeletonUI variant="card" style={{ height: '100px' }} />
        </div>
      </div>
    );
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
  const today = new Date().toISOString().split('T')[0];
  const todayActivity = activities?.find(a => (a.date === today) || (new Date(a.date || a.createdAt).toISOString().split('T')[0] === today));

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
      <div className="dashboard-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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

        {/* 2. HERO GAUGE (Locked/Unlocked) */}
        {!isTrainer && (
          <div style={{ position: 'relative' }}>
            <ReadinessGauge score={readinessScore || 0} />

            {!readinessScore && (
              <div className="morning-briefing-overlay" style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(7, 10, 19, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
                zIndex: 10,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💤</div>
                <h3 style={{ margin: 0, color: 'white', fontWeight: 800 }}>Morning Briefing</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '8px 0 20px 0', maxWidth: '280px' }}>
                  Log your sleep to unlock your Daily Readiness score and AI insights.
                </p>
                <button
                  className="primary-btn"
                  style={{
                    width: 'auto',
                    padding: '12px 28px',
                    background: 'var(--secondary)',
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)'
                  }}
                  onClick={() => navigate('/trackers?tab=sleep')}
                >
                  Sync Sleep <FiArrowRight style={{ marginLeft: '8px' }} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. QUICK ACTIONS GRID */}
        {!isTrainer && (
          <div className="dashboard-grid">
            <WellnessGradeCard score={structuralReadiness || 0} />
            <EnergyForecastCard forecast={energyForecast?.forecast} message={energyForecast?.message} />

            <div
              onClick={() => navigate('/trackers?tab=activity')}
              className="card"
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  <FiRefreshCw />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px' }}>HEALTH SYNC</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Daily Steps</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {(todayActivity?.steps || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/workouts')}
              className="card"
              style={{
                padding: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'linear-gradient(135deg, var(--primary-light), transparent)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: 'var(--secondary)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  <FiArrowRight />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px' }}>WORKOUTS</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Active Fitness</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>{workouts?.length || 0} Session(s)</div>
              </div>
            </div>
            <div
              onClick={() => navigate('/report')}
              className="card"
              style={{
                padding: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                background: 'linear-gradient(135deg, var(--secondary-light, rgba(167, 139, 250, 0.1)), transparent)',
                border: '1px solid var(--card-border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(167, 139, 250, 0.1)',
                  color: 'var(--secondary)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  <FiFileText />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.8px' }}>INSIGHTS</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>Weekly Report</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>Generate Report</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CONTENT SWITCHER */}
        {isTrainer ? (
          <TrainerDashboard user={user} />
        ) : (
          <UserDashboard user={user} />
        )}

      </div>
    </div>
  );
};

export default Dashboard;
