import React, { useState, useRef, useEffect } from 'react';
import { FiArrowRight, FiCheck, FiMic } from 'react-icons/fi';
import { useData } from '../../context/DataContext';
import VoiceScanButton from './VoiceScanButton';
import './OnboardingFlow.css';

const OnboardingFlow = ({ user, onComplete, onTriggerMic }) => {
    const { submitVoiceCommand } = useData();

    const [step, setStep] = useState(1);
    const [selectedGoal, setSelectedGoal] = useState("Stay Hydrated 💧");
    const [calibrated, setCalibrated] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationProgress, setCalibrationProgress] = useState(0);
    const [spokenText, setSpokenText] = useState("");
    const [calibrationError, setCalibrationError] = useState("");
    
    // Fallback & Permission states
    const [speechSupported, setSpeechSupported] = useState(true);
    const [voiceDisabled, setVoiceDisabled] = useState(false);
    const [permissionChecked, setPermissionChecked] = useState(false);

    // Wow-moment states
    const [wowLogging, setWowLogging] = useState(false);
    const [wowSuccess, setWowSuccess] = useState(false);
    const [wowTranscript, setWowTranscript] = useState("");
    const [wowError, setWowError] = useState("");

    const calibrationProgressRef = useRef(0);
    const timerRef = useRef(null);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef("");
    const isHoldingRef = useRef(false);

    // Check speech support on mount
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            setVoiceDisabled(true);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {}
            }
        };
    }, []);

    const goals = [
        "Stay Hydrated 💧",
        "Build Muscle 💪",
        "Eat Clean 🥗",
        "Sleep Better 😴"
    ];

    const requestMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setCalibrationError("");
            setPermissionChecked(true);
        } catch (err) {
            console.error("Mic permission denied:", err);
            setCalibrationError("Microphone permission denied. Please allow mic access in your browser settings. 🎙️");
        }
    };

    const continueWithoutVoice = () => {
        setVoiceDisabled(true);
        setCalibrated(true);
        setStep(4);
    };

    const startCalibration = (e) => {
        if (calibrated) return;
        
        setIsCalibrating(true);
        setCalibrationProgress(0);
        calibrationProgressRef.current = 0;
        transcriptRef.current = "";
        setSpokenText("");
        setCalibrationError("");
        isHoldingRef.current = true;
        
        if (navigator.vibrate) navigator.vibrate(40);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            try {
                const rec = new SpeechRecognition();
                recognitionRef.current = rec;
                rec.continuous = false;
                rec.interimResults = true;
                rec.lang = 'en-IN';
                
                rec.onresult = (event) => {
                    const resultText = Array.from(event.results)
                        .map(res => res[0])
                        .map(res => res.transcript)
                        .join('');
                    
                    transcriptRef.current = resultText;
                    setSpokenText(resultText);
                };

                rec.onerror = (err) => {
                    console.error("Calibration Speech Error:", err);
                    if (err.error === 'not-allowed') {
                        setCalibrationError("Microphone permission denied. 🎙️");
                    }
                };

                rec.start();
            } catch (err) {
                console.error("Failed to start Speech Recognition in calibration:", err);
            }
        }

        timerRef.current = setInterval(() => {
            calibrationProgressRef.current += 4;
            const nextProgress = Math.min(100, calibrationProgressRef.current);
            setCalibrationProgress(nextProgress);
            
            if (nextProgress >= 100) {
                clearInterval(timerRef.current);
            }
        }, 100);
    };

    const stopCalibration = () => {
        if (calibrated) return;
        isHoldingRef.current = false;
        
        if (timerRef.current) clearInterval(timerRef.current);
        setIsCalibrating(false);

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error(e);
            }
            recognitionRef.current = null;
        }

        if (navigator.vibrate) navigator.vibrate(20);

        setTimeout(() => {
            const finalTranscript = transcriptRef.current.trim().toLowerCase();
            const progress = calibrationProgressRef.current;
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                if (!finalTranscript) {
                    setCalibrationProgress(0);
                    calibrationProgressRef.current = 0;
                    setCalibrationError("We didn't hear anything. Try holding and speaking clearly! 🎙️");
                } else {
                    const matched = ['habit', 'build', 'ready', 'make', 'well', 'nest', 'let', 'lets', 'hello', 'test'].some(keyword => 
                        finalTranscript.includes(keyword)
                    );
                    
                    if (matched || finalTranscript.length > 2) {
                        setCalibrated(true);
                        setCalibrationProgress(100);
                        calibrationProgressRef.current = 100;
                        if (navigator.vibrate) {
                            navigator.vibrate([100, 50, 100]);
                        }
                    } else {
                        setCalibrationProgress(0);
                        calibrationProgressRef.current = 0;
                        setCalibrationError(`You said: "${transcriptRef.current}". Please say "Let's build a habit".`);
                    }
                }
            } else {
                if (progress >= 80) {
                    setCalibrated(true);
                    setCalibrationProgress(100);
                    calibrationProgressRef.current = 100;
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                } else {
                    setCalibrationProgress(0);
                    calibrationProgressRef.current = 0;
                    setCalibrationError("Hold the button longer to calibrate. ⏳");
                }
            }
        }, 300);
    };

    const handleWowComplete = async (input) => {
        setWowLogging(true);
        setWowError("");
        try {
            const res = await submitVoiceCommand(input);
            if (res && res.status === 'SUCCESS') {
                setWowSuccess(true);
                setWowTranscript(res.displayMessage || "Logged 500ml Water");
            } else {
                setWowError("I couldn't catch that. Please say 'Drank 500ml water' clearly!");
            }
        } catch (err) {
            console.error("Wow moment log error:", err);
            setWowError(err.message || "Failed to submit log. Please try again.");
        } finally {
            setWowLogging(false);
        }
    };

    const nextStep = () => {
        if (step === 3 && !calibrated) {
            return;
        }
        if (step === 4 && !wowSuccess) {
            return;
        }
        if (step < 5) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        const userIdKey = user?.id || user?.email || 'default';
        localStorage.setItem(`hasOnboarded_${userIdKey}`, 'true');
        localStorage.setItem(`userFocusGoal_${userIdKey}`, selectedGoal);
        onComplete();
        setTimeout(() => {
            onTriggerMic();
        }, 800);
    };

    const steps = [
        {
            title: "Your voice is the key.",
            subtitle: "Welcome to Wellnest, the zero-friction voice-driven wellness companion.",
            icon: "✨",
            color: "#14B8A6"
        },
        {
            title: "What is your main focus?",
            subtitle: "Choose what you want to track effortlessly today.",
            icon: "🎯",
            color: "#6366F1"
        },
        {
            title: "Hold down to calibrate.",
            subtitle: "Hold the mic button below and say: 'Let's build a habit'",
            icon: "🎙️",
            color: "#10B981"
        },
        {
            title: "Try your first log!",
            subtitle: "Log your first water intake to experience the zero-friction habit tracker.",
            icon: "💧",
            color: "#0ea5e9"
        },
        {
            title: "Your Aura is ready.",
            subtitle: "As you log habits, your aura will brighten. Let's step inside.",
            icon: "🌌",
            color: "#f59e0b"
        }
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card layered-glass">
                <div className="onboarding-steps-indicator">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`step-dot ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                <div className="onboarding-content">
                    {step === 1 && (
                        <>
                            <div className="onboarding-icon-wrapper" style={{ '--accent': currentStep.color }}>
                                <span className="onboarding-emoji">{currentStep.icon}</span>
                            </div>
                            <h2 className="onboarding-title">{currentStep.title}</h2>
                            <p className="onboarding-subtitle">{currentStep.subtitle}</p>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="onboarding-icon-wrapper" style={{ '--accent': currentStep.color }}>
                                <span className="onboarding-emoji">{currentStep.icon}</span>
                            </div>
                            <h2 className="onboarding-title">{currentStep.title}</h2>
                            <p className="onboarding-subtitle" style={{ marginBottom: '24px' }}>{currentStep.subtitle}</p>
                            <div className="onboarding-goals-grid">
                                {goals.map(g => (
                                    <button 
                                        key={g} 
                                        className={`onboarding-goal-pill ${selectedGoal === g ? 'active' : ''}`}
                                        onClick={() => setSelectedGoal(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            {!speechSupported ? (
                                <div className="onboarding-fallback-screen">
                                    <div className="onboarding-icon-wrapper" style={{ '--accent': '#ef4444' }}>
                                        <span className="onboarding-emoji">⚠️</span>
                                    </div>
                                    <h2 className="onboarding-title">Voice logging not available.</h2>
                                    <p className="onboarding-subtitle">
                                        Voice logging is not supported on this device or browser. You can still use our full Quick Actions and Manual Logging features.
                                    </p>
                                    <button 
                                        className="onboarding-btn" 
                                        onClick={continueWithoutVoice}
                                        style={{ marginTop: '20px' }}
                                    >
                                        Continue <FiArrowRight />
                                    </button>
                                </div>
                            ) : calibrationError && calibrationError.includes("denied") ? (
                                <div className="onboarding-fallback-screen">
                                    <div className="onboarding-icon-wrapper" style={{ '--accent': '#ef4444' }}>
                                        <span className="onboarding-emoji">🎙️</span>
                                    </div>
                                    <h2 className="onboarding-title">Mic Access Required</h2>
                                    <p className="onboarding-subtitle">
                                        Wellnest works best with voice logging. Please grant microphone access to continue with calibration.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '20px' }}>
                                        <button className="onboarding-btn" onClick={requestMicPermission}>
                                            Allow Microphone
                                        </button>
                                        <button className="onboarding-btn secondary-btn" onClick={continueWithoutVoice} style={{ background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-main)' }}>
                                            Continue Without Voice
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="onboarding-title">{currentStep.title}</h2>
                                    <p className="onboarding-subtitle" style={{ marginBottom: '32px' }}>{currentStep.subtitle}</p>
                                    
                                    <div className="calibration-container">
                                        <svg width="120" height="120" viewBox="0 0 100 100" className="calibration-svg">
                                            <circle 
                                                cx="50" 
                                                cy="50" 
                                                r="40" 
                                                fill="none" 
                                                stroke="rgba(255,255,255,0.05)" 
                                                strokeWidth="5" 
                                            />
                                            <circle 
                                                cx="50" 
                                                cy="50" 
                                                r="40" 
                                                fill="none" 
                                                stroke="var(--primary)" 
                                                strokeWidth="5" 
                                                strokeDasharray={`${calibrationProgress * 2.51} 251.2`} 
                                                transform="rotate(-90 50 50)"
                                                strokeLinecap="round"
                                                style={{ transition: isCalibrating ? 'none' : 'stroke-dasharray 0.2s ease' }}
                                            />
                                        </svg>
                                        <button
                                            className={`calibration-btn ${isCalibrating ? 'calibrating' : ''} ${calibrated ? 'success' : ''}`}
                                            onMouseDown={startCalibration}
                                            onMouseUp={stopCalibration}
                                            onMouseLeave={stopCalibration}
                                            onTouchStart={startCalibration}
                                            onTouchEnd={stopCalibration}
                                            onTouchCancel={stopCalibration}
                                            style={{ touchAction: 'none' }}
                                        >
                                            {calibrated ? <FiCheck size={28} /> : <FiMic size={28} />}
                                        </button>
                                    </div>
                                    
                                    <div className="calibration-status">
                                        {calibrated ? (
                                            <span className="calibrated-success-text">Calibrated Successfully! ✅</span>
                                        ) : isCalibrating ? (
                                            <span className="calibrating-text">
                                                {spokenText ? `"${spokenText}"` : "Listening... Speak now 🎙️"}
                                            </span>
                                        ) : calibrationError ? (
                                            <span className="calibration-error-text" style={{ color: '#ef4444', fontWeight: 600 }}>
                                                {calibrationError}
                                            </span>
                                        ) : (
                                            <span className="calibration-hint-text">Hold the button to calibrate</span>
                                        )}
                                    </div>

                                    {!calibrated && (
                                        <button 
                                            onClick={continueWithoutVoice}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                textDecoration: 'underline',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                marginTop: '20px'
                                            }}
                                        >
                                            Skip Calibration
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <h2 className="onboarding-title">{voiceDisabled ? "Try your first log!" : "Try your first voice log!"}</h2>
                            <p className="onboarding-subtitle" style={{ marginBottom: '24px' }}>
                                {voiceDisabled 
                                    ? "Log a baseline activity to start. Click the water droplet below to log water intake." 
                                    : "Hold the mic button below and say: \"Drank 500ml water\" or \"Maine ek glass paani kiya\""
                                }
                            </p>

                            {wowSuccess ? (
                                <div className="wow-success-card" style={{
                                    background: 'rgba(20, 184, 166, 0.04)',
                                    border: '1px solid rgba(20, 184, 166, 0.2)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    marginTop: '20px',
                                    animation: 'scaleUp 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 12px auto'
                                    }}>
                                        <FiCheck size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-main)' }}>First Log Logged! 🎉</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', maxWidth: '240px', margin: '0 auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                            <span>✅</span> <span>Log Analyzed Successfully</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                            <span>💧</span> <span>Water Intake Updated (+0.5L)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                            <span>🔥</span> <span>1-Day Active Streak Started!</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                                    {voiceDisabled ? (
                                        <button 
                                            className="onboarding-btn"
                                            onClick={() => handleWowComplete("Drank 500ml water")}
                                            disabled={wowLogging}
                                            style={{ minWidth: '180px' }}
                                        >
                                            {wowLogging ? "Logging... 🔄" : "Log 500ml Water 💧"}
                                        </button>
                                    ) : (
                                        <>
                                            <VoiceScanButton onScanComplete={handleWowComplete} mode="command" />
                                            
                                            {wowLogging && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>AI is analyzing your voice... 🧬</span>}
                                            {wowError && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>{wowError}</span>}

                                            <button 
                                                className="secondary-btn"
                                                onClick={() => handleWowComplete("Drank 500ml water")}
                                                disabled={wowLogging}
                                                style={{ 
                                                    background: 'transparent', 
                                                    border: '1px solid var(--card-border)', 
                                                    color: 'var(--text-muted)', 
                                                    padding: '8px 16px', 
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    marginTop: '10px'
                                                }}
                                            >
                                                Log manually instead
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <div className="onboarding-aura-visual-wrapper">
                                <div className="onboarding-aura-visual" />
                            </div>
                            <h2 className="onboarding-title" style={{ marginTop: '24px' }}>{currentStep.title}</h2>
                            <p className="onboarding-subtitle">{currentStep.subtitle}</p>
                        </>
                    )}
                </div>

                <button 
                    className="onboarding-btn" 
                    onClick={nextStep}
                    disabled={(step === 3 && !calibrated) || (step === 4 && !wowSuccess)}
                    style={{ opacity: ((step === 3 && !calibrated) || (step === 4 && !wowSuccess)) ? 0.5 : 1 }}
                >
                    {step === 5 ? "Enter Wellnest" : "Continue"}
                    <FiArrowRight />
                </button>
            </div>
        </div>
    );
};

export default OnboardingFlow;
