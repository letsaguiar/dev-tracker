import React, { useState, useMemo } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus, Task } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Select } from './ui/Common';
import { ArrowUpRight, ArrowDownRight, Activity, CheckCircle2, ListPlus, Clock, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { isAfter, differenceInDays } from 'date-fns';

const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

const MetricsView: React.FC = () => {
  const { tasks } = useTaskStore();
  const [timeRange, setTimeRange] = useState<string>('30'); // '7', '30', '90', 'all'

  const stats = useMemo(() => {
      const now = new Date();
      const days = parseInt(timeRange);
      const startDate = timeRange === 'all' ? new Date(0) : subDays(now, days);

      // --- Helpers ---
      const isInRange = (dateStr?: string | null) => {
          if (!dateStr) return false;
          return isAfter(new Date(dateStr), startDate);
      };

      const getHistoryTimestamp = (task: Task, actionMatch: string) => {
          const entry = task.history.find(h => h.action.includes(actionMatch));
          return entry ? new Date(entry.timestamp) : null;
      };

      // --- Calculations ---
      
      // 1. Velocity (Completed in range)
      const completedTasks = tasks.filter(t => t.status === TaskStatus.Done && isInRange(t.dates.completedDate));
      
      // 2. Created in range
      const createdTasks = tasks.filter(t => {
          // Fallback to history or lastUpdated if creation time isn't explicitly stored separately in a 'createdAt' field
          // (TaskStore uses history[0] as creation usually)
          // Check store: "history: [{ timestamp: now, action: 'Task created' }]" appended to new task.
          // Wait, useTaskStore unshifts: "history: [newHistory, ...task.history]". 
          // So the LAST element is the oldest (creation).
          const creationEntry = t.history[t.history.length - 1]; 
          if(creationEntry && creationEntry.action === 'Task created') {
              return isAfter(new Date(creationEntry.timestamp), startDate);
          }
          // Fallback to startDate if available
          return isInRange(t.dates.startDate);
      });

      // 3. Cycle Time (Avg days from In-Progress -> Done for tasks COMPLETED in range)
      let totalCycleDays = 0;
      let cycleCount = 0;
      completedTasks.forEach(t => {
          // Find when it moved to done
          const doneDate = t.dates.completedDate ? new Date(t.dates.completedDate) : new Date();
          
          // Find earliest "In-Progress" status change
          // History is newest first. We want the *first* time it went to In-Progress.
          // So we iterate backwards or filter.
          const inProgressEntries = t.history.filter(h => h.action.includes('Status changed to In-Progress'));
          // The oldest entry is likely the first transition
          const startEntry = inProgressEntries[inProgressEntries.length - 1];
          
          if (startEntry) {
              const start = new Date(startEntry.timestamp);
              const days = differenceInDays(doneDate, start);
              totalCycleDays += (days < 0 ? 0 : days); // avoid negative if weird data
              cycleCount++;
          } else if (t.dates.startDate) {
              // Fallback to user entered start date
              const start = new Date(t.dates.startDate);
              const days = differenceInDays(doneDate, start);
              totalCycleDays += (days < 0 ? 0 : days);
              cycleCount++;
          }
      });
      const avgCycleTime = cycleCount > 0 ? (totalCycleDays / cycleCount).toFixed(1) : '-';

      // 4. Refinement Health (Active tasks that are fully refined)
      const activeTasks = tasks.filter(t => t.status !== TaskStatus.Done);
      const refinedTasks = activeTasks.filter(t => t.refinement.goal && t.refinement.technicalAnalysis && t.refinement.testingStrategy);
      const refinementRate = activeTasks.length > 0 ? Math.round((refinedTasks.length / activeTasks.length) * 100) : 100;

      // 5. Pomodoro Efficiency (of completed tasks in range)
      let totalEst = 0;
      let totalAct = 0;
      completedTasks.forEach(t => {
          if(t.pomodoro.estimated > 0) {
              totalEst += t.pomodoro.estimated;
              totalAct += t.pomodoro.actual;
          }
      });
      const pomodoroEfficiency = totalEst > 0 ? Math.round((totalAct / totalEst) * 100) : 0; // 100% means perfect prediction

      // 6. Status Distribution (Current snapshot, not ranged)
      const statusCounts = {
          [TaskStatus.Todo]: tasks.filter(t => t.status === TaskStatus.Todo).length,
          [TaskStatus.InProgress]: tasks.filter(t => t.status === TaskStatus.InProgress).length,
          [TaskStatus.Blocked]: tasks.filter(t => t.status === TaskStatus.Blocked).length,
          [TaskStatus.Waiting]: tasks.filter(t => t.status === TaskStatus.Waiting).length,
          [TaskStatus.Done]: tasks.filter(t => t.status === TaskStatus.Done).length,
      };

      return {
          completedCount: completedTasks.length,
          createdCount: createdTasks.length,
          avgCycleTime,
          refinementRate,
          pomodoroEfficiency,
          statusCounts,
          totalTasks: tasks.length
      };

  }, [tasks, timeRange]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Metrics</h2>
            <p className="text-muted-foreground">Team performance and health insights.</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Interval:</span>
            <Select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-[150px]"
            >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="all">All Time</option>
            </Select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
        <Card>
            <CardContent className="p-6 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Velocity
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats.completedCount}</span>
                    <span className="text-xs text-muted-foreground">tasks completed</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ListPlus className="w-4 h-4" /> Inflow
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats.createdCount}</span>
                    <span className="text-xs text-muted-foreground">tasks created</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Cycle Time
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats.avgCycleTime}</span>
                    <span className="text-xs text-muted-foreground">days (avg)</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent className="p-6 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Pomodoro Use
                </span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats.pomodoroEfficiency > 0 ? `${stats.pomodoroEfficiency}%` : '-'}</span>
                    <span className="text-xs text-muted-foreground">Act/Est ratio</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Backlog Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(stats.statusCounts).map(([status, count]) => {
                    const percentage = stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;
                    let barColor = 'bg-secondary';
                    if (status === TaskStatus.Done) barColor = 'bg-green-600';
                    if (status === TaskStatus.InProgress) barColor = 'bg-blue-600';
                    if (status === TaskStatus.Blocked) barColor = 'bg-red-600';
                    if (status === TaskStatus.Waiting) barColor = 'bg-amber-600';

                    return (
                        <div key={status} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{status}</span>
                                <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                <div 
                                    className={cn("h-full rounded-full transition-all duration-500", barColor)} 
                                    style={{ width: `${percentage}%` }} 
                                />
                            </div>
                        </div>
                    );
                })}
                {stats.totalTasks === 0 && <div className="text-center text-muted-foreground py-4">No tasks available</div>}
            </CardContent>
        </Card>

        {/* Throughput vs Inflow Visualization */}
        <Card className="h-full">
             <CardHeader>
                <CardTitle className="text-lg">Throughput vs Inflow</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[200px] space-y-6">
                 <div className="w-full space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-green-500" /> Completed (Velocity)</span>
                            <span className="font-bold">{stats.completedCount}</span>
                        </div>
                        <div className="h-4 w-full bg-secondary/30 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${stats.totalTasks > 0 ? (stats.completedCount / Math.max(stats.completedCount + stats.createdCount, 1)) * 100 : 0}%` }}
                             />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-blue-500" /> Created (Inflow)</span>
                            <span className="font-bold">{stats.createdCount}</span>
                        </div>
                        <div className="h-4 w-full bg-secondary/30 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${stats.totalTasks > 0 ? (stats.createdCount / Math.max(stats.completedCount + stats.createdCount, 1)) * 100 : 0}%` }}
                             />
                        </div>
                    </div>
                 </div>
                 <div className="text-xs text-muted-foreground text-center">
                     {stats.completedCount > stats.createdCount 
                        ? "Net Reduction: You are clearing the backlog." 
                        : stats.createdCount > stats.completedCount 
                            ? "Net Accumulation: The backlog is growing."
                            : "Equilibrium: Inflow matches Outflow."}
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricsView;