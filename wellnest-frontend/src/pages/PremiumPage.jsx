import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiArrowLeft, FiCheckCircle, FiZap, FiMic, FiCpu, FiActivity,
    FiLoader, FiShield, FiAward, FiSend, FiClock,
    FiUsers, FiGift, FiUnlock, FiTrendingUp
} from 'react-icons/fi';
import { useData } from '../context/DataContext';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import './PremiumPage.css';

const TIER_CONFIG = {
    FREE: { label: 'Free', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '🌱' },
    BETA_PREMIUM: { label: 'Beta Premium', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '⚡' },
    PAID_PREMIUM: { label: 'Paid Premium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '👑' },
    ADMIN_GRANTED: { label: 'Founder Access', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '🎖️' },
    LIFETIME: { label: 'Lifetime', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: '♾️' },
};

const PREMIUM_FEATURES = [
    { icon: <FiMic />, title: 'Unlimited Voice Logs', desc: 'Speak your habits naturally — unlimited per day' },
    { icon: <FiCpu />, title: 'AI Neural Diagnostics', desc: 'Deep pattern analysis across all health dimensions' },
    { icon: <FiActivity />, title: 'Advanced Analytics', desc: 'Energy forecast, daily readiness & recovery maps' },
    { icon: <FiTrendingUp />, title: 'Smart Meal AI', desc: 'Log anything in Hinglish — auto-estimates macros' },
    { icon: <FiShield />, title: 'Mental Fitness Reports', desc: 'Daily mental wellness diagnostics and journaling' },
    { icon: <FiAward />, title: 'Priority Feature Access', desc: 'First to test new features before public launch' },
];

const PremiumPage = () => {
    const navigate = useNavigate();
    const { userData, refreshUserData } = useData();

    const [betaStatus, setBetaStatus] = useState(null); // null = loading
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const accessType = userData?.premiumAccessType || (userData?.isPremium ? 'PAID_PREMIUM' : 'FREE');
    const tierConfig = TIER_CONFIG[accessType] || TIER_CONFIG.FREE;
    const hasPremium = accessType !== 'FREE';

    useEffect(() => {
        const fetchBetaStatus = async () => {
            try {
                const res = await apiClient.get('/subscription/beta-status');
                setBetaStatus(res.data);
            } catch (err) {
                console.error('Failed to fetch beta status', err);
                setBetaStatus({ hasRequest: false, premiumAccessType: 'FREE' });
            } finally {
                setLoadingStatus(false);
            }
        };
        fetchBetaStatus();
    }, []);

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            toast.error('Please write a message explaining why you want beta access.');
            return;
        }
        if (trimmedMessage.length < 20) {
            toast.error('Please write a more detailed message (at least 20 characters).');
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post('/subscription/request-beta', { message: trimmedMessage });
            toast.success('Beta access request submitted! We\'ll review it within 24-48 hours.');
            setSubmitted(true);
            setBetaStatus({ hasRequest: true, status: 'PENDING' });
            await refreshUserData();
        } catch (err) {
            const errMsg = err?.response?.data?.error || 'Failed to submit request. Please try again.';
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // If user has premium — show active status page
    if (hasPremium) {
        return (
            <div className="premium-page-v2">
                <div className="premium-page-inner">
                    <button className="premium-back-btn" onClick={() => navigate(-1)}>
                        <FiArrowLeft /> Back
                    </button>

                    <div className="beta-active-card">
                        <div className="beta-active-icon">{tierConfig.icon}</div>
                        <div className="beta-active-badge" style={{ background: tierConfig.bg, color: tierConfig.color }}>
                            {tierConfig.label}
                        </div>
                        <h1>You're all set!</h1>
                        <p className="beta-active-desc">
                            Your <strong>{tierConfig.label}</strong> access is active. You have full access to all premium features across Wellnest.
                        </p>

                        <div className="beta-active-features">
                            {PREMIUM_FEATURES.map((f, i) => (
                                <div key={i} className="beta-active-feature-item">
                                    <FiCheckCircle className="beta-feature-check" />
                                    <span>{f.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className="beta-active-meta">
                            {userData?.premiumActivatedAt && (
                                <span>Active since {new Date(userData.premiumActivatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            )}
                            {userData?.subscriptionPlan && (
                                <span className="beta-plan-tag">{userData.subscriptionPlan}</span>
                            )}
                        </div>

                        <button className="beta-dashboard-btn" onClick={() => navigate('/dashboard')}>
                            <FiZap /> Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If request is pending or approved
    const hasPendingRequest = betaStatus?.hasRequest && betaStatus?.status === 'PENDING';

    return (
        <div className="premium-page-v2">
            <div className="premium-page-inner">
                <button className="premium-back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back
                </button>

                {/* Hero Section */}
                <div className="beta-hero">
                    <div className="beta-hero-badge">
                        <span className="beta-badge-dot" />
                        BETA TESTING PHASE
                    </div>
                    <h1 className="beta-hero-title">
                        Early Access to<br />
                        <span className="beta-gradient-text">Wellnest Premium</span>
                    </h1>
                    <p className="beta-hero-subtitle">
                        We're onboarding a select group of beta testers before our official launch.
                        <br />No payment required — just your honest feedback.
                    </p>
                    <div className="beta-hero-stats">
                        <div className="beta-stat">
                            <FiUsers />
                            <span>Limited Spots</span>
                        </div>
                        <div className="beta-stat-divider" />
                        <div className="beta-stat">
                            <FiGift />
                            <span>100% Free</span>
                        </div>
                        <div className="beta-stat-divider" />
                        <div className="beta-stat">
                            <FiUnlock />
                            <span>Full Access</span>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="beta-features-section">
                    <h2 className="beta-section-title">What you get</h2>
                    <div className="beta-features-grid">
                        {PREMIUM_FEATURES.map((f, i) => (
                            <div key={i} className="beta-feature-card">
                                <div className="beta-feature-icon">{f.icon}</div>
                                <div className="beta-feature-body">
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Request Form or Status */}
                <div className="beta-request-section">
                    {loadingStatus ? (
                        <div className="beta-loading">
                            <FiLoader className="spin" /> Checking your status...
                        </div>
                    ) : hasPendingRequest || submitted ? (
                        <div className="beta-pending-card">
                            <div className="beta-pending-icon">
                                <FiClock />
                            </div>
                            <h2>Request Under Review</h2>
                            <p>
                                We've received your beta access request. Our team reviews applications within
                                <strong> 24–48 hours</strong>. You'll get an in-app notification once approved.
                            </p>
                            <div className="beta-pending-steps">
                                <div className="beta-step done">
                                    <FiCheckCircle /> <span>Request Submitted</span>
                                </div>
                                <div className="beta-step-line done" />
                                <div className="beta-step active">
                                    <FiClock /> <span>Under Review</span>
                                </div>
                                <div className="beta-step-line" />
                                <div className="beta-step">
                                    <FiUnlock /> <span>Access Granted</span>
                                </div>
                            </div>
                            <button className="beta-dashboard-btn outline" onClick={() => navigate('/dashboard')}>
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="beta-form-card">
                            <div className="beta-form-header">
                                <h2>Apply for Beta Access</h2>
                                <p>Tell us a bit about yourself and how you plan to use Wellnest.</p>
                            </div>

                            <form onSubmit={handleSubmitRequest} className="beta-form">
                                <div className="beta-form-group">
                                    <label>Your Name</label>
                                    <input
                                        type="text"
                                        value={userData?.name || ''}
                                        readOnly
                                        className="beta-input readonly"
                                    />
                                </div>
                                <div className="beta-form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={userData?.email || ''}
                                        readOnly
                                        className="beta-input readonly"
                                    />
                                </div>
                                <div className="beta-form-group">
                                    <label>Why do you want beta access? <span className="required">*</span></label>
                                    <textarea
                                        className="beta-textarea"
                                        placeholder="E.g. I'm a fitness enthusiast who wants to track my health holistically. I've been using apps like XYZ but they don't have voice logging..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        rows={5}
                                        maxLength={1000}
                                        required
                                    />
                                    <div className="beta-char-count">{message.length}/1000</div>
                                </div>

                                <div className="beta-form-note">
                                    <FiShield />
                                    <span>No payment information required. Beta access is completely free.</span>
                                </div>

                                <button
                                    type="submit"
                                    className="beta-submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <><FiLoader className="spin" /> Submitting...</>
                                    ) : (
                                        <><FiSend /> Submit Beta Request</>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* How it works */}
                <div className="beta-how-section">
                    <h2 className="beta-section-title">How Beta Access Works</h2>
                    <div className="beta-how-steps">
                        <div className="beta-how-step">
                            <div className="beta-how-num">1</div>
                            <h3>Submit Request</h3>
                            <p>Fill out the short application above. No payment, no credit card.</p>
                        </div>
                        <div className="beta-how-arrow">→</div>
                        <div className="beta-how-step">
                            <div className="beta-how-num">2</div>
                            <h3>Founder Reviews</h3>
                            <p>Our team personally reviews each request within 24–48 hours.</p>
                        </div>
                        <div className="beta-how-arrow">→</div>
                        <div className="beta-how-step">
                            <div className="beta-how-num">3</div>
                            <h3>Full Access Unlocked</h3>
                            <p>If approved, you get instant access to all premium features — free for the beta period.</p>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="beta-faq-section">
                    <h2 className="beta-section-title">FAQs</h2>
                    <div className="beta-faq-list">
                        {[
                            { q: 'Is beta access really free?', a: 'Yes — 100% free during the beta period. No credit card, no payment. Just use Wellnest and share feedback with us.' },
                            { q: 'How many beta spots are available?', a: 'We are onboarding a limited cohort of testers to ensure quality feedback. Spots are filled on a first-come, first-served basis.' },
                            { q: 'What happens after the beta period?', a: 'Beta users will receive a discounted offer to continue with a paid plan, or we may extend your access based on your feedback contribution.' },
                            { q: 'Is my health data safe?', a: 'Absolutely. Your voice logs are processed securely and never shared with third parties. We do not store raw audio — only the transcribed text and logged health entries.' },
                        ].map((item, i) => (
                            <BetaFaqItem key={i} {...item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BetaFaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`beta-faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
            <div className="beta-faq-q">
                <span>{q}</span>
                <span className="beta-faq-chevron">{open ? '−' : '+'}</span>
            </div>
            {open && <div className="beta-faq-a">{a}</div>}
        </div>
    );
};

export default PremiumPage;
