// src/pages/Notifications.jsx
import React from "react";
import { FiBell, FiCheck, FiChevronLeft, FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead } from "../api/notificationApi";

const Notifications = () => {
    const navigate = useNavigate();

    const [notifications, setNotifications] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const fetchNotifs = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchNotifs();
    }, []);

    const handleMarkRead = async (id) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAll = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Helper to format time relative
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-card" style={{ maxWidth: '700px', margin: '0 auto', minHeight: '80vh', padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--card-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--card-bg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate('/dashboard')} className="icon-btn" style={{ fontSize: '1.2rem' }}>
                            <FiChevronLeft />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Notifications</h1>
                        </div>
                    </div>
                    {notifications.length > 0 && (
                        <button onClick={handleMarkAll} className="secondary-btn" style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: '12px' }}>
                            <FiCheck style={{ marginRight: '6px' }} /> Mark all read
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="notifications-list" style={{ padding: '0' }}>
                    {loading ? (
                        <p style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading updates...</p>
                    ) : notifications.length === 0 ? (
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
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`notif-item ${!notif.read ? 'unread' : ''}`}
                                onClick={() => !notif.read && handleMarkRead(notif.id)}
                            >
                                <div className="notif-icon-box">
                                    <FiBell />
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
                        ))
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
                    width: 44px; height: 44px;
                    min-width: 44px;
                    border-radius: 12px;
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--primary);
                    display: flex; align-items: center; justifyContent: center;
                    font-size: 1.25rem;
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
