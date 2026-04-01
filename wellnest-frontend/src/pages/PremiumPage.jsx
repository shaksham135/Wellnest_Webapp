import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheckCircle, FiZap, FiMic, FiCpu, FiSun, FiActivity, FiStar } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import './PremiumPage.css';

const PremiumPage = () => {
    const navigate = useNavigate();
    const { userData } = useData();

    const handleUpgrade = () => {
        if (userData?.isPremium) {
            toast("You are already a Premium Member! 🌟", { icon: '👏' });
            return;
        }
        navigate('/profile');
    };

    return (
        <div className="premium-page">
            <button className="premium-close-btn" onClick={() => navigate(-1)} title="Go Back">
                <FiX size={24} />
            </button>

            <div className="premium-hero">
                <div className="premium-glow-orb"></div>
                <div className="premium-glow-orb secondary"></div>
                
                <div className="premium-hero-content">
                    <div className="premium-badge">
                        <FiStar className="spin-slow" /> WELLNEST VIP
                    </div>
                    <h1>Unlock Your Ultimate Potential</h1>
                    <p>Stop guessing. Start optimizing. Upgrade to Wellnest Premium and fuse your biological data with state-of-the-art AI coaching.</p>
                </div>
            </div>

            <div className="premium-features-grid">
                <div className="premium-feature-card">
                    <div className="pf-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <FiCpu />
                    </div>
                    <h3>Smart AI Diet Logging</h3>
                    <p>No more tedious calorie counting. Just type what you ate (e.g. "Two eggs and a slice of toast"), and our AI instantly calculates your precise macros and calories.</p>
                </div>

                <div className="premium-feature-card">
                    <div className="pf-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <FiMic />
                    </div>
                    <h3>Voice Clarity & Neural Scans</h3>
                    <p>Speak to your daily AI check-in. Our algorithm analyzes speech patterns and biometrics to calculate your <strong>Cognitive Reserve</strong> and mental readiness for high-intensity training.</p>
                </div>

                <div className="premium-feature-card">
                    <div className="pf-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <FiSun />
                    </div>
                    <h3>Personalized AI Briefings</h3>
                    <p>Wake up to a dynamic daily briefing tailored exclusively for you. The AI cross-analyzes your recent sleep quality, training volume, and water intake to give you actionable advice.</p>
                </div>

                <div className="premium-feature-card">
                    <div className="pf-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <FiActivity />
                    </div>
                    <h3>Energy Forecasting</h3>
                    <p>Know exactly when to train and when to rest. Get live projections of your internal vitality battery over the next 6 hours so you can optimize your schedule.</p>
                </div>
            </div>

            <div className="premium-pricing-tier">
                <h2>Ready to become elite?</h2>
                <div className="pricing-box">
                    <div className="price-tag">
                        <span className="currency">$</span>
                        <span className="amount">9.99</span>
                        <span className="duration">/mo</span>
                    </div>
                    <ul className="pricing-benefits">
                        <li><FiCheckCircle color="#10b981" /> Unlimited AI Meal Scans</li>
                        <li><FiCheckCircle color="#10b981" /> Daily Voice Neurometrics</li>
                        <li><FiCheckCircle color="#10b981" /> Smart Reminders & Tips</li>
                        <li><FiCheckCircle color="#10b981" /> Early Access to New Features</li>
                    </ul>
                    <button 
                        className="premium-cta-btn" 
                        onClick={handleUpgrade}
                        disabled={userData?.isPremium}
                    >
                        {userData?.isPremium ? 'Already Premium VIP' : 'Unlock Wellnest Premium'}
                        {!userData?.isPremium && <FiZap style={{ marginLeft: '8px' }} />}
                    </button>
                    {!userData?.isPremium && (
                        <p className="guarantee">Cancel anytime. 7-day money-back guarantee.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PremiumPage;
