import React, { useEffect } from 'react';
import { useDailyStore } from '../store/useDailyStore';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus } from '../types';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
import { Button, Card, CardContent, Select } from './ui/Common';
import { cn } from '../lib/utils';

const PomodoroTimer: React.FC = () => {
    const { pomodoroState, tickPomodoro, resetPomodoro, startPomodoro, pausePomodoro, setBreak, setPomodoroTask } = useDailyStore();
    const { incrementPomodoro, tasks } = useTaskStore();
    
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.Done);

    useEffect(() => {
        let interval: number;
        if (pomodoroState.isActive && pomodoroState.timeLeft > 0) {
            interval = window.setInterval(() => {
                tickPomodoro();
            }, 1000);
        } else if (pomodoroState.isActive && pomodoroState.timeLeft === 0) {
            // Timer finished
            pausePomodoro();
            if (!pomodoroState.isBreak && pomodoroState.currentTaskId) {
                incrementPomodoro(pomodoroState.currentTaskId);
                setBreak(true);
            } else if (pomodoroState.isBreak) {
                setBreak(false); // Back to work
            }
        }

        return () => clearInterval(interval);
    }, [pomodoroState.isActive, pomodoroState.timeLeft, tickPomodoro, pausePomodoro, pomodoroState.isBreak, pomodoroState.currentTaskId, incrementPomodoro, setBreak]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Card className={cn("border-2 transition-colors", pomodoroState.isBreak ? "border-green-500/20 bg-green-900/10" : "border-primary/20 bg-card")}>
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {pomodoroState.isBreak ? <><Coffee className="w-4 h-4" /> Break Time</> : <><Zap className="w-4 h-4" /> Focus Mode</>}
                </div>
                
                <div className="text-5xl font-mono font-bold tabular-nums">
                    {formatTime(pomodoroState.timeLeft)}
                </div>

                <div className="w-full px-2">
                    <Select 
                        value={pomodoroState.currentTaskId || ""}
                        onChange={(e) => setPomodoroTask(e.target.value)}
                        disabled={pomodoroState.isActive}
                        className="w-full text-center h-8 text-sm"
                    >
                        <option value="" disabled>Select a task to focus</option>
                        {activeTasks.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.code}: {t.title}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {!pomodoroState.isActive ? (
                        <Button 
                            size="sm" 
                            className="w-24" 
                            onClick={() => {
                                if(pomodoroState.currentTaskId || pomodoroState.isBreak) {
                                    startPomodoro(pomodoroState.currentTaskId || '');
                                }
                            }}
                            disabled={!pomodoroState.currentTaskId && !pomodoroState.isBreak}
                        >
                            <Play className="w-4 h-4 mr-2" /> Start
                        </Button>
                    ) : (
                        <Button size="sm" variant="secondary" className="w-24" onClick={pausePomodoro}>
                            <Pause className="w-4 h-4 mr-2" /> Pause
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={resetPomodoro}>
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
                
                {/* Manual Mode Switch */}
                <div className="flex gap-2 text-[10px] mt-2">
                     <button onClick={() => setBreak(false)} className={cn("px-2 py-1 rounded", !pomodoroState.isBreak ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>Work</button>
                     <button onClick={() => setBreak(true)} className={cn("px-2 py-1 rounded", pomodoroState.isBreak ? "bg-green-600 text-white" : "text-muted-foreground hover:bg-accent")}>Break</button>
                </div>
            </CardContent>
        </Card>
    );
};

export default PomodoroTimer;