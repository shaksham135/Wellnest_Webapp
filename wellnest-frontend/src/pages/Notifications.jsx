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

    return (
        <div className="dashboard-page">
            <div className="dashboard-card" style={{ maxWidth: '800px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--card-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate('/dashboard')} className="icon-btn" style={{ fontSize: '1.2rem' }}>
                            <FiChevronLeft />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Notifications</h1>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Stay updated with your progress
                            </p>
                        </div>
                    </div>
                    {notifications.length > 0 && (
                        <button onClick={handleMarkAll} className="secondary-btn" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                            <FiCheck style={{ marginRight: '6px' }} /> Mark all read
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="notifications-list" style={{ padding: '10px', flex: 1 }}>
                    {loading ? (
                        <p style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading updates...</p>
                    ) : notifications.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            height: '100%', padding: '60px 20px', color: 'var(--text-muted)', textAlign: 'center'
                        }}>
                            <div style={{
                                width: '80px', height: '80px', background: 'var(--card-bg)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid var(--card-border)', marginBottom: '20px', fontSize: '2rem', color: 'var(--primary)'
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
                                className={`notif-card ${!notif.read ? 'unread' : ''}`}
                                onClick={() => !notif.read && handleMarkRead(notif.id)}
                            >
                                <div className="notif-icon-col">
                                    <div className="notif-icon-circle">
                                        <FiBell />
                                    </div>
                                </div>
                                <div className="notif-content-col">
                                    <div className="notif-header-row">
                                        <h4>{notif.title}</h4>
                                        <span className="notif-time">
                                            <FiClock style={{ marginRight: '4px' }} />
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p>{notif.message}</p>
                                </div>
                                {!notif.read && <div className="unread-dot"></div>}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .notif-card {
                    display: flex;
                    gap: 16px;
                    padding: 18px;
                    margin: 8px 12px;
                    border-radius: 16px;
                    background: var(--card-bg);
                    border: 1px solid var(--card-border);
                    transition: all 0.2s ease;
                    cursor: default;
                    position: relative;
                }
                .notif-card:hover {
                    background: rgba(255,255,255,0.03);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                }
                .notif-card.unread {
                    background: rgba(59, 130, 246, 0.04);
                    border-color: rgba(59, 130, 246, 0.2);
                }
                .notif-icon-circle {
                    width: 40px; height: 40px;
                    border-radius: 12px;
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--primary);
                    display: flex; align-items: center; justifyContent: center;
                    font-size: 1.2rem;
                }
                .notif-content-col {
                    flex: 1;
                }
                .notif-header-row {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    margin-bottom: 6px;
                }
                .notif-header-row h4 {
                    margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main);
                }
                .notif-time {
                    font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center;
                }
                .notif-content-col p {
                    margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;
                }
                .unread-dot {
                    position: absolute; top: 20px; right: 20px;
                    width: 8px; height: 8px; background: #ef4444; border-radius: 50%;
                }
                [data-theme="light"] .notif-card.unread {
                    background: #eff6ff;
                }
            `}</style>
        </div>
    );
};

export default Notifications;
