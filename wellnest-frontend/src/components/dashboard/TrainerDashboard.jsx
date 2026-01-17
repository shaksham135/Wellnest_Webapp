import React, { useState, useEffect } from 'react';
import {
    FiUsers,
    FiUserPlus,
    FiDollarSign,
    FiStar,
    FiActivity,
    FiCheck,
    FiX
} from 'react-icons/fi';
import {
    getTrainerRequests,
    updateRequestStatus
} from '../../api/trainerApi';

const TrainerDashboard = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        activeClients: 0,
        pendingRequests: 0,
        rating: user?.rating || 4.9,
        earnings: 1250 // Mock Data
    });
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await getTrainerRequests();
            setRequests(res.data || []);
            // Calculate stats from requests if needed, or use separate stats API
            console.log("Trainer Requests Data:", res.data);
            const pending = (res.data || []).filter(r => r.status === 'PENDING').length;
            const active = (res.data || []).filter(r => r.status && r.status.toUpperCase() === 'ACTIVE').length;
            setStats(prev => ({ ...prev, activeClients: active, pendingRequests: pending }));
        } catch (err) {
            console.error("Failed to fetch requests", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateRequestStatus(id, status);
            fetchRequests(); // Refresh
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* 1. Stats Overview */}
            {/* 1. Stats Overview */}
            <div className="dashboard-grid">
                <div className="trainer-stat-card blue">
                    <div className="stat-icon-wrapper">
                        <FiUsers />
                    </div>
                    <div>
                        <h3>Active Clients</h3>
                        <div className="stat-value">{stats.activeClients}</div>
                    </div>
                    <p className="stat-label">Currently training</p>
                    <div className="stat-bg-icon"><FiUsers /></div>
                </div>

                <div className="trainer-stat-card yellow">
                    <div className="stat-icon-wrapper">
                        <FiUserPlus />
                    </div>
                    <div>
                        <h3>Pending Requests</h3>
                        <div className="stat-value">{stats.pendingRequests}</div>
                    </div>
                    <p className="stat-label">New inquiries</p>
                    <div className="stat-bg-icon"><FiUserPlus /></div>
                </div>

                <div className="trainer-stat-card green">
                    <div className="stat-icon-wrapper">
                        <FiDollarSign />
                    </div>
                    <div>
                        <h3>Earnings</h3>
                        <div className="stat-value">${stats.earnings}</div>
                    </div>
                    <p className="stat-label">This month</p>
                    <div className="stat-bg-icon"><FiDollarSign /></div>
                </div>
            </div>

            {/* 2. Pending Requests List */}
            <div className="dashboard-card" style={{ maxWidth: '100%' }}>
                <div className="dashboard-header">
                    <h3>Recent Client Requests</h3>
                    <p className="dashboard-subtitle">Manage your incoming training requests</p>
                </div>

                {loading ? <p>Loading requests...</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {requests.filter(r => r.status === 'PENDING').length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No pending requests.</p>
                        )}

                        {requests.filter(r => r.status === 'PENDING').map(req => (
                            <div key={req.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '16px',
                                background: 'var(--bg-main)',
                                borderRadius: '12px',
                                border: '1px solid var(--card-border)'
                            }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        borderRadius: '50%', background: 'var(--card-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <span style={{ fontWeight: 'bold' }}>{req.clientName?.[0] || 'U'}</span>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{req.clientName || 'Unknown Client'}</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {req.initialMessage ? `"${req.initialMessage}"` : 'Sent a training request'}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="icon-btn"
                                        style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.1)', padding: '8px', borderRadius: '8px' }}
                                        onClick={() => handleStatusUpdate(req.id, 'ACTIVE')}
                                        title="Accept"
                                    >
                                        <FiCheck size={18} />
                                    </button>
                                    <button
                                        className="icon-btn"
                                        style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}
                                        onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                        title="Reject"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. Trainer Profile Settings */}
            <div className="dashboard-card" style={{ maxWidth: '100%', border: '1px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
                <div className="dashboard-header">
                    <div className="flex gap-sm">
                        <FiActivity style={{ color: "var(--primary)", fontSize: 26 }} />
                        <h3>Trainer Profile Settings</h3>
                    </div>
                    <p className="dashboard-subtitle">Update your availability and details for clients</p>
                </div>

                <TrainerSettingsForm userEmail={user.email} />
            </div>

        </div >
    );
};

const TrainerSettingsForm = ({ userEmail }) => {
    const [formData, setFormData] = useState({
        location: '',
        specialties: '',
        bio: ''
    });
    const [msg, setMsg] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s)
            };
            await import("../../api/trainerApi").then(mod => mod.updateTrainerProfile(payload));
            setMsg('Profile updated successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (e) {
            console.error(e);
            setMsg('Failed to update.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Location (City or 'Online')</label>
                <input
                    type="text"
                    name="location"
                    className="auth-input"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. New York"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0, 0, 0, 0.2)', color: 'var(--text-main)' }}
                />
            </div>
            <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Specialties (comma separated)</label>
                <input
                    type="text"
                    name="specialties"
                    className="auth-input"
                    value={formData.specialties}
                    onChange={handleChange}
                    placeholder="e.g. Yoga, Weight Loss, HIIT"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0, 0, 0, 0.2)', color: 'var(--text-main)' }}
                />
            </div>
            <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Bio</label>
                <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell clients about yourself..."
                    rows={3}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'rgba(0, 0, 0, 0.2)', color: 'var(--text-main)' }}
                />
            </div>
            <button className="primary-btn" onClick={handleSubmit}>Save Changes</button>
            {msg && <p style={{ color: msg.includes('Failed') ? 'red' : 'green', marginTop: '8px' }}>{msg}</p>}
        </div>
    );
};

export default TrainerDashboard;
