import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus, EisenhowerQuad } from '../types';
import { formatDateTime, formatDate, cn } from '../lib/utils';
import {
    ArrowLeft, Calendar, Save, Trash2, CheckSquare, Square, Plus,
    AlertTriangle, FileText, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import {
    Button, Input, Select, Badge, Card, CardHeader, CardTitle, CardContent,
    Alert, AlertTitle, AlertDescription
} from './ui/Common';
import MarkdownEditor from './MarkdownEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const task = useTaskStore(state => state.tasks.find(t => t.id === id));
    const { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, addNote } = useTaskStore();

    const [noteInput, setNoteInput] = useState('');
    const [subtaskInput, setSubtaskInput] = useState('');
    const [isRefinementOpen, setIsRefinementOpen] = useState(true);

    // Refinement local state
    const [refinementGoal, setRefinementGoal] = useState(task?.refinement.goal || '');
    const [refinementAnalysis, setRefinementAnalysis] = useState(task?.refinement.technicalAnalysis || '');
    const [refinementStrategy, setRefinementStrategy] = useState(task?.refinement.testingStrategy || '');
    const [isRefinementDirty, setIsRefinementDirty] = useState(false);

    // Update local state when task changes (e.g. initial load or id change)
    useEffect(() => {
        if (task) {
            setRefinementGoal(task.refinement.goal);
            setRefinementAnalysis(task.refinement.technicalAnalysis);
            setRefinementStrategy(task.refinement.testingStrategy);
            setIsRefinementDirty(false);
        }
    }, [task?.id]); // Only reset on task switch, not every store update to avoid overwriting typed content if store updates elsewhere

    if (!task) return <div className="p-8 text-center">Task not found</div>;

    const handleUpdate = (field: string, value: any) => {
        updateTask(task.id, { [field]: value });
    };

    const handleDateUpdate = (field: string, value: string) => {
        updateTask(task.id, { dates: { ...task.dates, [field]: value || null } });
    };

    const handleRefinementSave = () => {
        updateTask(task.id, {
            refinement: {
                goal: refinementGoal,
                technicalAnalysis: refinementAnalysis,
                testingStrategy: refinementStrategy
            }
        });
        setIsRefinementDirty(false);
        // Optional: Add toast here
    };

    const handleLocalRefinementChange = (field: 'goal' | 'technicalAnalysis' | 'testingStrategy', value: string) => {
        if (field === 'goal') setRefinementGoal(value);
        if (field === 'technicalAnalysis') setRefinementAnalysis(value);
        if (field === 'testingStrategy') setRefinementStrategy(value);
        setIsRefinementDirty(true);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
            navigate('/');
        }
    };

    const isUnrefined = task.status !== TaskStatus.Done &&
        (!task.refinement.goal || !task.refinement.technicalAnalysis || !task.refinement.testingStrategy);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <Button variant="ghost" onClick={() => navigate('/tasks')} className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
            </Button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded text-sm">{task.code}</span>
                        <Select
                            value={task.status}
                            onChange={(e) => handleUpdate('status', e.target.value)}
                            className="w-[140px] h-8 text-xs font-medium"
                        >
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </div>
                    <Input
                        className="text-2xl md:text-3xl font-bold bg-transparent border-none px-0 h-auto focus-visible:ring-0"
                        value={task.title}
                        onChange={(e) => handleUpdate('title', e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="icon" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Refinement */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Dates Card */}
                    <Card>
                        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                                <Input
                                    type="date"
                                    value={task.dates.startDate ? new Date(task.dates.startDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleDateUpdate('startDate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                                <Input
                                    type="date"
                                    value={task.dates.dueDate ? new Date(task.dates.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleDateUpdate('dueDate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground">Completed Date</label>
                                <Input
                                    type="date"
                                    value={task.dates.completedDate ? new Date(task.dates.completedDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleDateUpdate('completedDate', e.target.value)}
                                    disabled={task.status !== TaskStatus.Done}
                                    className={task.status !== TaskStatus.Done ? "opacity-50 cursor-not-allowed" : ""}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Refinement Section */}
                    <div className="space-y-2">
                        {isUnrefined && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Refinement Required</AlertTitle>
                                <AlertDescription>
                                    This task is in progress but lacks refinement details. Please fill out the goal, analysis, and strategy.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Card className={isUnrefined ? "border-destructive/30" : ""}>
                            <CardHeader className="py-4 cursor-pointer hover:bg-accent/50 transition-colors flex flex-row items-center justify-between" onClick={() => setIsRefinementOpen(!isRefinementOpen)}>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Technical Refinement
                                </CardTitle>
                                {isRefinementOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </CardHeader>
                            {isRefinementOpen && (
                                <CardContent className="space-y-4 animate-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Goal</label>
                                        <MarkdownEditor
                                            placeholder="What is the user value?"
                                            value={refinementGoal}
                                            onChange={(val) => handleLocalRefinementChange('goal', val)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Technical Analysis</label>
                                        <MarkdownEditor
                                            placeholder="Implementation details, architecture changes..."
                                            minHeight="min-h-[150px]"
                                            value={refinementAnalysis}
                                            onChange={(val) => handleLocalRefinementChange('technicalAnalysis', val)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium">Testing Strategy</label>
                                        <MarkdownEditor
                                            placeholder="Unit tests, edge cases, manual verification steps..."
                                            value={refinementStrategy}
                                            onChange={(val) => handleLocalRefinementChange('testingStrategy', val)}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            onClick={handleRefinementSave}
                                        >
                                            <Save className="w-4 h-4 mr-2" /> Save Refinement
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Subtasks */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg">Subtasks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a subtask..."
                                    value={subtaskInput}
                                    onChange={(e) => setSubtaskInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (subtaskInput.trim()) {
                                                addSubtask(task.id, subtaskInput);
                                                setSubtaskInput('');
                                            }
                                        }
                                    }}
                                />
                                <Button onClick={() => {
                                    if (subtaskInput.trim()) {
                                        addSubtask(task.id, subtaskInput);
                                        setSubtaskInput('');
                                    }
                                }}><Plus className="w-4 h-4" /></Button>
                            </div>
                            <div className="space-y-2">
                                {task.subtasks.map(st => (
                                    <div key={st.id} className="flex items-center gap-3 group">
                                        <button onClick={() => toggleSubtask(task.id, st.id)}>
                                            {st.completed ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                                        </button>
                                        <span className={cn("flex-1 text-sm", st.completed && "text-muted-foreground line-through")}>{st.title}</span>
                                        <button onClick={() => deleteSubtask(task.id, st.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {task.subtasks.length === 0 && <div className="text-sm text-muted-foreground italic">No subtasks yet.</div>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg">Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <MarkdownEditor
                                    placeholder="Add a note..."
                                    minHeight="min-h-[80px]"
                                    value={noteInput}
                                    onChange={(val) => setNoteInput(val)}
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" onClick={() => {
                                        if (noteInput.trim()) {
                                            addNote(task.id, noteInput);
                                            setNoteInput('');
                                        }
                                    }}><Save className="w-4 h-4 mr-2" /> Save Note</Button>
                                </div>
                            </div>
                            <div className="space-y-4 mt-4">
                                {task.notes.map(note => (
                                    <div key={note.id} className="bg-secondary/30 p-3 rounded-md text-sm">
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-1 text-foreground" {...props} />,
                                                    a: ({ node, ...props }) => <a className="text-blue-400 underline" {...props} />,
                                                    code: ({ node, ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                                                }}
                                            >
                                                {note.content}
                                            </ReactMarkdown>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-2 text-right">{formatDateTime(note.createdAt)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader className="py-4 bg-muted/20 border-b">
                            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[calc(100vh-200px)] overflow-y-auto">
                            <div className="relative pl-6 py-4 space-y-6">
                                {/* Vertical Line */}
                                <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />

                                {task.history.map((entry, idx) => (
                                    <div key={idx} className="relative pr-4">
                                        <div className="absolute left-[-17px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-background" />
                                        <p className="text-xs text-muted-foreground mb-0.5">{formatDateTime(entry.timestamp)}</p>
                                        <p className="text-sm">{entry.action}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TaskDetail;