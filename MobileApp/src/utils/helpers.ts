import { TaskStatus, TaskPriority } from '../types/Task';
import { Strings } from '../constants/Strings';

/**
 * Format date to Vietnamese locale
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date to short format
 */
export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Get status text in Vietnamese
 */
export const getStatusText = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO:
      return Strings.statusTodo;
    case TaskStatus.IN_PROGRESS:
      return Strings.statusInProgress;
    case TaskStatus.DONE:
      return Strings.statusDone;
    case TaskStatus.CANCELLED:
      return Strings.statusCancelled;
    default:
      return 'Không xác định';
  }
};

/**
 * Get priority text in Vietnamese
 */
export const getPriorityText = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return Strings.priorityLow;
    case TaskPriority.MEDIUM:
      return Strings.priorityMedium;
    case TaskPriority.HIGH:
      return Strings.priorityHigh;
    case TaskPriority.URGENT:
      return Strings.priorityUrgent;
    default:
      return 'Không xác định';
  }
};

/**
 * Get status color based on status
 */
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.TODO:
      return '#9E9E9E';
    case TaskStatus.IN_PROGRESS:
      return '#2196F3';
    case TaskStatus.DONE:
      return '#4CAF50';
    case TaskStatus.CANCELLED:
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

/**
 * Get priority color based on priority
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.LOW:
      return '#4CAF50';
    case TaskPriority.MEDIUM:
      return '#FF9800';
    case TaskPriority.HIGH:
      return '#FF5722';
    case TaskPriority.URGENT:
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

/**
 * Check if date is overdue
 */
export const isOverdue = (dueDate?: Date): boolean => {
  if (!dueDate) return false;
  return new Date() > dueDate;
};

/**
 * Calculate days remaining
 */
export const getDaysRemaining = (dueDate?: Date): number => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
