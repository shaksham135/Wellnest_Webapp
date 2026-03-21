// src/pages/Notifications.jsx
import React from "react";
import { 
    FiBell, FiCheck, FiArrowLeft, FiDroplet, FiActivity, 
    FiShield, FiAward, FiZap 
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { markAsRead, markAllAsRead } from "../api/notificationApi";

import { useNotifications } from "../context/NotificationContext";
import { toast } from "react-hot-toast";

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, refreshNotifications, permissionStatus, requestPermission } = useNotifications();

    const handleMarkAll = async () => {
        await markAllAsRead();
        refreshNotifications();
        toast.success("All notifications marked as read");
    };

    // Smart Navigation Mapping
    const handleNotifClick = async (notif) => {
        // 1. Mark as read if unread
        if (!notif.read) {
            await markAsRead(notif.id);
            refreshNotifications();
        }

        // 2. Determine Navigation Target
        const title = notif.title.toLowerCase();
        const msg = notif.message.toLowerCase();

        if (title.includes('hydration') || msg.includes('water')) {
            navigate('/trackers?tab=water');
        } else if (title.includes('activity') || title.includes('step')) {
            navigate('/trackers?tab=activity');
        } else if (title.includes('workout') || msg.includes('exercise')) {
            navigate('/trackers?tab=workout');
        } else if (title.includes('sleep') || msg.includes('rest')) {
            navigate('/trackers?tab=sleep');
        } else if (title.includes('meal') || title.includes('nutrition') || msg.includes('eat')) {
            navigate('/trackers?tab=meal');
        } else if (title.includes('chat') || title.includes('trainer') || msg.includes('coach')) {
            navigate('/community');
        } else if (title.includes('verification') || title.includes('approved')) {
            navigate('/profile');
        } else if (title.includes('leaderboard')) {
            navigate('/leaderboard');
        } else if (title.includes('analytics')) {
            navigate('/analytics');
        }
    };

    // Helper to format time relative
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 84600) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const hasUnread = notifications.some(n => !n.read);

    return (
        <div className="dashboard-page">
            <div className="dashboard-card" style={{ maxWidth: '700px', margin: '0 auto', minHeight: '80vh', padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--card-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--card-bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-main)', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                            <FiArrowLeft />
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>Notifications</h2>
                    </div>

                    {hasUnread && (
                        <button 
                            onClick={handleMarkAll}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.2)', padding: '6px 12px',
                                borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.2)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(34, 197, 94, 0.1)'}
                        >
                            <FiCheck /> Mark All
                        </button>
                    )}
                </div>

                {/* Banner */}
                    {permissionStatus !== "granted" && (
                        <div style={{ padding: '0 24px 20px' }}>
                            <div style={{ 
                                background: 'var(--primary-light)', 
                                borderRadius: '16px', 
                                padding: '16px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                border: '1px solid var(--primary-border)'
                            }}>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '0.9rem' }}>System Notifications</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Get real-time health alerts on your device</p>
                                </div>
                                <button 
                                    onClick={requestPermission}
                                    className="primary-btn" 
                                    style={{ padding: '8px 16px', fontSize: '0.8rem', height: 'auto' }}
                                >
                                    {permissionStatus === "denied" ? "Blocked" : "Enable"}
                                </button>
                            </div>
                        </div>
                    )}

                {/* List */}
                <div className="notifications-list" style={{ padding: '0' }}>
                    {notifications.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: '400px', padding: '40px', color: 'var(--text-muted)', textAlign: 'center'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.05)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '24px', fontSize: '2rem', color: 'var(--primary)'
                            }}>
                                <FiBell />
                            </div>
                            <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)' }}>All caught up!</h3>
                            <p>You have no new notifications at the moment.</p>
                        </div>
                    ) : (
                        notifications.map(notif => {
                            const title = notif.title.toLowerCase();
                            let icon = <FiBell />;
                            let boxStyles = { background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-muted)' };

                            if (title.includes('hydration')) {
                                icon = <FiDroplet />;
                                boxStyles = { background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' };
                            } else if (title.includes('activity') || title.includes('step')) {
                                icon = <FiActivity />;
                                boxStyles = { background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' };
                            } else if (title.includes('workout')) {
                                icon = <FiZap />;
                                boxStyles = { background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' };
                            } else if (title.includes('tip')) {
                                icon = <FiZap />;
                                boxStyles = { background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' };
                            } else if (title.includes('verification') || title.includes('security')) {
                                icon = <FiShield />;
                                boxStyles = { background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' };
                            } else if (title.includes('congratulations') || title.includes('approved')) {
                                icon = <FiAward />;
                                boxStyles = { background: 'rgba(249, 115, 22, 0.12)', color: '#f97316' };
                            }

                            return (
                                <div
                                    key={notif.id}
                                    className={`notif-item ${!notif.read ? 'unread' : ''}`}
                                    onClick={() => handleNotifClick(notif)}
                                >
                                    <div className="notif-icon-box" style={boxStyles}>
                                        {icon}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-top-row">
                                            <h4 className="notif-title">{notif.title}</h4>
                                            <span className="notif-time">{formatTime(notif.createdAt)}</span>
                                        </div>
                                        <p className="notif-msg">{notif.message}</p>
                                    </div>
                                    {!notif.read && <div className="unread-dot"></div>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <style>{`
                .notif-item {
                    display: flex;
                    gap: 16px;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--card-border);
                    cursor: pointer;
                    transition: background 0.2s;
                    position: relative;
                }
                .notif-item:last-child { border-bottom: none; }
                .notif-item:hover {
                    background: rgba(255,255,255,0.02);
                }
                .notif-item.unread {
                    background: rgba(59, 130, 246, 0.03);
                }
                .notif-item.unread:hover {
                    background: rgba(59, 130, 246, 0.06);
                }
                
                .notif-icon-box {
                    width: 46px; height: 46px;
                    min-width: 46px;
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.35rem;
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
                }
                .notif-item:hover .notif-icon-box {
                    transform: scale(1.05);
                }
                
                .notif-content { flex: 1; }
                
                .notif-top-row {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 6px;
                }
                .notif-title { margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main); }
                .notif-time { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; margin-left: 10px; }
                
                .notif-msg { margin: 0; font-size: 0.95rem; color: var(--text-muted); line-height: 1.5; }
                
                .unread-dot {
                    position: absolute; top: 22px; right: 24px; /* Adjusted position */
                    width: 8px; height: 8px; background: #ef4444; border-radius: 50%;
                }
                /* Hide dot if specific layout needs it, but keeping it simple */
                .notif-item.unread .unread-dot { display: block; }
                
                @media (max-width: 640px) {
                    .notif-item { padding: 16px; gap: 12px; }
                    .notif-icon-box { width: 36px; height: 36px; min-width: 36px; font-size: 1rem; }
                    .notif-title { font-size: 0.95rem; }
                    .notif-msg { font-size: 0.85rem; }
                }
            `}</style>
        </div>
    );
};

export default Notifications;
