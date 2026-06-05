import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import apiClient from "../api/apiClient";
import storageService from "../api/storageService";

// Capacitor bridge
let Browser = null;
try {
  if (window.Capacitor) {
    import('@capacitor/browser').then(m => { Browser = m.Browser; });
  }
} catch (e) { console.log("Native plugins not available"); }

/* ─── Validators ─────────────────────────────────────── */
const VALIDATORS = {
  name: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    if (v.trim().length > 60) return "Name must not exceed 60 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return "Name can only contain letters, spaces, hyphens and apostrophes";
    return "";
  },
  email: (v) => {
    if (!v.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Enter a valid email address (e.g. user@example.com)";
    if (v.trim().length > 120) return "Email must not exceed 120 characters";
    return "";
  },
  phone: (v) => {
    if (!v) return ""; // optional
    const cleaned = v.replace(/\s+/g, "");
    if (cleaned && !/^\+?[0-9]{7,15}$/.test(cleaned)) return "Phone must be 7–15 digits (optionally starting with +)";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required";
    if (v.length < 8) return "Password must be at least 8 characters";
    if (v.length > 72) return "Password must not exceed 72 characters";
    if (!/[A-Z]/.test(v)) return "Must include at least one uppercase letter (A–Z)";
    if (!/[a-z]/.test(v)) return "Must include at least one lowercase letter (a–z)";
    if (!/\d/.test(v)) return "Must include at least one number (0–9)";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return "Must include at least one special character (!@#$ …)";
    return "";
  },
  confirmPassword: (v, password) => {
    if (!v) return "Please confirm your password";
    if (v !== password) return "Passwords do not match";
    return "";
  },
};

const getPasswordScore = (v) => {
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[a-z]/.test(v)) score++;
  if (/\d/.test(v)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(v)) score++;
  return score;
};

const STRENGTH_MAP = {
  0: { label: "", color: "transparent" },
  1: { label: "Very Weak", color: "#ef4444" },
  2: { label: "Weak", color: "#f97316" },
  3: { label: "Fair", color: "#f59e0b" },
  4: { label: "Strong", color: "#22c55e" },
  5: { label: "Very Strong", color: "#10b981" },
};

/* ─── Component ──────────────────────────────────────── */
const Register = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const isNative = !!(window.Capacitor && window.Capacitor.getPlatform() !== 'web');

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "USER" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse),
    onError: () => setMessage("Google Registration Failed"),
    ux_mode: isNative ? 'redirect' : 'popup',
    redirect_uri: isNative ? 'https://wellnest-eight-psi.vercel.app/' : undefined
  });

  // Handle Google Redirect Callback for Native
  React.useEffect(() => {
    if (!isNative) return;
    const checkHash = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      if (accessToken) {
        handleGoogleSuccess({ access_token: accessToken });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  /* ─── Field change ──── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "confirmPassword") {
      setConfirmPassword(value);
      if (touched.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: VALIDATORS.confirmPassword(value, form.password) }));
      }
      return;
    }
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const err = name === "password"
        ? VALIDATORS.password(value)
        : VALIDATORS[name]?.(value) ?? "";
      setErrors(prev => ({ ...prev, [name]: err }));
      // Re-validate confirm password when password changes
      if (name === "password" && touched.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: VALIDATORS.confirmPassword(confirmPassword, value) }));
      }
    }
  };

  /* ─── On blur — mark as touched & validate ──── */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    let err = "";
    if (name === "confirmPassword") {
      err = VALIDATORS.confirmPassword(value, form.password);
    } else {
      err = VALIDATORS[name]?.(value) ?? "";
    }
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  /* ─── Validate all fields before submit ──── */
  const validateAll = () => {
    const newErrors = {
      name: VALIDATORS.name(form.name),
      email: VALIDATORS.email(form.email),
      phone: VALIDATORS.phone(form.phone),
      password: VALIDATORS.password(form.password),
      confirmPassword: VALIDATORS.confirmPassword(confirmPassword, form.password),
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    return Object.values(newErrors).every(e => !e);
  };

  /* ─── Submit ──── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validateAll()) return;
    setLoading(true);
    try {
      await apiClient.post("/auth/register", { ...form, email: form.email.trim().toLowerCase() });
      setMessage("Registration successful!");
      navigate("/");
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data || "Registration failed. Please try again.");
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
        role: "USER",
      });
      if (res.data.token) await saveCredentials(res.data);
      onLoginSuccess?.();
      const { role, profileComplete } = res.data;
      if (role === "ROLE_ADMIN") { setTimeout(() => navigate("/admin-dashboard"), 600); return; }
      setTimeout(() => navigate(profileComplete ? "/dashboard" : "/setup-profile"), 600);
    } catch (err) {
      setMessage("Google registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    const clientId = "824393698796-2a2k17e527hbnd9irvhjv72pnngc5jc7.apps.googleusercontent.com";
    const redirectUri = "https://wellnest-eight-psi.vercel.app/";
    const scope = encodeURIComponent("email profile openid");
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`;
    if (Browser) await Browser.open({ url: authUrl });
    else window.location.assign(authUrl);
  };

  const saveCredentials = async (data) => {
    const { token, userId, role, isVerified } = data;
    if (token) await storageService.setItem("token", token);
    if (userId) await storageService.setItem("userId", userId.toString());
    if (role) await storageService.setItem("role", role);
    if (isVerified) await storageService.setItem("isVerified", "true");
    else await storageService.removeItem("isVerified");
  };

  const passwordScore = getPasswordScore(form.password);
  const strengthInfo = STRENGTH_MAP[passwordScore];

  /* ─── Render ──── */
  return (
    <div className={isNative ? "minimal-auth-page" : "auth-page"}>
      <div className={isNative ? "auth-container" : "auth-card"}>
        {isNative && (
          <div className="auth-logo-header">
            <img src="/logo192.png" alt="Wellnest Logo" className="auth-logo" />
            <h2 className="auth-brand-name">Wellnest</h2>
          </div>
        )}
        <div className="auth-title">
          <FiUserPlus className="auth-title-icon" />
          <h2>Create account</h2>
          <p className="auth-subtitle">Start your Wellnest journey</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div>
            <div className={`input-group ${errors.name && touched.name ? 'input-error' : ''}`}>
              <FiUser className="input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
              />
            </div>
            {touched.name && errors.name && (
              <div className="field-error"><FiAlertCircle size={12} /> {errors.name}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <div className={`input-group ${errors.email && touched.email ? 'input-error' : touched.email && !errors.email ? 'input-success' : ''}`}>
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
              />
              {touched.email && !errors.email && form.email && (
                <FiCheckCircle style={{ position: 'absolute', right: 14, color: '#22c55e', fontSize: 16 }} />
              )}
            </div>
            {touched.email && errors.email && (
              <div className="field-error"><FiAlertCircle size={12} /> {errors.email}</div>
            )}
          </div>

          {/* Phone */}
          <div>
            <div className={`input-group ${errors.phone && touched.phone ? 'input-error' : ''}`}>
              <FiPhone className="input-icon" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (Optional)"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="tel"
              />
            </div>
            {touched.phone && errors.phone && (
              <div className="field-error"><FiAlertCircle size={12} /> {errors.phone}</div>
            )}
          </div>

          {/* Password */}
          <div>
            <div className={`input-group password-group ${errors.password && touched.password ? 'input-error' : ''}`}>
              <FiLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div style={{ marginTop: 6, marginBottom: 2 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 99,
                      background: i <= passwordScore ? strengthInfo.color : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s'
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthInfo.color, fontWeight: 600 }}>
                  {strengthInfo.label}
                </span>
              </div>
            )}
            {touched.password && errors.password && (
              <div className="field-error"><FiAlertCircle size={12} /> {errors.password}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div className={`input-group password-group ${errors.confirmPassword && touched.confirmPassword ? 'input-error' : touched.confirmPassword && !errors.confirmPassword ? 'input-success' : ''}`}>
              <FiLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword(p => !p)} tabIndex={-1}>
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="field-error"><FiAlertCircle size={12} /> {errors.confirmPassword}</div>
            )}
            {touched.confirmPassword && !errors.confirmPassword && confirmPassword && (
              <div className="field-success"><FiCheckCircle size={12} /> Passwords match</div>
            )}
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          className="google-auth-btn"
          onClick={() => isNative ? handleNativeGoogleLogin() : loginWithGoogle()}
          disabled={loading}
          style={{ marginBottom: '20px' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
          <span>Continue with Google</span>
        </button>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-toggle">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
