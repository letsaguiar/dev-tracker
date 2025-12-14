import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CodeReview } from '../types';
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
  };
  setPomodoroTask: (taskId: string) => void;
  startPomodoro: (taskId: string) => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  tickPomodoro: () => void; // Called by interval
  setBreak: (isBreak: boolean) => void;
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

      pomodoroState: {
        isActive: false,
        timeLeft: WORK_DURATION,
        currentTaskId: null,
        isBreak: false,
      },
      setPomodoroTask: (taskId) => set(state => ({
        pomodoroState: { ...state.pomodoroState, currentTaskId: taskId }
      })),
      startPomodoro: (taskId) => set(state => ({
        pomodoroState: { 
            ...state.pomodoroState, 
            isActive: true, 
            currentTaskId: taskId,
            // Only reset time if we are switching tasks or it was finished, 
            // otherwise resume. But simpler for now:
            // If task changed, reset. If same task, resume.
            timeLeft: (state.pomodoroState.currentTaskId !== taskId && !state.pomodoroState.isBreak) 
                ? WORK_DURATION 
                : state.pomodoroState.timeLeft
        }
      })),
      pausePomodoro: () => set(state => ({
        pomodoroState: { ...state.pomodoroState, isActive: false }
      })),
      resetPomodoro: () => set(state => ({
        pomodoroState: { 
            ...state.pomodoroState, 
            isActive: false, 
            timeLeft: state.pomodoroState.isBreak ? BREAK_DURATION : WORK_DURATION 
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
      })
    }),
    {
      name: 'dev-daily-storage',
    }
  )
);