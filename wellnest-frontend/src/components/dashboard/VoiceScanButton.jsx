import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiZap, FiLoader } from 'react-icons/fi';
import './VoiceScanButton.css';

const VoiceScanButton = ({ onScanComplete, mode = "scan", onBeforeStart }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const isRecordingRef = useRef(false);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {}
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {}
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startAudioFallback = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isRecordingRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            streamRef.current = stream;
            
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '' });
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                setIsRecording(false);
                setIsProcessing(true);
                
                onScanComplete(audioBlob);
                
                stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current = null;
                streamRef.current = null;
                
                setTimeout(() => setIsProcessing(false), 2000);
            };

            setIsRecording(true);
            mediaRecorder.start(1000);
        } catch (err) {
            console.error("Microphone Access Denied:", err);
            alert("Microphone access is required. Please enable it in settings. 🎙️");
            setIsRecording(false);
            isRecordingRef.current = false;
        }
    };

    const handlePressStart = async (e) => {
        if (e && typeof e.persist === 'function') {
            e.persist();
        }

        if (isProcessing || isRecordingRef.current) return;

        if (onBeforeStart) {
            const proceed = onBeforeStart();
            if (!proceed) return;
        }

        isRecordingRef.current = true;

        // soft web haptics
        if (navigator.vibrate) {
            try {
                navigator.vibrate(40);
            } catch (err) {
                // ignore intervention/security restrictions
            }
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (mode === "command" && SpeechRecognition) {
            try {
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-IN'; // Excellent for Hinglish / Indian English

                recognition.onstart = () => {
                    setIsRecording(true);
                };

                recognition.onerror = (event) => {
                    console.error("Speech Recognition Error:", event.error);
                    setIsRecording(false);
                    setIsProcessing(false);
                    isRecordingRef.current = false;
                    if (event.error === 'not-allowed') {
                        alert("Microphone access is required for speech recognition. Please check your browser settings. 🎙️");
                    } else {
                        startAudioFallback();
                    }
                };

                recognition.onend = () => {
                    setIsRecording(false);
                    isRecordingRef.current = false;
                };

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log("Speech Recognition Success:", transcript);
                    setIsProcessing(true);
                    onScanComplete(transcript);
                    setTimeout(() => setIsProcessing(false), 2000);
                };

                recognition.start();
            } catch (err) {
                console.error("Failed to start Speech Recognition, falling back:", err);
                startAudioFallback();
            }
        } else {
            startAudioFallback();
        }
    };

    const handlePressEnd = () => {
        if (!isRecordingRef.current) return;
        isRecordingRef.current = false;

        // soft release haptics
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Error stopping recognition:", e);
            }
            recognitionRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error("Error stopping media recorder:", e);
            }
        }
    };

    const labels = {
        scan: {
            idle: "HOLD TO SCAN",
            recording: "ANALYZING TONE...",
            processing: "SYNCING...",
            icon: <FiMic />
        },
        command: {
            idle: "HOLD TO TALK",
            recording: "LISTENING...",
            processing: "EXECUTING...",
            icon: <FiZap style={{ color: 'var(--primary)' }} />
        }
    };

    const currentLabels = labels[mode] || labels.scan;

    return (
        <div className={`voice-scan-wrapper ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''} mode-${mode}`}>
            <button 
                className="voice-scan-btn" 
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onTouchCancel={handlePressEnd}
                onContextMenu={(e) => e.preventDefault()}
                disabled={isProcessing}
                title={currentLabels.idle}
                style={{ touchAction: 'none' }}
            >
                {isProcessing ? (
                    <FiLoader className="spin-slow" />
                ) : (
                    currentLabels.icon
                )}
            </button>
            
            {isRecording && (
                <>
                    <div className="neural-ripple ripple-1" />
                    <div className="neural-ripple ripple-2" />
                    <div className="audio-waveform-container" style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '14px', marginTop: '6px', justifyContent: 'center' }}>
                        <div className="bar bar-1" />
                        <div className="bar bar-2" />
                        <div className="bar bar-3" />
                        <div className="bar bar-4" />
                        <div className="bar bar-5" />
                    </div>
                </>
            )}
            
            <div className="status-label">
                {isRecording ? currentLabels.recording : isProcessing ? currentLabels.processing : currentLabels.idle}
            </div>
        </div>
    );
};

export default VoiceScanButton;
