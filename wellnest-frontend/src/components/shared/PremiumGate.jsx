import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiLock } from 'react-icons/fi';
import './PremiumGate.css';

const PREMIUM_TYPES = ['BETA_PREMIUM', 'PAID_PREMIUM', 'ADMIN_GRANTED', 'LIFETIME'];

const PremiumGate = ({ children, isPremium, premiumAccessType, featureName, featureDesc, compact = false }) => {
    const navigate = useNavigate();

    // Unlock if isPremium bool is true OR if the access type is any non-FREE tier
    const hasAccess = isPremium || (premiumAccessType && PREMIUM_TYPES.includes(premiumAccessType));

    if (hasAccess) {
        return children;
    }

    return (
        <div className={`premium-gate-container ${compact ? 'compact' : ''}`}>
            {/* Blurred content preview */}
            <div className="premium-gate-blurred-content">
                {children}
            </div>

            {/* Premium Gating Overlay */}
            <div className="premium-gate-overlay">
                <div className="premium-gate-badge">
                    <FiLock className="premium-star-icon" />
                    <span>BETA ACCESS</span>
                </div>
                <div className="premium-gate-content">
                    <h3>{featureName || 'Premium Feature'}</h3>
                    {featureDesc && <p>{featureDesc}</p>}
                    <button 
                        className="premium-gate-cta"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/premium');
                        }}
                    >
                        Request Beta Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumGate;
