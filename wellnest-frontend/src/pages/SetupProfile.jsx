import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { FiUser, FiActivity, FiTarget, FiMonitor, FiPhone } from "react-icons/fi";

const SetupProfile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    age: "",
    heightCm: "",
    weightKg: "",
    gender: "",
    fitnessGoal: "",
    phone: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await apiClient.put("/users/me/profile", formData);
      setMessage("Profile setup completed!");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Profile setup error:", err);
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '600px' }}>
        <div className="auth-title">
          <FiMonitor className="auth-title-icon" />
          <h2>Complete your profile</h2>
          <p className="auth-subtitle">Tell us about your fitness details</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid-row">
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FiActivity className="input-icon" />
              <input
                type="number"
                name="heightCm"
                placeholder="Height (cm)"
                value={formData.heightCm}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-grid-row">
            <div className="input-group">
              <FiActivity className="input-icon" />
              <input
                type="number"
                name="weightKg"
                placeholder="Weight (kg)"
                value={formData.weightKg}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FiUser className="input-icon" />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="role-select"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* New Phone Number Field */}
          <div className="input-group">
            <FiPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (Optional)"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <FiTarget className="input-icon" />
            <select
              name="fitnessGoal"
              value={formData.fitnessGoal}
              onChange={handleChange}
              required
              className="role-select"
            >
              <option value="">Select Fitness Goal</option>
              <option value="WEIGHT_LOSS">Weight Loss</option>
              <option value="MUSCLE_GAIN">Muscle Gain</option>
              <option value="MAINTAIN">Maintain Body</option>
            </select>
          </div>

          <button type="submit" className="primary-btn" style={{ marginTop: '10px' }}>
            Save & Continue
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
};

export default SetupProfile;
