// src/pages/Profile.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiUser, FiPhone, FiLogOut, FiSave, FiTarget, FiCheck, FiStar, FiBell, FiShield, FiActivity, FiArrowLeft, FiCalendar } from "react-icons/fi";
import "./Profile.css";
import { updateUserProfile, togglePremium } from "../api/userApi";
import apiClient from "../api/apiClient";
import storageService from "../api/storageService";
import VerificationUpload from "../components/VerificationUpload";
import { useData } from "../context/DataContext";
import { useNotifications } from "../context/NotificationContext";

const Profile = ({ onLogout }) => {
  const navigate = useNavigate();
  const { userData, isUserDataLoaded, refreshUserData } = useData();
  const { permissionStatus, requestPermission } = useNotifications();
  
  const [user, setUser] = useState(userData);
  const [loading, setLoading] = useState(!isUserDataLoaded);
  const [error, setError] = useState("");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

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
    setSaveLoading(true);
    try {
      const payload = {
        age: formData.age ? parseInt(formData.age) : null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        gender: formData.gender,
        fitnessGoal: formData.fitnessGoal,
        phone: formData.phone
      };

      await updateUserProfile(payload);
      setUser({ ...user, ...payload });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile. Please check your inputs.");
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

  const handleTogglePremium = async () => {
    try {
      const isNowPremium = await togglePremium();
      const updatedUser = { ...user, isPremium: isNowPremium.data };
      setUser(updatedUser);
      
      // Update local storage/context too
      const stored = await storageService.getUser();
      if (stored) {
        await storageService.setUser({ ...stored, isPremium: isNowPremium.data });
      }
      
      await refreshUserData();
      alert(isNowPremium.data ? "You are now a Premium user! Enjoy AI-personalized notifications." : "Premium status removed.");
    } catch (error) {
      console.error("Failed to toggle premium:", error);
      alert("Error toggling premium status.");
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
          <h1>{user.name || "User"}</h1>
          <p>{user.email}</p>
          
          <div className="profile-action-ribbon">
            {!isEditing ? (
              <button className="profile-pill-btn ghost" onClick={() => setIsEditing(true)}>
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
              className={`profile-pill-btn ${user.isPremium ? 'premium' : 'ghost'}`} 
              onClick={handleTogglePremium}
            >
              {user.isPremium ? <><FiStar size={14} /> Premium Active</> : <><FiStar size={14} /> Upgrade to VIP</>}
            </button>

            {!user.isPremium && (
              <button 
                className="profile-pill-btn ghost" 
                onClick={() => navigate('/premium')}
                title="View Premium Features"
              >
                <FiStar size={14} /> VIP Features
              </button>
            )}
          </div>
        </div>
      </div>

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
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Height (cm)</label>
              <input type="number" name="heightCm" value={formData.heightCm || ''} onChange={handleChange} className="profile-input-modern" placeholder="175" />
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
