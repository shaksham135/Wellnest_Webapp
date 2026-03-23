import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../api/apiClient";
import {
    FiUsers, FiTrash2, FiActivity, FiUserCheck, FiLogOut, FiX,
    FiGrid, FiList, FiFileText, FiShield, FiSearch, FiChevronRight, FiGlobe, FiCheckCircle, FiXCircle, FiBell
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getClientAnalytics, getPendingVerifications, verifyTrainer, rejectTrainerVerification } from "../api/trainerApi";
import ThemeToggle from "../components/ThemeToggle";
import storageService from "../api/storageService";
import logo from "../assets/logo.png";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [users, setUsers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [pendingTrainerVerifications, setPendingTrainerVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Broadcast State
    const [broadcastData, setBroadcastData] = useState({ title: "", message: "", type: "INFO" });
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
            const [usersRes, trainersRes, postsRes, pendingVerRes] = await Promise.all([
                apiClient.get("/admin/users"),
                apiClient.get("/admin/trainers"),
                apiClient.get("/blog/posts?category=All"),
                getPendingVerifications()
            ]);
            setUsers(usersRes.data.filter(u => u.role !== 'ROLE_ADMIN'));
            setTrainers(trainersRes.data);
            setPosts(postsRes.data);
            setPendingTrainerVerifications(pendingVerRes.data || []);
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
            await apiClient.post("/admin/notifications/broadcast", broadcastData);
            alert("Notification broadcasted successfully to all users! 📢");
            setBroadcastData({ title: "", message: "", type: "INFO" });
        } catch (error) {
            console.error("Error broadcasting:", error);
            alert("Failed to send broadcast. Check your connection or permissions.");
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleLogout = async () => {
        await storageService.clearAuth();
        window.location.href = '/login';
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
                        <NavItem id="verification" icon={FiShield} label="User Verifications" />
                        <NavItem id="trainerVerification" icon={FiCheckCircle} label={`Cert Reviews ${pendingTrainerVerifications.length > 0 ? `(${pendingTrainerVerifications.length})` : ''}`} />
                        <NavItem id="posts" icon={FiFileText} label="Community Posts" />
                        <NavItem id="broadcast" icon={FiBell} label="Broadcast Alerts" />
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => window.location.href = '/community'} className="logout-btn-full secondary">
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

                        <div className="header-actions">
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
                                        <FiBell style={{ color: 'var(--primary)' }} /> Broadcast Announcement
                                    </h2>
                                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                        Send a real-time notification to every user on the platform. Use this for important updates, maintenance, or community news.
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

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button 
                                                type="submit" 
                                                className="primary-btn" 
                                                disabled={isBroadcasting}
                                                style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                            >
                                                {isBroadcasting ? (
                                                    <>Sending...</>
                                                ) : (
                                                    <>
                                                        <FiBell /> Push to All Users
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
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

                    {/* Data Table Card */}
                    {activeTab !== 'trainerVerification' && (
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
                                                                        <span className="name-text">{item.name}</span>
                                                                        <span className="email-text">{item.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {(item.verified || item.isVerified) ? (
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
                                                                        className="icon-btn delete"
                                                                        onClick={() => item.role === 'ROLE_TRAINER' ? handleDeleteTrainer(item.id, item.email) : handleDeleteUser(item.id)}
                                                                        title="Delete"
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
