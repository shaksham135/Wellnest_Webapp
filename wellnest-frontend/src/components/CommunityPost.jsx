import React, { useState } from 'react';
import { FiClock, FiMessageSquare, FiHeart, FiTrash2, FiEdit2, FiMoreHorizontal, FiSend, FiStar } from 'react-icons/fi';
import { toggleLike, deletePost, addComment, deleteComment } from '../api/blogApi';

const CommunityPost = ({ post, onRefresh, onEdit }) => {
    const [likes, setLikes] = useState(post.likes);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isLiking, setIsLiking] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Comment State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentUserId = localStorage.getItem('userId');
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
    const canAction = (post.authorId && String(post.authorId) === String(currentUserId)) || userRole === 'ROLE_ADMIN';

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        try {
            const response = await toggleLike(post.id);
            if (response.data) {
                setLikes(response.data.likes);
                setIsLiked(response.data.isLiked);
            }
        } catch (err) {
            console.error('Error liking post:', err);
            setIsLiked(!isLiked);
            setLikes(isLiked ? likes - 1 : likes + 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Delete this post?")) {
            try {
                await deletePost(post.id);
                if (onRefresh) onRefresh();
            } catch (err) {
                console.error('Error deleting post:', err);
                alert('Failed to delete post');
            }
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const userName = localStorage.getItem('userName') || 'User';
            const response = await addComment(post.id, { text: commentText, userName });
            if (response.data) {
                setComments(response.data);
                setCommentText('');
            }
        } catch (err) {
            console.error("Failed to add comment", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error("Failed to delete comment", err);
            alert("Failed to delete comment");
        }
    };

    // Generate a random avatar background color based on name
    const getAvatarColor = (name) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        let hash = 0;
        if (!name) return colors[0];
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="community-post" style={{
            background: 'var(--card-bg)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--card-border)',
            overflow: 'hidden', // Changed to hidden to match card radius
            marginBottom: '0',
            backdropFilter: 'var(--glass-blur)',
            color: 'var(--text-main)'
        }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: getAvatarColor(post.author),
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '15px'
                    }}>
                        {post.author ? post.author.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {post.author}
                            {post.isAuthorVerified && (
                                <span title="Verified Professional" style={{ color: '#3b82f6', display: 'flex' }}>
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.15-.43.23-.88.23-1.35 0-2.21-1.79-4-4-4-.47 0-.92.08-1.35.23-.7-1.3-2.07-2.18-3.65-2.18s-2.95.88-3.65 2.18c-.43-.15-.88-.23-1.35-.23-2.21 0-4 1.79-4 4 0 .47.08.92.23 1.35-1.3.7-2.18 2.07-2.18 3.65s.88 2.95 2.18 3.65c-.15.43-.23.88-.23 1.35 0 2.21 1.79 4 4 4 .47 0 .92-.08 1.35-.23.7 1.3 2.07 2.18 3.65 2.18s2.95-.88 3.65-2.18c.43.15.88.23 1.35.23 2.21 0 4-1.79 4-4 0-.47-.08-.92-.23-1.35 1.3-.7 2.18-2.07 2.18-3.65zm-11 5.5l-4-4 1.41-1.41L11.5 15.17l7.59-7.59L20.5 9l-9 9z"></path></svg>
                                </span>
                            )}
                            {post.isAuthorPremium && (
                                <span className="premium-badge-mini" style={{ 
                                    background: 'var(--primary-light)', color: 'var(--primary)', 
                                    fontSize: '9px', fontWeight: 900, padding: '1px 6px', 
                                    borderRadius: '4px', letterSpacing: '0.5px', display: 'flex', 
                                    alignItems: 'center', gap: '3px' 
                                }}>
                                    <FiStar size={8} fill="currentColor" /> ELITE
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiClock size={10} /> {post.date}
                        </div>
                    </div>
                </div>

                {canAction && (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)', borderRadius: '50%' }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.target.style.background = 'none'}
                        >
                            <FiMoreHorizontal size={20} />
                        </button>
                        {showMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: '100%',
                                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                                borderRadius: '8px', boxShadow: 'var(--shadow-lg)',
                                zIndex: 10, minWidth: '140px', padding: '4px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <button
                                    onClick={() => { onEdit(post); setShowMenu(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'var(--text-main)' }}
                                >
                                    <FiEdit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => { handleDelete(); setShowMenu(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#ef4444' }}
                                >
                                    <FiTrash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '4px 16px 16px' }}>
                {post.title && post.title !== 'Community Post' && (
                    <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>{post.title}</h3>
                )}
                <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap', fontSize: '15px' }}>
                    {post.content || post.excerpt}
                </p>
            </div>

            {/* Image */}
            {post.image && (
                <div style={{ width: '100%', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)' }}>
                    <img src={post.image} alt="Post content" style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Stats */}
            <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {likes > 0 && <span role="img" aria-label="like" style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiHeart fill="white" color="white" size={10} /></span>}
                    {likes > 0 ? likes : 'Be the first to like'}
                </span>
                <span style={{ cursor: 'pointer' }} onClick={() => setShowComments(!showComments)}>
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </span>
            </div>

            <div style={{ borderTop: '1px solid var(--card-border)', margin: '0 12px' }}></div>

            {/* Actions */}
            <div style={{ display: 'flex', padding: '4px 8px' }}>
                <button
                    onClick={handleLike}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '4px',
                        color: isLiked ? '#ef4444' : 'var(--text-muted)',
                        fontWeight: 600, fontSize: '14px',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(128,128,128,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <FiHeart fill={isLiked ? '#ef4444' : 'none'} size={18} /> Like
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '4px',
                        color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(128,128,128,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <FiMessageSquare size={18} /> Comment
                </button>
            </div>

            {/* Comment Section */}
            {showComments && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.00)' }}>
                    {/* List */}
                    {comments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 0' }}>
                            {comments.map((comment, idx) => {
                                const isCommentOwner = comment.userId && String(comment.userId) === String(currentUserId);
                                const isPostOwner = post.authorId && String(post.authorId) === String(currentUserId);
                                // Admin check
                                const isUserAdmin = userRole === 'ROLE_ADMIN';
                                const canDeleteComment = isCommentOwner || isPostOwner || isUserAdmin;

                                return (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: getAvatarColor(comment.user),
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700, flexShrink: 0
                                        }}>
                                            {comment.user ? comment.user.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '12px', fontSize: '13px', flex: 1, border: '1px solid var(--card-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>{comment.user}</div>
                                                {canDeleteComment && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                                                        title="Delete Comment"
                                                    >
                                                        <FiTrash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ color: 'var(--text-main)' }}>{comment.text}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: comments.length === 0 ? '16px' : '0' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', flexShrink: 0
                        }}>
                            <FiMessageSquare size={14} />
                        </div>
                        <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: '1px solid var(--card-border)',
                                color: 'var(--text-main)',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim() || isSubmitting}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: commentText.trim() ? '#3b82f6' : '#94a3b8',
                                padding: '8px'
                            }}
                        >
                            <FiSend size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CommunityPost;
