// Project type definitions matching Backend DTOs

export interface Project {
  id: number;
  projectName: string;
  description?: string;
  workspaceId: number;
  userId: number;
  status?: ProjectStatus;
  dateCreated: Date;
  dateModified: Date;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  workspace?: {
    id: number;
    workspaceName: string;
  };
  memberCount?: number;
  userRole?: ProjectMemberRole;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: ProjectMemberRole;
  joinedAt: Date;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export enum ProjectMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

// Request DTOs
export interface CreateProjectRequest {
  projectName: string;
  description?: string;
  workspaceId: number;
}

export interface UpdateProjectRequest {
  projectName?: string;
  description?: string;
}

export interface InviteProjectMemberRequest {
  email: string;
  role?: ProjectMemberRole;
}

export interface UpdateMemberRoleRequest {
  role: ProjectMemberRole;
}

// Response DTOs
export interface ProjectResponse {
  success: boolean;
  message: string;
  data: Project;
}

export interface ProjectListResponse {
  success: boolean;
  message: string;
  data: Project[];
}

export interface ProjectMemberResponse {
  success: boolean;
  message: string;
  data: ProjectMember[];
}

export interface DeleteProjectResponse {
  success: boolean;
  message: string;
}

// Legacy types for backward compatibility (to be removed later)
export interface ProjectLabel {
  id: string;
  name: string;
  color: string;
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

