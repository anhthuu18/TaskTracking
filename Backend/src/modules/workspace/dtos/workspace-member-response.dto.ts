import { MemberRole } from '@prisma/client';

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
