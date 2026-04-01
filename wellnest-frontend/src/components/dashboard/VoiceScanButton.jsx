import React, { useState } from 'react';
import { FiMic, FiZap, FiLoader } from 'react-icons/fi';
import './VoiceScanButton.css';

const VoiceScanButton = ({ onScanComplete, mode = "scan" }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const startScan = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : '' });
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
                
                // Processing UI delay
                setTimeout(() => setIsProcessing(false), 2000);
            };

            setIsRecording(true);
            mediaRecorder.start(1000);

            // Record for 7s (Command) or 10s (Scan)
            const duration = mode === "command" ? 7000 : 10000;
            setTimeout(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                }
            }, duration);

        } catch (err) {
            console.error("Microphone Access Denied:", err);
            alert("Microphone access is required for your AI Assistant. Please enable it in settings. 🎙️");
        }
    };

    const labels = {
        scan: {
            idle: "CLARITY SCAN",
            recording: "ANALYZING TONE...",
            processing: "SYNCING...",
            icon: <FiMic />
        },
        command: {
            idle: "AI COMMAND",
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
                onClick={startScan}
                disabled={isProcessing}
                title={currentLabels.idle}
            >
                {isProcessing ? (
                    <FiLoader className="spin-slow" />
                ) : (
                    currentLabels.icon
                )}
            </button>
            
            {isRecording && <div className="neural-ripple" />}
            
            <div className="status-label">
                {isRecording ? currentLabels.recording : isProcessing ? currentLabels.processing : currentLabels.idle}
            </div>
        </div>
    );
};

export default VoiceScanButton;
