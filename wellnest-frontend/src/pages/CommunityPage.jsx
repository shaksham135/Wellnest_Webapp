import React, { useState, useEffect } from 'react';
import { FiPlus, FiRefreshCw, FiLock } from 'react-icons/fi';
import CommunityPost from '../components/CommunityPost';
import CreatePostModal from '../components/CreatePostModal';
import { getPosts, createPost, updatePost } from '../api/blogApi';

const CommunityPage = () => {
    const [posts, setPosts] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [createError, setCreateError] = useState('');
    const [editingPost, setEditingPost] = useState(null); // Track post being edited

    // Check if user is logged in
    const isLoggedIn = !!localStorage.getItem('token');

    // Get User Role
    const getUserRole = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.role;
        } catch (e) {
            return null;
        }
    };
    const userRole = getUserRole();
    // Only 'ROLE_USER' can post. Admins and Trainers cannot.
    const canCreatePost = isLoggedIn && userRole === 'ROLE_USER';

    const fetchPosts = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch all posts (pass 'All' to get everything)
            const response = await getPosts('All');
            const allPosts = response.data || [];

            // Community posts are those from regular Users
            // If Admin posts with isCommunity=true, backend might help distinguish.
            // For now, filtering by 'User' role is the existing logic.
            // Note: createPost logic now ensures community posts are tagged 'User' role if forced.
            const communityPosts = allPosts.filter(post => post.role === 'User' || post.category === 'Community');

            setPosts(communityPosts);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load community posts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleCreateOrUpdatePost = async (postData) => {
        setCreateError('');
        try {
            if (editingPost) {
                await updatePost(editingPost.id, postData);
            } else {
                await createPost(postData);
            }
            fetchPosts();
            setShowCreateModal(false);
            setEditingPost(null);
        } catch (err) {
            console.error('Error saving post:', err);
            if (err.response?.status === 403 || err.response?.status === 401) {
                setCreateError('Your session has expired. Please log in again.');
            } else {
                setCreateError(editingPost ? 'Failed to update post.' : 'Failed to create post.');
            }
        }
    };

    const handleNewPostClick = () => {
        if (!isLoggedIn) {
            alert('Please log in to create a post.');
            return;
        }
        setEditingPost(null);
        setCreateError('');
        setShowCreateModal(true);
    };

    const handleEditClick = (post) => {
        setEditingPost(post);
        setCreateError('');
        setShowCreateModal(true);
    };

    // Sorting Logic
    const sortedPosts = [...posts].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt); // Handle mismatching date fields if any
        const dateB = new Date(b.date || b.createdAt);
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        return 0;
    });

    return (
        <div className="blog-page" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
            <div className="blog-header" style={{ maxWidth: '680px', margin: '0 auto', padding: '30px 0 20px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Community Feed</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Connect with the community.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="ghost-btn"
                        onClick={fetchPosts}
                        disabled={loading}
                        title="Refresh feed"
                        style={{ background: 'var(--card-bg)' }}
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </button>
                    {canCreatePost && (
                        <button
                            className="primary-btn"
                            style={{ width: 'auto' }}
                            onClick={handleNewPostClick}
                            title="Create a new post"
                        >
                            <FiPlus /> New Post
                        </button>
                    )}
                </div>
            </div>

            {/* Sorting Dropdown */}
            <div style={{ maxWidth: '680px', margin: '0 auto 24px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <label style={{ marginRight: 10, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Sort By:</label>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="role-select"
                    style={{ width: 'auto', minWidth: 160, display: 'inline-block', background: 'var(--input-bg)', border: '1px solid var(--input-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    maxWidth: '680px', margin: '0 auto 24px',
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#ef4444',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(220, 38, 38, 0.2)'
                }}>
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && posts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <p>Loading community feed...</p>
                </div>
            )}

            {/* Posts Feed */}
            {!loading && posts.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    <h3 style={{ color: 'var(--text-main)' }}>No posts found</h3>
                    <p>Be the first to share your thoughts!</p>
                </div>
            )}

            <div className="community-feed-container" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedPosts.map(post => (
                    <CommunityPost key={post.id} post={post} onRefresh={fetchPosts} onEdit={handleEditClick} />
                ))}
            </div>

            {showCreateModal && (
                <CreatePostModal
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingPost(null);
                    }}
                    onCreate={handleCreateOrUpdatePost}
                    error={createError}
                    initialData={editingPost}
                    isCommunity={true}
                />
            )}
        </div>
    );
};

// Placeholder for the new component import, I will add it to the top imports in the next step or same step if possible.
// I can't add import in this tool call easily without replacing whole file.
// I will use `replace_file_content` to replace the import section separately.

export default CommunityPage;
