import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../api/apiClient";
import {
    FiUsers, FiTrash2, FiActivity, FiUserCheck, FiLogOut, FiX,
    FiGrid, FiList, FiFileText, FiShield, FiSearch, FiChevronRight, FiGlobe, FiCheckCircle, FiXCircle, FiBell, FiAward
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getClientAnalytics, getPendingVerifications, verifyTrainer, rejectTrainerVerification } from "../api/trainerApi";
import { toggleUserPremium, toggleUserSuspension, getSystemMetrics, toggleGlobalAi } from "../api/adminApi";
import ThemeToggle from "../components/ThemeToggle";
import storageService from "../api/storageService";
import logo from "../assets/logo.png";
import "./AdminDashboard.css";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState("all");
    const [users, setUsers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [pendingTrainerVerifications, setPendingTrainerVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Advanced Filters
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterTier, setFilterTier] = useState("ALL");

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Analytics Metrics
    const [metrics, setMetrics] = useState({
        totalUsers: 0,
        premiumUsers: 0,
        totalTrainers: 0,
        aiEnabled: true,
        totalTokens: 0
    });

    // Broadcast State
    const [broadcastData, setBroadcastData] = useState({ title: "", message: "", type: "INFO", target: "ALL" });
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // User Detail State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);

    const navigate = useNavigate();

    // Fetch Analytics when user is selected
    useEffect(() => {
        if (selectedUser) {
            setUserAnalytics(null);
            getClientAnalytics(selectedUser.id)
                .then(res => setUserAnalytics(res.data))
                .catch(err => {
                    console.error("Failed to load user analytics", err);
                    setUserAnalytics(null);
                });
        }
    }, [selectedUser]);

    const viewFullAnalytics = () => {
        navigate(`/trainers/client/${selectedUser.id}/analytics`, { state: { fromAdmin: true } });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersRes, trainersRes, postsRes, pendingVerRes, metricsRes] = await Promise.all([
                apiClient.get("/admin/users"),
                apiClient.get("/admin/trainers"),
                apiClient.get("/blog/posts?category=All"),
                getPendingVerifications(),
                getSystemMetrics()
            ]);
            setUsers(usersRes.data.filter(u => u.role !== 'ROLE_ADMIN'));
            setTrainers(trainersRes.data);
            setPosts(postsRes.data);
            setPendingTrainerVerifications(pendingVerRes.data || []);
            if (metricsRes.data) {
                setMetrics(metricsRes.data);
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            if (error.response && error.response.status === 403) {
                alert("Access Denied");
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // -- Action Handlers --

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await apiClient.delete(`/admin/users/${userId}`);
            const userToDelete = users.find(u => u.id === userId);
            setUsers(users.filter(u => u.id !== userId));
            if (userToDelete) {
                setTrainers(trainers.filter(t => t.email !== userToDelete.email));
            }
            // Close modal if deleted user is currently viewed
            if (selectedUser?.id === userId) setSelectedUser(null);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        }
    };

    const handleDeleteTrainer = async (trainerId, trainerEmail) => {
        if (!window.confirm("Are you sure you want to delete this trainer? This will also delete their User account.")) return;
        try {
            await apiClient.delete(`/admin/trainers/${trainerId}`);
            setTrainers(trainers.filter(t => t.id !== trainerId));
            setUsers(users.filter(u => u.email !== trainerEmail));
            if (selectedUser?.email === trainerEmail) setSelectedUser(null);
        } catch (error) {
            console.error("Error deleting trainer:", error);
            alert("Failed to delete trainer.");
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await apiClient.delete(`/blog/posts/${postId}`);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (error) {
            console.error("Error deleting post:", error);
            alert("Failed to delete post.");
        }
    };

    const handleVerifyUser = async (userId) => {
        try {
            await apiClient.put(`/admin/users/${userId}/verify`);
            setUsers(users.map(u => {
                if (u.id === userId) {
                    return { ...u, isVerified: !u.isVerified, verified: !u.isVerified, verificationRequested: false };
                }
                return u;
            }));
            // Update modal if open
            if (selectedUser?.id === userId) {
                setSelectedUser(prev => ({ ...prev, verified: !prev.verified, verificationRequested: false }));
            }
        } catch (error) {
            console.error("Error verifying user:", error);
            alert("Failed to update verification status.");
        }
    };

    const handleTogglePremium = async (userId) => {
        try {
            const res = await toggleUserPremium(userId);
            setUsers(users.map(u => u.id === userId ? { ...u, isPremium: res.data.isPremium } : u));
        } catch (error) {
            console.error("Error toggling premium:", error);
            alert("Failed to update premium status.");
        }
    };

    const handleToggleSuspension = async (userId) => {
        try {
            const res = await toggleUserSuspension(userId);
            setUsers(users.map(u => u.id === userId ? { ...u, isSuspended: res.data.isSuspended } : u));
        } catch (error) {
            console.error("Error toggling suspension:", error);
            alert("Failed to update suspension status.");
        }
    };

    const handleVerifyTrainer = async (trainerId) => {
        try {
            await verifyTrainer(trainerId);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to verify trainer.');
        }
    };

    const handleRejectTrainer = async (trainerId) => {
        try {
            await rejectTrainerVerification(trainerId);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to reject trainer.');
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastData.title || !broadcastData.message) {
            alert("Title and Message are required");
            return;
        }
        
        try {
            setIsBroadcasting(true);
            const response = await apiClient.post("/admin/notifications/broadcast", broadcastData);
            
            // Handle both 200 and 202 Accepted
            if (response.status === 202 || response.status === 200) {
                alert(`Success! Your industry-ready broadcast has been queued and is pushing to ${broadcastData.target === 'ALL' ? 'all devices' : broadcastData.target} in the background. 📢🚀`);
                setBroadcastData({ title: "", message: "", type: "INFO", target: "ALL" });
            }
        } catch (error) {
            console.error("Error broadcasting:", error);
            const errorMsg = error.response?.data?.message || error.response?.data || "Check your connection or permissions.";
            alert(`Failed to send broadcast: ${errorMsg}`);
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout();
        } else {
            await storageService.clearAuth();
            navigate('/login');
        }
    };

    // -- Data Filtering --

    const getDisplayData = () => {
        let data = [];
        if (activeTab === 'all') data = users;
        else if (activeTab === 'users') data = users.filter(u => u.role === 'ROLE_USER');
        else if (activeTab === 'trainers') data = trainers;
        else if (activeTab === 'verification') data = users.filter(u => u.verificationRequested || u.verified);
        else if (activeTab === 'posts') data = posts;
        else if (activeTab === 'broadcast') data = []; // No list for broadcast tab

        // Advanced Filters
        if (activeTab === 'users' || activeTab === 'trainers') {
            if (filterStatus !== 'ALL') {
                data = data.filter(u => filterStatus === 'SUSPENDED' ? u.isSuspended : !u.isSuspended);
            }
            if (activeTab === 'users' && filterTier !== 'ALL') {
                data = data.filter(u => filterTier === 'PREMIUM' ? u.isPremium : !u.isPremium);
            }
        }

        // Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return data.filter(item => {
                // Determine fields to search based on item type
                if (activeTab === 'posts') {
                    return item.title?.toLowerCase().includes(lowerSearch) ||
                        item.author?.toLowerCase().includes(lowerSearch);
                }
                return item.name?.toLowerCase().includes(lowerSearch) ||
                    item.email?.toLowerCase().includes(lowerSearch);
            });
        }
        return data;
    };

    const displayData = getDisplayData();

    // -- Renders --

    const NavItem = ({ id, icon: Icon, label }) => (
        <button
            className={`admin-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
        >
            <Icon className="nav-icon" />
            <span>{label}</span>
            {activeTab === id && <FiChevronRight className="nav-arrow" />}
        </button>
    );

    return (
        <div className="admin-layout">
            <div
                className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="admin-brand">
                        <img src={logo} alt="Wellnest" style={{ width: '32px', height: '32px' }} />
                        <h2>Wellnest</h2>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <ThemeToggle />
                    </div>
                    <button className="mobile-close" onClick={() => setIsSidebarOpen(false)}>
                        <FiX />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group">
                        <p className="nav-label">Overview</p>
                        <NavItem id="all" icon={FiGrid} label="Dashboard" />
                        <NavItem id="users" icon={FiUsers} label="Users" />
                        <NavItem id="trainers" icon={FiUserCheck} label="Trainers" />
                    </div>

                    <div className="nav-group">
                        <p className="nav-label">Management</p>
                        <NavItem id="premium" icon={FiAward} label="Premium Control" />
                        <NavItem id="verification" icon={FiShield} label="User Verifications" />
                        <NavItem id="trainerVerification" icon={FiCheckCircle} label={`Cert Reviews ${pendingTrainerVerifications.length > 0 ? `(${pendingTrainerVerifications.length})` : ''}`} />
                        <NavItem id="posts" icon={FiFileText} label="Community Posts" />
                        <NavItem id="broadcast" icon={FiBell} label="Broadcast Alerts" />
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => navigate('/community')} className="logout-btn-full secondary">
                        <FiGlobe /> <span>View Community</span>
                    </button>
                    <button onClick={handleLogout} className="logout-btn-full">
                        <FiLogOut /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
                        <FiList />
                    </button>
                    <div className="admin-brand mobile">
                        <img src={logo} alt="Wellnest" style={{ width: '28px', height: '28px' }} />
                        <h2 style={{ fontSize: '20px', margin: 0 }}>Wellnest</h2>
                    </div>
                </header>

                <div className="admin-content-wrapper">

                    {/* Header Section */}
                    <div className="content-header">
                        <div>
                            <h1>{activeTab === 'all' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                            <p className="subtitle">Manage your application data and users</p>
                        </div>

                        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {(activeTab === 'users' || activeTab === 'trainers') && (
                                <>
                                    <select 
                                        className="admin-input-modern"
                                        style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="ALL">Status: All</option>
                                        <option value="ACTIVE">Status: Active</option>
                                        <option value="SUSPENDED">Status: Suspended</option>
                                    </select>
                                    {activeTab === 'users' && (
                                    <select 
                                        className="admin-input-modern"
                                        style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}
                                        value={filterTier}
                                        onChange={(e) => setFilterTier(e.target.value)}
                                    >
                                        <option value="ALL">Tier: All</option>
                                        <option value="PREMIUM">Tier: Premium</option>
                                        <option value="FREE">Tier: Free</option>
                                    </select>
                                    )}
                                </>
                            )}
                            <div className="search-box">
                                <FiSearch />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Broadcast Panel */}
                    {activeTab === 'broadcast' && (
                        <div className="admin-broadcast-container" style={{ maxWidth: '800px' }}>
                            <div className="data-card" style={{ padding: '32px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <h2 style={{ margin: '0 0 8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FiBell style={{ color: 'var(--primary)' }} /> Targeted Broadcast
                                    </h2>
                                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                        Send real-time alerts to specific segments of your user base. Use this for VIP updates, community news, or system maintenance.
                                    </p>
                                </div>

                                <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)' }}>Alert Title</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. System Maintenance" 
                                            value={broadcastData.title}
                                            onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                                            className="admin-input-modern"
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)' }}>Message Content</label>
                                        <textarea 
                                            placeholder="Enter the announcement message here..." 
                                            rows="4"
                                            value={broadcastData.message}
                                            onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                                            className="admin-input-modern"
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) auto', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)' }}>Alert Type</label>
                                            <select 
                                                value={broadcastData.type}
                                                onChange={(e) => setBroadcastData({...broadcastData, type: e.target.value})}
                                                className="admin-input-modern"
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}
                                            >
                                                <option value="INFO">Information (Blue)</option>
                                                <option value="SUCCESS">Goal/Achievement (Green)</option>
                                                <option value="ALERT">Warning/Urgent (Red)</option>
                                                <option value="COMMUNITY">Community News (Purple)</option>
                                            </select>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-main)' }}>Target Audience</label>
                                            <select 
                                                value={broadcastData.target}
                                                onChange={(e) => setBroadcastData({...broadcastData, target: e.target.value})}
                                                className="admin-input-modern"
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-main)' }}
                                            >
                                                <option value="ALL">🌎 All Users</option>
                                                <option value="PREMIUM">👑 Premium VIPs</option>
                                                <option value="FREE">🆓 Free Users</option>
                                                <option value="TRAINERS">🏋️ Certified Trainers</option>
                                            </select>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button 
                                                type="submit" 
                                                className="primary-btn" 
                                                disabled={isBroadcasting}
                                                style={{ width: '100%', padding: '14px 28px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                            >
                                                {isBroadcasting ? (
                                                    <>Sending...</>
                                                ) : (
                                                    <>
                                                        <FiBell /> Launch Broadcast
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Premium Management Dedicated UI */}
                    {activeTab === 'premium' && (
                        <div className="premium-management-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="data-card" style={{ padding: '32px' }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)', marginTop: 0, marginBottom: '8px' }}>
                                        <FiAward color="#fbbf24" size={24} /> VIP Premium Control
                                    </h2>
                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                        Grant or revoke premium status for users. Premium features include advanced AI diagnostics and deep health tracking.
                                    </p>
                                </div>
                                
                                <div className="search-box" style={{ maxWidth: '400px', marginBottom: '32px', border: '1px solid var(--card-border)', padding: '12px 16px', borderRadius: '8px' }}>
                                    <FiSearch style={{ color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-main)', marginLeft: '10px' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                                    {users
                                        .filter(u => (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) && u.role !== 'ROLE_ADMIN')
                                        .map(user => (
                                        <div key={user.id} style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', 
                                            background: user.isPremium ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255, 255, 255, 0.02)', 
                                            borderRadius: '16px', 
                                            border: user.isPremium ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)', 
                                            boxShadow: user.isPremium ? '0 4px 20px rgba(251, 191, 36, 0.1)' : 'none',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '18px', fontWeight: 700, background: user.isPremium ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.1)', color: user.isPremium ? '#fff' : 'var(--text-main)' }}>
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {user.name} {user.isPremium && <span title="Active Premium User" style={{ fontSize: '16px', filter: 'drop-shadow(0px 0px 8px rgba(251,191,36,0.6))' }}>👑</span>}
                                                    </span>
                                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{user.email}</span>
                                                </div>
                                            </div>
                                            
                                            <button
                                                style={{ 
                                                    padding: '8px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s ease',
                                                    background: user.isPremium ? 'transparent' : 'rgba(255, 255, 255, 0.05)', 
                                                    border: user.isPremium ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', 
                                                    color: user.isPremium ? '#f59e0b' : 'var(--text-main)' 
                                                }}
                                                onMouseEnter={(e) => {
                                                    if(!user.isPremium) {
                                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                    } else {
                                                        e.target.style.background = 'rgba(245, 158, 11, 0.1)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if(!user.isPremium) {
                                                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                    } else {
                                                        e.target.style.background = 'transparent';
                                                    }
                                                }}
                                                onClick={() => {
                                                    if(user.isPremium && !window.confirm(`Revoke premium access for ${user.name}?`)) return;
                                                    handleTogglePremium(user.id);
                                                }}
                                            >
                                                {user.isPremium ? 'Revoke VIP' : 'Grant Premium'}
                                            </button>
                                        </div>
                                    ))}
                                    {users.filter(u => (!searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) && u.role !== 'ROLE_ADMIN').length === 0 && (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            <FiUsers size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                            <p>No users found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Row (Only on Overview) */}
                    {activeTab === 'all' && (
                        <div className="stats-grid-modern">
                            <div className="stat-card-modern">
                                <div className="icon-wrapper blue"><FiUsers /></div>
                                <div className="stat-info">
                                    <h3>Total Users</h3>
                                    <p>{users.length}</p>
                                </div>
                            </div>
                            <div className="stat-card-modern">
                                <div className="icon-wrapper green"><FiUserCheck /></div>
                                <div className="stat-info">
                                    <h3>Trainers</h3>
                                    <p>{trainers.length}</p>
                                </div>
                            </div>
                            <div className="stat-card-modern">
                                <div className="icon-wrapper purple"><FiFileText /></div>
                                <div className="stat-info">
                                    <h3>Total Posts</h3>
                                    <p>{posts.length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Trainer Certificate Review Panel */}
                    {activeTab === 'trainerVerification' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 4px', color: 'var(--text-main)' }}>🛡️ Cert Reviews</h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {pendingTrainerVerifications.length} pending request{pendingTrainerVerifications.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {pendingTrainerVerifications.length === 0 ? (
                                <div className="data-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                                    <FiCheckCircle size={48} style={{ color: 'var(--primary)', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                                    <h3 style={{ color: 'var(--text-main)', margin: '0 0 6px' }}>All Clear!</h3>
                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No pending trainer verification requests.</p>
                                </div>
                            ) : (
                                pendingTrainerVerifications.map(trainer => (
                                    <div key={trainer.id} className="data-card" style={{ padding: '24px' }}>
                                        {/* Trainer Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '52px', height: '52px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                                                    color: '#fff', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', fontSize: '22px', fontWeight: 700,
                                                    flexShrink: 0
                                                }}>
                                                    {trainer.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: '0 0 3px', color: 'var(--text-main)', fontSize: '16px' }}>{trainer.name}</h3>
                                                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--text-muted)' }}>{trainer.email}</p>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        {trainer.specialties?.map((s, i) => (
                                                            <span key={i} style={{
                                                                background: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)',
                                                                padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600
                                                            }}>{s}</span>
                                                        ))}
                                                        <span style={{
                                                            background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)',
                                                            padding: '2px 10px', borderRadius: '99px', fontSize: '12px'
                                                        }}>{trainer.experience || 0} yrs exp</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                                <button
                                                    className="primary-btn"
                                                    style={{ padding: '10px 20px', gap: '6px', display: 'flex', alignItems: 'center' }}
                                                    onClick={() => handleVerifyTrainer(trainer.id)}
                                                >
                                                    <FiCheckCircle size={16} /> Approve
                                                </button>
                                                <button
                                                    className="secondary-btn"
                                                    style={{ padding: '10px 20px', gap: '6px', display: 'flex', alignItems: 'center', color: '#ef4444', borderColor: '#ef4444' }}
                                                    onClick={() => handleRejectTrainer(trainer.id)}
                                                >
                                                    <FiXCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ borderTop: '1px solid var(--card-border)', marginBottom: '16px' }} />

                                        {/* Certificates Grid */}
                                        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Submitted Certificates ({[trainer.certificate1, trainer.certificate2, trainer.certificate3].filter(Boolean).length})
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                                            {[trainer.certificate1, trainer.certificate2, trainer.certificate3]
                                                .filter(Boolean)
                                                .map((cert, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setLightboxImage(cert)}
                                                        style={{
                                                            borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                                            border: '2px solid var(--card-border)', aspectRatio: '4/3',
                                                            position: 'relative', background: 'var(--bg-main)',
                                                            transition: 'border-color 0.2s, transform 0.2s',
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    >
                                                        <img
                                                            src={cert}
                                                            alt={`Certificate ${idx + 1}`}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <div style={{
                                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                                            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                                                            color: '#fff', fontSize: '11px', padding: '8px',
                                                            textAlign: 'center', fontWeight: 600
                                                        }}>
                                                            Certificate {idx + 1} · Click to view
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Lightbox Modal for Certificate Images */}
                    {lightboxImage && (
                        <div
                            onClick={() => setLightboxImage(null)}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 9999,
                                background: 'rgba(0,0,0,0.85)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', padding: '20px'
                            }}
                        >
                            <button
                                onClick={() => setLightboxImage(null)}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '50%', width: '40px', height: '40px', color: '#fff',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <FiX size={20} />
                            </button>
                            <img
                                src={lightboxImage}
                                alt="Certificate"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    maxWidth: '90vw', maxHeight: '90vh',
                                    borderRadius: '16px', objectFit: 'contain',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                                }}
                            />
                        </div>
                    )}

                    {/* Analytics Overview Dashboard */}
                    {activeTab === 'all' && (
                        <div className="analytics-overview-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Top Stats Row */}
                            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                <div className="stat-card modern" style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Platform Users</h3>
                                    <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FiUsers /> {metrics.totalUsers}
                                    </div>
                                </div>
                                <div className="stat-card modern" style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Premium VIPs</h3>
                                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FiAward /> {metrics.premiumUsers}
                                    </div>
                                </div>
                                <div className="stat-card modern" style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Tokens Consumed</h3>
                                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FiActivity /> {metrics.totalTokens.toLocaleString()}
                                    </div>
                                </div>
                                <div className="stat-card modern" style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Certified Trainers</h3>
                                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FiUserCheck /> {metrics.totalTrainers}
                                    </div>
                                </div>
                            </div>

                            {/* Global Config & Charts */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                                {/* Global AI Kill-Switch */}
                                <div className="data-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                                        <div>
                                            <h2 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <FiShield color={metrics.aiEnabled ? '#10b981' : '#ef4444'} /> Global AI System {metrics.aiEnabled ? "(ONLINE)" : "(HALTED)"}
                                            </h2>
                                            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
                                                Emergency kill-switch. When toggled off, all outgoing API queries to groq/llama are halted system-wide. Features will fallback to predefined static templates instantly.
                                            </p>
                                        </div>
                                        <label className="switch" style={{ flexShrink: 0 }}>
                                            <input type="checkbox" checked={metrics.aiEnabled} onChange={async (e) => {
                                                const newVal = e.target.checked;
                                                setMetrics(prev => ({ ...prev, aiEnabled: newVal }));
                                                try {
                                                    await toggleGlobalAi(newVal);
                                                } catch(err) {
                                                    console.error(err);
                                                    setMetrics(prev => ({ ...prev, aiEnabled: !newVal })); // Revert on failure
                                                }
                                            }} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>

                                {/* Demographics Chart */}
                                <div className="data-card" style={{ padding: '32px' }}>
                                    <h2 style={{ margin: '0 0 20px', color: 'var(--text-main)' }}>Platform Demographics</h2>
                                    <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
                                        <Doughnut 
                                            options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                                            data={{
                                                labels: ['VIP Premium', 'Free Users', 'Trainers'],
                                                datasets: [{
                                                    data: [metrics.premiumUsers, Math.max(0, metrics.totalUsers - metrics.premiumUsers), metrics.totalTrainers],
                                                    backgroundColor: ['#fbbf24', '#3b82f6', '#10b981'],
                                                    borderColor: ['var(--card-bg)', 'var(--card-bg)', 'var(--card-bg)'],
                                                    borderWidth: 2,
                                                }]
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Table Card */}
                    {activeTab !== 'all' && activeTab !== 'trainerVerification' && activeTab !== 'broadcast' && activeTab !== 'premium' && (
                    <div className="data-card">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading data...</p>
                            </div>
                        ) : (
                            <div className="table-responsive-modern">
                                <table className="admin-table-modern">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            {activeTab === 'posts' ? (
                                                <>
                                                    <th>Post Title</th>
                                                    <th>Author</th>
                                                    <th>Category</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th>User</th>
                                                    <th>Status</th>
                                                    <th className="details-col">Details</th>
                                                    <th>Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayData.length > 0 ? (
                                            displayData.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="id-col">#{item.id}</td>

                                                    {activeTab === 'posts' ? (
                                                        <>
                                                            <td className="title-col">
                                                                <div className="post-title">{item.title}</div>
                                                                <span className="post-excerpt">{item.excerpt?.substring(0, 40)}...</span>
                                                            </td>
                                                            <td>
                                                                <div className="user-cell">
                                                                    <div className="avatar-circle small">{item.author?.charAt(0)}</div>
                                                                    <span>{item.author}</span>
                                                                </div>
                                                            </td>
                                                            <td><span className="badge-modern neutral">{item.category}</span></td>
                                                            <td>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</td>
                                                            <td>
                                                                <button
                                                                    className="icon-btn delete"
                                                                    onClick={() => handleDeletePost(item.id)}
                                                                    title="Delete Post"
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>
                                                                <div className="user-info-cell">
                                                                    <div className="avatar-circle">{item.name?.charAt(0)}</div>
                                                                    <div>
                                                                        <span className="name-text">
                                                                            {item.name}
                                                                            {item.isPremium && <span title="Premium User" style={{marginLeft: '6px', fontSize: '14px', filter: 'drop-shadow(0px 2px 4px rgba(255,215,0,0.4))'}}>👑</span>}
                                                                        </span>
                                                                        <span className="email-text">{item.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {item.isSuspended ? (
                                                                    <span className="status-indicator pending" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>
                                                                        <span className="dot" style={{backgroundColor: '#ef4444'}}></span> Suspended
                                                                    </span>
                                                                ) : (item.verified || item.isVerified) ? (
                                                                    <span className="status-indicator verified">
                                                                        <span className="dot"></span> Verified
                                                                    </span>
                                                                ) : item.verificationRequested ? (
                                                                    <span className="status-indicator pending">
                                                                        <span className="dot"></span> Pending
                                                                    </span>
                                                                ) : (
                                                                    <span className="status-indicator unverified">
                                                                        Unverified
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="details-col">
                                                                {activeTab === 'trainers' ? (
                                                                    <span className="detail-pill">{item.specialties?.[0] || 'Trainer'}</span>
                                                                ) : (
                                                                    <span className="detail-pill">{item.fitnessGoal?.replace(/_/g, ' ') || 'User'}</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="action-row">
                                                                    <button className="icon-btn view" onClick={() => setSelectedUser(item)} title="View Details">
                                                                        <FiActivity />
                                                                    </button>

                                                                    {activeTab === 'verification' && (
                                                                        <button
                                                                            className={`icon-btn ${item.verified ? 'warning' : 'success'}`}
                                                                            onClick={() => handleVerifyUser(item.id)}
                                                                            title={item.verified ? "Revoke" : "Approve"}
                                                                        >
                                                                            {item.verified ? <FiX /> : <FiUserCheck />}
                                                                        </button>
                                                                    )}

                                                                    <button 
                                                                        className={`icon-btn ${item.isSuspended ? 'success' : 'delete'}`} 
                                                                        onClick={() => handleToggleSuspension(item.id)} 
                                                                        title={item.isSuspended ? "Unsuspend User" : "Suspend User (Ban)"}
                                                                    >
                                                                        <FiShield />
                                                                    </button>

                                                                    <button
                                                                        className="icon-btn delete"
                                                                        onClick={() => item.role === 'ROLE_TRAINER' ? handleDeleteTrainer(item.id, item.email) : handleDeleteUser(item.id)}
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <FiTrash2 />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="empty-state">
                                                    <div className="empty-content">
                                                        <FiSearch />
                                                        <p>No results found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </main >

            {/* User Detail Modal */}
            {
                selectedUser && (
                    <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                        <div className="modal-panel" onClick={e => e.stopPropagation()}>
                            <div className="modal-header-modern">
                                <div className="user-header-info">
                                    <div className="avatar-circle large">{selectedUser.name?.charAt(0)}</div>
                                    <div>
                                        <h2>{selectedUser.name}</h2>
                                        <p>{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button className="close-btn" onClick={() => setSelectedUser(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Role</label>
                                        <p>{selectedUser.role?.replace('ROLE_', '')}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Status</label>
                                        <p className={(selectedUser.verified || selectedUser.isVerified) ? 'text-success' : ''}>
                                            {(selectedUser.verified || selectedUser.isVerified) ? 'Verified' : 'Unverified'}
                                        </p>
                                    </div>
                                    <div className="info-item">
                                        <label>Phone</label>
                                        <p>{selectedUser.phone || 'N/A'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Gender</label>
                                        <p>{selectedUser.gender || 'N/A'}</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Age & BMI</label>
                                        <p>{selectedUser.age || '-'} yrs</p>
                                    </div>
                                    <div className="info-item">
                                        <label>Dimensions</label>
                                        <p>{selectedUser.heightCm ? `${selectedUser.heightCm}cm / ${selectedUser.weightKg}kg` : 'N/A'}</p>
                                    </div>
                                </div>

                                {userAnalytics && (
                                    <div className="analytics-preview">
                                        <h3>Quick Stats</h3>
                                        <div className="stats-row">
                                            <div className="mini-stat">
                                                <span>Workouts</span>
                                                <strong>{userAnalytics.workoutAnalytics?.totalWorkouts || 0}</strong>
                                            </div>
                                            <div className="mini-stat">
                                                <span>Calories (Avg)</span>
                                                <strong>{userAnalytics.nutritionAnalytics?.avgDailyCalories?.toFixed(0) || 0}</strong>
                                            </div>
                                            <div className="mini-stat">
                                                <span>Streak</span>
                                                <strong>{userAnalytics.streak || 0} 🔥</strong>
                                            </div>
                                        </div>
                                        <button className="view-full-btn" onClick={viewFullAnalytics}>
                                            View Full Analytics <FiActivity />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
