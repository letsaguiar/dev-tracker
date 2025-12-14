import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskStatus, HistoryEntry, EisenhowerQuad } from '../types';
import { generateId } from '../lib/utils';

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'history' | 'dates' | 'subtasks' | 'notes' | 'refinement' | 'eisenhowerQuad' | 'pomodoro'> & { dueDate?: string | null; startDate?: string | null }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addNote: (taskId: string, content: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  incrementPomodoro: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (partialTask) => set((state) => {
        const now = new Date().toISOString();
        const { dueDate, startDate, ...rest } = partialTask;
        const newTask: Task = {
          ...rest,
          id: generateId(),
          dates: {
            startDate: startDate || null,
            dueDate: dueDate || null,
            completedDate: null,
            lastUpdated: now,
          },
          refinement: { goal: '', technicalAnalysis: '', testingStrategy: '' },
          history: [{ timestamp: now, action: 'Task created' }],
          subtasks: [],
          notes: [],
          eisenhowerQuad: EisenhowerQuad.None,
          pomodoro: { estimated: 0, actual: 0 },
        };
        return { tasks: [newTask, ...state.tasks] };
      }),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id !== id) return task;
          
          const now = new Date().toISOString();
          let historyAction = 'Task updated';
          
          if (updates.status && updates.status !== task.status) {
            historyAction = `Status changed to ${updates.status}`;
          }

          const newHistory: HistoryEntry = { timestamp: now, action: historyAction };
          
          // Handle Completed Date Logic
          let completedDate = task.dates.completedDate;
          if (updates.status === TaskStatus.Done && task.status !== TaskStatus.Done) {
            completedDate = now;
          } else if (updates.status && updates.status !== TaskStatus.Done) {
            completedDate = null;
          }

          // Merge nested objects carefully
          const updatedTask = {
            ...task,
            ...updates,
            dates: {
              ...task.dates,
              ...(updates.dates || {}),
              completedDate,
              lastUpdated: now,
            },
            refinement: {
                ...task.refinement,
                ...(updates.refinement || {})
            },
            pomodoro: {
                ...task.pomodoro,
                ...(updates.pomodoro || {})
            },
            history: [newHistory, ...task.history],
          };

          return updatedTask;
        }),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      })),
      addNote: (taskId, content) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            notes: [...t.notes, { id: generateId(), content, createdAt: new Date().toISOString() }],
            dates: { ...t.dates, lastUpdated: new Date().toISOString() }
          };
        })
      })),
      addSubtask: (taskId, title) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: [...t.subtasks, { id: generateId(), title, completed: false }],
            dates: { ...t.dates, lastUpdated: new Date().toISOString() }
          };
        })
      })),
      toggleSubtask: (taskId, subtaskId) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s),
            dates: { ...t.dates, lastUpdated: new Date().toISOString() }
          };
        })
      })),
      deleteSubtask: (taskId, subtaskId) => set((state) => ({
        tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                subtasks: t.subtasks.filter(s => s.id !== subtaskId),
                dates: { ...t.dates, lastUpdated: new Date().toISOString() }
            };
        })
      })),
      incrementPomodoro: (taskId) => set((state) => ({
          tasks: state.tasks.map((t) => {
              if (t.id !== taskId) return t;
              return {
                  ...t,
                  pomodoro: { ...t.pomodoro, actual: t.pomodoro.actual + 1 },
                  dates: { ...t.dates, lastUpdated: new Date().toISOString() }
              };
          })
      }))
    }),
    {
      name: 'dev-lifecycle-storage',
    }
  )
);