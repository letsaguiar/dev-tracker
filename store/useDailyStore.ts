import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CodeReview, DailyReport, PomodoroSession, DailyGoal, DailySnapshot } from '../types';
import { generateId } from '../lib/utils';
import { useTaskStore } from './useTaskStore';

interface DailyState {
  // Work Hours
  startTime: string | null;
  desiredEndTime: string | null;
  actualEndTime: string | null;
  setStartTime: (time: string | null) => void;
  setDesiredEndTime: (time: string | null) => void;
  setActualEndTime: (time: string | null) => void;

  // Daily Focus (Goals)
  todayGoals: DailyGoal[];
  addGoal: (goal: DailyGoal) => void;
  removeGoal: (id: string) => void;

  // Code Reviews
  codeReviews: CodeReview[];
  addCodeReview: (title: string, url?: string) => void;
  toggleCodeReview: (id: string) => void;
  deleteCodeReview: (id: string) => void;

  // Pomodoro
  pomodoroState: {
    isActive: boolean;
    timeLeft: number; // in seconds
    currentTaskId: string | null;
    isBreak: boolean;
    currentSessionCount?: number;
    currentSessionStartTime?: string | null;
  };
  pomodoroSessions: PomodoroSession[];
  addPomodoroSession: (taskId: string) => void;
  setPomodoroTask: (taskId: string) => void;
  startPomodoro: (taskId: string) => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void; // Called by interval
  setBreak: (isBreak: boolean) => void;

  // History / Persistence
  history: DailyReport[];
  endDay: () => void;
}

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      startTime: null,
      desiredEndTime: null,
      actualEndTime: null,
      setStartTime: (time) => set({ startTime: time }),
      setDesiredEndTime: (time) => set({ desiredEndTime: time }),
      setActualEndTime: (time) => set({ actualEndTime: time }),

      todayGoals: [],
      addGoal: (goal) => set(state => {
        if (state.todayGoals.some(g => g.id === goal.id)) return state;
        return { todayGoals: [...state.todayGoals, goal] };
      }),
      removeGoal: (id) => set(state => ({
        todayGoals: state.todayGoals.filter(g => g.id !== id)
      })),

      codeReviews: [],
      addCodeReview: (title, url) => set(state => ({
        codeReviews: [...state.codeReviews, { id: generateId(), title, url: url || '', completed: false }]
      })),
      toggleCodeReview: (id) => set(state => ({
        codeReviews: state.codeReviews.map(cr => cr.id === id ? { ...cr, completed: !cr.completed } : cr)
      })),
      deleteCodeReview: (id) => set(state => ({
        codeReviews: state.codeReviews.filter(cr => cr.id !== id)
      })),

      pomodoroSessions: [],
      addPomodoroSession: (taskId) => set(state => {
        const startTime = state.pomodoroState.currentSessionStartTime || new Date().toISOString();
        return {
          pomodoroSessions: [...state.pomodoroSessions, {
            id: generateId(),
            taskId,
            startTime,
            endTime: new Date().toISOString(),
          }],
          pomodoroState: {
            ...state.pomodoroState,
            currentSessionStartTime: null
          }
        };
      }),

      pomodoroState: {
        isActive: false,
        timeLeft: WORK_DURATION,
        currentTaskId: null,
        isBreak: false,
        currentSessionCount: 0,
        currentSessionStartTime: null,
      },
      setPomodoroTask: (taskId) => set(state => ({
        pomodoroState: { ...state.pomodoroState, currentTaskId: taskId }
      })),
      startPomodoro: (taskId) => set(state => {
        const isNewSession = (state.pomodoroState.currentTaskId !== taskId && !state.pomodoroState.isBreak) || state.pomodoroState.timeLeft === WORK_DURATION;

        return {
          pomodoroState: {
            ...state.pomodoroState,
            isActive: true,
            currentTaskId: taskId,
            timeLeft: isNewSession ? WORK_DURATION : state.pomodoroState.timeLeft,
            currentSessionStartTime: isNewSession ? new Date().toISOString() : state.pomodoroState.currentSessionStartTime
          }
        };
      }),
      pausePomodoro: () => set(state => ({
        pomodoroState: { ...state.pomodoroState, isActive: false }
      })),
      resetPomodoro: () => set(state => ({
        pomodoroState: {
          ...state.pomodoroState,
          isActive: false,
          timeLeft: state.pomodoroState.isBreak ? BREAK_DURATION : WORK_DURATION,
          currentSessionStartTime: null
        }
      })),
      setBreak: (isBreak) => set(state => ({
        pomodoroState: {
          ...state.pomodoroState,
          isBreak,
          timeLeft: isBreak ? BREAK_DURATION : WORK_DURATION,
          isActive: false
        }
      })),
      tickPomodoro: () => set(state => {
        const { timeLeft } = state.pomodoroState;
        if (timeLeft <= 0) return state;
        return {
          pomodoroState: { ...state.pomodoroState, timeLeft: timeLeft - 1 }
        };
      }),

      history: [],
      endDay: () => set(state => {
        // Hydrate goals from task store
        const taskState = useTaskStore.getState();
        const allTasks = taskState.tasks;

        const snapshots: DailySnapshot[] = state.todayGoals.map(goal => {
          const task = allTasks.find(t => t.id === goal.taskId);
          let isCompleted = false;
          let title = 'Unknown Task';

          if (task) {
            if (goal.type === 'task') {
              isCompleted = task.status === 'Done';
              title = task.title;
            } else {
              const subtask = task.subtasks.find(s => s.id === goal.id);
              if (subtask) {
                isCompleted = subtask.completed;
                title = subtask.title + ` (via ${task.title})`;
              }
            }
          }

          return {
            id: goal.id,
            taskId: goal.taskId,
            type: goal.type,
            title,
            completed: isCompleted
          };
        });

        const report: DailyReport = {
          id: generateId(),
          date: new Date().toISOString(),
          startTime: state.startTime,
          endTime: state.actualEndTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          desiredEndTime: state.desiredEndTime || null,
          goals: snapshots,
          codeReviews: state.codeReviews.filter(cr => cr.completed),
          pomodoroSessions: state.pomodoroSessions,
          summary: '',
        };

        const pendingReviews = state.codeReviews.filter(cr => !cr.completed);

        return {
          history: [report, ...state.history],
          startTime: null,
          desiredEndTime: null,
          actualEndTime: null,
          todayGoals: [], // Clear Daily Focus
          codeReviews: pendingReviews,
          pomodoroSessions: [],
          pomodoroState: {
            ...state.pomodoroState,
            currentSessionCount: 0,
            currentSessionStartTime: null
          }
        };
      })
    }),
    {
      name: 'dev-daily-storage',
    }
  )
);