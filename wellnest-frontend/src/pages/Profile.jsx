// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiUser, FiPhone, FiLogOut, FiSave, FiX, FiActivity, FiTarget } from "react-icons/fi";
import { fetchCurrentUser, updateUserProfile } from "../api/userApi";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetchCurrentUser();
      setUser(res.data);
      setFormData(res.data); // Initialize form with current data
    } catch (err) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // Backend expects the full object logic we saw in Controller, 
      // but strictly defined in ProfileUpdateRequest.
      // We pass the formData which matches the fields.
      const payload = {
        age: formData.age ? parseInt(formData.age) : null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        gender: formData.gender,
        fitnessGoal: formData.fitnessGoal,
        phone: formData.phone
      };

      await updateUserProfile(payload);

      // Refresh user data (or just update local state)
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
