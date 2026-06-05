// src/pages/Profile.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiUser, FiPhone, FiLogOut, FiSave, FiTarget, FiCheck, FiStar, FiBell, FiShield, FiActivity, FiArrowLeft, FiCalendar, FiZap, FiSmartphone } from "react-icons/fi";
import "./Profile.css";
import { updateUserProfile, seedDemoData } from "../api/userApi";
import apiClient from "../api/apiClient";
import storageService from "../api/storageService";
import VerificationUpload from "../components/VerificationUpload";
import { useData } from "../context/DataContext";
import { useNotifications } from "../context/NotificationContext";
import toast from "react-hot-toast";

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const { userData, isUserDataLoaded, refreshUserData, refreshTrackers } = useData();
  const { permissionStatus, requestPermission } = useNotifications();
  
  const [user, setUser] = useState(userData);
  const [loading, setLoading] = useState(!isUserDataLoaded);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState("");

  // PWA Install State
  const [showInstallBtn, setShowInstallBtn] = useState(!!window.deferredPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(ios);
    setIsInstalled(standalone);

    const handleInstallAvailable = () => {
      setShowInstallBtn(true);
    };
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    window.deferredPrompt = null;
    setShowInstallBtn(false);
  };

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Height unit switcher state & validation
  const [heightUnit, setHeightUnit] = useState("cm"); // "cm" or "ft"
  const [heightFtStr, setHeightFtStr] = useState("");
  const [errors, setErrors] = useState({});

  const cmToFeetInchesStr = (cm) => {
    if (!cm) return "";
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round((totalInches % 12) * 10) / 10;
    return `${feet}' ${inches}"`;
  };

  const parseFeetInches = (str) => {
    if (!str) return null;
    const cleanStr = str.trim().toLowerCase();
    const regex = /^\s*([2-8])\s*(?:'|ft|feet)?\s*([0-9]+(?:\.[0-9]+)?)?\s*(?:"|''|in|inches)?\s*$/;
    const match = cleanStr.match(regex);
    if (match) {
      const feet = parseInt(match[1]);
      const inches = match[2] ? parseFloat(match[2]) : 0;
      if (inches >= 0 && inches < 12) {
        const cm = (feet * 30.48) + (inches * 2.54);
        return { feet, inches, cm: Math.round(cm * 10) / 10 };
      }
    }
    return null;
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setHeightUnit("cm");
    if (formData.heightCm) {
      setHeightFtStr(cmToFeetInchesStr(formData.heightCm));
    } else {
      setHeightFtStr("");
    }
    setErrors({});
  };

  const handleSeedDemoData = async () => {
    if (!window.confirm("This will overwrite your current daily tracker logs with 7 days of realistic demo logs (water, steps, meals, sleep, workouts). Proceed?")) {
      return;
    }
    setSeedLoading(true);
    try {
      const res = await seedDemoData();
      setUser(res.data);
      setFormData(res.data);
      
      await Promise.all([
          refreshUserData(),
          refreshTrackers()
      ]);
      alert("Demo data successfully loaded! Streaks, metrics, and charts are now fully populated. 🚀");
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to seed demo data:", err);
      alert("Failed to seed demo data. Please try again.");
    } finally {
      setSeedLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setUser(userData);
      setFormData(userData);
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const resData = await refreshUserData();
        setUser(resData);
        setFormData(resData);
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [refreshUserData]);

  const handleLogout = async () => {
    if (onLogout) {
        await onLogout();
    } else {
        await storageService.clearAuth();
        navigate("/");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const newErrors = {};

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = "Age is required.";
    } else if (isNaN(age) || age < 5 || age > 120) {
      newErrors.age = "Age must be between 5 and 120 years.";
    }

    // Weight validation
    const weight = parseFloat(formData.weightKg);
    if (!formData.weightKg) {
      newErrors.weightKg = "Weight is required.";
    } else if (isNaN(weight) || weight < 20 || weight > 350) {
      newErrors.weightKg = "Weight must be between 20 and 350 kg.";
    }

    // Height validation
    let finalCm = 0;
    if (heightUnit === "cm") {
      finalCm = parseFloat(formData.heightCm);
      if (!formData.heightCm) {
        newErrors.heightCm = "Height is required.";
      } else if (isNaN(finalCm) || finalCm < 50 || finalCm > 250) {
        newErrors.heightCm = "Height must be between 50 and 250 cm.";
      }
    } else {
      if (!heightFtStr) {
        newErrors.heightFtStr = "Height is required.";
      } else {
        const parsed = parseFeetInches(heightFtStr);
        if (!parsed) {
          newErrors.heightFtStr = "Invalid format. e.g. 5' 11\"";
        } else if (parsed.cm < 50 || parsed.cm > 250) {
          newErrors.heightFtStr = "Height must translate between 50 and 250 cm.";
        } else {
          finalCm = parsed.cm;
        }
      }
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = "Gender is required.";
    }

    // Phone validation (Optional)
    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Phone must be 10-15 digits.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      alert(firstError);
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        age: parseInt(formData.age),
        heightCm: finalCm,
        weightKg: parseFloat(formData.weightKg),
        gender: formData.gender,
        fitnessGoal: formData.fitnessGoal,
        phone: formData.phone
      };

      await updateUserProfile(payload);
      setUser({ ...user, ...payload });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.message || "Failed to update profile. Please check your inputs.";
      alert(serverMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(user); // Reset to original
    setIsEditing(false);
  };

  const handleRequestVerification = useCallback(async () => {
    try {
      await apiClient.post("/users/request-verification");
      setUser(prev => ({ ...prev, verificationRequested: true }));
      alert("Verification requested successfully!");
    } catch (error) {
      console.error("Verification request failed:", error);
      alert("Failed to request verification.");
    }
  }, []);

  const TIER_CONFIG = {
    FREE: { label: 'Free', color: '#6b7280', icon: '🌱' },
    BETA_PREMIUM: { label: 'Beta Premium', color: '#10b981', icon: '⚡' },
    PAID_PREMIUM: { label: 'Paid Premium', color: '#f59e0b', icon: '👑' },
    ADMIN_GRANTED: { label: 'Founder Access', color: '#8b5cf6', icon: '🎖️' },
    LIFETIME: { label: 'Lifetime', color: '#ec4899', icon: '♾️' },
  };

  const accessType = user?.premiumAccessType || (user?.isPremium ? 'PAID_PREMIUM' : 'FREE');
  const tierConfig = TIER_CONFIG[accessType] || TIER_CONFIG.FREE;
  const hasPremium = user?.isPremium || (accessType && accessType !== 'FREE');

  const handleUpgradeClick = () => {
    if (hasPremium) {
      toast(`You have ${tierConfig.label} access! ${tierConfig.icon}`, { icon: tierConfig.icon });
    } else {
      navigate('/premium');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) return <div className="dashboard-page"><div className="dashboard-card">Loading...</div></div>;
  if (error) return <div className="dashboard-page"><div className="dashboard-card">{error}</div></div>;

  return (
    <div className="profile-container">
      {/* Hero Header component */}
      <div className="profile-cover">
        <button className="profile-close-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
          <FiArrowLeft size={18} />
        </button>
      </div>

      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
          </div>
        </div>
        
        <div className="profile-identity">
          <h1>
            {user.name || "User"}
            {user?.hasPremiumBadge && (
              <span style={{ color: '#fbbf24', marginLeft: '8px', textShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} title="Elite Member">👑</span>
            )}
          </h1>
          <p>{user.email}</p>
          
          <div className="profile-action-ribbon">
            {!isEditing ? (
              <button className="profile-pill-btn ghost" onClick={handleStartEdit}>
                <FiEdit2 size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <button className="profile-pill-btn ghost" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="profile-pill-btn primary" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : <><FiSave size={14} /> Save</>}
                </button>
              </>
            )}

            <button 
              className={`profile-pill-btn ${hasPremium ? 'premium' : 'ghost'}`} 
              onClick={handleUpgradeClick}
            >
              {hasPremium 
                ? <>{tierConfig.icon} {tierConfig.label}</> 
                : <><FiStar size={14} /> Apply for Beta</>
              }
            </button>

            {!hasPremium && (
              <button 
                className="profile-pill-btn ghost" 
                onClick={() => navigate('/premium')}
                title="View Beta Features"
              >
                <FiStar size={14} /> Beta Access
              </button>
            )}
          </div>
        </div>
      </div>

      {hasPremium && (
        <>
          <h2 className="profile-section-title" style={{ color: tierConfig.color }}>✨ {tierConfig.label} Membership</h2>
          <div className="profile-card premium-details-card" style={{ borderColor: tierConfig.color + '33' }}>
            <div className="premium-details-header">
              <div className="premium-badge-gold" style={{ background: tierConfig.color + '22', color: tierConfig.color }}>
                <FiStar className="spin-slow" /> {accessType.replace('_', ' ')}
              </div>
              <span className="premium-badge-status" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>ACTIVE</span>
            </div>
            
            <div className="premium-details-grid">
              <div className="details-item">
                <span className="label">Access Tier</span>
                <span className="value">{tierConfig.icon} {tierConfig.label}</span>
              </div>
              <div className="details-item">
                <span className="label">Member Since</span>
                <span className="value">
                  {user.subscriptionDate ? formatDate(user.subscriptionDate) : user.premiumActivatedAt ? formatDate(user.premiumActivatedAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <h2 className="profile-section-title">Health Biometrics</h2>
      <div className={`profile-card ${isEditing ? 'edit-mode' : ''}`}>
        <div className="profile-card-header">
          <h3><FiActivity /> Physical Details</h3>
        </div>
        
        {isEditing ? (
          <div className="profile-form-grid">
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Age (Years)</label>
              <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="profile-input-modern" placeholder="Age" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Height</label>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '15px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setHeightUnit("cm");
                      setErrors((prev) => ({ ...prev, heightCm: null, heightFtStr: null }));
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "10px",
                      border: "none",
                      background: heightUnit === "cm" ? "var(--primary)" : "transparent",
                      color: "white",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    CM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeightUnit("ft");
                      setErrors((prev) => ({ ...prev, heightCm: null, heightFtStr: null }));
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "10px",
                      border: "none",
                      background: heightUnit === "ft" ? "var(--primary)" : "transparent",
                      color: "white",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Feet
                  </button>
                </div>
              </div>
              {heightUnit === "cm" ? (
                <input 
                  type="number" 
                  name="heightCm" 
                  value={formData.heightCm || ''} 
                  onChange={handleChange} 
                  className={`profile-input-modern ${errors.heightCm ? 'input-error' : ''}`} 
                  placeholder="Height (cm)" 
                />
              ) : (
                <input 
                  type="text" 
                  name="heightFtStr" 
                  value={heightFtStr} 
                  onChange={(e) => {
                    setHeightFtStr(e.target.value);
                    if (errors.heightFtStr) {
                      setErrors((prev) => ({ ...prev, heightFtStr: null }));
                    }
                  }} 
                  className={`profile-input-modern ${errors.heightFtStr ? 'input-error' : ''}`} 
                  placeholder="e.g. 5' 11&quot;" 
                />
              )}
              {heightUnit === 'ft' && heightFtStr && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: parseFeetInches(heightFtStr) ? '#10b981' : '#f59e0b' }}>
                  {parseFeetInches(heightFtStr) ? (
                    `Parsed: ${parseFeetInches(heightFtStr).feet} ft ${parseFeetInches(heightFtStr).inches} in (${parseFeetInches(heightFtStr).cm} cm)`
                  ) : (
                    `Use format like 5' 11"`
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Weight (kg)</label>
              <input type="number" name="weightKg" value={formData.weightKg || ''} onChange={handleChange} className="profile-input-modern" placeholder="70.5" />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Fitness Goal</label>
              <select name="fitnessGoal" value={formData.fitnessGoal || ''} onChange={handleChange} className="profile-input-modern">
                <option value="">Select Goal</option>
                <option value="WEIGHT_LOSS">Weight Loss</option>
                <option value="MUSCLE_GAIN">Muscle Gain</option>
                <option value="FITNESS">General Fitness</option>
                <option value="WORKOUT_FREQUENCY">Workout Consistency</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="profile-grid-metrics">
            <div className="metric-item interactive">
              <FiCalendar className="metric-icon" />
              <div className="metric-label">Age</div>
              <div className="metric-value">{user.age || '—'}<span className="metric-unit">yrs</span></div>
            </div>
            <div className="metric-item interactive">
              <span className="metric-icon" style={{ display: 'inline-block', transform: 'rotate(90deg)', fontSize: '1.4rem' }}>📏</span>
              <div className="metric-label">Height</div>
              <div className="metric-value">{user.heightCm || '—'}<span className="metric-unit">cm</span></div>
            </div>
            <div className="metric-item interactive">
              <span className="metric-icon" style={{ fontSize: '1.4rem' }}>kg</span>
              <div className="metric-label">Weight</div>
              <div className="metric-value">{user.weightKg || '—'}<span className="metric-unit">kg</span></div>
            </div>
            <div className="metric-item interactive">
              <FiTarget className="metric-icon" />
              <div className="metric-label">Goal</div>
              <div className="metric-value" style={{ fontSize: '0.9rem', lineHeight: '1.2rem', marginTop: '4px' }}>
                {user.fitnessGoal?.replace('_', ' ') || 'Not Set'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OWNED COLLECTIBLES */}
      {(user.hasPremiumBadge || user.hasGoldTheme || user.hasEmeraldTheme) && (
        <>
          <h2 className="profile-section-title">📦 Owned Collectibles</h2>
          <div className="profile-card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '20px' }}>
            {user.hasPremiumBadge && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '16px', color: '#fbbf24', fontSize: '13px', fontWeight: 'bold' }}>
                👑 Elite Badge
              </div>
            )}
            {user.hasGoldTheme && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '16px', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>
                🟡 Gold Theme
              </div>
            )}
            {user.hasEmeraldTheme && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                🌿 Emerald Theme
              </div>
            )}
          </div>
        </>
      )}

      <h2 className="profile-section-title">Account Settings</h2>
      <div className="profile-card" style={{ padding: '0 24px' }}>
        <div className="profile-list">
          
          {/* Phone Field */}
          <div className="profile-list-item">
            <div className="item-left">
              <div className="item-icon"><FiPhone /></div>
              <div className="item-details">
                <h4>Phone Number</h4>
                {isEditing ? (
                  <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="profile-input-modern" placeholder="+1 234..." style={{ marginTop: '8px', padding: '8px 12px' }} />
                ) : (
                  <p>{user.phone || 'Tap Edit to add phone'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Gender Field */}
          <div className="profile-list-item">
            <div className="item-left">
              <div className="item-icon"><FiUser /></div>
              <div className="item-details">
                <h4>Gender</h4>
                {isEditing ? (
                  <select name="gender" value={formData.gender || ''} onChange={handleChange} className="profile-input-modern" style={{ marginTop: '8px', padding: '8px 12px' }}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p>{user.gender || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notification System Toggle */}
          <div className="profile-list-item">
            <div className="item-left">
              <div className="item-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><FiBell /></div>
              <div className="item-details">
                <h4>Push Notifications</h4>
                <p>Allow Smart Reminders</p>
              </div>
            </div>
            <div className="item-right">
              {permissionStatus === 'granted' ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>On <FiCheck /></span>
              ) : (
                <button onClick={requestPermission} className="profile-pill-btn ghost" style={{ padding: '6px 12px', fontSize: '11px' }}>Enable</button>
              )}
            </div>
          </div>

          {/* Account Role */}
          <div className="profile-list-item">
            <div className="item-left">
              <div className="item-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><FiShield /></div>
              <div className="item-details">
                <h4>Account Role</h4>
                <p>System Privileges</p>
              </div>
            </div>
            <div className="item-right">
              {user.role?.replace('ROLE_', '')}
            </div>
          </div>

          {/* PWA Installation Section */}
          {showInstallBtn && (
            <div className="profile-list-item" style={{ background: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', margin: '12px 0', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px' }}>
              <div className="item-left">
                <div className="item-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><FiSmartphone /></div>
                <div className="item-details">
                  <h4>Install Wellnest App</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Add to home screen for fullscreen access & offline use.</p>
                </div>
              </div>
              <div className="item-right">
                <button 
                  onClick={handleInstallApp} 
                  className="profile-pill-btn primary" 
                  style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Install
                </button>
              </div>
            </div>
          )}

          {isIOS && !isInstalled && (
            <div className="profile-list-item" style={{ background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', margin: '12px 0', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px' }}>
              <div className="item-left" style={{ width: '100%' }}>
                <div className="item-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}><FiSmartphone /></div>
                <div className="item-details" style={{ width: '100%' }}>
                  <h4>Install on iPhone / iPad</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4rem' }}>
                    Tap the <strong>Share</strong> button <span style={{ fontSize: '15px' }}>⎋</span> at the bottom of Safari, then select <strong>Add to Home Screen</strong> 📲
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seed Demo Data Card */}
          <div className="profile-list-item" style={{ borderBottom: 'none', paddingTop: '20px' }}>
            <div className="item-left" style={{ width: '100%' }}>
              <div className="item-icon" style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--primary)' }}><FiZap /></div>
              <div className="item-details" style={{ width: '100%' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Demo Sandbox Mode
                  <span style={{ fontSize: '9px', fontWeight: 800, background: 'rgba(20, 184, 166, 0.15)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>Pitch Tool</span>
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4rem' }}>
                  Click to populate 7 days of realistic habit logs (water, sleep, active steps, weights, workouts). Perfect for displaying active streaks, compliance levels, and analytics charts during pitches.
                </p>
                <button 
                  className="profile-pill-btn primary" 
                  onClick={handleSeedDemoData} 
                  disabled={seedLoading}
                  style={{ width: 'auto', marginTop: '16px', padding: '10px 24px', fontSize: '12px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '20px', fontWeight: 'bold' }}
                >
                  {seedLoading ? "Seeding Database..." : "🚀 Load Sandbox Demo Data"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {user.role === 'ROLE_TRAINER' && (
        <>
          <h2 className="profile-section-title">Trainer Portal</h2>
          <div className="profile-card">
            <div className="profile-card-header">
              <h3><FiShield /> Identity Verification</h3>
              {user.isVerified ? (
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px', border: '1px solid #10b981', padding: '4px 8px', borderRadius: '6px' }}>Verified</span>
              ) : user.verificationRequested ? (
                <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '13px', border: '1px solid #f59e0b', padding: '4px 8px', borderRadius: '6px' }}>Pending</span>
              ) : (
                <button onClick={handleRequestVerification} className="profile-pill-btn primary" style={{ padding: '6px 12px', fontSize: '11px' }}>Request Badge</button>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>Upload your certifications to receive the verified trainer badge on your profile. This increases trust with potential clients.</p>
            <VerificationUpload />
          </div>
        </>
      )}

      {/* Dangerous Action */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
        <button className="profile-pill-btn danger" onClick={handleLogout} style={{ padding: '12px 32px' }}>
          <FiLogOut /> Sign Out Successfully
        </button>
      </div>

    </div>
  );
};

export default Profile;
