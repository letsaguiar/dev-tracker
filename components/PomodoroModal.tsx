import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Zap, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTaskStore } from '../store/useTaskStore';
import { useDailyStore } from '../store/useDailyStore';
import { Button, Card } from './ui/Common';
import { cn } from '../lib/utils';
import { playNotificationSound } from '../lib/sound';

interface PomodoroModalProps {
    taskId: string;
    onClose: () => void;
}

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;
const SESSIONS_BEFORE_LONG_BREAK = 4;

const PomodoroModal: React.FC<PomodoroModalProps> = ({ taskId, onClose }) => {
    const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));
    const { incrementPomodoro } = useTaskStore();
    const { addPomodoroSession } = useDailyStore();

    // Local state for the timer to avoid global store complexity for this isolated feature
    // unless we want to persist it. For "run in background", Worker is key.
    const [timeLeft, setTimeLeft] = useState(WORK_TIME);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [completedSessions, setCompletedSessions] = useState(0);

    // Worker Ref
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Worker
        // Use BASE_URL to correctly locate the worker file when served from a subpath
        // @ts-ignore
        const baseUrl = import.meta.env.BASE_URL;
        const workerPath = `${baseUrl}timer-worker.js`;
        workerRef.current = new Worker(workerPath);

        workerRef.current.onerror = (err) => {
            console.error("Worker Error:", err);
        };

        workerRef.current.onmessage = (e) => {
            const { type, timeLeft: workerTimeLeft } = e.data;
            if (type === 'TICK') {
                setTimeLeft(workerTimeLeft);
            } else if (type === 'COMPLETE') {
                handleComplete();
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Sync Worker with State
    useEffect(() => {
        if (isActive) {
            workerRef.current?.postMessage({ type: 'START', payload: { timeLeft } });
        } else {
            workerRef.current?.postMessage({ type: 'PAUSE' });
        }
    }, [isActive]); // Note: depend on isActive. For timeLeft, we only send initial current value on Start. 
    // But if we pause, we need to ensure we resume correctly.
    // The worker continues from where it was if we don't send new time, 
    // BUT our worker implementation expects 'timeLeft' in payload for START.
    // We should send current 'timeLeft' state when starting.

    const handleComplete = () => {
        setIsActive(false);
        playNotificationSound();

        if (mode === 'work') {
            incrementPomodoro(taskId);
            addPomodoroSession(taskId);
            const newSessions = completedSessions + 1;
            setCompletedSessions(newSessions);

            // Auto-transition considerations? Or just stop and let user decide?
            // "warning user it has been completed" -> Sound done.
            // Suggest break.
        }
        // Notification API if permitted
        if (Notification.permission === 'granted') {
            new Notification("Timer Completed!", {
                body: mode === 'work' ? "Focus session done. Take a break!" : "Break is over. Back to work!",
            });
        }
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        const time = mode === 'work' ? WORK_TIME : (mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK_TIME);
        setTimeLeft(time);
        workerRef.current?.postMessage({ type: 'UPDATE_TIME', payload: { timeLeft: time } });
    };

    const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
        setIsActive(false);
        setMode(newMode);
        let time = WORK_TIME;
        if (newMode === 'shortBreak') time = SHORT_BREAK;
        if (newMode === 'longBreak') time = LONG_BREAK_TIME;
        setTimeLeft(time);
        workerRef.current?.postMessage({ type: 'UPDATE_TIME', payload: { timeLeft: time } });
    };

    const handleClose = () => {
        if (isActive) {
            const confirm = window.confirm("Timer is running. Are you sure you want to leave?");
            if (!confirm) return;
        }
        onClose();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const percentage = mode === 'work'
        ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100
        : mode === 'shortBreak'
            ? ((SHORT_BREAK - timeLeft) / SHORT_BREAK) * 100
            : ((LONG_BREAK_TIME - timeLeft) / LONG_BREAK_TIME) * 100;

    if (!task) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md border-2 shadow-2xl relative overflow-hidden bg-card">
                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                />

                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 z-10"
                    onClick={handleClose}
                >
                    <X className="w-4 h-4" />
                </Button>

                <div className="p-8 flex flex-col items-center space-y-6 text-center">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">{task.code}: {task.title}</h2>
                        <div className="flex justify-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                                mode === 'work' ? "bg-primary/20 text-primary" : "text-muted-foreground")}>
                                Focus
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                                mode === 'shortBreak' ? "bg-green-500/20 text-green-600" : "text-muted-foreground")}>
                                Short Break
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                                mode === 'longBreak' ? "bg-blue-500/20 text-blue-600" : "text-muted-foreground")}>
                                Long Break
                            </span>
                        </div>
                    </div>

                    <div className={cn("text-8xl font-mono font-black tracking-tighter tabular-nums select-none transition-colors",
                        timeLeft < 60 && isActive ? "text-red-500" : "text-foreground"
                    )}>
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            className="h-16 w-32 rounded-full text-lg font-bold shadow-lg shadow-primary/20"
                            onClick={toggleTimer}
                        >
                            {isActive ? (
                                <><Pause className="mr-2 w-6 h-6" /> Pause</>
                            ) : (
                                <><Play className="mr-2 w-6 h-6" /> Start</>
                            )}
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="h-16 w-16 rounded-full"
                            onClick={resetTimer}
                        >
                            <RotateCcw className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t">
                        <Button variant="ghost" size="sm" onClick={() => switchMode('work')} className={mode === 'work' ? "bg-accent" : ""}>
                            <Zap className="w-3 h-3 mr-2" /> Focus
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => switchMode('shortBreak')} className={mode === 'shortBreak' ? "bg-accent" : ""}>
                            <Coffee className="w-3 h-3 mr-2" /> Short
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => switchMode('longBreak')} className={mode === 'longBreak' ? "bg-accent" : ""}>
                            <Coffee className="w-3 h-3 mr-2" /> Long
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Sessions done: {task.pomodoro.actual} / {task.pomodoro.estimated} (This session: {completedSessions})
                    </div>
                </div>
            </Card>
        </div>,
        document.body
    );
};

export default PomodoroModal;
