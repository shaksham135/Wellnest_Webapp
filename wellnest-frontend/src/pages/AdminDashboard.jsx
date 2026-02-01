import React, { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { FiUsers, FiTrash2, FiActivity, FiUserCheck, FiLogOut, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getClientAnalytics } from "../api/trainerApi";

import "./AdminDashboard.css";

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("all"); // 'all', 'users', 'trainers', 'verification', 'posts'
    const [users, setUsers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (selectedUser) {
            setUserAnalytics(null); // Reset
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, trainersRes, postsRes] = await Promise.all([
                apiClient.get("/admin/users"),
                apiClient.get("/admin/trainers"),
                apiClient.get("/blog/posts?category=All") // Fetch all posts
            ]);
            setUsers(usersRes.data);
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
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        try {
            await apiClient.delete(`/admin/users/${userId}`);
            // Remove from users list
            const userToDelete = users.find(u => u.id === userId);
            setUsers(users.filter(u => u.id !== userId));

            // If this user was a trainer, remove from trainers list too (by email match as fallback)
            if (userToDelete) {
                setTrainers(trainers.filter(t => t.email !== userToDelete.email));
            }
            alert("User deleted successfully.");
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
            // Also remove from users list by email
            setUsers(users.filter(u => u.email !== trainerEmail));
            alert("Trainer deleted successfully.");
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
            alert("Post deleted successfully.");
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
            alert("User verification status updated.");
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

    const getDisplayData = () => {
        if (activeTab === 'all') return users;
        if (activeTab === 'users') return users.filter(u => u.role === 'ROLE_USER');
        if (activeTab === 'verification') return users.filter(u => u.verificationRequested || u.verified);
        return trainers;
    };

    const displayData = getDisplayData();



    const handleViewDetails = (user) => {
        setSelectedUser(user);
    };

    const closeDetails = () => {
        setSelectedUser(null);
    };

    return (
        <div className="admin-dashboard-container">
            {/* ... Header and Stats ... */}
            <div className="admin-header">
                <h1 className="admin-title">Admin <span>Dashboard</span></h1>
                <button onClick={handleLogout} className="logout-btn">
                    <FiLogOut style={{ marginRight: '8px' }} /> Logout
                </button>
            </div>

            <div className="stats-grid">
                {/* ... stats ... */}
                <div className="statCard">
                    <div className="stat-icon-box" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Accounts</p>
                        <h3 className="statValue">{users.length}</h3>
                    </div>
                </div>

                <div className="statCard">
                    <div className="stat-icon-box" style={{ background: '#DCFCE7', color: '#22C55E' }}>
                        <FiUserCheck />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Trainers</p>
                        <h3 className="statValue">
                            {users.filter(u => u.role === 'ROLE_TRAINER').length}
                        </h3>
                    </div>
                </div>

                <div className="statCard">
                    <div className="stat-icon-box" style={{ background: '#F3E8FF', color: '#A855F7' }}>
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Normal Users</p>
                        <h3 className="statValue">
                            {users.filter(u => u.role === 'ROLE_USER').length}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Accounts
                </button>
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Normal Users
                </button>
                <button
                    className={`tab-btn ${activeTab === 'trainers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trainers')}
                >
                    Trainers List
                </button>
                <button
                    className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
                    onClick={() => setActiveTab('verification')}
                >
                    Verified Users
                </button>
                <button
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    Community Posts
                </button>
            </div>

            {/* Content Area */}
            <div className="content-card">
                {loading ? (
                    <p className="state-message">Loading data...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    {activeTab === 'posts' ? (
                                        <>
                                            <th>Title</th>
                                            <th>Author</th>
                                            <th>Category</th>
                                            <th>Date</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>Name</th>
                                            <th>Email</th>
                                            {activeTab === 'verification' ? (
                                                <>
                                                    <th>Role</th>
                                                    <th>Status</th>
                                                </>
                                            ) : (
                                                <th>{activeTab === 'trainers' ? 'Specialties' : 'Goal'}</th>
                                            )}
                                            {activeTab !== 'verification' && activeTab !== 'trainers' && <th>Role</th>}
                                        </>
                                    )}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeTab === 'posts' ? posts : displayData).map(item => (
                                    <tr key={item.id}>
                                        <td>#{item.id}</td>
                                        {activeTab === 'posts' ? (
                                            <>
                                                <td><div style={{ fontWeight: '500', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div></td>
                                                <td>{item.author}</td>
                                                <td><span className="badge badge-user" style={{ background: '#e0f2fe', color: '#0369a1' }}>{item.category}</span></td>
                                                <td>{item.date}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => handleDeletePost(item.id)}
                                                            className="action-btn btn-delete"
                                                            title="Delete Post"
                                                        >
                                                            <FiTrash2 /> <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                </td>
                                                <td>{item.email}</td>
                                                {activeTab === 'verification' ? (
                                                    <>
                                                        <td>
                                                            <span className={item.role === 'ROLE_TRAINER' ? "badge badge-trainer" : "badge badge-user"}>
                                                                {item.role === 'ROLE_TRAINER' ? 'TRAINER' : 'USER'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {item.verified ? (
                                                                <span className="badge badge-verified">Verified</span>
                                                            ) : item.verificationRequested ? (
                                                                <span className="badge badge-pending">Pending</span>
                                                            ) : (
                                                                <span className="badge badge-unverified">Unverified</span>
                                                            )}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td>
                                                        {activeTab === 'trainers'
                                                            ? (Array.isArray(item.specialties) ? item.specialties.join(', ') : item.specialties)
                                                            : (item.fitnessGoal || 'N/A')
                                                        }
                                                    </td>
                                                )}

                                                {activeTab !== 'verification' && activeTab !== 'trainers' && (
                                                    <td>
                                                        <span className={item.role === 'ROLE_TRAINER' ? "badge badge-trainer" : "badge badge-user"}>
                                                            {item.role === 'ROLE_TRAINER' ? 'TRAINER' : 'USER'}
                                                        </span>
                                                    </td>
                                                )}

                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button
                                                                onClick={() => handleViewDetails(item)}
                                                                className="action-btn btn-detail"
                                                                title="View Details"
                                                            >
                                                                <FiActivity /> <span>Details</span>
                                                            </button>

                                                            {activeTab === 'verification' && (
                                                                <button
                                                                    onClick={() => handleVerifyUser(item.id)}
                                                                    className={`action-btn ${item.verified ? 'btn-revoke' : 'btn-verify'}`}
                                                                    title={item.verified ? "Revoke Verification" : "Verify User"}
                                                                >
                                                                    {item.verified ? <><FiX /> <span>Revoke</span></> : <><FiUserCheck /> <span>Verify</span></>}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    if (activeTab === 'trainers') {
                                                                        handleDeleteTrainer(item.id, item.email);
                                                                    } else {
                                                                        handleDeleteUser(item.id);
                                                                    }
                                                                }}
                                                                className="action-btn btn-delete"
                                                                title={activeTab === 'trainers' ? "Delete Trainer" : "Delete User"}
                                                            >
                                                                <FiTrash2 /> <span>Delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {(activeTab === 'posts' ? posts : displayData).length === 0 && (
                                    <tr>
                                        <td colSpan={activeTab === 'posts' ? "5" : "6"} className="state-message">No data found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedUser && (
                <div className="modal-backdrop open" onClick={closeDetails}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>User Details</h2>
                            <button onClick={closeDetails} className="ghost-btn" style={{ fontSize: '24px', padding: '4px' }}>
                                <FiX />
                            </button>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">{selectedUser.name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{selectedUser.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Role</span>
                                <span className="detail-value">{selectedUser.role}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">{selectedUser.phone || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Gender</span>
                                <span className="detail-value">{selectedUser.gender || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Age</span>
                                <span className="detail-value">{selectedUser.age || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Height</span>
                                <span className="detail-value">{selectedUser.heightCm ? `${selectedUser.heightCm} cm` : 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Weight</span>
                                <span className="detail-value">{selectedUser.weightKg ? `${selectedUser.weightKg} kg` : 'N/A'}</span>
                            </div>
                            <div className="detail-item full-width">
                                <span className="detail-label">Fitness Goal</span>
                                <span className="detail-value">{selectedUser.fitnessGoal?.replace(/_/g, ' ') || 'N/A'}</span>
                            </div>
                            {selectedUser.role === 'ROLE_TRAINER' && (
                                <div className="detail-item full-width">
                                    <span className="detail-label">Specialties</span>
                                    <span className="detail-value">
                                        {Array.isArray(selectedUser.specialties) ? selectedUser.specialties.join(', ') : selectedUser.specialties || 'N/A'}
                                    </span>
                                </div>
                            )}
                        </div>


                        <div className="section-divider">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 className="section-title" style={{ margin: 0 }}>Analytics Overview</h3>
                                <button
                                    onClick={viewFullAnalytics}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    View Full Details <FiActivity />
                                </button>
                            </div>
                            <div className="mini-analytics-grid">
                                <div className="mini-stat-card">
                                    <div className="mini-stat-value">
                                        {userAnalytics?.workoutAnalytics?.totalWorkouts || 0}
                                    </div>
                                    <div className="mini-stat-label">Workouts</div>
                                </div>
                                <div className="mini-stat-card">
                                    <div className="mini-stat-value">
                                        {userAnalytics?.nutritionAnalytics?.avgDailyCalories?.toFixed(0) || 0}
                                    </div>
                                    <div className="mini-stat-label">Calories</div>
                                </div>
                                <div className="mini-stat-card">
                                    <div className="mini-stat-value">
                                        {userAnalytics?.streak || 0}
                                    </div>
                                    <div className="mini-stat-label">Streak</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
