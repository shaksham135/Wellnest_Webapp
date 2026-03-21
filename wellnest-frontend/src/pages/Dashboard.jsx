// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchCurrentUser } from "../api/userApi";
import UserDashboard from "../components/dashboard/UserDashboard";
import TrainerDashboard from "../components/dashboard/TrainerDashboard";
import SkeletonUI from "../components/common/SkeletonUI";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- AUTH & DATA LOAD ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const res = await fetchCurrentUser();
        setUser(res.data);
      } catch (err) {
        console.error(err);
        const status = err.response ? err.response.status : 'Unknown';
        setError(`Failed to load user. Status: ${status}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

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
        <div className="dashboard-card">{error}</div>
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
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 800 }}>
              Hey, {user?.name?.split(' ')[0] || 'Trainer'}! 👋
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

        <p className="role-pill" style={{ alignSelf: 'flex-start' }}>
          Logged in as {user.role?.replace("ROLE_", "")}
        </p>

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
