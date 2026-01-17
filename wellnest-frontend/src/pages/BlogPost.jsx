import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHeart, FiShare2, FiClock, FiUser, FiTrash2 } from 'react-icons/fi';
import { getPostById, toggleLike, addComment, deletePost, deleteComment } from '../api/blogApi';

const BlogPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [showCopyMessage, setShowCopyMessage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [commenting, setCommenting] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getPostById(id);
                setPost(response.data);
                setIsLiked(response.data.isLiked);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('Failed to load the article.');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [id]);

    const handleLike = async () => {
        if (!post) return;
        try {
            const response = await toggleLike(post.id);
            setPost(response.data);
            setIsLiked(response.data.isLiked);
        } catch (err) {
            console.error('Error liking post:', err);
            alert('Please log in to like posts.');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowCopyMessage(true);
        setTimeout(() => setShowCopyMessage(false), 2000);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deletePost(post.id);
                navigate('/blog');
            } catch (err) {
                console.error('Error deleting post:', err);
                alert('Failed to delete post. You may not have permission.');
            }
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await deleteComment(commentId);
            setPost(prev => ({
                ...prev,
                comments: prev.comments.filter(c => c.id !== commentId)
            }));
        } catch (err) {
            console.error("Failed to delete comment", err);
            alert("Failed to delete comment");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setCommenting(true);
        try {
            const userName = localStorage.getItem('userName') || 'You';
            const response = await addComment(post.id, { text: commentText, userName });
            // Updating comments list from response (which returns list of comments)
            // But wait, addComment returns list of comments? Yes in backend.
            setPost({ ...post, comments: response.data });
            setCommentText('');
        } catch (err) {
            console.error('Error adding comment:', err);
            alert('Please log in to comment.');
        } finally {
            setCommenting(false);
        }
    };

    if (loading) {
        return (
            <div className="blog-page" style={{ textAlign: 'center', marginTop: 100 }}>
                <p>Loading article...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="blog-page" style={{ textAlign: 'center', marginTop: 100 }}>
                <h2>{error || 'Article not found'}</h2>
                <Link to="/blog" className="ghost-btn" style={{ marginTop: 20 }}>Back to Blog</Link>
            </div>
        );
    }

    const currentUserId = localStorage.getItem('userId');
    const canDeletePost = post.authorId && String(post.authorId) === String(currentUserId);

    return (
        <div className="blog-page">
            {showCopyMessage && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    background: '#22c55e',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: 8,
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    Link copied to clipboard!
                </div>
            )}
            <Link to="/blog" className="ghost-btn" style={{ width: 'auto', marginBottom: 24, paddingLeft: 10 }}>
                <FiArrowLeft /> Back to Articles
            </Link>

            <div className="blog-detail-container">
                {post.image && (
                    <div style={{ width: '100%', height: 300, borderRadius: '16px 16px 0 0', overflow: 'hidden', marginBottom: 24 }}>
                        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                <header className="blog-meta-header">
                    <span className="blog-tag" style={{ fontSize: 12 }}>{post.category}</span>
                    <h1 className="blog-detail-title">{post.title}</h1>

                    <div className="blog-detail-info">
                        <div className="blog-icon-stat">
                            <FiUser /> {post.author} <span style={{ opacity: 0.6, fontSize: 12, marginLeft: 4 }}>({post.role})</span>
                        </div>
                        <div className="blog-icon-stat">
                            <FiClock /> {post.date}
                        </div>
                    </div>
                </header>

                <div className="blog-body">
                    {post.content && post.content.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>

                <div className="interaction-bar">
                    <button
                        className={`like-btn ${isLiked ? 'liked' : ''}`}
                        onClick={handleLike}
                    >
                        <FiHeart style={{ fill: isLiked ? 'currentColor' : 'none' }} />
                        {isLiked ? 'Liked' : 'Like'} ({post.likes})
                    </button>

                    <button className="action-btn" onClick={handleShare}>
                        <FiShare2 /> Share
                    </button>

                    {canDeletePost && (
                        <button className="action-btn" onClick={handleDelete} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <FiTrash2 /> Delete
                        </button>
                    )}
                </div>

                <div className="comments-section">
                    <h3>Comments ({post.comments && post.comments.length})</h3>

                    <div className="comment-list">
                        {post.comments && post.comments.map(comment => {
                            const isCommentOwner = comment.userId && String(comment.userId) === String(currentUserId);
                            const isPostOwner = post.authorId && String(post.authorId) === String(currentUserId);
                            const canDeleteComment = isCommentOwner || isPostOwner;

                            return (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-user">{comment.user}</span>
                                        <span className="comment-date">{comment.date}</span>
                                        {canDeleteComment && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="ghost-btn"
                                                style={{ marginLeft: 'auto', color: '#ef4444', padding: '4px', height: 'auto', fontSize: '12px' }}
                                                title="Delete comment"
                                            >
                                                <FiTrash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            );
                        })}

                        {(!post.comments || post.comments.length === 0) && (
                            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No comments yet. Be the first to share your thoughts!</p>
                        )}
                    </div>

                    <form className="comment-form" onSubmit={handleCommentSubmit}>
                        <textarea
                            placeholder="Join the discussion..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="primary-btn"
                            style={{ width: 'auto', alignSelf: 'flex-end' }}
                            disabled={commenting}
                        >
                            {commenting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
