import React, { useState, useEffect } from 'react';
import CommunityPost from '../components/CommunityPost';
import CreatePostModal from '../components/CreatePostModal';
import { getPosts, createPost, updatePost } from '../api/blogApi';
import SkeletonUI from '../components/common/SkeletonUI';
import PullToRefresh from '../components/common/PullToRefresh';
import BottomSheet from '../components/common/BottomSheet';
import { FiPlus, FiRefreshCw, FiFilter, FiInbox, FiClock, FiCalendar, FiZap } from 'react-icons/fi';
import storageService from '../api/storageService';
import cacheService from '../api/cacheService';

const CommunityPage = ({ isLoggedIn: propIsLoggedIn }) => {
    const cacheKey = '/community/posts';
    const [posts, setPosts] = useState(cacheService.get(cacheKey) || []);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(!cacheService.get(cacheKey));
    const [error, setError] = useState('');
    const [createError, setCreateError] = useState('');
    const [editingPost, setEditingPost] = useState(null); 
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Initial load for user info
    useEffect(() => {
        const init = async () => {
            const token = await storageService.getItem("token");
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    setUserRole(payload.role);
                } catch (e) {}
            }
        };
        init();
    }, []);

    const isLoggedIn = propIsLoggedIn !== undefined ? propIsLoggedIn : !!userRole;
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
            cacheService.set(cacheKey, communityPosts);
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
        if (sortBy === 'trending') {
            const scoreA = (a.likes * 2) + (a.comments?.length || 0);
            const scoreB = (b.likes * 2) + (b.comments?.length || 0);
            return scoreB - scoreA;
        }
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        return 0;
    });

    const getSortLabel = () => {
        if (sortBy === 'trending') return 'Trending Pulse';
        if (sortBy === 'newest') return 'Newest First';
        return 'Oldest First';
    };

    return (
        <PullToRefresh onRefresh={fetchPosts}>
            <div className="blog-page" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
            <div className="blog-header" style={{ maxWidth: '680px', margin: '0 auto', padding: '30px 0 20px' }}>
                <div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.5px' }}>Community Wall</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                        The neural heartbeat of Wellnest.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="ghost-btn"
                        onClick={fetchPosts}
                        disabled={loading}
                        title="Refresh feed"
                        style={{ background: 'var(--card-bg)', width: '48px', height: '48px', borderRadius: '14px' }}
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </button>
                    {canCreatePost && (
                        <button
                            className="primary-btn"
                            style={{ width: 'auto', padding: '0 24px', borderRadius: '14px', fontWeight: 800 }}
                            onClick={handleNewPostClick}
                            title="Create a new post"
                        >
                            <FiPlus /> Share Story
                        </button>
                    )}
                </div>
            </div>

            {/* Sorting Trigger (Mobile Optimized) */}
            <div style={{ maxWidth: '680px', margin: '0 auto 24px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <button 
                    className="ghost-btn" 
                    onClick={() => setIsSortOpen(true)}
                    style={{ 
                        background: 'var(--card-bg)', 
                        gap: '8px', 
                        padding: '10px 20px',
                        border: '1px solid var(--card-border)',
                        color: 'var(--text-main)',
                        fontWeight: 700,
                        borderRadius: '12px',
                        fontSize: '13px'
                    }}
                >
                    <FiFilter /> {getSortLabel()}
                </button>
            </div>

            <BottomSheet 
                isOpen={isSortOpen} 
                onClose={() => setIsSortOpen(false)} 
                title="Neural Sort"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                        className={`sort-option-item ${sortBy === 'trending' ? 'active' : ''}`}
                        onClick={() => { setSortBy('trending'); setIsSortOpen(false); }}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', 
                            borderRadius: '16px', background: sortBy === 'trending' ? 'var(--primary-light)' : 'var(--input-bg)',
                            border: '1px solid', borderColor: sortBy === 'trending' ? 'var(--primary)' : 'var(--card-border)',
                            color: sortBy === 'trending' ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer'
                        }}
                    >
                        <FiZap style={{ fontSize: '20px' }} />
                        <span>Trending Pulse</span>
                    </button>
                    <button 
                        className={`sort-option-item ${sortBy === 'newest' ? 'active' : ''}`}
                        onClick={() => { setSortBy('newest'); setIsSortOpen(false); }}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', 
                            borderRadius: '16px', background: sortBy === 'newest' ? 'var(--primary-light)' : 'var(--input-bg)',
                            border: '1px solid', borderColor: sortBy === 'newest' ? 'var(--primary)' : 'var(--card-border)',
                            color: sortBy === 'newest' ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer'
                        }}
                    >
                        <FiClock style={{ fontSize: '20px' }} />
                        <span>Newest Story</span>
                    </button>
                    <button 
                        className={`sort-option-item ${sortBy === 'oldest' ? 'active' : ''}`}
                        onClick={() => { setSortBy('oldest'); setIsSortOpen(false); }}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', 
                            borderRadius: '16px', background: sortBy === 'oldest' ? 'var(--primary-light)' : 'var(--input-bg)',
                            border: '1px solid', borderColor: sortBy === 'oldest' ? 'var(--primary)' : 'var(--card-border)',
                            color: sortBy === 'oldest' ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: 700, width: '100%', textAlign: 'left', cursor: 'pointer'
                        }}
                    >
                        <FiCalendar style={{ fontSize: '20px' }} />
                        <span>Timeline Origin</span>
                    </button>
                </div>
            </BottomSheet>

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

            {/* Loading State - Skeletons */}
            {loading && posts.length === 0 && (
                <div className="community-feed-container" style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3].map(i => (
                        <SkeletonUI key={i} variant="post" />
                    ))}
                </div>
            )}

            {/* Posts Feed - Empty State */}
            {!loading && posts.length === 0 && !error && (
                <div className="empty-state-container" style={{ maxWidth: '600px', margin: '40px auto' }}>
                    <div className="empty-state-icon">
                        <FiInbox />
                    </div>
                    <h3 className="empty-state-title">No posts yet</h3>
                    <p className="empty-state-text">
                        The community wall is quiet. Be the first to share your health journey or ask a question!
                    </p>
                    {canCreatePost && (
                        <button className="primary-btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={handleNewPostClick}>
                            <FiPlus style={{ marginRight: '8px' }} /> Create First Post
                        </button>
                    )}
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
        </PullToRefresh>
    );
};

// Placeholder for the new component import, I will add it to the top imports in the next step or same step if possible.
// I can't add import in this tool call easily without replacing whole file.
// I will use `replace_file_content` to replace the import section separately.

export default CommunityPage;
