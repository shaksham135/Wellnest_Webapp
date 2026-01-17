// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiUser
} from "react-icons/fi";

import { fetchCurrentUser } from "../api/userApi";
import { getNotifications, markAsRead, markAllAsRead } from "../api/notificationApi";
import UserDashboard from "../components/dashboard/UserDashboard";
import TrainerDashboard from "../components/dashboard/TrainerDashboard";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
        await loadNotifications();
      } catch (err) {
        console.error(err);
        const status = err.response ? err.response.status : 'Unknown';
        setError(`Failed to load user. Status: ${status}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Poll for notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const loadNotifications = async () => {
    try {
      const list = await getNotifications();
      setNotifications(list);
      const unread = list.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">Loading dashboard…</div>
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

  /* ===================== RENDER ===================== */
  const isTrainer = user.role === 'ROLE_TRAINER' || user.role === 'TRAINER';

  return (
    <div className="dashboard-page">
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ================= TOP HEADER ================= */}
        <div className="dashboard-card" style={{ maxWidth: '100%' }}>
          <div className="dashboard-header">
            <div>
              <style>{`
            .notification-dropdown {
                position: absolute;
                top: 50px;
                right: 0;
                width: 320px;
                background: var(--card-bg);
                border: 1px solid var(--card-border);
                border-radius: 12px;
                box-shadow: var(--shadow-lg);
                backdrop-filter: var(--glass-blur);
                z-index: 100;
                overflow: hidden;
                color: var(--text-main);
            }
            .dropdown-header {
                padding: 12px 16px;
                border-bottom: 1px solid var(--card-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--card-bg);
            }
            .dropdown-header h4 { margin: 0; font-size: 0.9rem; color: var(--text-main); }
            .clear-all { font-size: 0.8rem; color: var(--primary); cursor: pointer; }
            .dropdown-list { max-height: 350px; overflow-y: auto; background: var(--card-bg); }
            .dropdown-item {
                padding: 12px 16px;
                border-bottom: 1px solid var(--card-border);
                transition: background 0.2s;
                cursor: pointer;
                position: relative;
            }
            .dropdown-item.unread { background: rgba(59, 130, 246, 0.08); }
            .dropdown-item.unread::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--primary);
            }
            .dropdown-item:hover { background: rgba(59, 130, 246, 0.12); }
            .notif-title { margin: 0 0 4px; font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
            .notif-msg { margin: 0 0 6px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }
            .notif-time { font-size: 0.7rem; color: var(--text-muted); opacity: 0.8; }
            .dropdown-footer {
                padding: 10px;
                text-align: center;
                font-size: 0.8rem;
                color: var(--text-muted);
                border-top: 1px solid var(--card-border);
            }
          `}</style>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary), #1e1b4b)',
                borderRadius: '16px',
                padding: '32px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}>
                {/* Decorative Circle */}
                <div style={{
                  position: 'absolute', top: '-50px', right: '-50px',
                  width: '200px', height: '200px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)'
                }}></div>

                <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem', fontWeight: 800 }}>Hey, {user?.name?.split(' ')[0] || 'Trainer'}! 👋</h1>
                <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px' }}>
                  {isTrainer ? 'Ready to inspire your clients today?' : 'Welcome to your smart health & fitness hub'}
                </p>
                {isTrainer && (
                  <div style={{ marginTop: '16px', display: 'inline-flex', padding: '6px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
                    TRAINER DASHBOARD
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="ghost-btn icon-btn"
                style={{ position: 'relative' }}
              >
                <FiBell style={{ fontSize: '1.2rem' }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '6px', right: '6px',
                    width: '10px', height: '10px',
                    background: '#ef4444', borderRadius: '50%',
                    border: '2px solid var(--card-bg)'
                  }}></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h4>Notifications ({unreadCount})</h4>
                    <span className="clear-all" onClick={handleMarkAllRead}>Mark all read</span>
                  </div>
                  <div className="dropdown-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`dropdown-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.message}</p>
                          <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <button onClick={() => navigate('/profile')} className="ghost-btn icon-btn">
                <FiUser style={{ fontSize: '1.2rem' }} />
              </button>
            </div>
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
