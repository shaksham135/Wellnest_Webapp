// src/components/common/SplashScreen.jsx
import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onFinish }) => {
  const [fade, setFade] = useState('fade-in');

  useEffect(() => {
    // Show splash for 2.5 seconds, then fade out
    const timer = setTimeout(() => {
      setFade('fade-out');
      setTimeout(onFinish, 500); // Wait for fade-out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash-container ${fade}`}>
      <div className="splash-content">
        <img src="/logo_wellnest.png" alt="Wellnest Logo" className="splash-logo" />
        <h1 className="splash-title">Wellnest</h1>
        <div className="splash-loader"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
