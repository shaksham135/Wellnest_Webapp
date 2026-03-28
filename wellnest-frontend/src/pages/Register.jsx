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

const Register = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const isNative = !!(window.Capacitor && window.Capacitor.getPlatform() !== 'web');

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom Google Login Hook
  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => handleGoogleSuccess(tokenResponse),
    onError: (error) => setMessage("Google Registration Failed"),
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
          console.log("Detected Google Access Token in Hash");
          const { Preferences } = await import('@capacitor/preferences');
          const { value: storedRole } = await Preferences.get({ key: 'pending_reg_role' });
          const { value: storedGoal } = await Preferences.get({ key: 'pending_reg_goal' });
          
          handleGoogleSuccess({ access_token: accessToken }, storedRole || "USER", storedGoal || "");
          
          // Cleanup
          await Preferences.remove({ key: 'pending_reg_role' });
          await Preferences.remove({ key: 'pending_reg_goal' });
          window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    score: 0,
    feedback: [],
  });

  const validatePassword = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push("8+ characters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("1 uppercase");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("1 lowercase");

    if (/\d/.test(password)) score++;
    else feedback.push("1 number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push("1 special char");

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "confirmPassword") {
      setConfirmPassword(value);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "password") {
      setPasswordStrength(validatePassword(value));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (form.password !== confirmPassword) {
      setMessage("Password and Confirm Password do not match");
      setLoading(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setMessage("Password is too weak");
      setLoading(false);
      return;
    }

    try {
      await apiClient.post("/auth/register", form);
      setMessage("Registration successful!");
      navigate("/");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse, forcedRole = null, forcedGoal = null) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await apiClient.post("/auth/google", {
        token: tokenResponse.access_token || tokenResponse.credential,
        role: forcedRole || form.role || "USER",
        fitnessGoal: forcedGoal || form.fitnessGoal || ""
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
      console.error(err);
      setMessage("Google registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    const clientId = "824393698796-2a2k17e527hbnd9irvhjv72pnngc5jc7.apps.googleusercontent.com";
    const redirectUri = "https://wellnest-eight-psi.vercel.app/";
    const scope = encodeURIComponent("email profile openid");
    
    // PERSIST ROLE BEFORE REDIRECT
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: 'pending_reg_role', value: form.role });
      if (form.fitnessGoal) {
        await Preferences.set({ key: 'pending_reg_goal', value: form.fitnessGoal });
      }
    } catch (e) { console.error("Could not save pending role", e); }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&status=register&response_type=token&scope=${scope}`;
    
    if (Browser) {
        await Browser.open({ url: authUrl });
    } else {
        window.location.assign(authUrl);
    }
  };

  const saveCredentials = async (data) => {
    const { token, userId, role, isVerified } = data;
    if (token) await storageService.setItem("token", token);
    if (userId) await storageService.setItem("userId", userId.toString());
    if (role) await storageService.setItem("role", role);
    if (isVerified) await storageService.setItem("isVerified", "true");
    else await storageService.removeItem("isVerified");
  };



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

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <FiPhone className="input-icon" />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number (Optional)"
              value={form.phone}
              onChange={handleChange}
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
            <button type="button" className="eye-btn" onClick={togglePasswordVisibility}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {form.password && (
            <div style={{ fontSize: "12px", marginBottom: "10px" }}>
              Strength:{" "}
              <b
                style={{
                  color: passwordStrength.isValid ? "#22c55e" : "#ef4444",
                }}
              >
                {passwordStrength.score <= 2
                  ? "Weak"
                  : passwordStrength.score <= 3
                    ? "Medium"
                    : "Strong"}
              </b>
              {!passwordStrength.isValid && (
                <div style={{ color: "#ef4444" }}>
                  Missing: {passwordStrength.feedback.join(", ")}
                </div>
              )}
            </div>
          )}

          <div className="input-group password-group">
            <FiLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="eye-btn"
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="role-row">
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="role-select"
            >
              <option value="USER">User</option>
              <option value="TRAINER">Trainer</option>
            </select>
          </div>

          {form.role === "TRAINER" && (
            <div className="role-row" style={{ marginTop: '16px' }}>
              <label>Specialty / Goal:</label>
              <select
                name="fitnessGoal"
                value={form.fitnessGoal || ""}
                onChange={handleChange}
                className="role-select"
                required
              >
                <option value="" disabled>Select your specialty</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Yoga">Yoga</option>
                <option value="Rehabilitation">Rehabilitation</option>
                <option value="CrossFit">CrossFit</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Creating..." : "Register"}
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
          <span>{form.role === 'TRAINER' ? 'Sign up as Trainer with Google' : 'Continue with Google'}</span>
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
