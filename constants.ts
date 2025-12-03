import { Status } from './types';

export const STATUS_COLORS: { [key in Status]: string } = {
  [Status.Done]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [Status.InProgress]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [Status.Planned]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  // FIX: Add 'AtRisk' and 'Dropped' statuses to provide consistent coloring across the app.
  [Status.AtRisk]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  [Status.Dropped]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};