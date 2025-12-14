import { create } from 'zustand';
import { Task, AppNotification, TaskStatus, CompletionStatus } from '../types';
import { getCompletionStatus } from '../lib/utils';

interface NotificationState {
  notifications: AppNotification[];
  refreshNotifications: (tasks: Task[]) => void;
  clearNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  refreshNotifications: (tasks) => {
    const newNotifications: AppNotification[] = [];
    const now = Date.now();
    const dayInMillis = 24 * 60 * 60 * 1000;

    tasks.forEach(task => {
        // 1. Staleness Check
        if (task.status !== TaskStatus.Done) {
            const lastUpdate = new Date(task.dates.lastUpdated).getTime();
            if (now - lastUpdate > 7 * dayInMillis) {
                newNotifications.push({
                    id: `${task.id}-stale`,
                    taskId: task.id,
                    taskCode: task.code,
                    type: 'Staleness',
                    message: `No updates in 7+ days`,
                    severity: 'warning'
                });
            }
        }

        // 2. Refinement Debt
        if (task.status === TaskStatus.InProgress) {
            const { goal, technicalAnalysis, testingStrategy } = task.refinement;
            if (!goal || !technicalAnalysis || !testingStrategy) {
                newNotifications.push({
                    id: `${task.id}-refinement`,
                    taskId: task.id,
                    taskCode: task.code,
                    type: 'RefinementDebt',
                    message: `In-Progress but unrefined`,
                    severity: 'critical'
                });
            }
        }

        // 3. Deadline Check
        const status = getCompletionStatus(task);
        if (status === CompletionStatus.Overdue) {
            newNotifications.push({
                id: `${task.id}-overdue`,
                taskId: task.id,
                taskCode: task.code,
                type: 'Deadline',
                message: `Overdue`,
                severity: 'critical'
            });
        } else if (status === CompletionStatus.AtRisk) {
             newNotifications.push({
                id: `${task.id}-atrisk`,
                taskId: task.id,
                taskCode: task.code,
                type: 'Deadline',
                message: `Due soon`,
                severity: 'warning'
            });
        }
    });

    set({ notifications: newNotifications });
  },
  clearNotification: (id) => set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
  }))
}));
