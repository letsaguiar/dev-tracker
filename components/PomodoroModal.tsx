import React, { useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { Button, Card } from './ui/Common';
import { cn } from '../lib/utils';
import { initAudio } from '../lib/sound';

interface PomodoroModalProps {
    taskId?: string; // Optional for Generic Mode
    onClose: () => void;
    isGeneric?: boolean;
}

const WORK_TIME = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

const PomodoroModal: React.FC<PomodoroModalProps> = ({ taskId, onClose, isGeneric }) => {
    // Connect to Global Timer Store
    const {
        timeLeft,
        isActive,
        mode,
        pomodoroCount,
        activeTaskId,
        startTimer,
        pauseTimer,
        resetTimer,
        setMode
    } = useTimerStore();

    // Get task if exists
    // If generic, task is undefined.
    // If modal opened for a specific task but timer is running for another, 
    // we should probably warn or show the running one? 
    // The previous implementation assumed this modal IS the timer. 
    // Now the timer is global.

    // Logic: 
    // If the global timer is active and activeTaskId !== taskId, 
    // we are viewing a different task than the one running.
    // This UX needs decision. For now, let's assume if you open this modal for Task B, 
    // and Task A is running, we show Task A's timer? Or we switch?
    // Let's assume we SWITCH context if not active. If active, we warn?
    // For simplicity V1: If you open a modal, you are "Connecting" to the global timer.
    // However, if the Timer is running for ANOTHER task, we should probably prompt user.
    // But since we removed "Start" button from list if another is running (maybe?), 
    // Let's just handle the current global state.

    // If taskId is provided, we might want to start/Associate the timer with it if it's idle.
    // Effectively: useEffect on mount -> if idle, set activeTaskId? No, let user click start.

    // We need to fetch the task object for display labels.
    // Note: activeTaskId from store is the source of truth for "What is running".
    // taskId prop is "What did I click on".

    const displayTaskId = activeTaskId || taskId;
    const task = useTaskStore(state => state.tasks.find(t => t.id === displayTaskId));

    // Calculate time total for progress bar
    const totalTime = mode === 'work' ? WORK_TIME : (mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK_TIME);
    const percentage = ((totalTime - timeLeft) / totalTime) * 100;

    const handleClose = () => {
        // We do NOT stop the timer on close anymore!
        onClose();
    };

    const toggleTimer = () => {
        if (!isActive) {
            initAudio();
            // If we are starting fresh (or resuming), ensuring we have the right task ID
            // If currently idle, we start with the `taskId` prop (or null if generic).
            // If currently active/paused, we resume.
            // If we are paused on Task A, and clicked Task B... that's a switch.
            // useTimerStore handles switching if we pass an ID.

            // If generic mode is requested and we are idle:
            if (isGeneric && !activeTaskId) {
                startTimer(null);
            } else if (taskId && activeTaskId !== taskId) {
                // Switching tasks!
                // Auto-reset timer for new task? or continue?
                // Standard behavior: New Task = New Timer.
                // We should probably reset if the ID changes.
                // For now, `startTimer(taskId)` will update the ID. 
                // Implied Reset needs to happen in Store or we do it here.
                // Let's force reset if we switch tasks?
                // Actually, let's just let startTimer handle it.
                resetTimer(); // Reset time for new task
                startTimer(taskId);
            } else {
                startTimer(); // Resume
            }

        } else {
            pauseTimer();
        }
    };

    const handleModeSwitch = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
        setMode(newMode);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-2 shadow-2xl relative overflow-hidden bg-card">
                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear"
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
                        <h2 className="text-2xl font-bold tracking-tight">
                            {task ? `${task.code}: ${task.title}` : (isGeneric ? "Free Flow Focus" : "Focus Mode")}
                        </h2>
                        <div className="flex justify-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                                mode === 'work' ? "bg-primary/20 text-primary" : "text-muted-foreground opacity-50")}>
                                Focus
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                                mode === 'shortBreak' ? "bg-green-500/20 text-green-600" : "text-muted-foreground opacity-50")}>
                                Short Break
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                                mode === 'longBreak' ? "bg-blue-500/20 text-blue-600" : "text-muted-foreground opacity-50")}>
                                Long Break
                            </span>
                        </div>
                    </div>

                    <div className={cn("text-8xl font-mono font-black tracking-tighter tabular-nums select-none transition-colors",
                        timeLeft < 60 && isActive && mode === 'work' ? "text-red-500" : "text-foreground"
                    )}>
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            className={cn(
                                "h-16 w-32 rounded-full text-lg font-bold shadow-lg transition-all",
                                isActive ? "bg-primary/90 hover:bg-primary shadow-primary/20" : "bg-primary hover:bg-primary/90"
                            )}
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
                        <Button variant="ghost" size="sm" onClick={() => handleModeSwitch('work')} className={mode === 'work' ? "bg-accent" : ""}>
                            <Zap className="w-3 h-3 mr-2" /> Focus
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleModeSwitch('shortBreak')} className={mode === 'shortBreak' ? "bg-accent" : ""}>
                            <Coffee className="w-3 h-3 mr-2" /> Short
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleModeSwitch('longBreak')} className={mode === 'longBreak' ? "bg-accent" : ""}>
                            <Coffee className="w-3 h-3 mr-2" /> Long
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {task ? (
                            `Sessions done: ${task.pomodoro.actual} / ${task.pomodoro.estimated} (This run: ${pomodoroCount})`
                        ) : (
                            `Sessions done this run: ${pomodoroCount}`
                        )}
                    </div>
                </div>
            </Card>
        </div>,
        document.body
    );
};

export default PomodoroModal;
