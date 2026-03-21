import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { FiMail, FiLock, FiKey } from "react-icons/fi";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Sending OTP...");

    try {
      await apiClient.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
      toast.success("If this email is registered, an OTP has been sent.", { id: toastId });
      setStep(2);
    } catch (err) {
      toast.error("Something went wrong. Try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying OTP...");

    try {
      await apiClient.post(
        `/auth/reset-password?token=${encodeURIComponent(otp)}&newPassword=${encodeURIComponent(newPassword)}`
      );
      toast.success("Password reset successfully! Please log in.", { id: toastId });
      navigate("/");
    } catch (err) {
      const errMsg = err?.response?.data || "Invalid or expired OTP.";
      toast.error(typeof errMsg === 'string' ? errMsg : "Invalid or expired OTP.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">
          <h2>{step === 1 ? "Forgot password" : "Reset Password"}</h2>
          <p className="auth-subtitle">
            {step === 1 
              ? "Enter your registered email to receive a 6-digit OTP" 
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <div className="input-group">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="Registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="input-group">
              <FiKey className="input-icon" />
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Resetting..." : "Set New Password"}
            </button>
            <div className="auth-toggle" style={{ marginTop: "12px" }}>
              <button 
                type="button" 
                className="link-inline-btn" 
                onClick={() => setStep(1)}
              >
                Back to Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
