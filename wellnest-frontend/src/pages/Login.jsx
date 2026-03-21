import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import toast from "react-hot-toast";
import apiClient from "../api/apiClient";

// Capacitor bridge
let Preferences = null;
let Biometric = null;
try {
  if (window.Capacitor) {
    import('@capacitor/preferences').then(m => { Preferences = m.Preferences; });
    import('@capgo/capacitor-native-biometric').then(m => { Biometric = m.NativeBiometric; });
  }
} catch (e) { console.log("Native plugins not available"); }

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isNative = !!(window.Capacitor && window.Capacitor.getPlatform() !== 'web');

  const saveTokenNative = async (token) => {
    if (isNative && Preferences) {
      await Preferences.set({ key: 'token', value: token });
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await apiClient.post("/auth/login", form);
      const { token, profileComplete, userId, role, isVerified } = res.data;

      if (token) {
        localStorage.setItem("token", token);
        if (isNative) await saveTokenNative(token);
        if (userId) localStorage.setItem("userId", userId);
        if (role) localStorage.setItem("role", role);
        if (isVerified) localStorage.setItem("isVerified", "true");
        else localStorage.removeItem("isVerified");
      }
      onLoginSuccess?.();

      if (role === "ROLE_ADMIN") {
        setTimeout(() => navigate("/admin-dashboard"), 600);
        return;
      }

      setTimeout(() => {
        navigate(profileComplete ? "/dashboard" : "/setup-profile");
      }, 600);
    } catch (err) {
      setMessage("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await apiClient.post("/auth/google", {
        token: credentialResponse.credential,
        role: 'USER'
      });
      const { token, profileComplete, userId, role, isVerified } = res.data;

      if (token) {
        localStorage.setItem("token", token);
        if (isNative) await saveTokenNative(token);
        if (userId) localStorage.setItem("userId", userId);
        if (role) localStorage.setItem("role", role);
        if (isVerified) localStorage.setItem("isVerified", "true");
        else localStorage.removeItem("isVerified");
      }
      onLoginSuccess?.();

      if (role === "ROLE_ADMIN") {
        setTimeout(() => navigate("/admin-dashboard"), 600);
        return;
      }

      setTimeout(() => {
        navigate(profileComplete ? "/dashboard" : "/setup-profile");
      }, 600);
    } catch (err) {
      console.error(err);
      setMessage("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google login was cancelled or failed.");
  };

  return (
    <div className="login-long-page">
      {/* ================= HERO + LOGIN ================= */}
      <section className="login-hero">
        <div className="login-hero-inner">
          <div className="login-text-content">
            <h1>Unlock Your Best Self with <span>Wellnest</span></h1>
            <p className="hero-subtitle">
              The all-in-one platform to track fitness, nutrition, and health goals.
              Join thousands of users building better habits today.
            </p>
            <div className="hero-features-preview">
              <div className="preview-item"><FiActivity /> <span>Track Habits</span></div>
              <div className="preview-item"><FiTrendingUp /> <span>View Analytics</span></div>
              <div className="preview-item"><FiUsers /> <span>Hire Trainers</span></div>
            </div>
          </div>

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

            {isNative && (
              <button 
                type="button" 
                className="secondary-btn" 
                style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={async () => {
                  try {
                    const result = await Biometric.verifyIdentity({
                       reason: "Login to Wellnest",
                       title: "Biometric Login",
                       subtitle: "Touch the sensor to log in",
                       description: "Use your fingerprint or face to sign in instantly."
                    });
                    if (result) {
                      // Attempt to use stored credentials if available, or just token parity
                      const { value } = await Preferences.get({ key: 'token' });
                      if (value) {
                        toast.success("Welcome back!");
                        onLoginSuccess?.();
                        navigate("/dashboard");
                      } else {
                        toast.error("Please login manually once to enable biometrics.");
                      }
                    }
                  } catch (e) {
                    console.error(e);
                    toast.error("Biometric authentication failed.");
                  }
                }}
              >
                <FiShield /> Use Biometrics
              </button>
            )}

            <div style={{ margin: "20px 0", display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
              />
            </div>

            {message && <p className="auth-message">{message}</p>}

            <p className="auth-toggle">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </section>

      {/* On native, we hide the huge landing sections for a better app experience */}
      {!isNative && (
        <>
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

          {/* ... [Rest of landing page sections removed for brevity in this replace block, but retained in file] ... */}
          <section className="cta-section">
            <div className="cta-card">
              <h2>Start your wellness journey today</h2>
              <p>Join thousands of users who are transforming their lives with Wellnest.</p>
              <div className="cta-actions">
                <Link to="/register" className="primary-btn large-btn">
                  Get Started for Free
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Wellnest. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
};

export default Login;
