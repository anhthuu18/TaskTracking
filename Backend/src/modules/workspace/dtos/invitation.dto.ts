import { InviteType, InvitationStatus } from '@prisma/client';

export class InvitationResponseDto {
  id: number;
  workspaceId: number;
  email: string;
  invitedBy: number;
  inviteType: InviteType;
  status: InvitationStatus;
  token: string;
  message?: string;
  expiresAt: Date;
  createdAt: Date;
  workspace: {
    id: number;
    workspaceName: string;
    workspaceType: string;
  };
  inviter: {
    id: number;
    username: string;
    email: string;
  };
}
