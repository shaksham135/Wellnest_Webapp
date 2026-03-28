// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiAward } from "react-icons/fi";

import storageService from "../api/storageService";
import { useData } from "../context/DataContext";
import UserDashboard from "../components/dashboard/UserDashboard";
import TrainerDashboard from "../components/dashboard/TrainerDashboard";
import SkeletonUI from "../components/common/SkeletonUI";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, isUserDataLoaded, refreshUserData, workouts, water, sleep } = useData();

  const [user, setUser] = useState(userData);
  const [loading, setLoading] = useState(!isUserDataLoaded);
  const [error, setError] = useState("");
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Keep local user in sync with context
  useEffect(() => {
    if (userData) {
      setUser(userData);
      setLoading(false);
    }
  }, [userData]);

  /* ---------------- AUTH & DATA LOAD ---------------- */
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // If we already have data, don't show skeletons, just refresh in background
      if (!userData) {
        setLoading(true);
      }
      setError("");
      try {
        const token = await storageService.getItem("token");
        if (!token) {
          if (isMounted) navigate("/");
          return;
        }

        const resData = await refreshUserData();
        if (isMounted) {
          setUser(resData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
        if (isMounted) {
          const status = err.response ? err.response.status : (err.message || 'Unknown');
          setError(`Unable to connect to server (${status}). Please check your internet.`);
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [navigate, retryTrigger, userData, refreshUserData]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid var(--card-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div style={{ flex: 1 }}>
              <SkeletonUI variant="text" style={{ width: '60%', height: '40px', marginBottom: '16px' }} />
              <SkeletonUI variant="text" style={{ width: '40%', height: '20px' }} />
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <SkeletonUI variant="circle" />
            </div>
          </div>
          <SkeletonUI variant="text" style={{ width: '120px', height: '24px', borderRadius: '12px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <SkeletonUI variant="card" />
            <SkeletonUI variant="card" />
            <SkeletonUI variant="card" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
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

  return (
    <div className="dashboard-page">
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ================= TOP HEADER ================= */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), #1e1b4b)',
          borderRadius: '24px',
          padding: '32px',
          color: 'white',
          position: 'relative',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          {/* Background Layer */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '-50px', right: '-50px',
              width: '300px', height: '300px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', filter: 'blur(50px)'
            }}></div>
          </div>

          {/* Text Content */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              Hey, {user?.name?.split(' ')[0] || 'Trainer'}! 👋
              {user.isPremium && (
                <span style={{ 
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', 
                  color: '#1e1b4b', 
                  fontSize: '12px', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  PRO
                </span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
              {isTrainer ? 'Ready to inspire your clients today?' : 'Welcome to your smart health & fitness hub'}
            </p>
            {isTrainer && (
              <div style={{ marginTop: '14px', display: 'inline-block', padding: '6px 14px', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>
                TRAINER DASHBOARD
              </div>
            )}
          </div>

          {/* Profile Icon Only */}
          <div style={{ position: 'relative', zIndex: 20 }}>
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.4rem',
                transition: 'all 0.3s ease'
              }}
              title="Go to Profile"
              className="dashboard-profile-btn"
            >
              <FiUser />
            </button>
          </div>
        </div>

        <p className="role-pill" style={{ alignSelf: 'flex-start', margin: 0 }}>
          Logged in as {user.role?.replace("ROLE_", "")}
        </p>

        {/* ================= PREMIUM WELLNESS GRADE (Repositioned) ================= */}
        {!isTrainer && user.isPremium && (
          <div className="dashboard-card premium-glass-card" style={{ 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '-12px',
            animation: 'pulse-glow 4s infinite ease-in-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, var(--primary), #818cf8)', 
                  color: 'white',
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  boxShadow: '0 8px 16px rgba(79, 70, 229, 0.3)'
                }}>
                  <FiAward />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Wellness Grade
                    <span style={{ fontSize: '10px', background: '#f59e0b', color: '#1e1b4b', padding: '2px 8px', borderRadius: '6px', fontWeight: 900, boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}>PRO</span>
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {(() => {
                      const totalDataPoints = (workouts?.length || 0) + (water?.length || 0) + (sleep?.length || 0);
                      const avg = totalDataPoints / 3;
                      
                      if (totalDataPoints === 0) return "Welcome! Track your first activity to calculate your grade. ✨";
                      if (avg >= 5) return "Master of Consistency! Top 1% achieved. 🏅";
                      if (avg >= 3) return "Great work! You're in the Top 10%. 🚀";
                      return "Keep moving! You're doing better than 60% of peers.";
                    })()}
                  </p>
                </div>
              </div>

              {/* GRADE BADGE */}
              <div style={{ 
                fontSize: '42px', 
                fontWeight: '950', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #c7d2fe 50%, var(--primary) 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
                padding: '0 10px',
                textAlign: 'center',
                letterSpacing: '-2px'
              }}>
                {(() => {
                  const totalDataPoints = (workouts?.length || 0) + (water?.length || 0) + (sleep?.length || 0);
                  const avg = totalDataPoints / 3;
                  
                  if (totalDataPoints === 0) return "—";
                  if (avg >= 5) return "A+";
                  if (avg >= 3) return "A";
                  if (avg >= 1.5) return "B+";
                  if (avg >= 1) return "B";
                  return "C";
                })()}
              </div>
            </div>

            {/* MINI PROGRESS TRACKER */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                <span>Weekly Momentum</span>
                <span>{(() => {
                  const totalDataPoints = (workouts?.length || 0) + (water?.length || 0) + (sleep?.length || 0);
                  return Math.min(100, Math.round((totalDataPoints / 21) * 100));
                })()}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(() => {
                    const totalDataPoints = (workouts?.length || 0) + (water?.length || 0) + (sleep?.length || 0);
                    return Math.min(100, Math.round((totalDataPoints / 21) * 100));
                  })()}%`,
                  background: 'linear-gradient(90deg, var(--primary), #818cf8)',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>
            </div>

            {/* A+ DECORATION */}
            {(() => {
               const totalDataPoints = (workouts?.length || 0) + (water?.length || 0) + (sleep?.length || 0);
               const avg = totalDataPoints / 3;
               if (totalDataPoints > 0 && avg >= 5) {
                 return (
                   <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#f59e0b', animation: 'sparkle 2s infinite ease-in-out' }}>
                     ✨
                   </div>
                 );
               }
               return null;
            })()}
          </div>
        )}

        {/* ================= CONTENT SWITCHER ================= */}
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
