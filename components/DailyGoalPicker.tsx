import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useDailyStore } from '../store/useDailyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input } from './ui/Common';
import { Search, ChevronRight, ChevronDown, Check, Plus } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { cn } from '../lib/utils';
import { DailyGoalType } from '../types';

interface DailyGoalPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DailyGoalPicker: React.FC<DailyGoalPickerProps> = ({ open, onOpenChange }) => {
    const { tasks } = useTaskStore();
    const { addGoal, todayGoals } = useDailyStore();
    const [search, setSearch] = useState('');
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // Filter tasks not done
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.Done);

    // Filter by search
    const filteredTasks = activeTasks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        t.subtasks.some(s => s.title.toLowerCase().includes(search.toLowerCase()))
    );

    const toggleExpand = (taskId: string) => {
        const newSet = new Set(expandedTasks);
        if (newSet.has(taskId)) {
            newSet.delete(taskId);
        } else {
            newSet.add(taskId);
        }
        setExpandedTasks(newSet);
    };

    const isSelected = (id: string) => todayGoals.some(g => g.id === id);

    const handleAdd = (id: string, taskId: string, type: DailyGoalType) => {
        addGoal({ id, taskId, type });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add to Today's Focus</DialogTitle>
                </DialogHeader>

                <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filteredTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No active tasks found matching your search.
                        </div>
                    )}
                    {filteredTasks.map(task => {
                        const isTaskSelected = isSelected(task.id);
                        const isExpanded = expandedTasks.has(task.id);
                        const hasSubtasks = task.subtasks.length > 0;

                        return (
                            <div key={task.id} className="border rounded-md bg-card">
                                <div className="flex items-center p-3 gap-2 hover:bg-muted/50 transition-colors rounded-t-md">
                                    <button
                                        onClick={() => toggleExpand(task.id)}
                                        className={cn("p-1 rounded hover:bg-muted text-muted-foreground", !hasSubtasks && "invisible")}
                                    >
                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-mono">{task.code}</span>
                                            {task.title}
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={isTaskSelected ? "secondary" : "outline"}
                                        className={cn("h-7 px-2 gap-1", isTaskSelected && "text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400")}
                                        disabled={isTaskSelected}
                                        onClick={() => handleAdd(task.id, task.id, 'task')}
                                    >
                                        {isTaskSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        {isTaskSelected ? "Added" : "Add Task"}
                                    </Button>
                                </div>

                                {isExpanded && hasSubtasks && (
                                    <div className="border-t bg-secondary/10 p-2 space-y-1">
                                        {task.subtasks.map(sub => {
                                            const isSubSelected = isSelected(sub.id);
                                            if (sub.completed) return null; // Don't show completed subtasks

                                            return (
                                                <div key={sub.id} className="flex items-center gap-3 pl-8 pr-2 py-1.5 hover:bg-background/80 rounded transition-colors text-sm">
                                                    <div className="flex-1 truncate text-muted-foreground">
                                                        {sub.title}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className={cn("h-6 px-2 gap-1 text-xs", isSubSelected ? "text-green-600" : "text-muted-foreground hover:text-foreground")}
                                                        disabled={isSubSelected}
                                                        onClick={() => handleAdd(sub.id, task.id, 'subtask')}
                                                    >
                                                        {isSubSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                                        {isSubSelected ? "Added" : "Add Subtask"}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        {task.subtasks.every(s => s.completed) && (
                                            <div className="text-xs text-muted-foreground pl-8 py-2 italic">All subtasks completed.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DailyGoalPicker;
