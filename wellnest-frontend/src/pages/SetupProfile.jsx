import React, { useState, useEffect } from "react";
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

  // Height unit switcher states
  const [heightUnit, setHeightUnit] = useState("cm"); // "cm" or "ft"
  const [heightFtStr, setHeightFtStr] = useState("");
  const [parsedHeightCm, setParsedHeightCm] = useState(null);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper to parse Feet & Inches string (e.g. 5' 11", 5 11, 5ft 11, 5')
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

  // Update live preview when feet string changes
  useEffect(() => {
    if (heightUnit === "ft" && heightFtStr) {
      const parsed = parseFeetInches(heightFtStr);
      setParsedHeightCm(parsed);
    } else {
      setParsedHeightCm(null);
    }
  }, [heightFtStr, heightUnit]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear field-specific error
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = "Age is required.";
    } else if (isNaN(age) || age < 5 || age > 120) {
      newErrors.age = "Age must be between 5 and 120.";
    }

    // Weight validation
    const weight = parseFloat(formData.weightKg);
    if (!formData.weightKg) {
      newErrors.weightKg = "Weight is required.";
    } else if (isNaN(weight) || weight < 20 || weight > 350) {
      newErrors.weightKg = "Weight must be between 20 and 350 kg.";
    }

    // Height validation & conversion check
    if (heightUnit === "cm") {
      const height = parseFloat(formData.heightCm);
      if (!formData.heightCm) {
        newErrors.heightCm = "Height is required.";
      } else if (isNaN(height) || height < 50 || height > 250) {
        newErrors.heightCm = "Height must be between 50 and 250 cm.";
      }
    } else {
      if (!heightFtStr) {
        newErrors.heightFtStr = "Height is required.";
      } else {
        const parsed = parseFeetInches(heightFtStr);
        if (!parsed) {
          newErrors.heightFtStr = "Invalid format. e.g. 5' 11\" or 5 11";
        } else if (parsed.cm < 50 || parsed.cm > 250) {
          newErrors.heightFtStr = "Translated height must be between 50 and 250 cm.";
        }
      }
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = "Gender selection is required.";
    }

    // Goal validation
    if (!formData.fitnessGoal) {
      newErrors.fitnessGoal = "Goal selection is required.";
    }

    // Phone validation (Optional)
    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "Phone must be 10-15 digits.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    let finalHeightCm = formData.heightCm;
    if (heightUnit === "ft") {
      const parsed = parseFeetInches(heightFtStr);
      finalHeightCm = parsed ? parsed.cm : "";
    }

    const payload = {
      ...formData,
      heightCm: finalHeightCm ? parseFloat(finalHeightCm) : null,
      age: formData.age ? parseInt(formData.age) : null,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
    };

    try {
      await apiClient.put("/users/me/profile", payload);
      setMessage("Profile setup completed successfully! 🚀");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      console.error("Profile setup error:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.displayMessage;
      setMessage(serverMsg || "Failed to update profile. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "600px" }}>
        <div className="auth-title">
          <FiMonitor className="auth-title-icon" />
          <h2>Complete your profile</h2>
          <p className="auth-subtitle">Tell us about your fitness details</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid-row" style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
            {/* Age Field */}
            <div className="form-field-wrapper" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <div className={`input-group ${errors.age ? "has-error" : ""}`}>
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
              {errors.age && (
                <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                  {errors.age}
                </span>
              )}
            </div>

            {/* Height Field with Switcher */}
            <div className="form-field-wrapper" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", padding: "0 4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Height Unit</span>
                <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "15px", padding: "2px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setHeightUnit("cm");
                      setErrors((prev) => ({ ...prev, heightCm: null, heightFtStr: null }));
                    }}
                    style={{
                      padding: "3px 10px",
                      fontSize: "11px",
                      border: "none",
                      background: heightUnit === "cm" ? "var(--primary)" : "transparent",
                      color: "white",
                      borderRadius: "13px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
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
                      padding: "3px 10px",
                      fontSize: "11px",
                      border: "none",
                      background: heightUnit === "ft" ? "var(--primary)" : "transparent",
                      color: "white",
                      borderRadius: "13px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    Feet
                  </button>
                </div>
              </div>

              {heightUnit === "cm" ? (
                <div className={`input-group ${errors.heightCm ? "has-error" : ""}`}>
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
              ) : (
                <div className={`input-group ${errors.heightFtStr ? "has-error" : ""}`}>
                  <FiActivity className="input-icon" />
                  <input
                    type="text"
                    name="heightFtStr"
                    placeholder="Height (e.g. 5' 11&quot;)"
                    value={heightFtStr}
                    onChange={(e) => {
                      setHeightFtStr(e.target.value);
                      if (errors.heightFtStr) {
                        setErrors((prev) => ({ ...prev, heightFtStr: null }));
                      }
                    }}
                    required
                  />
                </div>
              )}

              {/* Conversion Live Preview */}
              {heightUnit === "ft" && heightFtStr && (
                <span style={{ fontSize: "11px", marginTop: "4px", paddingLeft: "8px", color: parsedHeightCm ? "#34d399" : "#fbbf24", textAlign: "left" }}>
                  {parsedHeightCm ? (
                    `Parsed: ${parsedHeightCm.feet} ft ${parsedHeightCm.inches} in (${parsedHeightCm.cm} cm)`
                  ) : (
                    `Use format like 5' 11"`
                  )}
                </span>
              )}

              {errors.heightCm && (
                <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                  {errors.heightCm}
                </span>
              )}
              {errors.heightFtStr && (
                <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                  {errors.heightFtStr}
                </span>
              )}
            </div>
          </div>

          <div className="auth-grid-row" style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
            {/* Weight Field */}
            <div className="form-field-wrapper" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <div className={`input-group ${errors.weightKg ? "has-error" : ""}`}>
                <FiActivity className="input-icon" />
                <input
                  type="number"
                  step="0.1"
                  name="weightKg"
                  placeholder="Weight (kg)"
                  value={formData.weightKg}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.weightKg && (
                <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                  {errors.weightKg}
                </span>
              )}
            </div>

            {/* Gender Field */}
            <div className="form-field-wrapper" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              <div className={`input-group ${errors.gender ? "has-error" : ""}`}>
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
              {errors.gender && (
                <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                  {errors.gender}
                </span>
              )}
            </div>
          </div>

          {/* Phone Field */}
          <div className="form-field-wrapper" style={{ display: "flex", flexDirection: "column", marginBottom: "15px" }}>
            <div className={`input-group ${errors.phone ? "has-error" : ""}`}>
              <FiPhone className="input-icon" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (Optional)"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            {errors.phone && (
              <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                {errors.phone}
              </span>
            )}
          </div>

          {/* Fitness Goal Field */}
          <div className="form-field-wrapper" style={{ display: "flex", flexDirection: "column", marginBottom: "20px" }}>
            <div className={`input-group ${errors.fitnessGoal ? "has-error" : ""}`}>
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
            {errors.fitnessGoal && (
              <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", paddingLeft: "8px", textAlign: "left" }}>
                {errors.fitnessGoal}
              </span>
            )}
          </div>

          <button type="submit" className="primary-btn" style={{ marginTop: "10px" }} disabled={loading}>
            {loading ? "Saving Profile..." : "Save & Continue"}
          </button>
        </form>

        {message && (
          <p 
            className="auth-message" 
            style={{ 
              marginTop: "15px", 
              color: message.includes("failed") || message.includes("wrong") || message.includes("Invalid") ? "#f87171" : "#34d399" 
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default SetupProfile;
