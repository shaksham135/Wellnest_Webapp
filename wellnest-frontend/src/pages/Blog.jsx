import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiLock } from 'react-icons/fi';
import BlogCard from '../components/BlogCard';
import CreatePostModal from '../components/CreatePostModal';
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

    const fetchPosts = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getPosts(filter);
            setPosts(response.data || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load blog posts. Please try again.');
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
            const response = await createPost(newPostData);
            setPosts([response.data, ...posts]);
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
            alert('Please log in to create a blog post.');
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Health Blog</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                        Community insights on nutrition, fitness, and wellness.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="ghost-btn"
                        onClick={fetchPosts}
                        disabled={loading}
                        title="Refresh posts"
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </button>
                    <button
                        className="primary-btn"
                        style={{ width: 'auto', opacity: isLoggedIn ? 1 : 0.7 }}
                        onClick={handleNewPostClick}
                        title={isLoggedIn ? 'Create a new post' : 'Login required'}
                    >
                        {isLoggedIn ? <FiPlus /> : <FiLock />} New Post
                    </button>
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
                    background: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px'
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
                    <p>Loading blog posts...</p>
                </div>
            )}

            {/* Posts Grid */}
            {!loading && posts.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <h3 style={{ color: 'var(--text-main)' }}>No posts found</h3>
                    <p>Be the first to share your health insights!</p>
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
