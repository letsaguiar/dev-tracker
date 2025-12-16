import React, { useEffect, useRef } from 'react';
import { useTimerStore } from '../store/useTimerStore';

const GlobalTimerHandler: React.FC = () => {
    const {
        isActive,
        timeLeft,
        tick,
        syncWorker
    } = useTimerStore();

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Worker
        // @ts-ignore
        const baseUrl = import.meta.env.BASE_URL;
        const workerPath = `${baseUrl}timer-worker.js`;

        try {
            workerRef.current = new Worker(workerPath);
            syncWorker(workerRef.current);
            console.log("Global Timer Worker Initialized");

            workerRef.current.onerror = (err) => {
                console.error("Worker Error:", err);
            };

            workerRef.current.onmessage = (e) => {
                const { type, timeLeft: workerTimeLeft } = e.data;
                if (type === 'TICK') {
                    // Calculate delta if needed, or just sync time
                    // For now, simpler to just tick(1) if we trust the interval?
                    // Actually, worker sends updated timeLeft.
                    // We need to calculate delta for Time Tracking.
                    const currentStoreTime = useTimerStore.getState().timeLeft;
                    const delta = currentStoreTime - workerTimeLeft;

                    if (delta > 0) {
                        tick(delta);
                    }
                } else if (type === 'COMPLETE') {
                    // Force complete
                    // We tick remainder
                    const currentStoreTime = useTimerStore.getState().timeLeft;
                    if (currentStoreTime > 0) tick(currentStoreTime);
                }
            };
        } catch (e) {
            console.error("Failed to init worker", e);
        }

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Sync Worker with Store State
    useEffect(() => {
        if (!workerRef.current) return;

        if (isActive) {
            // Check if worker needs start
            // We send current timeLeft to ensure sync
            workerRef.current.postMessage({ type: 'START', payload: { timeLeft } });
        } else {
            workerRef.current.postMessage({ type: 'PAUSE' });
        }
    }, [isActive]); // We only trigger on Active change. 
    // If timeLeft changes due to tick, we DON'T send it back to worker loop, standard loop.

    return null; // Logic only
};

export default GlobalTimerHandler;
