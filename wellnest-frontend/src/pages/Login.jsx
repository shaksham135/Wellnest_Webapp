import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiTrendingUp,
  FiMic,
  FiZap,
  FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import apiClient from "../api/apiClient";

import storageService from "../api/storageService";

// Plugins
let Browser = null;
try {
  if (window.Capacitor) {
    import('@capacitor/browser').then(m => { Browser = m.Browser; });
  }
} catch (e) { console.log("Native plugins not available"); }



const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isNative = !!(window.Capacitor && window.Capacitor.getPlatform() !== 'web');

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (codeResponse) => handleGoogleSuccess(codeResponse),
    onError: (error) => toast.error("Google Login Failed"),
    ux_mode: isNative ? 'redirect' : 'popup',
    redirect_uri: isNative ? 'https://wellnest-eight-psi.vercel.app/' : undefined
  });

  // Handle Google Redirect Callback for Native
  useEffect(() => {
    if (!isNative) return;
    
    const checkHash = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      
      if (accessToken) {
          console.log("Detected Google Access Token in Hash");
          handleGoogleSuccess({ access_token: accessToken });
          // Clean up hash
          window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  // Handle Initial Auto-Login check (Skip login page if token exists)
  useEffect(() => {
    const checkExistingSession = async () => {
        const token = await storageService.getItem("token");
        if (token) {
            const role = await storageService.getItem("role");
            const profileComplete = await storageService.getItem("isVerified") === "true"; // Simple check
            
            if (role === "ROLE_ADMIN") {
                navigate("/admin-dashboard");
            } else {
                navigate(profileComplete ? "/dashboard" : "/setup-profile");
            }
        }
    };
    checkExistingSession();
  }, [navigate]);

  const saveCredentials = async (data) => {
    const { token, userId, role, isVerified } = data;
    if (token) await storageService.setItem("token", token);
    if (userId) await storageService.setItem("userId", userId.toString());
    if (role) await storageService.setItem("role", role);
    if (isVerified) await storageService.setItem("isVerified", "true");
    else await storageService.removeItem("isVerified");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await apiClient.post("/auth/login", form);
      const { profileComplete, role } = res.data;

      if (res.data.token) {
        await saveCredentials(res.data);
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

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await apiClient.post("/auth/google", {
        token: tokenResponse.access_token || tokenResponse.credential,
        role: 'USER'
      });
      if (res.data.token) {
        await saveCredentials(res.data);
      }
      onLoginSuccess?.();
      const { role, profileComplete } = res.data;
      if (role === "ROLE_ADMIN") {
        setTimeout(() => navigate("/admin-dashboard"), 600);
        return;
      }
      setTimeout(() => {
        navigate(profileComplete ? "/dashboard" : "/setup-profile");
      }, 600);
    } catch (err) {
      toast.error("Google Login Failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    const clientId = "824393698796-2a2k17e527hbnd9irvhjv72pnngc5jc7.apps.googleusercontent.com";
    const redirectUri = "https://wellnest-eight-psi.vercel.app/"; // Reverting to Vercel for Web Client ID compatibility
    const scope = encodeURIComponent("email profile openid");
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&status=login&response_type=token&scope=${scope}`;
    
    if (Browser) {
        await Browser.open({ url: authUrl });
    } else {
        window.location.assign(authUrl);
    }
  };

  const renderLoginForm = () => (
    <form id="login-form" className="login-form-card" onSubmit={handleSubmit}>
      {isNative && (
        <div className="auth-logo-header">
           <img src="/logo_wellnest.png" alt="Wellnest Logo" className="auth-logo" />
           <h2 className="auth-brand-name">Wellnest</h2>
        </div>
      )}
      <h2>{isNative ? "Welcome Back" : "Sign in to your account"}</h2>

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

      <button 
        type="button" 
        className="google-auth-btn" 
        onClick={() => isNative ? handleNativeGoogleLogin() : loginWithGoogle()}
        disabled={loading}
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
        <span>Continue with Google</span>
      </button>

      {message && <p className="auth-message">{message}</p>}

      <p className="auth-toggle">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );

  if (isNative) {
    return (
      <div className="minimal-auth-page">
        <div className="auth-container">
           {renderLoginForm()}
        </div>
      </div>
    );
  }

  return (
    <div className="login-long-page">
      <section className="login-hero">
        <div className="login-hero-inner">
          <div className="login-text-content">
            <h1>Track Your Health. <span>Just By Speaking.</span></h1>
            <p className="hero-subtitle">
              Log water, workouts, sleep and daily habits using natural voice commands.
              No forms. No manual tracking.
            </p>
            <div className="hero-features-preview">
              <div className="preview-item"><FiMic /> <span>Log by Voice</span></div>
              <div className="preview-item"><FiZap /> <span>Daily Readiness</span></div>
              <div className="preview-item"><FiTrendingUp /> <span>Weekly Progress</span></div>
            </div>
          </div>

          {renderLoginForm()}
        </div>
      </section>

      <section className="info-section">
        <h2>Why Choose Wellnest?</h2>
        <p>
          Most wellness apps make tracking feel like work. Wellnest is different.
          Just speak naturally and let the app handle the logging, tracking and insights for you.
        </p>
      </section>

      <section className="features-section">
        <h2>Everything you need to succeed</h2>

        <div className="features-grid">
          <div className="feature-card">
            <FiMic />
            <h3>Voice Logging</h3>
            <p>
              Track water, workouts, sleep and daily activities simply by speaking.
            </p>
          </div>

          <div className="feature-card">
            <FiZap />
            <h3>Daily Readiness</h3>
            <p>
              See how your habits impact your energy, focus and recovery.
            </p>
          </div>

          <div className="feature-card">
            <FiTrendingUp />
            <h3>Weekly Insights</h3>
            <p>
              Get simple summaries and trends based on your wellness activity.
            </p>
          </div>

          <div className="feature-card">
            <FiCalendar />
            <h3>Consistency Tracking</h3>
            <p>
              Build streaks, stay accountable and make healthy habits stick.
            </p>
          </div>
        </div>
      </section>

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
