import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus } from '../types';
import { cn, getStatusColor } from '../lib/utils';
import { 
    format, endOfMonth, endOfWeek, eachDayOfInterval, 
    isSameMonth, isSameDay, addMonths, isToday, isWithinInterval, endOfDay,
    differenceInCalendarDays, addDays, eachWeekOfInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, Input, Select } from './ui/Common';

// Helper functions to replace missing date-fns exports
const startOfDay = (date: Date | number): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date | number): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = (date: Date | number): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Fix for "One Day Behind" issue:
// Inputs are saved as UTC Midnight (ISO string).
// In Western timezones, new Date(isoString) shifts to previous day.
// This helper extracts the UTC components and forces them into Local Time.
const getLocalDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

const CalendarView: React.FC = () => {
  const { tasks, addTask } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDate, setNewDate] = useState<string>('');
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  // Generate a range of years centered on current year
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = parseInt(e.target.value);
      const d = new Date(currentDate);
      d.setDate(1); // Reset day to avoid overflow (e.g., Jan 31 -> Feb 28/29)
      d.setMonth(val);
      setCurrentDate(d);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = parseInt(e.target.value);
      const d = new Date(currentDate);
      d.setDate(1);
      d.setFullYear(val);
      setCurrentDate(d);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // Calendar Grid boundaries (include padded days)
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper: Get color class based on status
  const getTaskColorClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Done: return 'bg-green-600/20 border-green-600/40 text-green-100 hover:bg-green-600/30';
      case TaskStatus.InProgress: return 'bg-blue-600/20 border-blue-600/40 text-blue-100 hover:bg-blue-600/30';
      case TaskStatus.Blocked: return 'bg-red-600/20 border-red-600/40 text-red-100 hover:bg-red-600/30';
      case TaskStatus.Waiting: return 'bg-amber-600/20 border-amber-600/40 text-amber-100 hover:bg-amber-600/30';
      default: return 'bg-secondary border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary/80';
    }
  };

  // Helper: Handle Task Creation
  const handleCreateTask = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCode && newTitle && newDate) {
          // Standardize to ISO string for storage, similar to Dashboard
          const isoDate = new Date(newDate).toISOString();
          addTask({
              code: newCode,
              title: newTitle,
              status: TaskStatus.Todo,
              dueDate: isoDate,
              startDate: isoDate 
          });
          setIsCreateOpen(false);
          setNewCode('');
          setNewTitle('');
      }
  };

  const openCreateModal = (date: Date) => {
      setNewDate(format(date, 'yyyy-MM-dd'));
      setNewCode('');
      setNewTitle('');
      setIsCreateOpen(true);
  };

  // --- LAYOUT LOGIC ---
  const weeks = eachWeekOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="space-y-4 max-w-full h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
            <p className="text-muted-foreground">Manage your schedule.</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex gap-2 mr-2">
                <Select 
                    value={currentMonth} 
                    onChange={handleMonthChange}
                    className="w-[140px] font-medium"
                >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </Select>
                <Select 
                    value={currentYear} 
                    onChange={handleYearChange}
                    className="w-[100px] font-medium"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
            </div>

            <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, -1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card shadow-sm flex flex-col overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
            {weekDays.map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0">
                    {day}
                </div>
            ))}
        </div>

        {/* Weeks */}
        <div className="flex flex-col">
            {weeks.map((weekStart) => {
                const weekEnd = endOfWeek(weekStart);
                const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
                
                // 1. Identify tasks in this week
                const tasksInWeek = tasks.filter(t => {
                    let end = getLocalDate(t.dates.dueDate);
                    const start = getLocalDate(t.dates.startDate);
                    
                    if (t.status === TaskStatus.Done && t.dates.completedDate) {
                        // completedDate might be a full timestamp, usually we want to respect that day
                        const cDate = new Date(t.dates.completedDate);
                        end = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate());
                    }
                    
                    const effectiveStart = start || end; // If no start, assume single day at end
                    const effectiveEnd = end || start;   // If no end, assume single day at start
                    
                    if (!effectiveStart || !effectiveEnd) return false;

                    // Normalize to day boundaries
                    const s = startOfDay(effectiveStart < effectiveEnd ? effectiveStart : effectiveEnd);
                    const e = endOfDay(effectiveEnd > effectiveStart ? effectiveEnd : effectiveStart);

                    // Check overlapping
                    return s <= weekEnd && e >= weekStart;
                }).map(t => {
                    // Pre-calculate display properties for this week
                    let end = getLocalDate(t.dates.dueDate);
                    const start = getLocalDate(t.dates.startDate);
                    
                    if (t.status === TaskStatus.Done && t.dates.completedDate) {
                        const cDate = new Date(t.dates.completedDate);
                        end = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate());
                    }
                    
                    const sDate = startOfDay(start || end || new Date());
                    const eDate = endOfDay(end || start || new Date());
                    const finalStart = sDate < eDate ? sDate : eDate;
                    const finalEnd = eDate > sDate ? eDate : sDate;

                    // Clip to week boundaries
                    const displayStart = finalStart < weekStart ? weekStart : finalStart;
                    const displayEnd = finalEnd > weekEnd ? weekEnd : finalEnd;

                    const startIndex = differenceInCalendarDays(displayStart, weekStart);
                    const duration = differenceInCalendarDays(displayEnd, displayStart) + 1;

                    return {
                        ...t,
                        startIndex, // 0-6
                        duration,   // 1-7
                        originalStart: finalStart,
                        originalEnd: finalEnd
                    };
                });

                // 2. Sort tasks: earlier start first, then longer duration
                tasksInWeek.sort((a, b) => {
                    if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
                    return b.duration - a.duration;
                });

                // 3. Lane layout algorithm
                const lanes: (typeof tasksInWeek)[] = [];
                tasksInWeek.forEach(task => {
                    // Find first lane where this task fits
                    let laneIndex = lanes.findIndex(lane => {
                        const lastTaskInLane = lane[lane.length - 1];
                        // If the last task ends before this one starts, it fits
                        return (lastTaskInLane.startIndex + lastTaskInLane.duration) <= task.startIndex;
                    });

                    if (laneIndex === -1) {
                        lanes.push([task]);
                    } else {
                        lanes[laneIndex].push(task);
                    }
                });

                // Flatten lanes with lane index assigned
                const positionedTasks = lanes.flatMap((laneTasks, laneIdx) => 
                    laneTasks.map(t => ({ ...t, laneIdx }))
                );
                
                // Determine row height based on max lanes
                const minHeight = 120;
                const taskHeight = 26;
                const headerHeight = 28;
                const contentHeight = (lanes.length * taskHeight) + headerHeight + 10; 
                const rowHeight = Math.max(minHeight, contentHeight);

                return (
                    <div key={weekStart.toString()} className="relative border-b border-border last:border-b-0 flex" style={{ height: `${rowHeight}px` }}>
                        {/* Background Grid */}
                        <div className="absolute inset-0 grid grid-cols-7">
                            {daysInWeek.map((day, idx) => (
                                <div 
                                    key={day.toString()} 
                                    className={cn(
                                        "border-r border-border last:border-r-0 h-full p-1 cursor-pointer hover:bg-accent/10 transition-colors group",
                                        !isSameMonth(day, monthStart) && "bg-muted/5"
                                    )}
                                    onClick={() => openCreateModal(day)}
                                >
                                    <div className="flex justify-center mt-1">
                                        <span className={cn(
                                            "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                            isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                                         <Plus className="w-8 h-8 text-primary/10" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Task Layer */}
                        <div className="absolute inset-x-0 top-[28px] bottom-0 px-1 pointer-events-none">
                            {positionedTasks.map(task => {
                                const isContinuesLeft = task.originalStart < weekStart;
                                const isContinuesRight = task.originalEnd > weekEnd;

                                return (
                                    <Link 
                                        key={task.id} 
                                        to={`/task/${task.id}`}
                                        className={cn(
                                            "absolute h-[24px] text-[11px] px-2 rounded-sm border truncate pointer-events-auto transition-all hover:brightness-110 flex items-center shadow-sm",
                                            getTaskColorClass(task.status),
                                            isContinuesLeft && "rounded-l-none border-l-0 ml-[-1px]",
                                            isContinuesRight && "rounded-r-none border-r-0 mr-[-1px]"
                                        )}
                                        style={{
                                            left: `${(task.startIndex / 7) * 100}%`,
                                            width: `${(task.duration / 7) * 100}%`,
                                            top: `${task.laneIdx * 26}px`
                                        }}
                                        title={`${task.code}: ${task.title}`}
                                    >
                                        <span className="font-mono font-bold opacity-75 mr-1.5">{task.code}</span>
                                        <span className="truncate">{task.title}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Create Task for {newDate}</DialogTitle>
                  <DialogClose onClick={() => setIsCreateOpen(false)} />
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4 py-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Code</label>
                      <Input 
                        placeholder="e.g. FE-101" 
                        value={newCode} 
                        onChange={e => setNewCode(e.target.value)}
                        autoFocus
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input 
                        placeholder="Task title" 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)}
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Input 
                        type="date"
                        value={newDate} 
                        onChange={e => setNewDate(e.target.value)}
                      />
                  </div>
              </form>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask}>Create Task</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;