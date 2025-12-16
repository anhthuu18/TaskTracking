import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { NotificationService } from "./notification.service";

@Controller("notification")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // Get ALL user notifications (workspace invitations + project notifications) for Personal Dashboard
  @Get("all")
  async getAllUserNotifications(@Request() req) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      // Get workspace invitations
      const wsInvitations =
        await this.notificationService.getNotificationsByEmail(userEmail);

      const invitations = wsInvitations.map((invitation: any) => {
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        return {
          ...invitation,
          daysRemaining: daysRemaining,
          receivedDate: new Date(invitation.createdAt).toLocaleDateString(
            "vi-VN"
          ),
          notificationType: "workspace_invitation",
        };
      });

      // Get project notifications (including task reminders)
      const projectNotis =
        await this.notificationService.getAllProjectNotificationsByUser(userId);

      const projectNotifications = projectNotis.map((n: any) => {
        const createdAt = new Date(n.createdAt);

        return {
          id: n.id,
          projectId: n.projectId,
          taskId: n.taskId,
          type: n.type,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          isRead: n.isRead,
          receivedDate: createdAt.toLocaleDateString("vi-VN"),
          projectName: n.project?.projectName,
          notificationType: "project_notification",
        };
      });

      // Combine and sort by date (newest first)
      const allNotifications = [...invitations, ...projectNotifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        message: "All notifications retrieved successfully",
        data: allNotifications,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to get notifications",
        data: [],
      };
    }
  }

  // Get user's workspace invitations only (for Personal Dashboard)
  @Get()
  async getUserNotifications(@Request() req) {
    try {
      const userEmail = req.user.email;

      // Workspace invitations (by email)
      const wsInvitations =
        await this.notificationService.getNotificationsByEmail(userEmail);

      // Return with expiry calculation
      const notifications = wsInvitations.map((invitation: any) => {
        const now = new Date();
        const expiresAt = new Date(invitation.expiresAt);
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        return {
          ...invitation,
          daysRemaining: daysRemaining,
          receivedDate: new Date(invitation.createdAt).toLocaleDateString(
            "vi-VN"
          ),
        };
      });

      return {
        success: true,
        message: "Workspace invitations retrieved successfully",
        data: notifications,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to get workspace invitations",
        data: [],
      };
    }
  }

  // Get project notifications for workspace context (for Workspace Dashboard)
  @Get("project/:workspaceId")
  async getProjectNotifications(
    @Request() req,
    @Param("workspaceId") workspaceId: string
  ) {
    try {
      const userId = req.user.id;
      const wsId = parseInt(workspaceId, 10);

      // Get project notifications filtered by workspace
      const projectNotis =
        await this.notificationService.getProjectNotificationsByWorkspace(
          userId,
          wsId
        );

      const notifications = projectNotis.map((n: any) => {
        const createdAt = new Date(n.createdAt);

        return {
          id: n.id,
          projectId: n.projectId,
          taskId: n.taskId, // Include taskId for navigation
          type: n.type,
          title: n.title,
          message: n.message,
          createdAt: n.createdAt,
          isRead: n.isRead,
          receivedDate: createdAt.toLocaleDateString("vi-VN"),
          projectName: n.project?.projectName,
        };
      });

      return {
        success: true,
        message: "Project notifications retrieved successfully",
        data: notifications,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to get project notifications",
        data: [],
      };
    }
  }

  // Accept an invitation
  @Post("accept/:invitationId")
  async acceptInvitation(
    @Param("invitationId") invitationId: string,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      const result = await this.notificationService.acceptInvitation(
        parseInt(invitationId),
        userId
      );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to accept invitation",
      };
    }
  }

  // Decline an invitation
  @Post("decline/:invitationId")
  async declineInvitation(@Param("invitationId") invitationId: string) {
    try {
      const result = await this.notificationService.declineInvitation(
        parseInt(invitationId)
      );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to decline invitation",
      };
    }
  }

  // Mark project notification as read
  @Post("mark-read/:notificationId")
  async markNotificationAsRead(
    @Param("notificationId") notificationId: string,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      const result =
        await this.notificationService.markProjectNotificationAsRead(
          parseInt(notificationId),
          userId
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to mark notification as read",
      };
    }
  }

  // Mark all project notifications as read for a user
  @Post("mark-all-read")
  async markAllNotificationsAsRead(@Request() req) {
    try {
      const userId = req.user.id;
      const result =
        await this.notificationService.markAllProjectNotificationsAsRead(
          userId
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to mark all notifications as read",
      };
    }
  }

  // Mark all project notifications as read for a workspace
  @Post("mark-all-read/:workspaceId")
  async markAllNotificationsAsReadForWorkspace(
    @Request() req,
    @Param("workspaceId") workspaceId: string
  ) {
    try {
      const userId = req.user.id;
      const wsId = parseInt(workspaceId, 10);
      const result =
        await this.notificationService.markAllProjectNotificationsAsReadForWorkspace(
          userId,
          wsId
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to mark all notifications as read",
      };
    }
  }

  // Delete all project notifications for workspace (for Workspace Dashboard)
  @Post("delete-all-project/:workspaceId")
  async deleteAllProjectNotifications(
    @Request() req,
    @Param("workspaceId") workspaceId: string
  ) {
    try {
      const userId = req.user.id;
      const wsId = parseInt(workspaceId, 10);
      const result =
        await this.notificationService.deleteAllProjectNotificationsByWorkspace(
          userId,
          wsId
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to delete project notifications",
      };
    }
  }

  // Delete all project notifications for user (for Personal Dashboard - all mode)
  @Post("delete-all-project")
  async deleteAllProjectNotificationsForUser(@Request() req) {
    try {
      const userId = req.user.id;
      const result =
        await this.notificationService.deleteAllProjectNotificationsByUser(
          userId
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to delete all project notifications",
      };
    }
  }

  // Delete all workspace invitations (for Personal Dashboard - not really deleting, but declining)
  @Post("delete-all-workspace")
  async deleteAllWorkspaceInvitations(@Request() req) {
    try {
      const userEmail = req.user.email;
      const result =
        await this.notificationService.declineAllWorkspaceInvitations(
          userEmail
        );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to decline workspace invitations",
      };
    }
  }
}
