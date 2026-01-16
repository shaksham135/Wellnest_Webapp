import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

const CreatePostModal = ({ onClose, onCreate, error }) => {
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        category: 'General',
        content: '',
        image: ''
    });
    const [useUrl, setUseUrl] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value ?? '' }));
    };

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
        if (!formData.title || !formData.content) return;

        // In a real app, author would come from authenticated user context
        const newPost = {
            ...formData,
            author: 'You',
            image: formData.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2000&auto=format&fit=crop'
        };

        onCreate(newPost);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2 className="auth-title" style={{ margin: 0, fontSize: 24 }}>Create New Post</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
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

                    <div style={{ display: 'flex', gap: 10, margin: '4px 0', fontSize: 13 }}>
                        <span
                            onClick={() => setUseUrl(true)}
                            style={{ cursor: 'pointer', color: useUrl ? '#2563eb' : '#64748b', fontWeight: useUrl ? 600 : 400 }}
                        >
                            Image URL
                        </span>
                        <span style={{ color: '#475569' }}>|</span>
                        <span
                            onClick={() => setUseUrl(false)}
                            style={{ cursor: 'pointer', color: !useUrl ? '#2563eb' : '#64748b', fontWeight: !useUrl ? 600 : 400 }}
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
                                style={{ padding: '8px', color: '#475569' }}
                            />
                        </div>
                    )}

                    {formData.image && (
                        <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', marginTop: 4, border: '1px solid rgba(148,163,184,0.3)' }}>
                            <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}

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

                    <div className="input-group">
                        <textarea
                            name="content"
                            placeholder="Write your article content here..."
                            value={formData.content}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '10px',
                                padding: '12px',
                                color: '#0f172a',
                                minHeight: '200px',
                                fontSize: '14px',
                                resize: 'vertical'
                            }}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-btn" style={{ marginTop: 12 }}>
                        Publish Post
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
