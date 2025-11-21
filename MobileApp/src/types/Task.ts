// Task type definitions for AI Task Tracking Mobile

// Simplified user object for task relations
export interface TaskUser {
  id: number;
  username: string;
  email: string;
}

// Simplified project object for task relations
export interface TaskProject {
  id: number;
  projectName: string;
}

/**
 * Represents a Task object received from the backend API.
 */
export interface Task {
  id: number;
  taskName: string;
  description?: string | null;
  status: string; // e.g., 'To Do', 'In Progress', 'Done'
  priority: number; // 1 (Lowest) to 5 (Urgent)

  projectId?: number | null;
  workspaceId: number;

  startTime?: string | Date | null;
  endTime?: string | Date | null; // This is the due date

  estimatedMinutes?: number | null;

  createdBy: number;
  assignedTo?: number | null;

  dateCreated: string | Date;
  dateModified: string | Date;

  isRecurring: boolean;
  recurringRule?: string | null;

  // --- Relational fields (included in API responses) ---
  creator?: TaskUser;
  assignee?: TaskUser | null;
  project?: TaskProject | null;
}

/**
 * Data Transfer Object for creating a new task.
 * This structure is sent to the backend.
 */
export interface CreateTaskDto {
  taskName: string;
  description?: string;
  projectId: number;
  assignedTo?: number;
  priority?: number; // 1-5, default 3 on backend
  status?: string; // Default 'todo' on backend
  startTime?: string; // ISO 8601 format
  endTime?: string; // ISO 8601 format
  estimatedMinutes?: number;
}

/**
 * Data Transfer Object for updating an existing task.
 * All fields are optional.
 */
export type UpdateTaskDto = Partial<CreateTaskDto>;


// --- Enums for UI mapping ---

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done',
}

export enum TaskPriority {
  URGENT = 5,
  HIGHEST = 4,
  MEDIUM = 3,
  LOW = 2,
  LOWEST = 1,
}

// --- Other related types ---

export interface TaskFilter {
  status?: string;
  priority?: number;
  assigneeId?: number;
  searchQuery?: string;
}

export interface TimeTracking {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}
