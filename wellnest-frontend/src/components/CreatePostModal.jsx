import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const CreatePostModal = ({ onClose, onCreate, error, initialData = null, isCommunity = false }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        excerpt: initialData?.excerpt || '',
        category: initialData?.category || (isCommunity ? 'Community' : 'General'),
        content: initialData?.content || '',
        image: initialData?.image || ''
    });
    // ...
    // Note: I will need to replace the component signature line too, so I should chunk this properly.
    // However, I can't replace line 4 deeply without checking the whole file context or doing multiple replace chunks.
    // I already have context. Line 4 is the signature.
    // I'll do this in two chunks or one large chunk covering the signature.
    // Actually, I'll just change the signature and the form part.
    // But `replace_file_content` requires contiguous block.
    // Let's replace the signature first, then the form part.
    // WAIT: `replace_file_content` rule 1: "Use this tool ONLY when you are making a SINGLE CONTIGUOUS block of edits".
    // I need to use `multi_replace_file_content` or just replace the whole file content since I viewed it all.
    // The previous tool usage was `replace_file_content` on a large block. I can do that again if needed, or use proper chunks.
    // I will use `replace_file_content` on the component signature line first.

    // Changing signature:
    // Line 4: const CreatePostModal = ({ onClose, onCreate, error, initialData = null }) => {
    // to include isCommunity.

    // Then I will change the category render part.

    // Let's use `multi_replace_file_content` as it's cleaner for non-contiguous edits.

    // WAIT: User instructions say "User can post anything change the ui and create post format remove that selection dropdown".
    // So for community, remove dropdown.

    const [useUrl, setUseUrl] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value ?? '' }));
    };
    // ... file handling ...

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation: Content is always required. Title only for Articles.
        if (!formData.content) return;
        if (!isCommunity && !formData.title) return;

        // In a real app, author would come from authenticated user context
        const newPost = {
            ...formData,
            title: isCommunity ? (formData.title || 'Community Post') : formData.title,
            excerpt: isCommunity ? (formData.excerpt || formData.content.substring(0, 100)) : formData.excerpt,
            // Don't send 'You' as author for new posts, let backend handle it
            author: initialData?.author,
            image: formData.image || (isCommunity ? null : 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2000&auto=format&fit=crop'), // No default image for community
            isCommunity: isCommunity
        };

        onCreate(newPost);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2 className="auth-title" style={{ margin: 0, fontSize: 24 }}>{initialData ? 'Edit Post' : 'Create New Post'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(220, 38, 38, 0.1)',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        border: '1px solid rgba(220, 38, 38, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isCommunity && (
                        <div className="input-group">
                            <input
                                type="text"
                                name="title"
                                placeholder="Article Title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    {!isCommunity && (
                        <div className="input-group">
                            <select
                                name="category"
                                className="role-select"
                                value={formData.category}
                                onChange={handleChange}
                                style={{ paddingLeft: 12 }}
                            >
                                <option value="General">General Wellness</option>
                                <option value="Nutrition">Nutrition</option>
                                <option value="Fitness">Fitness</option>
                                <option value="Mental Wellness">Mental Wellness</option>
                                <option value="Lifestyle">Lifestyle</option>
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, margin: '4px 0', fontSize: 13 }}>
                        <span
                            onClick={() => setUseUrl(true)}
                            style={{ cursor: 'pointer', color: useUrl ? 'var(--primary)' : 'var(--text-muted)', fontWeight: useUrl ? 600 : 400 }}
                        >
                            Image URL
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>|</span>
                        <span
                            onClick={() => setUseUrl(false)}
                            style={{ cursor: 'pointer', color: !useUrl ? 'var(--primary)' : 'var(--text-muted)', fontWeight: !useUrl ? 600 : 400 }}
                        >
                            Upload Image
                        </span>
                    </div>

                    {useUrl ? (
                        <div className="input-group">
                            <input
                                type="text"
                                name="image"
                                placeholder="Image URL (e.g. from Unsplash)"
                                value={formData.image || ''}
                                onChange={handleChange}
                            />
                        </div>
                    ) : (
                        <div className="input-group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ padding: '8px', color: 'var(--text-muted)' }}
                            />
                        </div>
                    )}

                    {formData.image && (
                        <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', marginTop: 4, border: '1px solid var(--card-border)' }}>
                            <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}

                    {!isCommunity && (
                        <div className="input-group">
                            <input
                                type="text"
                                name="excerpt"
                                placeholder="Short Excerpt (shows on card)"
                                value={formData.excerpt}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <textarea
                            name="content"
                            placeholder="Write your post content here..."
                            value={formData.content}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                borderRadius: '14px',
                                padding: '14px',
                                color: 'var(--text-main)',
                                minHeight: '200px',
                                fontSize: '15px',
                                resize: 'vertical',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-btn" style={{ marginTop: 12 }}>
                        {initialData ? 'Update Post' : 'Publish Post'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
