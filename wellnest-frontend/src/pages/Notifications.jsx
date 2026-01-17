// src/pages/Notifications.jsx
import React from "react";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
    const navigate = useNavigate();

    const [notifications, setNotifications] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const { getNotifications } = require("../api/notificationApi");
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Failed to load notifications", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifs();
    }, []);

    return (
        <div className="dashboard-page">
            <div className="dashboard-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--primary)' }}>
                            <FiBell size={24} />
                        </div>
                        <h1 style={{ margin: 0 }}>Notifications</h1>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="secondary-btn">Back to Dashboard</button>
                </div>

                <div className="notifications-list">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                            <div className="notif-content">
                                <h4 style={{ margin: '0 0 4px' }}>{notif.title} {notif.unread && <span className="badge-dot"></span>}</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{notif.message}</p>
                            </div>
                            <span className="notif-time">{notif.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .notification-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 16px;
                    border-bottom: 1px solid var(--card-border);
                    transition: background 0.2s;
                }
                .notification-item:last-child {
                    border-bottom: none;
                }
                .notification-item:hover {
                    background: rgba(255,255,255,0.02);
                }
                .notification-item.unread {
                    background: rgba(59, 130, 246, 0.05);
                }
                .badge-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    margin-left: 8px;
                }
                .notif-time {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    white-space: nowrap;
                    margin-left: 16px;
                }
            `}</style>
        </div>
    );
};

export default Notifications;
