// Event type definitions for AI Task Tracking Mobile

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  includeTime: boolean;
  location?: string;
  assignedMembers: string[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

export interface EventFilter {
  startDate?: Date;
  endDate?: Date;
  assignee?: string;
  searchQuery?: string;
}

export interface CreateEventData {
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  includeTime: boolean;
  startTime?: string;
  endTime?: string;
  location?: string;
  assignedMembers: string[];
  memberIds?: number[];
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  projectId?: string;
}
