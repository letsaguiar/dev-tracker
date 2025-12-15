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
    // Fallback: try to init if it doesn't exist, though it might fail to auto-play if not warm.
    if (!audioContext) {
        initAudio();
    }

    if (!audioContext) return;

    try {
        const ctx = audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (error) {
        console.error("Failed to play notification sound", error);
    }
};
