import React from 'react';
import { useTimerStore } from '../store/useTimerStore';
import { useTaskStore } from '../store/useTaskStore';
import { Play, Pause, Maximize2, X, Zap } from 'lucide-react';
import { Button } from './ui/Common';
import { cn } from '../lib/utils';
import PomodoroModal from './PomodoroModal';
import { initAudio } from '../lib/sound';

const TimerWidget: React.FC = () => {
    const {
        timeLeft,
        isActive,
        activeTaskId,
        mode,
        startTimer,
        pauseTimer
    } = useTimerStore();

    // We only show the widget if:
    // 1. Timer is active (running or paused with time)
    // 2. AND we assume the full modal is NOT open (This is tricky, we might need a local state or store state for "ModalOpen")
    // implementation_plan suggested widget appears when Modal is closed. 
    // Let's add a `isModalOpen` to store or just handle it here locally?
    // Better: The `PomodoroModal` component helps manage this. 
    // BUT the Widget should be persistent.
    // Let's assume the Widget is ALWAYS available if `activeTaskId` or `isActive` is true, 
    // but maybe we hide it if the Modal is open? 
    // For now, let's just make it a floating bottom-right widget.

    const [isExpanded, setIsExpanded] = React.useState(false);

    // Get Active Task details
    const task = useTaskStore(state => state.tasks.find(t => t.id === activeTaskId));

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isActive) {
            pauseTimer();
        } else {
            startTimer();
        }
    };

    // If completely idle (not active, full time) and no task, show nothing or a small "Start Focus" pill?
    // Let's hide if not active and no active task.
    // BUT wait, user wants Generic Focus.
    // Let's show a small "Zap" icon if idle.

    // Handling Modal Opening
    const handleExpand = () => {
        setIsExpanded(true);
    };

    if (isExpanded) {
        return (
            <PomodoroModal
                taskId={activeTaskId || undefined} // Check if PomodoroModal handles generic
                onClose={() => setIsExpanded(false)}
                isGeneric={!activeTaskId}
            />
        );
    }

    // Mini Player State
    // If we have an active session OR a paused non-full session
    const hasActiveSession = isActive || timeLeft < (25 * 60) || activeTaskId;

    if (!hasActiveSession) {
        // Show a subtle FAB or nothing?
        // Let's return nothing for now to reduce clutter, 
        // unless we want a "Start Generic Button" always visible.
        // Let's make it a small standard FAB.
        return (
            <div className="fixed bottom-6 right-6 z-40">
                <Button
                    className="h-12 w-12 rounded-full shadow-lg"
                    onClick={() => {
                        // Start generic session
                        // set generic/active?
                        startTimer(null); // Explicit null for generic
                        setIsExpanded(true);
                    }}
                    title="Start Focus Session"
                >
                    <Zap className="w-5 h-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-40 flex items-center gap-3 p-3 rounded-full shadow-2xl transition-all duration-300 border border-border animate-in slide-in-from-bottom-10 fade-in",
            mode === 'work' ? "bg-card text-card-foreground" : "bg-green-100 text-green-900 border-green-200" // Simple break styling
        )}>
            {/* Progress Ring or Simple Time? Simple Time first. */}

            <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={handleExpand}
            >
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    mode === 'work' ? "bg-primary/10 text-primary" : "bg-green-500/20 text-green-700"
                )}>
                    {mode === 'work' ? <Zap className="w-4 h-4" /> : <div className="text-xs font-bold">BRK</div>}
                </div>

                <div className="flex flex-col">
                    <span className="font-mono text-xl font-bold leading-none">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-[10px] uppercase font-bold opacity-60 max-w-[100px] truncate">
                        {task ? task.code : (mode === 'work' ? "Focus" : "Break")}
                    </span>
                </div>
            </div>

            <div className="h-8 w-px bg-border mx-1" />

            <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full hover:bg-primary/10"
                onClick={togglePlay}
            >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            {/* Close / Stop? Maybe just pause. Reset is in Modal. */}
        </div>
    );
};

export default TimerWidget;
