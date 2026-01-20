import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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
          <h1>Unlock Your Best Self with <span>Wellnest</span></h1>
          <p className="hero-subtitle">
            The all-in-one platform to track fitness, nutrition, and health goals.
            Join thousands of users building better habits today.
          </p>

          <form id="login-form" className="login-form-card" onSubmit={handleSubmit}>
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
        <h2>Why Choose Wellnest?</h2>
        <p>
          Achieving your health goals shouldn't be complicated. Wellnest brings everything you need—activity tracking, professional guidance, and deep insights—into one seamless experience. Whether you want to lose weight, build muscle, or simply live healthier, we have the tools to help you succeed.
        </p>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features-section">
        <h2>Everything you need to succeed</h2>

        <div className="features-grid">
          <div className="feature-card">
            <FiActivity />
            <h3>Complete Tracking</h3>
            <p>
              Log workouts, meals, water intake, and sleep patterns all in one intuitive dashboard.
            </p>
          </div>

          <div className="feature-card">
            <FiTrendingUp />
            <h3>Advanced Analytics</h3>
            <p>
              Visualize your journey with detailed charts, streak tracking, and weekly progress reports.
            </p>
          </div>

          <div className="feature-card">
            <FiUsers />
            <h3>Expert Guidance</h3>
            <p>
              Connect with certified trainers, get personalized diet plans, and reach your goals faster.
            </p>
          </div>

          <div className="feature-card">
            <FiShield />
            <h3>Secure & Private</h3>
            <p>
              Your health data is encrypted and secure. We prioritize your privacy above all else.
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

      {/* ================= FOR TRAINERS ================= */}
      <section className="info-section" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
        <h2 style={{ marginBottom: '10px' }}>Are you a Fitness Professional?</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 30px' }}>
          Join Wellnest as a Trainer to manage clients, create personalized diet plans, and track their progress with real-time analytics. Grow your reach and help more people achieve their goals.
        </p>
        <div className="features-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="feature-card">
            <FiUsers />
            <h3>Client Management</h3>
            <p>Easily manage your client roster and view their daily activity logs.</p>
          </div>
          <div className="feature-card">
            <FiActivity />
            <h3>Diet & Workout Plans</h3>
            <p>Create and assign custom nutrition and exercise plans instantly.</p>
          </div>
          <div className="feature-card">
            <FiTrendingUp />
            <h3>Client Analytics</h3>
            <p>Get deep insights into your clients' health trends and adherence.</p>
          </div>
        </div>
      </section>
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
        <div className="cta-card">
          <h2>Start your wellness journey today</h2>
          <p>Join thousands of users who are transforming their lives with Wellnest.</p>
          <div className="cta-actions">
            <Link to="/register" className="primary-btn large-btn">
              Get Started for Free
            </Link>
            <button
              className="secondary-btn large-btn"
              onClick={() => {
                const form = document.getElementById('login-form');
                form?.scrollIntoView({ behavior: 'smooth' });
                // Optional: focus email after scroll
                setTimeout(() => document.querySelector('input[name="email"]')?.focus(), 500);
              }}
            >
              Login to Existing Account
            </button>
          </div>
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
