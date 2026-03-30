// src/pages/Profile.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiUser, FiPhone, FiLogOut, FiSave, FiX, FiTarget, FiCheck, FiStar, FiBell } from "react-icons/fi";
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
    <div className="dashboard-page">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>My Profile</h1>
          <p className="dashboard-subtitle" style={{ marginTop: '5px' }}>Manage your account settings</p>
        </div>
        <button className="ghost-btn icon-btn" onClick={() => navigate('/dashboard')}>
          <FiX style={{ fontSize: '1.5rem' }} />
        </button>
      </div>

      <div className="profile-grid">

        {/* LEFT COLUMN: Identity Card */}
        <div className="dashboard-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold',
            margin: '0 auto 16px'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
          </div>
          <h2 style={{ margin: '0 0 8px' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Role</strong>
              {user.role?.replace('ROLE_', '')}
            </div>

            {/* Premium Status */}
            <div style={{ padding: '12px', background: user.isPremium ? 'rgba(234, 179, 8, 0.1)' : 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: user.isPremium ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(59, 130, 246, 0.1)' }}>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: user.isPremium ? '#ca8a04' : 'var(--primary)', textTransform: 'uppercase' }}>Subscription</strong>
              <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user.isPremium ? (
                  <span style={{ color: '#ca8a04', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <FiStar /> Wellnest Premium
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Standard Plan</span>
                )}
                
                <button
                  onClick={handleTogglePremium}
                  className="ghost-btn"
                  style={{ 
                    fontSize: '11px', 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '12px',
                    border: '1px solid ' + (user.isPremium ? '#ca8a04' : 'var(--primary)'), 
                    background: user.isPremium ? 'rgba(202, 138, 4, 0.05)' : 'transparent',
                    color: user.isPremium ? '#ca8a04' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    transition: 'all 0.2s'
                  }}
                >
                  {user.isPremium ? <><FiX /> Cancel Subscription</> : <><FiStar /> Unlock Wellnest Premium</>}
                </button>
              </div>
            </div>

            {/* Notification Permission Status */}
            <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Push Notifications</strong>
              <div style={{ marginTop: '5px' }}>
                {permissionStatus === 'granted' ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '14px' }}>
                    Enabled <FiCheck />
                  </span>
                ) : (
                  <button
                    onClick={requestPermission}
                    className="ghost-btn"
                    style={{ 
                      fontSize: '11px', 
                      width: '100%', 
                      padding: '6px', 
                      border: '1px solid var(--primary)', 
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <FiBell /> Enable Notifications
                  </button>
                )}
              </div>
            </div>

            {/* Verification Status */}
            {user.role === 'ROLE_USER' && (
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Verification</strong>
                <div style={{ marginTop: '5px' }}>
                  {user.isVerified ? (
                    <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '14px' }}>Verified <FiCheck /></span>
                  ) : user.verificationRequested ? (
                    <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>Pending Approval</span>
                  ) : (
                    <button
                      onClick={handleRequestVerification}
                      className="ghost-btn"
                      style={{ fontSize: '11px', width: '100%', padding: '6px', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                    >
                      Request Verification
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="secondary-btn" onClick={handleLogout} style={{ marginTop: 'auto', width: '100%', borderColor: '#ef4444', color: '#ef4444' }}>
            <FiLogOut style={{ marginRight: '8px' }} />
            Logout
          </button>
        </div>

        {/* RIGHT COLUMN: Editable Details */}
        <div className="dashboard-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0 }}>Personal Details</h3>
            {!isEditing ? (
              <button className="ghost-btn" onClick={() => setIsEditing(true)}>
                <FiEdit2 style={{ marginRight: '6px' }} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="ghost-btn" onClick={handleCancel} style={{ color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                <button className="primary-btn" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : <><FiSave style={{ marginRight: '6px' }} /> Save</>}
                </button>
              </div>
            )}
          </div>

          <div className="profile-form-grid" style={{ display: 'grid', gap: '20px' }}>

            {/* Phone */}
            <div className="input-group">
              <label className="input-label"><FiPhone /> Phone</label>
              {isEditing ? (
                <input
                  type="text" name="phone" value={formData.phone || ''} onChange={handleChange}
                  className="auth-input" placeholder="+1 234..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
              ) : (
                <div className="read-only-field">{user.phone || 'Not set'}</div>
              )}
            </div>

            {/* Gender */}
            <div className="input-group">
              <label className="input-label"><FiUser /> Gender</label>
              {isEditing ? (
                <select
                  name="gender" value={formData.gender || ''} onChange={handleChange}
                  className="auth-input"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <div className="read-only-field">{user.gender || 'Not set'}</div>
              )}
            </div>

            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid var(--card-border)' }} />
            <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Physical Metrics</h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {/* Age */}
              <div className="input-group">
                <label className="input-label">Age</label>
                {isEditing ? (
                  <input
                    type="number" name="age" value={formData.age || ''} onChange={handleChange}
                    className="auth-input"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                ) : (
                  <div className="read-only-field">{user.age ?? '—'} <span className="unit">yrs</span></div>
                )}
              </div>

              {/* Height */}
              <div className="input-group">
                <label className="input-label">Height</label>
                {isEditing ? (
                  <input
                    type="number" name="heightCm" value={formData.heightCm || ''} onChange={handleChange}
                    className="auth-input"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                ) : (
                  <div className="read-only-field">{user.heightCm ?? '—'} <span className="unit">cm</span></div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {/* Weight */}
              <div className="input-group">
                <label className="input-label">Weight</label>
                {isEditing ? (
                  <input
                    type="number" name="weightKg" value={formData.weightKg || ''} onChange={handleChange}
                    className="auth-input"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  />
                ) : (
                  <div className="read-only-field">{user.weightKg ?? '—'} <span className="unit">kg</span></div>
                )}
              </div>

              {/* Fitness Goal */}
              <div className="input-group">
                <label className="input-label"><FiTarget /> Goal</label>
                {isEditing ? (
                  <select
                    name="fitnessGoal" value={formData.fitnessGoal || ''} onChange={handleChange}
                    className="auth-input"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                  >
                    <option value="">Select Goal</option>
                    <option value="WEIGHT_LOSS">Weight Loss</option>
                    <option value="MUSCLE_GAIN">Muscle Gain</option>
                    <option value="FITNESS">General Fitness</option>
                    <option value="WORKOUT_FREQUENCY">Workout Consistency</option>
                  </select>
                ) : (
                  <div className="read-only-field">{user.fitnessGoal?.replace('_', ' ') || 'Not set'}</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Trainer Verification Section */}
      {user.role === 'ROLE_TRAINER' && (
        <div style={{ maxWidth: '1200px', marginTop: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-main)' }}>🛡️ Trainer Verification</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Upload your certifications to get a verified badge on your profile.</p>
          </div>
          <VerificationUpload />
        </div>
      )}

      <style>{`
            .profile-grid {
                display: grid;
                gap: 24px;
                max-width: 1200px; /* Wider */
                grid-template-columns: 1fr;
            }
            @media (min-width: 768px) {
                .profile-grid {
                    grid-template-columns: 320px 1fr;
                    align-items: stretch; /* Ensure equal height */
                }
            }
            .input-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                margin-bottom: 8px; /* Increased from 6px */
                color: var(--text-muted);
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .read-only-field {
                font-size: 1.2rem; /* Increased from 1.1rem */
                font-weight: 500;
                padding: 4px 0;
                color: var(--text-main);
                margin-top: 4px; /* Added margin */
            }
            .unit {
                font-size: 0.9rem;
                color: var(--text-muted);
                font-weight: normal;
                margin-left: 4px;
            }
            .input-group {
                display: flex;
                flex-direction: column;
            }
        `}</style>
    </div>
  );
};

export default Profile;
