import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playNotificationSound } from '../lib/sound';
import { useTaskStore } from './useTaskStore';
import { useDailyStore } from './useDailyStore';

interface TimerState {
    timeLeft: number;
    isActive: boolean;
    mode: 'work' | 'shortBreak' | 'longBreak';
    activeTaskId: string | null;
    pomodoroCount: number; // Completed sessions in current run
    elapsedTime: number; // Seconds spent in current session (for tracking)

    // Actions
    startTimer: (taskId?: string | null) => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    setMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void;
    tick: (delta: number) => void;
    completeSession: () => void;
    syncWorker: (worker: Worker) => void;
}

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

export const useTimerStore = create<TimerState>()(
    persist(
        (set, get) => ({
            timeLeft: WORK_TIME,
            isActive: false,
            mode: 'work',
            activeTaskId: null,
            pomodoroCount: 0,
            elapsedTime: 0,

            startTimer: (taskId) => set((state) => {
                // If providing a taskId (switching tasks) or starting fresh, update it.
                // If taskId is undefined, keep current (resuming).
                const newTaskId = taskId !== undefined ? taskId : state.activeTaskId;

                return {
                    isActive: true,
                    activeTaskId: newTaskId
                };
            }),

            pauseTimer: () => set({ isActive: false }),

            resetTimer: () => {
                const { mode } = get();
                const time = mode === 'work' ? WORK_TIME : (mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK_TIME);
                set({
                    isActive: false,
                    timeLeft: time,
                    elapsedTime: 0
                });
            },

            setMode: (mode) => {
                let time = WORK_TIME;
                if (mode === 'shortBreak') time = SHORT_BREAK;
                if (mode === 'longBreak') time = LONG_BREAK_TIME;
                set({
                    mode,
                    timeLeft: time,
                    isActive: false,
                    elapsedTime: 0
                });
            },

            tick: (delta) => {
                const { timeLeft, activeTaskId, elapsedTime, mode } = get();

                // 1. Update Timer
                const newTimeLeft = timeLeft - delta;
                const newElapsedTime = elapsedTime + delta;

                // 2. Track Time (if in work mode and has task)
                if (mode === 'work' && activeTaskId) {
                    // We update the Task Store periodically or on significant ticks.
                    // For now, we'll update it every tick to ensure strict accuracy, 
                    // relying on Zustand's efficiency. If too slow, genericize.
                    useTaskStore.getState().updateTask(activeTaskId, {
                        pomodoro: {
                            ...useTaskStore.getState().tasks.find(t => t.id === activeTaskId)?.pomodoro || { estimated: 0, actual: 0, timeSpent: 0 },
                            // We need to fetch fresh to avoid overwriting invalid state,
                            // but cleaner way is to use a specific action. 
                            // Let's rely on standard update for now, but optimize later if needed.
                            // Actually, let's use a specific action 'trackTime' to avoid full object merge overhead if possible,
                            // but updateTask is fine for V1.
                            // IMPORTANT: We must add `delta` to existing timeSpent.
                            // THIS IS TRICKY: We can't easily "add delta" via atomic updateTask unless we read it first.
                            // Better approach: Create `addTimeSpent` action in TaskStore.
                        }
                    });
                    useTaskStore.getState().addTimeSpent(activeTaskId, delta);
                }

                if (newTimeLeft <= 0) {
                    // Timer Done
                    get().completeSession();
                } else {
                    set({ timeLeft: newTimeLeft, elapsedTime: newElapsedTime });
                }
            },

            completeSession: () => {
                const { mode, activeTaskId, pomodoroCount } = get();

                playNotificationSound();

                if (mode === 'work') {
                    // Increment actual pomodoro count
                    if (activeTaskId) {
                        useTaskStore.getState().incrementPomodoro(activeTaskId);
                        useDailyStore.getState().addPomodoroSession(activeTaskId);
                    } else {
                        // Generic Session logging
                        // We might want to log this in DailyStore too?
                        // For now, simple console or skip.
                    }

                    set({
                        isActive: false,
                        pomodoroCount: pomodoroCount + 1,
                        elapsedTime: 0,
                        timeLeft: 0 // Ensure it hits 0
                    });

                    // Optional: Auto-suggest break?
                    if (Notification.permission === 'granted') {
                        new Notification("Focus Session Complete!", { body: "Great job! Time for a break?" });
                    }

                } else {
                    // Break done
                    set({
                        isActive: false,
                        elapsedTime: 0,
                        timeLeft: 0
                    });
                    if (Notification.permission === 'granted') {
                        new Notification("Break Over!", { body: "Ready to focus again?" });
                    }
                }
            },

            syncWorker: (worker) => {
                // This function can be called by UI to send state to worker if needed, 
                // or we can rely on the Effect in the Global Handler.
            }
        }),
        {
            name: 'dev-timer-storage', // name of the item in the storage (must be unique)
            partialize: (state) => ({
                // Only persist strictly necessary state
                mode: state.mode,
                timeLeft: state.timeLeft,
                activeTaskId: state.activeTaskId,
                pomodoroCount: state.pomodoroCount,
                isActive: state.isActive // We might want to resume paused? Or auto-pause on reload?
                // If we persist isActive=true, we need to handle the "time passed while closed" logic.
                // For now, let's default to PAUSED on reload to avoid confusion, OR trust the worker?
                // Let's persist isActive, but if the worker isn't running, it won't tick until we restart it.
            }),
        }
    )
);
