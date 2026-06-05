import React from 'react';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Neural System Crash Detected:", error, errorInfo);
  }

  handleRestart = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--text-main)',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            padding: '40px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ 
                width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444', borderRadius: '50%', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto',
                fontSize: '28px'
            }}>
              <FiAlertTriangle />
            </div>
            <h2 style={{ marginBottom: '16px', fontWeight: 800 }}>Neural System Recovery</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
              We detected a minor glitch in the neural interface. Don't worry, your data is safe. 
              Let's restart the module to sync with the core.
            </p>
            <button 
              onClick={this.handleRestart}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 auto',
                padding: '12px 24px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FiRefreshCw />
              Restart Neural Module
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
