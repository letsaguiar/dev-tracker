import { z } from 'zod';

// --- Enums ---

export enum TaskStatus {
  Todo = 'Todo',
  InProgress = 'In-Progress',
  Blocked = 'Blocked',
  Waiting = 'Waiting',
  Done = 'Done',
}

export enum CompletionStatus {
  OnTrack = 'On-Track',
  AtRisk = 'At-Risk',
  Overdue = 'Overdue',
}

export enum EisenhowerQuad {
  Do = 'Do',         // Important / Urgent
  Decide = 'Decide', // Important / Not Urgent
  Delegate = 'Delegate', // Not Important / Urgent
  Delete = 'Delete', // Not Important / Not Urgent
  None = 'None'
}

// --- Schemas ---

export const SubtaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Subtask title required"),
  completed: z.boolean(),
});

export const NoteSchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  createdAt: z.string().datetime(), // ISO string
});

export const HistoryEntrySchema = z.object({
  timestamp: z.string().datetime(),
  action: z.string(),
});

export const RefinementSchema = z.object({
  goal: z.string().default(''),
  technicalAnalysis: z.string().default(''),
  testingStrategy: z.string().default(''),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1, "Task code required"), // e.g., 'FE-101'
  title: z.string().min(1, "Title is required"),
  dates: z.object({
    startDate: z.string().datetime().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    completedDate: z.string().datetime().optional().nullable(),
    lastUpdated: z.string().datetime(),
  }),
  status: z.nativeEnum(TaskStatus),
  refinement: RefinementSchema,
  history: z.array(HistoryEntrySchema),
  subtasks: z.array(SubtaskSchema),
  notes: z.array(NoteSchema),

  // New Features
  eisenhowerQuad: z.nativeEnum(EisenhowerQuad).default(EisenhowerQuad.None),
  pomodoro: z.object({
    estimated: z.number().default(0),
    actual: z.number().default(0),
    timeSpent: z.number().default(0), // Total seconds spent on this task
  }).default({ estimated: 0, actual: 0, timeSpent: 0 }),
});

export const CodeReviewSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url().optional().or(z.literal('')),
  completed: z.boolean(),
});

// --- Types ---

export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Refinement = z.infer<typeof RefinementSchema>;
export type HistoryEntry = z.infer<typeof HistoryEntrySchema>;
export type CodeReview = z.infer<typeof CodeReviewSchema>;

// Notification Types
export type NotificationType = 'Staleness' | 'RefinementDebt' | 'Deadline';

export interface AppNotification {
  id: string;
  taskId: string;
  taskCode: string;
  type: NotificationType;
  message: string;
  severity: 'warning' | 'critical';
}

export const PomodoroSessionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const DailySnapshotSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  type: z.enum(['task', 'subtask']),
  title: z.string(),
  completed: z.boolean(),
});

export const DailyReportSchema = z.object({
  id: z.string().uuid(),
  date: z.string().datetime(), // When the report was created (end of day)

  // Metrics
  startTime: z.string().nullable(), // Time string HH:mm
  endTime: z.string().nullable(), // Time string HH:mm
  desiredEndTime: z.string().nullable(),

  // Work
  goals: z.array(DailySnapshotSchema),
  pomodoroSessions: z.array(PomodoroSessionSchema),

  // Outcomes
  ruleOfThree: z.array(z.string()).optional(), // Deprecated but kept for history

  // Work
  codeReviews: z.array(CodeReviewSchema),

  // Optional: Summary/Notes for the day
  summary: z.string().optional(),
});

export type PomodoroSession = z.infer<typeof PomodoroSessionSchema>;
export type DailyReport = z.infer<typeof DailyReportSchema>;
export type DailySnapshot = z.infer<typeof DailySnapshotSchema>;

// Store Types
export type DailyGoalType = 'task' | 'subtask';

export interface DailyGoal {
  id: string; // The ID of the task or subtask itself
  taskId: string; // The parent ID (if it is a task, this equals id)
  type: DailyGoalType;
}