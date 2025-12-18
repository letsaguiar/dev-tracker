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
  currentDate: string | null;
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
  pomodoroSessions: PomodoroSession[];
  addPomodoroSession: (taskId: string) => void;

  // History / Persistence
  history: DailyReport[];
  endDay: () => void;
  startDay: () => void;
  isDayReviewNeeded: boolean;
  setDayReviewNeeded: (needed: boolean) => void;
}



export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      startTime: null,
      desiredEndTime: null,
      actualEndTime: null,
      currentDate: null,
      setStartTime: (time) => set(state => {
        // If starting a new session and no date is set, set it to today
        if (time && !state.currentDate) {
          return { startTime: time, currentDate: new Date().toISOString().split('T')[0] };
        }
        return { startTime: time };
      }),
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
        return {
          pomodoroSessions: [...state.pomodoroSessions, {
            id: generateId(),
            taskId,
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
          }]
        };
      }),

      history: [],
      endDay: () => set(state => {
        // Hydrate goals from task store - Logic shared with startDay
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

        // Use the session date for the report, or fallback to today if missing (legacy data)
        const reportDate = state.currentDate
          ? new Date(state.currentDate).toISOString()
          : new Date().toISOString();

        const report: DailyReport = {
          id: generateId(),
          date: reportDate,
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
          currentDate: null, // Reset session date
          todayGoals: [], // Clear Daily Focus
          codeReviews: pendingReviews,
          pomodoroSessions: [],
        };
      }),

      startDay: () => {
        // startDay essentially performs the cleanup and persistence of the previous day
        // ensuring the user starts fresh. It calls the internal state setter logic similar to endDay.
        // We can actually reuse the logic or just implement it here.
        // For clarity and independence, I'll allow it to trigger the same "cleanup" logic.
        // If endDay was called, state is already clean.
        // If not, this saves the previous session.

        set(state => {
          // If there is no active session (no start time/current date), just ensure clean state
          if (!state.currentDate && !state.startTime) {
            return {
              startTime: null,
              desiredEndTime: null,
              actualEndTime: null,
              currentDate: null,
              todayGoals: [],
              pomodoroSessions: [],
              // codeReviews are not cleared if no session active (just safe default)
            };
          }

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

          // Use the session date for the report
          const reportDate = state.currentDate
            ? new Date(state.currentDate).toISOString()
            : new Date().toISOString();

          const report: DailyReport = {
            id: generateId(),
            date: reportDate,
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
            currentDate: null, // Ready for new day
            todayGoals: [],
            codeReviews: pendingReviews,
            pomodoroSessions: [],
          };
        })
      },
      setDayReviewNeeded: (needed) => set({ isDayReviewNeeded: needed }),
      isDayReviewNeeded: false,
    }),
    {
      name: 'dev-daily-storage',
    }
  )
);