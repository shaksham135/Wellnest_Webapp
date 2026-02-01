import React, { useEffect, useState, useCallback } from "react";
import apiClient from "../api/apiClient";
import {
    FiUsers, FiTrash2, FiActivity, FiUserCheck, FiLogOut, FiX,
    FiGrid, FiList, FiFileText, FiShield, FiSearch, FiChevronRight, FiGlobe
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getClientAnalytics } from "../api/trainerApi";
import ThemeToggle from "../components/ThemeToggle";
import logo from "../assets/logo.png";
import "./AdminDashboard.css";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [users, setUsers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // User Detail State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAnalytics, setUserAnalytics] = useState(null);

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
            const [usersRes, trainersRes, postsRes] = await Promise.all([
                apiClient.get("/admin/users"),
                apiClient.get("/admin/trainers"),
                apiClient.get("/blog/posts?category=All")
            ]);
            setUsers(usersRes.data.filter(u => u.role !== 'ROLE_ADMIN'));
            setTrainers(trainersRes.data);
            setPosts(postsRes.data);
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
                    return { ...u, verified: !u.verified, verificationRequested: false };
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        navigate("/login");
    };

    // -- Data Filtering --

    const getDisplayData = () => {
        let data = [];
        if (activeTab === 'all') data = users;
        else if (activeTab === 'users') data = users.filter(u => u.role === 'ROLE_USER');
        else if (activeTab === 'trainers') data = trainers;
        else if (activeTab === 'verification') data = users.filter(u => u.verificationRequested || u.verified);
        else if (activeTab === 'posts') data = posts;

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
                        <NavItem id="verification" icon={FiShield} label="Verifications" />
                        <NavItem id="posts" icon={FiFileText} label="Community Posts" />
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

                    {/* Data Table Card */}
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
                                                    <th>Role</th>
                                                    {activeTab !== 'trainers' && <th>Status</th>}
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
                                                                <span className={`badge-modern ${item.role === 'ROLE_TRAINER' ? 'trainer' : 'user'}`}>
                                                                    {item.role?.replace('ROLE_', '')}
                                                                </span>
                                                            </td>
                                                            {activeTab !== 'trainers' && (
                                                                <td>
                                                                    {item.verified ? (
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
                                                            )}
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
                                        <p className={selectedUser.verified ? 'text-success' : ''}>
                                            {selectedUser.verified ? 'Verified' : 'Unverified'}
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
