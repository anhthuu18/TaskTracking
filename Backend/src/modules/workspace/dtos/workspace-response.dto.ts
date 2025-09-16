import { WorkspaceType, MemberRole } from '@prisma/client';

export class WorkspaceResponseDto {
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

export class WorkspaceMemberResponseDto {
  id: number;
  workspaceId: number;
  userId: number;
  role: MemberRole;
  joinedAt: Date;
  user: {
    id: number;
    username: string; 
    email: string;
  };
}
