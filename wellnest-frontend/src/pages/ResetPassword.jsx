import React, { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";
import { FiKey } from "react-icons/fi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await apiClient.post(
        `/auth/reset-password?token=${encodeURIComponent(
          token
        )}&newPassword=${encodeURIComponent(password)}`
      );
      setMessage(res.data || "Password reset successfully");

      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      const msg = err.response?.data || "Failed to reset password";
      setMessage(msg);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">
          <FiKey className="auth-title-icon" />
          <h2>Reset password</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!token && (
            <input
              type="text"
              placeholder="6-digit OTP"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit" className="primary-btn">
            Change password
          </button>
        </form>

        {message && <p className="auth-message">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
