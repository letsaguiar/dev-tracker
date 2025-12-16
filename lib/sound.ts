let audioContext: AudioContext | null = null;

export const initAudio = () => {
    if (!audioContext) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioContext = new AudioContext();
        }
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(console.error);
    }
};

export const playNotificationSound = () => {
    // Fallback: try to init if it doesn't exist.
    if (!audioContext) {
        initAudio();
    }

    if (!audioContext) return;

    try {
        const ctx = audioContext;
        const now = ctx.currentTime;

        // Function to play a single beep
        const playBeep = (startTime: number, duration: number, freqStart: number, freqEnd: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freqStart, startTime);
            osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);

            // ADS Envelope
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Play three distinct beeps
        playBeep(now, 0.4, 880, 440);
        playBeep(now + 0.5, 0.4, 880, 440);
        playBeep(now + 1.0, 0.6, 880, 440);

    } catch (error) {
        console.error("Failed to play notification sound", error);
    }
};
