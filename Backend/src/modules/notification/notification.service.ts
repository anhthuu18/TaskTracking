import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkspaceInvitation } from "@prisma/client";

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
          createdAt: "desc",
        },
      });

      return notifications;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw new Error("Failed to get user notifications");
    }
  }

  // Get notifications by user email (since invitations are sent to email)
  async getNotificationsByEmail(
    userEmail: string,
    userId?: number
  ): Promise<WorkspaceInvitation[]> {
    try {
      const whereClause: any = {
        email: userEmail,
        expiresAt: {
          gt: new Date(), // Only non-expired invitations
        },
      };

      // Exclude invitations created by the user themselves
      if (userId) {
        whereClause.invitedBy = {
          not: userId,
        };
      }

      const notifications = await this.prisma.workspaceInvitation.findMany({
        where: whereClause,
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
          createdAt: "desc",
        },
      });

      return notifications;
    } catch (error) {
      console.error("Error getting notifications by email:", error);
      throw new Error("Failed to get notifications");
    }
  }

  // Project notifications for a user (added to project, etc.)
  async getProjectNotificationsByUser(userId: number) {
    return this.prisma.projectNotification.findMany({
      where: {
        receiverUserId: userId,
        isRead: false, // Only unread notifications
      },
      include: {
        project: {
          include: {
            creator: { select: { id: true, username: true, email: true } },
            workspace: { select: { id: true, workspaceName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Get all project notifications for user (across all workspaces) - for Personal Dashboard
  async getAllProjectNotificationsByUser(userId: number): Promise<any[]> {
    try {
      // Calculate date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const notifications = await this.prisma.projectNotification.findMany({
        where: {
          receiverUserId: userId,
          // Show both read and unread, but only from last 10 days
          createdAt: {
            gte: tenDaysAgo,
          },
        },
        include: {
          project: {
            select: {
              projectName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Limit to 100 most recent notifications for performance
      });

      return notifications;
    } catch (error) {
      console.error("Error getting all project notifications:", error);
      return [];
    }
  }

  // Project notifications filtered by workspace (for Workspace Dashboard)
  async getProjectNotificationsByWorkspace(
    userId: number,
    workspaceId: number
  ) {
    // Calculate date 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    return this.prisma.projectNotification.findMany({
      where: {
        receiverUserId: userId,
        // Show both read and unread, but only from last 10 days
        createdAt: {
          gte: tenDaysAgo,
        },
        project: {
          workspaceId: workspaceId, // Filter by workspace
        },
      },
      include: {
        project: {
          include: {
            creator: { select: { id: true, username: true, email: true } },
            workspace: { select: { id: true, workspaceName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Accept an invitation
  async acceptInvitation(
    invitationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = await this.prisma.workspaceInvitation.findUnique({
        where: { id: invitationId },
        include: {
          workspace: true,
        },
      });

      if (!invitation) {
        return { success: false, message: "Invitation not found" };
      }

      if (invitation.status !== "PENDING") {
        return { success: false, message: "Invitation is no longer pending" };
      }

      if (invitation.expiresAt < new Date()) {
        return { success: false, message: "Invitation has expired" };
      }

      // Check if user is already a member
      const existingMember = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: invitation.workspaceId,
          userId: userId,
        },
      });

      if (existingMember) {
        return {
          success: false,
          message: "You are already a member of this workspace",
        };
      }

      // Add user to workspace
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: userId,
          role: "MEMBER", // Default role for invited members
          joinedAt: new Date(),
        },
      });

      // Update invitation status
      await this.prisma.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: "ACCEPTED",
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Successfully joined ${invitation.workspace.workspaceName}`,
      };
    } catch (error) {
      console.error("Error accepting invitation:", error);
      return { success: false, message: "Failed to accept invitation" };
    }
  }

  // Decline an invitation
  async declineInvitation(
    invitationId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invitation = await this.prisma.workspaceInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return { success: false, message: "Invitation not found" };
      }

      if (invitation.status !== "PENDING") {
        return { success: false, message: "Invitation is no longer pending" };
      }

      // Update invitation status
      await this.prisma.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: "REJECTED",
          updatedAt: new Date(),
        },
      });

      return { success: true, message: "Invitation declined" };
    } catch (error) {
      console.error("Error declining invitation:", error);
      return { success: false, message: "Failed to decline invitation" };
    }
  }

  // Mark project notification as read
  async markProjectNotificationAsRead(
    notificationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const notification = await this.prisma.projectNotification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return { success: false, message: "Notification not found" };
      }

      if (notification.receiverUserId !== userId) {
        return {
          success: false,
          message: "Unauthorized to mark this notification as read",
        };
      }

      await this.prisma.projectNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return { success: true, message: "Notification marked as read" };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, message: "Failed to mark notification as read" };
    }
  }

  // Mark all project notifications as read for a user
  async markAllProjectNotificationsAsRead(
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.projectNotification.updateMany({
        where: {
          receiverUserId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { success: true, message: "All notifications marked as read" };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        message: "Failed to mark all notifications as read",
      };
    }
  }

  // Mark all project notifications as read for a workspace
  async markAllProjectNotificationsAsReadForWorkspace(
    userId: number,
    workspaceId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.projectNotification.updateMany({
        where: {
          receiverUserId: userId,
          isRead: false,
          project: {
            workspaceId: workspaceId,
          },
        },
        data: { isRead: true },
      });

      return { success: true, message: "All notifications marked as read" };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        message: "Failed to mark all notifications as read",
      };
    }
  }

  // Delete all project notifications for a workspace (for Workspace Dashboard)
  async deleteAllProjectNotificationsByWorkspace(
    userId: number,
    workspaceId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.prisma.projectNotification.deleteMany({
        where: {
          receiverUserId: userId,
          project: {
            workspaceId: workspaceId,
          },
        },
      });

      return {
        success: true,
        message: `Deleted ${result.count} project notifications successfully`,
      };
    } catch (error) {
      console.error("Error deleting project notifications:", error);
      return {
        success: false,
        message: "Failed to delete project notifications",
      };
    }
  }

  // Delete all project notifications for a user (for Personal Dashboard)
  async deleteAllProjectNotificationsByUser(
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.prisma.projectNotification.deleteMany({
        where: {
          receiverUserId: userId,
        },
      });

      return {
        success: true,
        message: `Deleted ${result.count} project notifications successfully`,
      };
    } catch (error) {
      console.error("Error deleting all project notifications:", error);
      return {
        success: false,
        message: "Failed to delete all project notifications",
      };
    }
  }

  // Decline all workspace invitations (for Personal Dashboard)
  async declineAllWorkspaceInvitations(
    userEmail: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.prisma.workspaceInvitation.updateMany({
        where: {
          email: userEmail,
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Declined ${result.count} workspace invitations successfully`,
      };
    } catch (error) {
      console.error("Error declining workspace invitations:", error);
      return {
        success: false,
        message: "Failed to decline workspace invitations",
      };
    }
  }
}
