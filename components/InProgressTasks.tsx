import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus } from '../types';
import { Play } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from './ui/Common';
import PomodoroModal from './PomodoroModal';

const InProgressTasks: React.FC = () => {
    const { tasks, updateTask } = useTaskStore();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Filter tasks that are not done
    // Sort by status (InProgress first, then others) or just filter
    const activeTasks = tasks
        .filter(t => t.status === TaskStatus.InProgress || t.status === TaskStatus.Todo || t.status === TaskStatus.Waiting || t.status === TaskStatus.Blocked)
        .sort((a, b) => {
            if (a.status === TaskStatus.InProgress && b.status !== TaskStatus.InProgress) return -1;
            if (a.status !== TaskStatus.InProgress && b.status === TaskStatus.InProgress) return 1;
            return 0;
        });

    const handleEstimateChange = (taskId: string, val: string) => {
        const num = parseInt(val);
        if (!isNaN(num) && num >= 0) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                updateTask(taskId, { pomodoro: { ...task.pomodoro, estimated: num } });
            }
        }
    };

    return (
        <>
            <Card className="mt-8 border-t-4 border-t-primary shadow-sm bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        🚀 Active Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activeTasks.length === 0 ? (
                        <div className="text-muted-foreground text-center py-8">
                            No active tasks found. Time to plan!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeTasks.map(task => (
                                <div key={task.id} className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-all hover:shadow-md">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                {task.code}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground border px-1.5 py-0.5 rounded-full">
                                                {task.status}
                                            </span>
                                        </div>
                                        <h3 className="font-medium truncate text-sm sm:text-base" title={task.title}>{task.title}</h3>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="flex items-center text-sm bg-secondary/50 p-1 rounded-md border border-transparent focus-within:border-primary/20 transition-colors">
                                            <span className="pl-2 font-mono text-muted-foreground font-medium" title="Completed Pomodoros">
                                                {task.pomodoro.actual}
                                            </span>
                                            <span className="mx-1 text-muted-foreground">/</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                className="w-10 h-7 text-center p-0 tabular-nums border-none focus-visible:ring-0 bg-transparent font-medium"
                                                value={task.pomodoro.estimated}
                                                onChange={(e) => handleEstimateChange(task.id, e.target.value)}
                                                placeholder="0"
                                                title="Target Pomodoros"
                                            />
                                        </div>

                                        <Button
                                            size="sm"
                                            className="gap-2 shadow-sm whitespace-nowrap"
                                            onClick={() => setSelectedTaskId(task.id)}
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" /> <span className="hidden sm:inline">Focus</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedTaskId && (
                <PomodoroModal
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </>
    );
};

export default InProgressTasks;
