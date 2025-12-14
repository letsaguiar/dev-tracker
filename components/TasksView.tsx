import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button, Input, Card, Select, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/Common';
import { TaskStatus, CompletionStatus, EisenhowerQuad, Task } from '../types';
import { cn, getCompletionStatus, formatDate, getStatusColor } from '../lib/utils';

const TasksView: React.FC = () => {
  const { tasks, addTask } = useTaskStore();
  const [filter, setFilter] = useState<'All' | 'Active' | 'Done'>('Active');
  const [search, setSearch] = useState('');

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'Active' && task.status === TaskStatus.Done) return false;
    if (filter === 'Done' && task.status !== TaskStatus.Done) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase()) && !task.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCode && newTitle && newDate) {
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

  const getPriorityBadge = (quad: EisenhowerQuad) => {
      switch(quad) {
          case EisenhowerQuad.Do: return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50">Do</Badge>;
          case EisenhowerQuad.Decide: return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/50">Decide</Badge>;
          case EisenhowerQuad.Delegate: return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/50">Delegate</Badge>;
          case EisenhowerQuad.Delete: return <Badge variant="outline" className="text-muted-foreground">Delete</Badge>;
          default: return null;
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
            <p className="text-muted-foreground">Manage your backlog and active work.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Task
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input 
                    placeholder="Search tasks..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full sm:w-64"
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="h-8 w-32"
                >
                    <option value="All">All Tasks</option>
                    <option value="Active">Active</option>
                    <option value="Done">Completed</option>
                </Select>
            </div>
        </div>
        <div className="divide-y divide-border">
            {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No tasks found</div>
            ) : (
                filteredTasks.map(task => {
                    const completionStatus = getCompletionStatus(task);
                    return (
                        <Link 
                            key={task.id} 
                            to={`/task/${task.id}`}
                            className="p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors group text-foreground"
                        >
                             <div className={cn("w-2 h-2 rounded-full shrink-0", getStatusColor(task.status).replace('text-', 'bg-'))} />
                             
                             <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                 <div className="md:col-span-6">
                                     <div className="flex items-center gap-2">
                                         <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
                                         <span className="font-medium group-hover:underline truncate block">
                                             {task.title}
                                         </span>
                                     </div>
                                 </div>
                                 
                                 <div className="md:col-span-2 flex md:justify-center">
                                     <Badge variant="outline" className="text-[10px] h-5">{task.status}</Badge>
                                 </div>

                                 <div className="md:col-span-2 flex md:justify-center">
                                     {getPriorityBadge(task.eisenhowerQuad)}
                                 </div>

                                 <div className="md:col-span-2 text-right text-xs text-muted-foreground">
                                     {task.dates.dueDate ? (
                                         <span className={cn(
                                             completionStatus === CompletionStatus.Overdue ? "text-red-500 font-bold" : 
                                             completionStatus === CompletionStatus.AtRisk ? "text-amber-500" : ""
                                         )}>
                                             Due {formatDate(task.dates.dueDate)}
                                         </span>
                                     ) : '-'}
                                 </div>
                             </div>
                        </Link>
                    );
                })
            )}
        </div>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
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
                      <label className="text-sm font-medium">Start Date</label>
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

export default TasksView;