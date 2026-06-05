import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiShare } from 'react-icons/fi';
import './PWAInstallBanner.css';

const PWAInstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Check if user previously dismissed the prompt
    const isDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
    if (isDismissed) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // If iOS, show custom banner after a short delay
    if (ios) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Standard PWA Install detection
    const handleInstallAvailable = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        setIsVisible(true);
      }
    };

    // If prompt is already captured in window
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setIsVisible(true);
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show native prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install Choice: ${outcome}`);

    // Clean up
    window.deferredPrompt = null;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="pwa-install-banner card">
      <div className="pwa-install-content">
        <div className="pwa-icon-wrapper">
          {isIOS ? <FiShare className="pwa-icon pulse" /> : <FiDownload className="pwa-icon pulse" />}
        </div>
        <div className="pwa-text-section">
          <h4>Install Wellnest</h4>
          <p>
            {isIOS 
              ? "Tap the Share button below and select 'Add to Home Screen' to install." 
              : "Install our voice-first health tracker as an app for quick access!"}
          </p>
        </div>
      </div>
      
      <div className="pwa-action-section">
        {!isIOS && (
          <button className="pwa-btn-primary" onClick={handleInstallClick}>
            Install
          </button>
        )}
        <button className="pwa-btn-close" onClick={handleDismiss} title="Dismiss">
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
