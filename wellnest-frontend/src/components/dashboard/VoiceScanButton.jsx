import React, { useState } from 'react';
import { FiMic, FiLoader } from 'react-icons/fi';
import './VoiceScanButton.css';

const VoiceScanButton = ({ onScanComplete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const startScan = async () => {
        try {
            // 🎙️ Request Permission and Start Media Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            setIsRecording(true);
            
            // Simulate a 5-second high-performance scan
            setTimeout(() => {
                // Stop the mic stream to save battery and privacy
                stream.getTracks().forEach(track => track.stop());
                
                setIsRecording(false);
                setIsProcessing(true);
                
                // Simulate AI Analysis Delay
                setTimeout(() => {
                    setIsProcessing(false);
                    // Mocking a successful scan for the demo/build
                    onScanComplete({
                        text: "Feeling focused but a bit drained from the morning session.",
                        reserve: 65
                    });
                }, 1500);
            }, 4000);
        } catch (err) {
            console.error("Microphone Access Denied:", err);
            alert("Microphone access is required for your Voice Clarity Scan. Please enable it in settings. 🛡️");
        }
    };

    return (
        <div className={`voice-scan-wrapper ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}>
            <button 
                className="voice-scan-btn" 
                onClick={startScan}
                disabled={isProcessing}
                title="Clarity Scan"
            >
                {isProcessing ? (
                    <FiLoader className="spin-slow" />
                ) : (
                    <FiMic />
                )}
            </button>
            
            {isRecording && <div className="neural-ripple" />}
            
            <div className="status-label">
                {isRecording ? "ANALYZING TONE..." : isProcessing ? "SYNCING..." : "CLARITY SCAN"}
            </div>
        </div>
    );
};

export default VoiceScanButton;
