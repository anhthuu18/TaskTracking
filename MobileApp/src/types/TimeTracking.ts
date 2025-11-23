// Time Tracking type definitions for AI Task Tracking Mobile

export interface TimeTracking {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  userId?: string;
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeTrackingSession {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  duration?: number;
}

export interface TimeTrackingSummary {
  totalDuration: number; // in minutes
  taskCount: number;
  date: Date;
  trackings: TimeTracking[];
}

