// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
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
  const notifRef = useRef(null); // Ref for the dropdown container

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

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

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

        {/* ================= TOP HEADER (Fixed Layout) ================= */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), #1e1b4b)',
          borderRadius: '24px',
          padding: '32px',
          color: 'white',
          position: 'relative',
          /* overflow: 'hidden' REMOVED to allow dropdown to pop out */
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          {/* Background Layer (Handles Clipping for decorative blob) */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none'
          }}>
            {/* Decorative Background Elements */}
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

          {/* Icons (Moved Inside Banner) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 20 }}>
            <style>{`
            .banner-icon-btn {
              background: transparent;
              border: none;
              color: rgba(255, 255, 255, 0.8);
              width: 44px; height: 44px;
              border-radius: 50%;
              display: flex; align-items: center; justifyContent: center;
              cursor: pointer; 
              transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
              font-size: 1.4rem;
            }
            /* Remove circle background on hover, add subtle glow */
            .banner-icon-btn:hover {
              background: transparent; 
              color: white;
              transform: scale(1.15);
              filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
            }
            /* intense shine when clicked/active */
            .banner-icon-btn.active {
              color: white;
              transform: scale(1.2);
              filter: drop-shadow(0 0 10px rgba(255,255,255,1)); /* THE SHINE */
            }
            .notification-dropdown {
                position: absolute;
                top: 55px; /* Adjusted for new height */
                right: 0;
                width: 360px;
                background: var(--card-bg);
                border: 1px solid var(--card-border);
                border-radius: 16px;
                box-shadow: var(--shadow-lg);
                backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                z-index: 100;
                overflow: hidden;
                color: var(--text-main);
                animation: fadeIn 0.2s ease-out;
                transform-origin: top right;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.98); }
                to { opacity: 1; transform: scale(1); }
            }
            /* ... preserve dropdown styles ... */
            .dropdown-header {
                padding: 16px 20px;
                border-bottom: 1px solid var(--card-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255,255,255,0.03);
            }
            .dropdown-header h4 { margin: 0; font-size: 1rem; color: var(--text-main); font-weight: 700; }
            .clear-all { font-size: 0.8rem; color: var(--primary); cursor: pointer; font-weight: 600; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
            .clear-all:hover { background: rgba(59, 130, 246, 0.1); }
            .dropdown-list { max-height: 400px; overflow-y: auto; }
            .dropdown-item {
                padding: 16px 20px;
                border-bottom: 1px solid var(--card-border);
                cursor: pointer; position: relative;
                transition: background 0.2s;
            }
            .dropdown-item:hover { background: rgba(59, 130, 246, 0.08); }
            .dropdown-item.unread { background: rgba(59, 130, 246, 0.05); }
            .dropdown-item.unread::before {
                content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--primary);
            }
            .notif-title { margin: 0 0 6px; font-weight: 600; font-size: 0.95rem; color: var(--text-main); }
            .notif-msg { margin: 0 0 8px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; }
            .notif-time { font-size: 0.75rem; color: var(--text-muted); opacity: 0.8; }
            .dropdown-footer {
                padding: 14px;
                text-align: center;
                background: rgba(255,255,255,0.03);
                border-top: 1px solid var(--card-border);
            }
            .view-all-link { color: var(--primary); font-size: 0.9rem; font-weight: 600; text-decoration: none; cursor: pointer; }
            .view-all-link:hover { text-decoration: underline; }
          `}</style>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`banner-icon-btn ${showNotifications ? 'active' : ''}`}
                title="Notifications"
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '8px', right: '10px',
                    width: '8px', height: '8px',
                    background: '#ef4444', borderRadius: '50%',
                    border: '1px solid #1e1b4b'
                  }}></span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h4>Notifications ({unreadCount})</h4>
                    <span className="clear-all" onClick={handleMarkAllRead}>Mark all read</span>
                  </div>
                  <div className="dropdown-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}>✨</div>
                        No new notifications
                      </div>
                    ) : (
                      // Only show last 5
                      notifications.slice(0, 5).map(n => (
                        <div
                          key={n.id}
                          className={`dropdown-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <p className="notif-title">{n.title}</p>
                          <p className="notif-msg">{n.message}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                            {!n.read && <span style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <span className="view-all-link" onClick={() => navigate('/notifications')}>
                      See all notifications →
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Icon (Simple) */}
            <button
              onClick={() => navigate('/profile')}
              className="banner-icon-btn"
              title="Go to Profile"
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
