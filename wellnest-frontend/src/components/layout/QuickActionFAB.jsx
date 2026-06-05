import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiPlus, FiActivity, FiDroplet, FiMoon, FiCoffee, FiX } from 'react-icons/fi';

const QuickActionFAB = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hideOnRoutes = ['/admin-dashboard', '/login', '/register', '/forgot-password', '/reset-password', '/setup-profile', '/premium'];
  const shouldHide = hideOnRoutes.some(route => location.pathname.startsWith(route)) || location.pathname === '/';

  const actions = [
    { icon: <FiActivity />, label: 'Workout', color: '#ef4444', route: '/trackers?tab=workout' },
    { icon: <FiCoffee />, label: 'Meal', color: '#f59e0b', route: '/trackers?tab=meal' },
    { icon: <FiDroplet />, label: 'Water', color: '#3b82f6', route: '/trackers?tab=water' },
    { icon: <FiMoon />, label: 'Sleep', color: '#8b5cf6', route: '/trackers?tab=sleep' },
  ];

  if (shouldHide) return null;

  return (
    <div className="quick-action-fab-container">
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '12px',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none'
      }}>
        {actions.map((action, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
            <span style={{
              background: 'var(--card-bg)',
              color: 'var(--text-main)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--card-border)'
            }}>
              {action.label}
            </span>
            <button
              onClick={() => { navigate(action.route); setIsOpen(false); }}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: action.color, color: 'white', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '46px', height: '46px', borderRadius: '50%',
          background: 'var(--primary)', color: '#000', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', cursor: 'pointer', 
          boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'all 0.3s ease'
        }}
      >
        {isOpen ? <FiX /> : <FiPlus />}
      </button>
    </div>
  );
};

export default QuickActionFAB;
