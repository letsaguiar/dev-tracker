import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, CompletionStatus, TaskStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getCompletionStatus(task: Task): CompletionStatus {
  if (task.status === TaskStatus.Done) return CompletionStatus.OnTrack;
  if (!task.dates.dueDate) return CompletionStatus.OnTrack;

  const due = new Date(task.dates.dueDate).getTime();
  const now = Date.now();
  const dayInMillis = 24 * 60 * 60 * 1000;

  if (now > due) return CompletionStatus.Overdue;
  if (now > due - (2 * dayInMillis)) return CompletionStatus.AtRisk; // Within 2 days

  return CompletionStatus.OnTrack;
}

export function getStatusColor(status: TaskStatus) {
  switch(status) {
      case TaskStatus.Done: return 'text-green-500';
      case TaskStatus.InProgress: return 'text-blue-500';
      case TaskStatus.Blocked: return 'text-red-500';
      case TaskStatus.Waiting: return 'text-amber-500';
      default: return 'text-muted-foreground';
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}
