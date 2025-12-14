import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CodeReview, DailyReport, PomodoroSession } from '../types';
import { generateId } from '../lib/utils';

interface DailyState {
  // Work Hours
  startTime: string | null;
  desiredEndTime: string | null;
  actualEndTime: string | null;
  setStartTime: (time: string | null) => void;
  setDesiredEndTime: (time: string | null) => void;
  setActualEndTime: (time: string | null) => void;

  // Rule of 3
  ruleOfThree: string[]; // Fixed array of 3 strings
  updateRuleOfThree: (index: number, text: string) => void;

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

      ruleOfThree: ['', '', ''],
      updateRuleOfThree: (index, text) => set(state => {
        const newRules = [...state.ruleOfThree];
        newRules[index] = text;
        return { ruleOfThree: newRules };
      }),

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
        // Fallback to now if missing, though ideally tracked
        return {
          pomodoroSessions: [...state.pomodoroSessions, {
            id: generateId(),
            taskId,
            startTime,
            endTime: new Date().toISOString(),
          }],
          pomodoroState: {
            ...state.pomodoroState,
            currentSessionStartTime: null // Reset after logging
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
          isActive: false // Auto-pause on mode switch
        }
      })),
      tickPomodoro: () => set(state => {
        const { timeLeft } = state.pomodoroState;
        if (timeLeft <= 0) return state; // Should be handled by component to trigger finish
        return {
          pomodoroState: { ...state.pomodoroState, timeLeft: timeLeft - 1 }
        };
      }),

      history: [],
      endDay: () => set(state => {
        const report: DailyReport = {
          id: generateId(),
          date: new Date().toISOString(),
          startTime: state.startTime,
          endTime: state.actualEndTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          desiredEndTime: state.desiredEndTime || null,
          ruleOfThree: state.ruleOfThree,
          codeReviews: state.codeReviews.filter(cr => cr.completed), // Only snapshot completed ones? Or all? Usually report contains what's done.
          pomodoroSessions: state.pomodoroSessions,
          summary: '',
        };

        // Keep pending code reviews, archive completed ones?
        // Actually, user might want to see history of all PRs involved that day.
        // But for "persistence", usually we archive "Done" stuff.
        const pendingReviews = state.codeReviews.filter(cr => !cr.completed);

        return {
          history: [report, ...state.history],
          // Reset Daily State
          startTime: null,
          desiredEndTime: null,
          actualEndTime: null,
          ruleOfThree: ['', '', ''],
          codeReviews: pendingReviews, // Carry over pending
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