import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateWorkspaceDto } from '../dtos/create-workspace.dto';
import { WorkspaceResponseDto } from '../dtos/workspace-response.dto';
import { InviteMemberDto } from '../dtos/invite-member.dto';
import { AddMemberDto } from '../dtos/add-member.dto';
import { WorkspaceMemberResponseDto } from '../dtos/workspace-member-response.dto';
import { InvitationResponseDto } from '../dtos/invitation.dto';
import { EmailService } from '../../../services/email.service';
import { WorkspaceType, MemberRole, InvitationStatus, InviteType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: number): Promise<WorkspaceResponseDto> {
    const { workspaceName, description, workspaceType } = createWorkspaceDto;

    // Create workspace
    const workspace = await this.prisma.workspace.create({
      data: {
        workspaceName,
        description,
        workspaceType,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // If GROUP workspace, automatically add creator as OWNER member
    if (workspaceType === WorkspaceType.GROUP) {
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: userId,
          role: MemberRole.OWNER,
        },
      });
    }

    return {
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      memberCount: workspaceType === WorkspaceType.GROUP ? 1 : undefined,
      userRole: workspaceType === WorkspaceType.GROUP ? MemberRole.OWNER : undefined,
    };
  }

  async findAllByUser(userId: number): Promise<WorkspaceResponseDto[]> {
    // Find workspaces where user is owner
    const ownedWorkspaces = await this.prisma.workspace.findMany({
      where: {
        userId,
        dateDeleted: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
        },
      },
    });

    // Find workspaces where user is member (GROUP only)
    const memberWorkspaces = await this.prisma.workspace.findMany({
      where: {
        workspaceType: WorkspaceType.GROUP,
        dateDeleted: null,
        workspaceMembers: {
          some: {
            userId,
            dateDeleted: null,
          },
        },
        NOT: {
          userId, // Exclude owned workspaces (already included above)
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];

    return allWorkspaces.map((workspace) => {
      const userMember = workspace.workspaceMembers.find(member => member.userId === userId);
      
      return {
        id: workspace.id,
        workspaceName: workspace.workspaceName,
        description: workspace.description,
        userId: workspace.userId,
        workspaceType: workspace.workspaceType,
        dateCreated: workspace.dateCreated,
        dateModified: workspace.dateModified,
        user: workspace.user,
        memberCount: workspace.workspaceType === WorkspaceType.GROUP ? workspace.workspaceMembers.length : undefined,
        userRole: workspace.userId === userId ? MemberRole.OWNER : userMember?.role,
      };
    });
  }

  async findOne(id: number, userId: number): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        dateDeleted: null,
        OR: [
          { userId }, // User is owner
          {
            workspaceType: WorkspaceType.GROUP,
            workspaceMembers: {
              some: {
                userId,
                dateDeleted: null,
              },
            },
          }, // User is member of GROUP workspace
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy workspace hoặc bạn không có quyền truy cập');
    }

    const userMember = workspace.workspaceMembers.find(member => member.userId === userId);

    return {
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      memberCount: workspace.workspaceType === WorkspaceType.GROUP ? workspace.workspaceMembers.length : undefined,
      userRole: workspace.userId === userId ? MemberRole.OWNER : userMember?.role,
    };
  }

  async delete(id: number, userId: number): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        dateDeleted: null,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy workspace');
    }

    // Only owner can delete workspace
    if (workspace.userId !== userId) {
      throw new ForbiddenException('Chỉ owner mới có thể xóa workspace');
    }

    // Soft delete workspace
    await this.prisma.workspace.update({
      where: { id },
      data: {
        dateDeleted: new Date(),
      },
    });

    // Soft delete all workspace members
    await this.prisma.workspaceMember.updateMany({
      where: {
        workspaceId: id,
        dateDeleted: null,
      },
      data: {
        dateDeleted: new Date(),
      },
    });

    // TODO: When Project model is implemented, also soft delete all projects in this workspace
    // await this.prisma.project.updateMany({
    //   where: {
    //     workspaceId: id,
    //     dateDeleted: null,
    //   },
    //   data: {
    //     dateDeleted: new Date(),
    //   },
    // });
  }

  async getPersonalWorkspaces(userId: number): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        userId,
        workspaceType: WorkspaceType.PERSONAL,
        dateDeleted: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateCreated: 'desc',
      },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      userRole: MemberRole.OWNER,
    }));
  }

  async getGroupWorkspaces(userId: number): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        workspaceType: WorkspaceType.GROUP,
        dateDeleted: null,
        OR: [
          { userId }, // User is owner
          {
            workspaceMembers: {
              some: {
                userId,
                dateDeleted: null,
              },
            },
          }, // User is member
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
        },
      },
      orderBy: {
        dateCreated: 'desc',
      },
    });

    return workspaces.map((workspace) => {
      const userMember = workspace.workspaceMembers.find(member => member.userId === userId);
      
      return {
        id: workspace.id,
        workspaceName: workspace.workspaceName,
        description: workspace.description,
        userId: workspace.userId,
        workspaceType: workspace.workspaceType,
        dateCreated: workspace.dateCreated,
        dateModified: workspace.dateModified,
        user: workspace.user,
        memberCount: workspace.workspaceMembers.length,
        userRole: workspace.userId === userId ? MemberRole.OWNER : userMember?.role,
      };
    });
  }

  async restore(id: number, userId: number): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        dateDeleted: { not: null }, // Must be soft deleted
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy workspace đã bị xóa');
    }

    // Only owner can restore workspace
    if (workspace.userId !== userId) {
      throw new ForbiddenException('Chỉ owner mới có thể khôi phục workspace');
    }

    // Restore workspace
    await this.prisma.workspace.update({
      where: { id },
      data: {
        dateDeleted: null,
      },
    });

    // Restore all workspace members
    await this.prisma.workspaceMember.updateMany({
      where: {
        workspaceId: id,
        dateDeleted: { not: null },
      },
      data: {
        dateDeleted: null,
      },
    });

    // TODO: When Project model is implemented, also restore all projects in this workspace
    // await this.prisma.project.updateMany({
    //   where: {
    //     workspaceId: id,
    //     dateDeleted: { not: null },
    //   },
    //   data: {
    //     dateDeleted: null,
    //   },
    // });
  }

  async getDeletedWorkspaces(userId: number): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        userId, // Only owner can see deleted workspaces
        dateDeleted: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: { not: null },
          },
        },
      },
      orderBy: {
        dateDeleted: 'desc',
      },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      memberCount: workspace.workspaceType === WorkspaceType.GROUP ? workspace.workspaceMembers.length : undefined,
      userRole: MemberRole.OWNER,
    }));
  }

  // Invite member to workspace via email or in-app (Hierarchical Approach - Step 1)
  async inviteMember(workspaceId: number, inviteMemberDto: InviteMemberDto, inviterId: number): Promise<InvitationResponseDto> {
    const { email, inviteType, message } = inviteMemberDto;

    // Check if user has permission to invite (must be owner or admin)
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
      },
      include: {
        user: true,
        workspaceMembers: {
          where: {
            userId: inviterId,
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Only GROUP workspaces can have invitations
    if (workspace.workspaceType !== WorkspaceType.GROUP) {
      throw new BadRequestException('Chỉ có thể mời thành viên vào GROUP workspace');
    }

    // Check permission: owner or admin can invite
    const isOwner = workspace.userId === inviterId;
    const memberRole = workspace.workspaceMembers[0]?.role;
    const canInvite = isOwner || memberRole === MemberRole.ADMIN;

    if (!canInvite) {
      throw new ForbiddenException('Chỉ owner hoặc admin mới có thể mời thành viên');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
        dateDeleted: null,
      },
    });

    if (existingMember) {
      throw new BadRequestException('Người dùng đã là thành viên của workspace');
    }

    // HIERARCHICAL APPROACH: Check for existing pending invitation and handle smartly
    const existingInvitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      // Instead of throwing error, update the existing invitation with new message and resend
      const updatedInvitation = await this.prisma.workspaceInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          message: message || existingInvitation.message,
          invitedBy: inviterId, // Update inviter
          updatedAt: new Date(),
        },
        include: {
          workspace: {
            select: {
              id: true,
              workspaceName: true,
              workspaceType: true,
            },
          },
          inviter: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // Resend email if EMAIL type
      if (inviteType === InviteType.EMAIL) {
        const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${existingInvitation.token}`;
        await this.emailService.sendWorkspaceInvitation(
          email,
          workspace.workspaceName,
          updatedInvitation.inviter.username,
          acceptUrl,
          message || 'Lời mời workspace đã được gửi lại'
        );
      }

      return {
        id: updatedInvitation.id,
        workspaceId: updatedInvitation.workspaceId,
        email: updatedInvitation.email,
        invitedBy: updatedInvitation.invitedBy,
        inviteType: updatedInvitation.inviteType,
        status: updatedInvitation.status,
        token: updatedInvitation.token,
        message: updatedInvitation.message,
        expiresAt: updatedInvitation.expiresAt,
        createdAt: updatedInvitation.createdAt,
        workspace: updatedInvitation.workspace,
        inviter: updatedInvitation.inviter,
      };
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        invitedBy: inviterId,
        inviteType,
        token,
        message,
        expiresAt,
      },
      include: {
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Send email if EMAIL type
    if (inviteType === InviteType.EMAIL) {
      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
      await this.emailService.sendWorkspaceInvitation(
        email,
        workspace.workspaceName,
        invitation.inviter.username,
        acceptUrl,
        message
      );
    }

    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      invitedBy: invitation.invitedBy,
      inviteType: invitation.inviteType,
      status: invitation.status,
      token: invitation.token,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      workspace: invitation.workspace,
      inviter: invitation.inviter,
    };
  }

  // Accept workspace invitation
  async acceptInvitation(token: string): Promise<WorkspaceMemberResponseDto> {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        token,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Lời mời không hợp lệ hoặc đã hết hạn');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      throw new BadRequestException('Người dùng chưa đăng ký tài khoản');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        dateDeleted: null,
      },
    });

    if (existingMember) {
      throw new BadRequestException('Bạn đã là thành viên của workspace này');
    }

    // Add user as member and update invitation status
    const [member] = await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: MemberRole.MEMBER,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
    ]);

    return {
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  // Add member directly (for existing workspace members)
  async addMember(workspaceId: number, addMemberDto: AddMemberDto, requesterId: number): Promise<WorkspaceMemberResponseDto> {
    const { userId, role = MemberRole.MEMBER } = addMemberDto;

    // Check workspace and permissions
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
      },
      include: {
        workspaceMembers: {
          where: {
            userId: requesterId,
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    if (workspace.workspaceType !== WorkspaceType.GROUP) {
      throw new BadRequestException('Chỉ có thể thêm thành viên vào GROUP workspace');
    }

    // Check permission
    const isOwner = workspace.userId === requesterId;
    const memberRole = workspace.workspaceMembers[0]?.role;
    const canAdd = isOwner || memberRole === MemberRole.ADMIN;

    if (!canAdd) {
      throw new ForbiddenException('Chỉ owner hoặc admin mới có thể thêm thành viên');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Check if already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        dateDeleted: null,
      },
    });

    if (existingMember) {
      throw new BadRequestException('Người dùng đã là thành viên của workspace');
    }

    // Add member
    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  // Remove member from workspace
  async removeMember(workspaceId: number, memberId: number, requesterId: number): Promise<void> {
    // Check workspace and permissions
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
      },
      include: {
        workspaceMembers: {
          where: {
            userId: requesterId,
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Check permission
    const isOwner = workspace.userId === requesterId;
    const memberRole = workspace.workspaceMembers[0]?.role;
    const canRemove = isOwner || memberRole === MemberRole.ADMIN;

    if (!canRemove) {
      throw new ForbiddenException('Chỉ owner hoặc admin mới có thể xóa thành viên');
    }

    // Find member to remove
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        id: memberId,
        workspaceId,
        dateDeleted: null,
      },
    });

    if (!member) {
      throw new NotFoundException('Thành viên không tồn tại');
    }

    // Cannot remove owner
    if (member.userId === workspace.userId) {
      throw new ForbiddenException('Không thể xóa owner khỏi workspace');
    }

    // Soft delete member
    await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { dateDeleted: new Date() },
    });
  }

  // Get workspace members
  async getMembers(workspaceId: number, requesterId: number): Promise<WorkspaceMemberResponseDto[]> {
    // Check access to workspace
    const hasAccess = await this.checkWorkspaceAccess(workspaceId, requesterId);
    if (!hasAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập workspace này');
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        dateDeleted: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // Owner first, then Admin, then Member
        { joinedAt: 'asc' },
      ],
    });

    return members.map(member => ({
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  // Get pending invitations for workspace
  async getPendingInvitations(workspaceId: number, requesterId: number): Promise<InvitationResponseDto[]> {
    // Check if user can view invitations (owner or admin)
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
      },
      include: {
        workspaceMembers: {
          where: {
            userId: requesterId,
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    const isOwner = workspace.userId === requesterId;
    const memberRole = workspace.workspaceMembers[0]?.role;
    const canView = isOwner || memberRole === MemberRole.ADMIN;

    if (!canView) {
      throw new ForbiddenException('Chỉ owner hoặc admin mới có thể xem danh sách lời mời');
    }

    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map(invitation => ({
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      invitedBy: invitation.invitedBy,
      inviteType: invitation.inviteType,
      status: invitation.status,
      token: invitation.token,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      workspace: invitation.workspace,
      inviter: invitation.inviter,
    }));
  }

  // Cancel invitation
  async cancelInvitation(invitationId: number, requesterId: number): Promise<void> {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        id: invitationId,
        status: InvitationStatus.PENDING,
      },
      include: {
        workspace: {
          include: {
            workspaceMembers: {
              where: {
                userId: requesterId,
                dateDeleted: null,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Lời mời không tồn tại');
    }

    // Check permission
    const isOwner = invitation.workspace.userId === requesterId;
    const isInviter = invitation.invitedBy === requesterId;
    const memberRole = invitation.workspace.workspaceMembers[0]?.role;
    const canCancel = isOwner || isInviter || memberRole === MemberRole.ADMIN;

    if (!canCancel) {
      throw new ForbiddenException('Bạn không có quyền hủy lời mời này');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REJECTED },
    });
  }

  // Helper method to check workspace access
  private async checkWorkspaceAccess(workspaceId: number, userId: number): Promise<boolean> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
        OR: [
          { userId }, // User is owner
          {
            workspaceType: WorkspaceType.GROUP,
            workspaceMembers: {
              some: {
                userId,
                dateDeleted: null,
              },
            },
          }, // User is member of GROUP workspace
        ],
      },
    });

    return !!workspace;
  }

  // Helper method to check if user is workspace member by email
  async checkWorkspaceMembershipByEmail(workspaceId: number, email: string): Promise<boolean> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email },
        dateDeleted: null,
      },
    });

    return !!member;
  }

  // Helper method to get workspace info
  async getWorkspaceInfo(workspaceId: number): Promise<{ id: number; workspaceName: string; workspaceType: WorkspaceType } | null> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
      },
      select: {
        id: true,
        workspaceName: true,
        workspaceType: true,
      },
    });

    return workspace;
  }
}
