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
                
                // Pass the real audio file to the completion handler
                onScanComplete(audioBlob);
                
                // Cleanup
                stream.getTracks().forEach(track => track.stop());
                
                // Simulated "AI Processing" UI delay (actual request happens in parent)
                setTimeout(() => setIsProcessing(false), 2000);
            };

            setIsRecording(true);
            // Request data every 1 second (1000ms) to prevent 0-byte blobs on buggy Mobile Safari versions
            mediaRecorder.start(1000);

            // Record for exactly 10 seconds
            setTimeout(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                }
            }, 10000);

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
