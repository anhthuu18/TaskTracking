import { InviteType, InvitationStatus } from '@prisma/client';

export class ProjectInvitationResponseDto {
  id: number;
  projectId: number;
  email: string;
  invitedBy: number;
  inviteType: InviteType;
  status: InvitationStatus;
  token: string;
  message?: string;
  roleId?: number;
  expiresAt: Date;
  createdAt: Date;
  project: {
    id: number;
    projectName: string;
    workspace: {
      id: number;
      workspaceName: string;
    };
  };
  inviter: {
    id: number;
    username: string;
    email: string;
  };
}
