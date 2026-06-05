import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiCheck, FiX, FiStar } from 'react-icons/fi';

const PremiumPaywall = ({ isOpen, onClose, featureName = "This feature" }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="paywall-card" style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--card-bg)',
        border: '1px solid var(--primary-border)',
        borderRadius: '32px',
        padding: '32px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255, 255, 255, 0.05)', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            padding: '8px', borderRadius: '50%', display: 'flex'
          }}
        >
          <FiX size={18} />
        </button>

        <div style={{
          width: '70px', height: '70px', background: 'var(--primary-light)',
          color: 'var(--primary)', borderRadius: '24px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto',
          fontSize: '32px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)'
        }}>
          <FiZap />
        </div>

        <h2 style={{ marginBottom: '12px', fontWeight: 900, color: 'var(--text-main)' }}>Unlock Neural Core</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
          <strong>{featureName}</strong> is reserved for our Elite members. Get real-time AI resonance and deep metabolic insights.
        </p>

        <div style={{ textAlign: 'left', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Instant AI Neural Resonance Score',
            'Full Metabolic Velocity Analytics',
            'Premium Recovery Efficiency Metrics',
            'Priority Community Verified Badge'
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-main)' }}>
              <div style={{ color: '#10b981', display: 'flex' }}><FiCheck /></div>
              {text}
            </div>
          ))}
        </div>

        <button 
          onClick={() => { onClose(); navigate('/premium'); }}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: '16px',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          <FiStar fill="white" /> Upgrade to Elite
        </button>

        <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Risk-free. Cancel your subscription anytime.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default PremiumPaywall;
