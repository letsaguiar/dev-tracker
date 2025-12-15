import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Task, CompletionStatus, TaskStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  // Use UTC timezone to ensure the date is displayed as stored (YYYY-MM-DD)
  // without being shifted by local timezone offsets.
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
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

  // Normalize dates to "Day" granularity to avoid timezone confusion.
  // We compare the "User's Local Today" vs "Task's Due Date (UTC)".

  // 1. Get Due Date parts (stored as ISO UTC, e.g. "2025-12-16T00:00:00.000Z")
  const dueStr = task.dates.dueDate;
  const dueDatePart = dueStr.split('T')[0];
  const dueTime = new Date(dueDatePart).getTime(); // UTC Midnight of Due Date

  // 2. Get Today's Date parts in Local Time
  const now = new Date();
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');
  const localDatePart = `${localYear}-${localMonth}-${localDay}`;
  const todayTime = new Date(localDatePart).getTime(); // UTC Midnight of Local Date

  const dayInMillis = 24 * 60 * 60 * 1000;
  const diffDays = (dueTime - todayTime) / dayInMillis;

  if (diffDays < 0) return CompletionStatus.Overdue;
  if (diffDays <= 2) return CompletionStatus.AtRisk; // Due today, tomorrow, or day after

  return CompletionStatus.OnTrack;
}

export function getStatusColor(status: TaskStatus) {
  switch (status) {
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
