import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceInvitation } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // Get all pending invitations for a user
  async getUserNotifications(userId: number): Promise<WorkspaceInvitation[]> {
    try {
      const notifications = await this.prisma.workspaceInvitation.findMany({
        where: {
          email: {
            // We need to get user's email first
            // This is a simplified approach - in real app, you'd join with User table
            // For now, we'll get invitations by checking if user exists with that email
          },
          status: 'PENDING',
          expiresAt: {
            gt: new Date(), // Only non-expired invitations
          },
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  // Get notifications by user email (since invitations are sent to email)
  async getNotificationsByEmail(userEmail: string): Promise<WorkspaceInvitation[]> {
    try {
      const notifications = await this.prisma.workspaceInvitation.findMany({
        where: {
          email: userEmail,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(), // Only non-expired invitations
          },
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      return notifications;
    } catch (error) {
      console.error('Error getting notifications by email:', error);
      throw new Error('Failed to get notifications');
    }
  }

  // Accept an invitation
  async acceptInvitation(invitationId: number, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = await this.prisma.workspaceInvitation.findUnique({
        where: { id: invitationId },
        include: {
          workspace: true,
        },
      });

      if (!invitation) {
        return { success: false, message: 'Invitation not found' };
      }

      if (invitation.status !== 'PENDING') {
        return { success: false, message: 'Invitation is no longer pending' };
      }

      if (invitation.expiresAt < new Date()) {
        return { success: false, message: 'Invitation has expired' };
      }

      // Check if user is already a member
      const existingMember = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: invitation.workspaceId,
          userId: userId,
        },
      });

      if (existingMember) {
        return { success: false, message: 'You are already a member of this workspace' };
      }

      // Add user to workspace
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: userId,
          role: 'MEMBER', // Default role for invited members
          joinedAt: new Date(),
        },
      });

      // Update invitation status
      await this.prisma.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          updatedAt: new Date(),
        },
      });

      return { 
        success: true, 
        message: `Successfully joined ${invitation.workspace.workspaceName}` 
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, message: 'Failed to accept invitation' };
    }
  }

  // Decline an invitation
  async declineInvitation(invitationId: number): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = await this.prisma.workspaceInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return { success: false, message: 'Invitation not found' };
      }

      if (invitation.status !== 'PENDING') {
        return { success: false, message: 'Invitation is no longer pending' };
      }

      // Update invitation status
      await this.prisma.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date(),
        },
      });

      return { success: true, message: 'Invitation declined' };
    } catch (error) {
      console.error('Error declining invitation:', error);
      return { success: false, message: 'Failed to decline invitation' };
    }
  }
}
