import React, { useState } from 'react';
import { FiClock, FiMessageSquare, FiHeart, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toggleLike, deletePost } from '../api/blogApi';

const BlogCard = ({ post, onRefresh }) => {
    const [likes, setLikes] = useState(post.likes);
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isLiking, setIsLiking] = useState(false);

    const currentUserId = localStorage.getItem('userId');
    // Check if user is owner (or if you want to allow admin, check role too)
    const canDelete = post.authorId && String(post.authorId) === String(currentUserId);

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLiking) return;

        setIsLiking(true);
        try {
            const response = await toggleLike(post.id);

            if (response.data) {
                setLikes(response.data.likes);
                // Use backend response for truth
                setIsLiked(response.data.isLiked);
            }
        } catch (err) {
            console.error('Error liking post:', err);

            // Revert strict toggle if error (simple heuristic)
            setIsLiked(!isLiked);
            setLikes(isLiked ? likes - 1 : likes + 1);
        } finally {
            setIsLiking(false);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await deletePost(post.id);
                if (onRefresh) onRefresh();
            } catch (err) {
                console.error('Error deleting post:', err);
                alert('Failed to delete post');
            }
        }
    };

    return (
        <div className="blog-card" style={{ background: 'var(--card-bg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--card-border)', overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ height: 160, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                {post.image ? (
                    <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)' }} />
                )}

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(255, 255, 255, 0.9)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        title="Delete Post"
                    >
                        <FiTrash2 size={16} />
                    </button>
                )}
            </div>
            <div className="blog-card-content" style={{ padding: '20px' }}>
                <span className="blog-tag" style={{ background: '#f0f9ff', color: '#0284c7', padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{post.category || 'Wellness'}</span>
                <h2 className="blog-title" style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: 700, margin: '12px 0 8px' }}>{post.title}</h2>
                <p className="blog-excerpt" style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>{post.excerpt}</p>

                <div className="blog-footer" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="blog-author" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        By <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{post.author}</span>
                    </div>
                    <div className="blog-icon-stat" style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiClock />
                        {post.date}
                    </div>
                </div>

                <div className="blog-footer" style={{ marginTop: 12, display: 'flex', gap: '16px' }}>
                    <div
                        className="blog-icon-stat"
                        onClick={handleLike}
                        style={{ cursor: isLiking ? 'wait' : 'pointer', userSelect: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                        <FiHeart style={{ color: isLiked ? '#ef4444' : 'var(--text-muted)', fill: isLiked ? '#ef4444' : 'none', transition: 'all 0.2s' }} />
                        {likes}
                    </div>
                    <div className="blog-icon-stat" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FiMessageSquare style={{ color: 'var(--text-muted)' }} /> {post.comments ? post.comments.length : 0}
                    </div>
                </div>
            </div>
            <Link to={`/blog/${post.id}`} className="primary-btn" style={{ borderRadius: 0, width: '100%', justifyContent: 'center', display: 'flex', padding: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', borderTop: '1px solid var(--card-border)', fontWeight: 600 }}>
                Read Article
            </Link>
        </div>
    );
};

export default BlogCard;
