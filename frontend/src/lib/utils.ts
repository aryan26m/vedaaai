import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700';
    case 'generating':
      return 'bg-amber-100 text-amber-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'draft':
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'moderate':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'challenging':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-neutral-50 text-neutral-600 border-neutral-200';
  }
}
