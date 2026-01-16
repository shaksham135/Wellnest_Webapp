import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiLogIn,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiActivity,
  FiTrendingUp,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import apiClient from "../api/apiClient";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await apiClient.post("/auth/login", form);
      const { token, profileComplete, userId } = res.data;

      if (token) {
        localStorage.setItem("token", token);
        if (userId) localStorage.setItem("userId", userId);
      }
      onLoginSuccess?.();

      setTimeout(() => {
        navigate(profileComplete ? "/dashboard" : "/setup-profile");
      }, 600);
    } catch (err) {
      setMessage("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-long-page">
      {/* ================= HERO + LOGIN ================= */}
      <section className="login-hero">
        <div className="login-hero-inner">
          <h1>Welcome to <span>Wellnest</span></h1>
          <p className="hero-subtitle">
            Your personal health & fitness command center
          </p>

          <form className="login-form-card" onSubmit={handleSubmit}>
            <h2>Sign in to your account</h2>

            <div className="input-group">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group password-group">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="login-form-row">
              <button
                type="button"
                className="link-inline-btn"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <button className="primary-btn" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            {message && <p className="auth-message">{message}</p>}

            <p className="auth-toggle">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </section>

      {/* ================= WHAT IS WELLNEST ================= */}
      <section className="info-section">
        <h2>What is Wellnest?</h2>
        <p>
          Wellnest is a smart health and fitness platform designed to help you
          build consistent habits, track daily activities, and understand your
          progress using clean analytics and simple tools.
        </p>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features-section">
        <h2>What you can do with Wellnest</h2>

        <div className="features-grid">
          <div className="feature-card">
            <FiActivity />
            <h3>Track Daily Activities</h3>
            <p>
              Log workouts, meals, water intake, and sleep effortlessly in one
              place.
            </p>
          </div>

          <div className="feature-card">
            <FiTrendingUp />
            <h3>Progress & Analytics</h3>
            <p>
              Visualize your progress with streaks, goals, charts, and health
              metrics.
            </p>
          </div>

          <div className="feature-card">
            <FiUsers />
            <h3>Trainer Matching</h3>
            <p>
              Find fitness trainers based on your goals, preferences, and
              availability.
            </p>
          </div>

          <div className="feature-card">
            <FiShield />
            <h3>Secure & Private</h3>
            <p>
              Your health data is protected with secure authentication and
              privacy-first design.
            </p>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="steps-section">
        <h2>How it works</h2>

        <div className="steps-grid">
          <div className="step">
            <span>1</span>
            <p>Create your account</p>
          </div>
          <div className="step">
            <span>2</span>
            <p>Track your daily habits</p>
          </div>
          <div className="step">
            <span>3</span>
            <p>Analyze progress & improve</p>
          </div>
        </div>
      </section>

      {/* ================= SECURITY ================= */}
      <section className="trust-section">
        <h2>Your data, fully protected</h2>
        <p>
          Wellnest uses secure authentication, protected APIs, and role-based
          access to ensure your personal health data remains private and safe.
          We never sell your data to third parties.
        </p>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta-section">
        <h2>Start your wellness journey today</h2>
        <div className="cta-actions">
          <Link to="/register" className="primary-btn">
            Create account
          </Link>
          <button
            className="secondary-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Login
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Wellnest. All rights reserved.</p>
        <div className="footer-links">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
