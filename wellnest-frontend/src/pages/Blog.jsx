import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import BlogCard from '../components/BlogCard';
import CreatePostModal from '../components/CreatePostModal';
import apiClient from '../api/apiClient';
import { getPosts, createPost } from '../api/blogApi';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createError, setCreateError] = useState('');

    // Check if user is logged in
    const isLoggedIn = !!localStorage.getItem('token');
    // We need to know if user is verified to show button, but token may not have it. 
    // For now, we'll optimistically show it for all logged in users BUT backend will reject if not verified for Articles.
    // OR, better, we only show for Admin/Trainer and rely on backend for Verified Users (they might see a 'Forbidden' error if we hide it? No, if we hide it they can't click).
    // Let's check if we can get verification status. 
    // If not, maybe we should let everyone *see* the button but `handleCreatePost` will fail if they are not verified?
    // User asked "only they are allowed to create". Hiding the button is best UI.
    // Let's assume for now only Admin/Trainer have the button visible, and Verified users... well, if I can't check verification, I might hide it for them too which is safe but maybe not what user wants.
    // Wait, the prompt implies "Verified Users" are a distinct class. 
    // Let's peek at `AuthController` or `Login` response to see if `verified` is sent.

    const [isVerified, setIsVerified] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const checkUserStatus = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await apiClient.get('/users/me');
                    setIsVerified(res.data.isVerified);
                    setUserRole(res.data.role);
                } catch (err) {
                    console.error("Failed to fetch user status", err);
                }
            }
        };
        checkUserStatus();
    }, []);

    // Allow Verified Users, Admins, and Trainers to create articles
    const canCreateArticle = userRole === 'ROLE_ADMIN' || userRole === 'ROLE_TRAINER' || isVerified;

    // ... logic matches ...


    const fetchPosts = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getPosts(filter);
            // Filter for Articles (Admin, Trainer, Verified User)
            const allPosts = response.data || [];
            const articlePosts = allPosts.filter(post =>
                ['Admin', 'Trainer', 'Verified User'].includes(post.role)
            );
            setPosts(articlePosts);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load articles. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleCreatePost = async (newPostData) => {
        setCreateError('');
        try {
            await createPost(newPostData);
            // Re-fetch to apply filter correctly or manually check
            fetchPosts();
            setShowCreateModal(false);
        } catch (err) {
            console.error('Error creating post:', err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                setCreateError('Your session has expired or is invalid. Please log in again.');
            } else {
                setCreateError('Failed to create post. Please try again.');
            }
        }
    };

    const handleNewPostClick = () => {
        if (!isLoggedIn) {
            alert('Please log in to create an article.');
            return;
        }
        setCreateError('');
        setShowCreateModal(true);
    };

    const categories = ['All', 'Nutrition', 'Fitness', 'Mental Wellness', 'Lifestyle'];

    return (
        <div className="blog-page">
            <div className="blog-header">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Articles</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        Expert insights on nutrition, fitness, and wellness.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="ghost-btn"
                        onClick={fetchPosts}
                        disabled={loading}
                        title="Refresh articles"
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </button>
                    {canCreateArticle && (
                        <button
                            className="primary-btn"
                            style={{ width: 'auto', opacity: isLoggedIn ? 1 : 0.7 }}
                            onClick={handleNewPostClick}
                            title="Create a new article"
                        >
                            <FiPlus /> New Article
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Dropdown */}
            <div style={{ marginBottom: 24 }}>
                <label style={{ marginRight: 10, color: 'var(--text-muted)', fontSize: 14 }}>Filter by Topic:</label>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="role-select"
                    style={{ width: 'auto', minWidth: 200, display: 'inline-block' }}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#ef4444',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    border: '1px solid rgba(220, 38, 38, 0.2)'
                }}>
                    {error}
                    <button
                        onClick={fetchPosts}
                        style={{ marginLeft: '12px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: '#dc2626' }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <p>Loading articles...</p>
                </div>
            )}

            {/* Posts Grid */}
            {!loading && posts.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <h3 style={{ color: 'var(--text-main)' }}>No articles found</h3>
                    <p>Check back later for expert content!</p>
                </div>
            )}

            <div className="blog-grid">
                {posts.map(post => (
                    <BlogCard key={post.id} post={post} onRefresh={fetchPosts} />
                ))}
            </div>

            {showCreateModal && (
                <CreatePostModal
                    onClose={() => {
                        setShowCreateModal(false);
                        setCreateError('');
                    }}
                    onCreate={handleCreatePost}
                    error={createError}
                />
            )}
        </div>
    );
};

export default Blog;
