// Text-To-Speech (TTS) Service for Wellnest
// Selects the highest quality, most natural and "sweet" voice available on the device.

export const speakMessage = (text, isMuted = false) => {
    if (isMuted || !text || !('speechSynthesis' in window)) {
        return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set speaking parameters for a warm, natural, and friendly tone
    utterance.rate = 0.95;  // Slightly slower (sounds more natural/encouraging)
    utterance.pitch = 1.06; // Slightly higher/warmer pitch (sounds friendly, "sweet" voice)

    const findAndSetBestVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
            return false;
        }

        // Detect if text contains Hindi characters (Devanagari script)
        const isHindiText = /[\u0900-\u097F]/.test(text);

        let priorityPatterns = [];
        if (isHindiText) {
            // Hindi text priority
            priorityPatterns = [
                { name: 'Google हिन्दी', lang: 'hi-IN' },
                { name: 'Kalpana', lang: 'hi-IN' },
                { name: 'Hemant', lang: 'hi-IN' }
            ];
        } else {
            // English / Hinglish text priority (prefer natural English voices)
            priorityPatterns = [
                // 1. High-quality Indian English (best for Hinglish and English in India context)
                { name: 'Google India English', lang: 'en-IN' },
                { name: 'Heera', lang: 'en-IN' }, // Microsoft Heera
                { name: 'Rishi', lang: 'en-IN' },  // iOS Rishi
                { name: 'Ravi', lang: 'en-IN' },   // Microsoft Ravi
                
                // 2. High-quality natural US/UK English female voices (very sweet & pleasant)
                { name: 'Aria', lang: 'en-US' },     // Microsoft Aria (Natural sweet)
                { name: 'Google US English', lang: 'en-US' },
                { name: 'Samantha', lang: 'en-US' },  // iOS Samantha
                { name: 'Google UK English Female', lang: 'en-GB' },
                { name: 'Zira', lang: 'en-US' }      // Microsoft Zira
            ];
        }

        let selectedVoice = null;

        // 1. Try to match the priority list
        for (const pref of priorityPatterns) {
            selectedVoice = voices.find(v => 
                v.name.toLowerCase().includes(pref.name.toLowerCase()) && 
                v.lang.toLowerCase().startsWith(pref.lang.split('-')[0].toLowerCase())
            );
            if (selectedVoice) break;
        }

        // 2. Fallback if no priority match found
        if (!selectedVoice) {
            if (isHindiText) {
                // Fallback to any Hindi voice
                selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
            } else {
                // Fallback to any Indian English first, then generic English
                selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-in'));
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => 
                        v.lang.toLowerCase().startsWith('en') && 
                        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural'))
                    );
                }
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
                }
            }
        }

        // 3. Absolute fallback (any voice)
        if (!selectedVoice) {
            selectedVoice = voices[0];
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
            console.log("TTS Selected Sweet Voice:", selectedVoice.name, `(${selectedVoice.lang})`);
        }
        return true;
    };

    // Try setting the voice immediately (works if voices are already loaded)
    const success = findAndSetBestVoice();

    // If voices are not yet loaded (async loading behavior in browsers like Chrome),
    // queue it using the onvoiceschanged callback.
    if (!success && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            findAndSetBestVoice();
            window.speechSynthesis.speak(utterance);
            window.speechSynthesis.onvoiceschanged = null; // Clean up
        };
        return;
    }

    // Speak!
    window.speechSynthesis.speak(utterance);
};
