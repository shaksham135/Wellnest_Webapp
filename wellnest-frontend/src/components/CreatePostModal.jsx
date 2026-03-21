import React, { useState } from 'react';
import { FiX, FiImage, FiType, FiFileText, FiPlus } from 'react-icons/fi';
import BottomSheet from './common/BottomSheet';

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
        <BottomSheet 
            isOpen={true} 
            onClose={onClose} 
            title={initialData ? 'Edit Post' : 'Create New Post'}
        >
            <form className="auth-form" onSubmit={handleSubmit} style={{ padding: '0' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!isCommunity && (
                        <div className="input-group">
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Title</label>
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
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Category</label>
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

                    <div className="input-group">
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Featured Image</label>
                        <div style={{ 
                            display: 'flex', 
                            background: 'var(--input-bg)', 
                            borderRadius: '12px', 
                            padding: '4px',
                            border: '1px solid var(--card-border)',
                            marginBottom: '15px'
                        }}>
                            <button 
                                type="button"
                                onClick={() => setUseUrl(true)}
                                style={{ 
                                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', 
                                    background: useUrl ? 'var(--primary)' : 'transparent',
                                    color: useUrl ? 'white' : 'var(--text-muted)',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <FiImage style={{ marginRight: '6px' }} /> URL
                            </button>
                            <button 
                                type="button"
                                onClick={() => setUseUrl(false)}
                                style={{ 
                                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', 
                                    background: !useUrl ? 'var(--primary)' : 'transparent',
                                    color: !useUrl ? 'white' : 'var(--text-muted)',
                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <FiPlus style={{ marginRight: '6px' }} /> Upload
                            </button>
                        </div>

                        {useUrl ? (
                            <input
                                type="text"
                                name="image"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image || ''}
                                onChange={handleChange}
                                style={{ marginBottom: '10px' }}
                            />
                        ) : (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ 
                                    padding: '12px', color: 'var(--text-muted)', background: 'var(--input-bg)', 
                                    borderRadius: '12px', border: '1px solid var(--card-border)', width: '100%',
                                    marginBottom: '10px', fontSize: '14px'
                                }}
                            />
                        )}

                        {formData.image && (
                            <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', marginTop: 8, border: '1px solid var(--card-border)' }}>
                                <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    {!isCommunity && (
                        <div className="input-group">
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Excerpt</label>
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
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Content</label>
                        <textarea
                            name="content"
                            placeholder={isCommunity ? "What's on your mind?" : "Write your post content here..."}
                            value={formData.content}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                borderRadius: '14px',
                                padding: '14px',
                                color: 'var(--text-main)',
                                minHeight: '150px',
                                fontSize: '15px',
                                resize: 'vertical',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-btn" style={{ marginTop: 12, height: '50px', fontSize: '16px' }}>
                        {initialData ? 'Update Post' : 'Publish Post'}
                    </button>
                </div>
            </form>
        </BottomSheet>
    );
};

export default CreatePostModal;
