import React, { useState } from 'react';
import { FiMail, FiMessageSquare, FiCompass } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';

const Support = () => {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        topic: 'General Inquiry',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get user email from local storage if available, or ask for it
            // For now, we assume logged in user or we might need to add email field if public
            // valid token is attached by apiClient, so backend can extract user. 
            // BUT, the requirements said "contact form", often public. 
            // Let's add an Email field to the form to be safe and versatile.

            await apiClient.post('/contact/submit', {
                email: formData.email,
                topic: formData.topic,
                message: formData.message
            });

            setSubmitted(true);
            toast.success("Message sent successfully!");
        } catch (error) {
            console.error("Failed to send message", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ paddingTop: '80px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)' }}>
            <div style={{ marginBottom: '40px' }}>
                <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>&larr; Back to Home</Link>
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>Support Center</h1>
            <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '48px' }}>
                How can we help you today?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '60px' }}>
                <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                    <FiCompass style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Getting Started</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                        New to Wellnest? checks our guides on how to set up your profile and specific goals.
                    </p>
                </div>
                <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                    <FiMessageSquare style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>FAQs</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                        Find answers to common questions about tracking, trainer connections, and account settings.
                    </p>
                </div>
            </div>

            <section>
                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiMail className="text-primary" /> Contact Us
                </h2>

                {submitted ? (
                    <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--success)', marginBottom: '8px' }}>Message Sent!</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Thank you for reaching out. We will get back to you within 24 hours.</p>
                        <button
                            onClick={() => setSubmitted(false)}
                            style={{ marginTop: '16px', padding: '8px 16px', background: 'transparent', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            Send another message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>Your Email</label>
                            <input
                                type="email"
                                name="email"
                                className="standard-input"
                                required
                                placeholder="name@example.com"
                                value={formData.email || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>Topic</label>
                            <select
                                name="topic"
                                value={formData.topic}
                                onChange={handleChange}
                                className="standard-input"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                            >
                                <option>General Inquiry</option>
                                <option>Technical Issue</option>
                                <option>Account Management</option>
                                <option>Billing</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'var(--text-secondary)' }}>Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="standard-input"
                                required
                                rows="5"
                                placeholder="Describe your issue or question..."
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-main)', resize: 'vertical' }}
                            ></textarea>
                        </div>

                        <button type="submit" className="primary-btn" disabled={loading} style={{ maxWidth: '200px' }}>
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
};

export default Support;
