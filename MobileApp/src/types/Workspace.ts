// Workspace type definitions matching Backend DTOs

export interface Workspace {
  id: number;
  workspaceName: string;
  description?: string;
  userId: number;
  workspaceType: WorkspaceType;
  dateCreated: Date;
  dateModified: Date;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  memberCount?: number;
  userRole?: MemberRole;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number;
  role: MemberRole;
  joinedAt: Date;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export interface WorkspaceInvitation {
  id: number;
  workspaceId: number;
  email: string;
  role: MemberRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  invitedBy: number;
}

export enum WorkspaceType {
  PERSONAL = 'PERSONAL',
  GROUP = 'GROUP'
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

// Request DTOs
export interface CreateWorkspaceRequest {
  workspaceName: string;
  description?: string;
  workspaceType: WorkspaceType;
}

export interface UpdateWorkspaceRequest {
  workspaceName?: string;
  description?: string;
}

export interface InviteMemberRequest {
  email?: string;
  username?: string;
  role?: MemberRole;
}

// Response DTOs
export interface WorkspaceResponse {
  success: boolean;
  message: string;
  data: Workspace;
}

export interface WorkspaceListResponse {
  success: boolean;
  message: string;
  data: Workspace[];
}

export interface WorkspaceMemberResponse {
  success: boolean;
  message: string;
  data: WorkspaceMember[];
}

export interface DeleteWorkspaceResponse {
  success: boolean;
  message: string;
}


