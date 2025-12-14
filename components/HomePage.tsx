import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { useDailyStore } from '../store/useDailyStore';
import { Link } from 'react-router-dom';
import { 
    Briefcase, LogOut, ExternalLink, Star, Plus, CheckSquare, Square, 
    ArrowRight, Activity
} from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Select } from './ui/Common';
import { TaskStatus, EisenhowerQuad, Task } from '../types';
import { cn, getStatusColor } from '../lib/utils';
import PomodoroTimer from './PomodoroTimer';

const HomePage: React.FC = () => {
  const { tasks, updateTask } = useTaskStore();
  const { 
      startTime, desiredEndTime, actualEndTime, setStartTime, setDesiredEndTime, setActualEndTime,
      codeReviews, addCodeReview, toggleCodeReview, deleteCodeReview,
      ruleOfThree, updateRuleOfThree
  } = useDailyStore();

  const [newCRTitle, setNewCRTitle] = useState('');
  const [newCRUrl, setNewCRUrl] = useState('');

  const activeTasks = tasks.filter(t => t.status !== TaskStatus.Done);
  const getTasksByQuad = (quad: EisenhowerQuad) => activeTasks.filter(t => t.eisenhowerQuad === quad);

  const handleAddCR = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCRTitle.trim()) return;
      addCodeReview(newCRTitle, newCRUrl);
      setNewCRTitle('');
      setNewCRUrl('');
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData('taskId', taskId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetQuad: EisenhowerQuad) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      if (taskId) {
          updateTask(taskId, { eisenhowerQuad: targetQuad });
      }
  };

  const renderMiniTask = (task: Task) => (
      <div 
        key={task.id} 
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        className="bg-background/50 p-2 rounded border border-border flex items-center justify-between group cursor-grab active:cursor-grabbing hover:bg-background transition-colors shadow-sm"
      >
          <div className="flex-1 min-w-0 mr-2">
              <Link to={`/task/${task.id}`} className="text-sm font-medium hover:underline flex items-center gap-2 truncate">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", getStatusColor(task.status).replace('text-', 'bg-'))} />
                  {task.code}: {task.title}
              </Link>
          </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Row: Activity & Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Daily Activity
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Start</label>
                          <Input type="time" value={startTime || ''} onChange={(e) => setStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Target End</label>
                          <Input type="time" value={desiredEndTime || ''} onChange={(e) => setDesiredEndTime(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Clock Out</label>
                          <div className="flex gap-2">
                            <Input type="time" value={actualEndTime || ''} onChange={(e) => setActualEndTime(e.target.value)} />
                            <Button size="icon" variant="outline" onClick={() => setActualEndTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}>
                                <LogOut className="w-4 h-4" />
                            </Button>
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>
          
          <div className="lg:col-span-1 h-full">
              <PomodoroTimer />
          </div>
      </div>

      {/* Row 2: Priorities (Rule of 3 & CRs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" /> Rule of 3
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">What are the 3 outcomes you commit to delivering today?</p>
                  {[0, 1, 2].map(idx => (
                      <div key={idx} className="flex items-center gap-3">
                          <span className="font-mono text-muted-foreground text-sm font-bold">#{idx + 1}</span>
                          <Input 
                            value={ruleOfThree[idx]} 
                            onChange={(e) => updateRuleOfThree(idx, e.target.value)}
                            placeholder={idx === 0 ? "Most important outcome..." : "Secondary outcome..."}
                            className="flex-1"
                          />
                      </div>
                  ))}
              </CardContent>
          </Card>

          <Card>
              <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" /> Pending Code Reviews
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <form onSubmit={handleAddCR} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Input 
                            placeholder="PR Title / ID" 
                            value={newCRTitle}
                            onChange={(e) => setNewCRTitle(e.target.value)}
                            className="h-9"
                        />
                         <Input 
                            placeholder="URL (Optional)" 
                            value={newCRUrl}
                            onChange={(e) => setNewCRUrl(e.target.value)}
                            className="h-8 text-xs"
                        />
                      </div>
                      <Button size="icon" type="submit" className="h-auto self-start py-2"><Plus className="w-4 h-4" /></Button>
                  </form>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {codeReviews.map(cr => (
                          <div key={cr.id} className="flex items-start gap-2 group p-1 hover:bg-muted/50 rounded">
                              <button onClick={() => toggleCodeReview(cr.id)} className="mt-0.5">
                                  {cr.completed ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                  <div className={cn("text-sm truncate", cr.completed && "line-through text-muted-foreground")}>
                                      {cr.url ? (
                                          <a href={cr.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary">
                                              {cr.title}
                                          </a>
                                      ) : cr.title}
                                  </div>
                              </div>
                              <button onClick={() => deleteCodeReview(cr.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                                  <Plus className="w-4 h-4 rotate-45" /> 
                              </button>
                          </div>
                      ))}
                      {codeReviews.length === 0 && <div className="text-xs text-muted-foreground italic">No pending PRs.</div>}
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Row 3: Eisenhower Matrix */}
      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Prioritization Matrix</h3>
              <Link to="/tasks" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                  Manage all tasks <ArrowRight className="w-4 h-4" />
              </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
              {/* Q1: Do */}
              <Card 
                className="flex flex-col border-red-500/20 bg-red-500/5 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, EisenhowerQuad.Do)}
              >
                  <CardHeader className="py-3 bg-red-500/10 border-b border-red-500/10">
                      <CardTitle className="text-sm font-bold text-red-500 uppercase tracking-wider">Do (Urgent & Important)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                      {getTasksByQuad(EisenhowerQuad.Do).map(renderMiniTask)}
                      {getTasksByQuad(EisenhowerQuad.Do).length === 0 && <span className="text-xs text-muted-foreground">Drop tasks here</span>}
                  </CardContent>
              </Card>

              {/* Q2: Decide */}
              <Card 
                className="flex flex-col border-blue-500/20 bg-blue-500/5 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, EisenhowerQuad.Decide)}
              >
                  <CardHeader className="py-3 bg-blue-500/10 border-b border-blue-500/10">
                      <CardTitle className="text-sm font-bold text-blue-500 uppercase tracking-wider">Decide (Important / Not Urgent)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                       {getTasksByQuad(EisenhowerQuad.Decide).map(renderMiniTask)}
                       {getTasksByQuad(EisenhowerQuad.Decide).length === 0 && <span className="text-xs text-muted-foreground">Drop tasks here</span>}
                  </CardContent>
              </Card>

              {/* Q3: Delegate */}
              <Card 
                className="flex flex-col border-amber-500/20 bg-amber-500/5 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, EisenhowerQuad.Delegate)}
              >
                   <CardHeader className="py-3 bg-amber-500/10 border-b border-amber-500/10">
                      <CardTitle className="text-sm font-bold text-amber-500 uppercase tracking-wider">Delegate (Urgent / Not Important)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                       {getTasksByQuad(EisenhowerQuad.Delegate).map(renderMiniTask)}
                       {getTasksByQuad(EisenhowerQuad.Delegate).length === 0 && <span className="text-xs text-muted-foreground">Drop tasks here</span>}
                  </CardContent>
              </Card>

              {/* Q4: Delete */}
              <Card 
                className="flex flex-col border-border/50 bg-secondary/5 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, EisenhowerQuad.Delete)}
              >
                   <CardHeader className="py-3 bg-secondary/20 border-b border-border/10">
                      <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Delete (Not Urgent / Not Important)</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
                       {getTasksByQuad(EisenhowerQuad.Delete).map(renderMiniTask)}
                       {getTasksByQuad(EisenhowerQuad.Delete).length === 0 && <span className="text-xs text-muted-foreground">Drop tasks here</span>}
                  </CardContent>
              </Card>
          </div>

          <Card
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, EisenhowerQuad.None)}
             className="border-dashed"
          >
              <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Unsorted Backlog (Drag to prioritize)</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                      {getTasksByQuad(EisenhowerQuad.None).map(t => (
                          <div 
                            key={t.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            className="bg-secondary/30 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-border cursor-grab active:cursor-grabbing hover:bg-secondary/50"
                          >
                              <span>{t.code}</span>
                          </div>
                      ))}
                      {getTasksByQuad(EisenhowerQuad.None).length === 0 && <span className="text-xs text-muted-foreground">All tasks prioritized!</span>}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default HomePage;