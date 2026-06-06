import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMic,
  FiZap,
  FiTrendingUp,
  FiCalendar,
  FiCheck,
  FiArrowRight,
  FiShield,
  FiUser,
  FiAward,
  FiPlay,
} from "react-icons/fi";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  // --- Voice Demo Simulation States ---
  const [activeDemo, setActiveDemo] = useState(null); // 'water', 'workout', 'sleep'
  const [demoState, setDemoState] = useState("idle"); // 'idle', 'recording', 'typing', 'processing', 'success'
  const [typedText, setTypedText] = useState("");
  const [waterAmount, setWaterAmount] = useState(1200);
  const [workoutMins, setWorkoutMins] = useState(30);
  const [sleepHrs, setSleepHrs] = useState(6.2);
  const [readinessScore, setReadinessScore] = useState(72);

  const demoPresets = {
    water: {
      command: "Drank 500ml water",
      feedback: "Water logged successfully! 💧 +500ml",
      update: () => {
        setWaterAmount((prev) => Math.min(prev + 500, 2500));
        setReadinessScore((prev) => Math.min(prev + 4, 100));
      },
    },
    workout: {
      command: "Walked 30 minutes",
      feedback: "Workout logged successfully! 🏃‍♂️ +30 mins",
      update: () => {
        setWorkoutMins((prev) => Math.min(prev + 30, 120));
        setReadinessScore((prev) => Math.min(prev + 8, 100));
      },
    },
    sleep: {
      command: "Slept 8 hours last night",
      feedback: "Sleep logged successfully! 😴 +8.0 hrs",
      update: () => {
        setSleepHrs(8.0);
        setReadinessScore((prev) => Math.min(prev + 12, 100));
      },
    },
  };

  const startDemoSimulation = (presetKey) => {
    if (demoState !== "idle") return;
    setActiveDemo(presetKey);
    setDemoState("recording");
    setTypedText("");

    // Step 1: Simulate "listening" wave for 1.0 second
    setTimeout(() => {
      setDemoState("typing");
      const fullText = demoPresets[presetKey].command;
      let currentLength = 0;
      
      // Step 2: Typing effect (Fast, 50ms per letter)
      const interval = setInterval(() => {
        currentLength++;
        setTypedText(fullText.substring(0, currentLength));
        if (currentLength >= fullText.length) {
          clearInterval(interval);
          
          // Step 3: Simulate AI Processing (0.5 second)
          setTimeout(() => {
            setDemoState("processing");
            
            // Step 4: Show Success and Update Mockup (0.8 second)
            setTimeout(() => {
              setDemoState("success");
              demoPresets[presetKey].update();
              
              // Step 5: Reset to Idle after 3 seconds
              setTimeout(() => {
                setDemoState("idle");
                setActiveDemo(null);
                setTypedText("");
              }, 3000);
            }, 800);
          }, 500);
        }
      }, 50);
    }, 1000);
  };

  return (
    <div className="landing-container">
      {/* ================= HERO SECTION ================= */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Track Your Health. <br />
            <span className="gradient-text">Just By Speaking.</span>
          </h1>
          <p className="hero-description">
            Log water, workouts, sleep, and daily habits using natural voice commands.
            No boring forms. No tedious manual tracking.
            <strong className="hero-highlight-tagline"> Speak naturally. We'll handle the tracking.</strong>
          </p>

          <div className="hero-actions">
            <button
              onClick={() => navigate("/register")}
              className="btn btn-primary"
            >
              Join Early Access <FiArrowRight />
            </button>
            <a href="#demo" className="btn btn-secondary">
              <FiPlay className="play-icon" /> Watch Demo
            </a>
          </div>

          {/* Social Proof Row */}
          <div className="social-proof-row">
            <div className="proof-item">
              <FiAward className="proof-icon" />
              <span>Public Beta Live</span>
            </div>
            <div className="proof-item">
              <FiMic className="proof-icon" />
              <span>Voice-First Tracking</span>
            </div>
            <div className="proof-item">
              <FiUser className="proof-icon" />
              <span>Solo Founder Built</span>
            </div>
            <div className="proof-item">
              <FiShield className="proof-icon" />
              <span>Built for Consistency</span>
            </div>
          </div>
        </div>

        {/* Hero Right: High-Fidelity CSS Smartphone Mockup */}
        <div className="hero-mockup-wrapper">
          <div className="phone-container">
            <div className="phone-screen">
              {/* Phone Status Bar */}
              <div className="phone-status-bar">
                <span className="phone-time">9:41 AM</span>
                <div className="phone-notch"></div>
                <div className="phone-status-icons">
                  <span className="bar-icon">📶</span>
                  <span className="bar-icon">🔋</span>
                </div>
              </div>

              {/* Mockup Dashboard Body */}
              <div className="mock-dashboard">
                <div className="mock-header">
                  <div className="user-info">
                    <div className="avatar">SA</div>
                    <div>
                      <span className="welcome-sub">Welcome Back</span>
                      <h4 className="welcome-name">Shaksham Agarwal</h4>
                    </div>
                  </div>
                </div>

                {/* Circular Readiness Score Card */}
                <div className="mock-card readiness-card">
                  <div className="readiness-info">
                    <h5>Daily Readiness</h5>
                    <p className="readiness-desc">Your daily habit metric</p>
                  </div>
                  <div className="readiness-circle-wrapper">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path
                        className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="circle"
                        strokeDasharray={`${readinessScore}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="circle-percentage">{readinessScore}%</div>
                  </div>
                </div>

                {/* Dashboard Stats Cards */}
                <div className="mock-stats-grid">
                  {/* Hydration Widget */}
                  <div className="mock-card stat-card hydration">
                    <div className="stat-header">
                      <span className="icon-badge text-blue">💧</span>
                      <h6>Hydration</h6>
                    </div>
                    <div className="stat-value">{waterAmount} ml</div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar bg-blue"
                        style={{ width: `${(waterAmount / 2500) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-target">Target: 2500ml</span>
                  </div>

                  {/* Workout Widget */}
                  <div className="mock-card stat-card workout">
                    <div className="stat-header">
                      <span className="icon-badge text-orange">🏃‍♂️</span>
                      <h6>Workouts</h6>
                    </div>
                    <div className="stat-value">{workoutMins} mins</div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar bg-orange"
                        style={{ width: `${(workoutMins / 60) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-target">Target: 60 mins</span>
                  </div>
                </div>

                {/* Sleep Widget */}
                <div className="mock-card sleep-card">
                  <div className="sleep-main">
                    <div className="sleep-text">
                      <span className="icon-badge text-purple">😴</span>
                      <div>
                        <h6>Sleep Performance</h6>
                        <span className="stat-value">{sleepHrs.toFixed(1)} hrs</span>
                      </div>
                    </div>
                    <span className="sleep-badge">{sleepHrs >= 7.5 ? "Optimal" : "Deficit"}</span>
                  </div>
                </div>

                {/* Simulated Floating Mic Animation Overlays */}
                {demoState === "recording" && (
                  <div className="mock-recording-overlay">
                    <div className="pulse-mic">
                      <FiMic />
                    </div>
                    <span>Listening...</span>
                  </div>
                )}
                {demoState === "typing" && (
                  <div className="mock-recording-overlay">
                    <div className="typing-display">
                      <FiMic className="typing-mic-icon" />
                      <span className="typing-text">"{typedText}"</span>
                    </div>
                  </div>
                )}
                {demoState === "processing" && (
                  <div className="mock-recording-overlay">
                    <div className="loading-spinner"></div>
                    <span>Processing voice...</span>
                  </div>
                )}
                {demoState === "success" && (
                  <div className="mock-success-overlay">
                    <div className="success-badge">
                      <FiCheck />
                    </div>
                    <span>{demoPresets[activeDemo].feedback}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE DEMO SECTION ================= */}
      <section id="demo" className="demo-section">
        <div className="section-header">
          <span className="section-tag">Interactive Demo</span>
          <h2 className="section-title">See How Easy It Is</h2>
          <p className="section-subtitle">
            Click one of the voice command presets below to simulate logging health metrics in real-time.
          </p>
        </div>

        <div className="demo-console-card">
          <div className="demo-left">
            <h4 className="demo-console-title">Select a Voice Shortcut</h4>
            <p className="demo-console-desc">
              Choose a command to see how our AI listens, understands, and updates your dashboard instantly.
            </p>

            <div className="preset-buttons">
              <button
                className={`preset-btn ${activeDemo === "water" ? "active" : ""}`}
                onClick={() => startDemoSimulation("water")}
                disabled={demoState !== "idle"}
              >
                💧 "Drank 500ml water"
              </button>
              <button
                className={`preset-btn ${activeDemo === "workout" ? "active" : ""}`}
                onClick={() => startDemoSimulation("workout")}
                disabled={demoState !== "idle"}
              >
                🏃‍♂️ "Walked 30 minutes"
              </button>
              <button
                className={`preset-btn ${activeDemo === "sleep" ? "active" : ""}`}
                onClick={() => startDemoSimulation("sleep")}
                disabled={demoState !== "idle"}
              >
                😴 "Slept 8 hours last night"
              </button>
            </div>

            {/* Visual Step-by-Step Flow indicators */}
            <div className="transformation-flow-steps">
              <div className={`flow-step ${demoState === "recording" || demoState === "typing" ? "step-active" : ""}`}>
                <span className="step-badge-num">1</span>
                <span className="step-text">🎤 Speak Command</span>
              </div>
              <div className="flow-step-arrow">→</div>
              <div className={`flow-step ${demoState === "processing" ? "step-active" : ""}`}>
                <span className="step-badge-num">2</span>
                <span className="step-text">🤖 AI Processing</span>
              </div>
              <div className="flow-step-arrow">→</div>
              <div className={`flow-step ${demoState === "success" ? "step-active" : ""}`}>
                <span className="step-badge-num">3</span>
                <span className="step-text">📈 Logged Instantly</span>
              </div>
            </div>

            {/* Simulated Live Console Log */}
            <div className="console-log-box">
              <div className="console-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="console-title">Live Voice Console</span>
              </div>
              <div className="console-body">
                {demoState === "idle" && (
                  <p className="log-placeholder">
                    &gt; Click a shortcut above to start the voice logging simulation...
                  </p>
                )}
                {demoState === "recording" && (
                  <p className="log-line text-blue animate-pulse">
                    &gt; [AUDIO RECEIVED] Listening to microphone stream...
                  </p>
                )}
                {demoState === "typing" && (
                  <p className="log-line">
                    &gt; [NLP TRANSCRIBING] Transcribing speech: <span className="text-white">"{typedText}"</span>
                  </p>
                )}
                {demoState === "processing" && (
                  <>
                    <p className="log-line">
                      &gt; [NLP TRANSCRIBING] Transcribing speech: <span className="text-white">"{demoPresets[activeDemo].command}"</span>
                    </p>
                    <p className="log-line text-yellow">
                      &gt; [AI AGENT] Parsing habits and updating metrics in real-time...
                    </p>
                  </>
                )}
                {demoState === "success" && (
                  <>
                    <p className="log-line">
                      &gt; [NLP TRANSCRIBING] Transcribing speech: <span className="text-white">"{demoPresets[activeDemo].command}"</span>
                    </p>
                    <p className="log-line text-yellow">
                      &gt; [AI AGENT] Parsing habits and updating metrics in real-time...
                    </p>
                    <p className="log-line text-green">
                      &gt; [SUCCESS] {demoPresets[activeDemo].feedback}
                    </p>
                    <p className="log-line text-green-dim">
                      &gt; [METRICS UPDATED] Dashboard state synced successfully.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="demo-right-mic">
            <div
              className={`mic-visualizer-button ${
                demoState !== "idle" ? "active-recording" : ""
              }`}
              onClick={() => {
                if (demoState === "idle") {
                  startDemoSimulation("water");
                }
              }}
            >
              <div className="wave-ring wave-1"></div>
              <div className="wave-ring wave-2"></div>
              <div className="wave-ring wave-3"></div>
              <div className="mic-center-circle">
                {demoState === "processing" ? (
                  <div className="mini-spinner"></div>
                ) : (
                  <FiMic />
                )}
              </div>
            </div>
            <span className="mic-status-label">
              {demoState === "idle" && "Tap Mic to Quick Demo"}
              {demoState === "recording" && "Listening..."}
              {demoState === "typing" && "Transcribing Speech..."}
              {demoState === "processing" && "AI Understanding..."}
              {demoState === "success" && "Logged Successfully! 🎉"}
            </span>
          </div>
        </div>
      </section>

      {/* ================= PROBLEM SECTION ================= */}
      <section className="problem-section">
        <div className="section-header">
          <span className="section-tag text-rose">The Problem</span>
          <h2 className="section-title">Most Health Apps Feel Like Work</h2>
          <p className="section-subtitle">
            Traditional tracking apps expect too much manual effort. That is why they fail.
          </p>
        </div>

        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-icon-wrapper">❌</div>
            <h3>Form Fatigue</h3>
            <p>Filling out multiple fields, scroll pickers, and checkboxes for simple everyday habits.</p>
          </div>

          <div className="problem-card">
            <div className="problem-icon-wrapper">❌</div>
            <h3>Manual Inputs</h3>
            <p>Typing in exact water milliliters, searching databases for basic snacks, and logging sleep hours manually.</p>
          </div>

          <div className="problem-card">
            <div className="problem-icon-wrapper">❌</div>
            <h3>Tracking Drops</h3>
            <p>Forgetting to update logs because the UI feels tedious, leading to broken habits and streaks.</p>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">Core Value</span>
          <h2 className="section-title">Everything You Need. Done Instantly.</h2>
          <p className="section-subtitle">
            We focus on keeping habit logging frictionless, so you can focus on building a healthy lifestyle.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <FiMic className="feature-icon" />
            <h3>Voice Logging</h3>
            <p>
              Log habits simply by speaking. Our AI model maps your natural speech directly to your stats.
            </p>
          </div>

          <div className="feature-card">
            <FiZap className="feature-icon" />
            <h3>Daily Readiness</h3>
            <p>
              Get a composite daily score summarizing how sleep, activity, and hydration affect your day.
            </p>
          </div>

          <div className="feature-card">
            <FiTrendingUp className="feature-icon" />
            <h3>Weekly Insights</h3>
            <p>
              Receive clear, action-oriented health reports showing clean summaries of your weekly progress.
            </p>
          </div>

          <div className="feature-card">
            <FiCalendar className="feature-icon" />
            <h3>Consistency Tracking</h3>
            <p>
              Build streaks and daily routines with absolute clarity. Stay accountable without the clutter.
            </p>
          </div>
        </div>
      </section>

      {/* ================= FOUNDER STORY SECTION ================= */}
      <section className="founder-section">
        <div className="founder-content-card">
          <div className="founder-avatar-wrapper">
            <div className="founder-avatar-fallback">
              SA
            </div>
          </div>
          <div className="founder-text-block">
            <span className="founder-tag">Founder Story</span>
            <blockquote>
              "I built Wellnest after realizing that most wellness apps make tracking feel harder than it should be. The goal was simple: make health tracking as easy as sending a voice note to a friend."
            </blockquote>
            <p className="founder-bio">
              A developer passionate about frictionless user experiences. I wanted a way to track sleep, hydration, workouts, and mood without clicking 20 buttons every single day.
            </p>
            <div className="founder-signature">
              <strong>Shaksham Agarwal</strong>
              <span>Solo Founder of Wellnest</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= EARLY ACCESS BANNER ================= */}
      <section className="early-access-banner">
        <div className="early-access-card">
          <div className="early-access-badge">🚀 Early Access Open</div>
          <h2>Unlock Lifetime Premium Access</h2>
          <p>
            Join the first group of Wellnest users today. Unlock full premium features, advanced voice metrics, and future AI logs completely free for life.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="btn btn-primary btn-large"
          >
            Claim Free Lifetime Access
          </button>
        </div>
      </section>

      {/* ================= FINAL CTA & FOOTER ================= */}
      <section className="final-cta-section">
        <h2>Ready to stop filling forms?</h2>
        <p>Start tracking your health today just by speaking.</p>
        <button
          onClick={() => navigate("/register")}
          className="btn btn-primary btn-large"
        >
          Join Wellnest Beta <FiArrowRight />
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo_wellnest.png" alt="Wellnest" className="footer-logo-img" />
            <span>Wellnest</span>
          </div>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="dot-divider">•</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="dot-divider">•</span>
            <Link to="/support">Support Helpdesk</Link>
          </div>
          <p className="copyright">
            © {new Date().getFullYear()} Wellnest. Built for the future of wellness.
          </p>
        </div>
      </footer>

      {/* ================= STICKY MOBILE CTA ================= */}
      <div className="mobile-floating-cta">
        <button
          onClick={() => navigate("/register")}
          className="btn btn-primary btn-block"
        >
          Join Early Access <FiArrowRight style={{ marginLeft: "4px" }} />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
