// Project type definitions for AI Task Tracking Mobile

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  workspaceId: string;
  createdBy: string;
  members: ProjectMember[];
  labels: ProjectLabel[];
  status: ProjectStatus;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  role: ProjectRole;
  joinedAt: Date;
}

export interface ProjectLabel {
  id: string;
  name: string;
  color: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  role: WorkspaceRoleType;
}

export interface ProjectFlow {
  id: string;
  name: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  members: ProjectMember[];
  status: FlowStatus;
  progress: number;
}

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export type WorkspaceRoleType = 'owner' | 'admin' | 'member';

export enum FlowStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked'
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  workspaceId: string;
  memberIds: string[];
  inviteEmails?: string[];
  labels: Omit<ProjectLabel, 'id'>[];
}

