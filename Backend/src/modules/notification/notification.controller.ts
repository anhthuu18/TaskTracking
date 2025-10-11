import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // Get user's notifications
  @Get()
  async getUserNotifications(@Request() req) {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      // Workspace invitations (by email)
      const wsInvitations = await this.notificationService.getNotificationsByEmail(userEmail);
      // Project notifications (by user id)
      const projectNotis = await this.notificationService.getProjectNotificationsByUser(userId);

      // Merge: map project notifications to a compatible shape for frontend
      const merged = [
        // Workspace invitations with expiry calculation
        ...wsInvitations.map((invitation: any) => {
          const now = new Date();
          const expiresAt = new Date(invitation.expiresAt);
          const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          
          return {
            ...invitation,
            daysRemaining: daysRemaining,
            receivedDate: new Date(invitation.createdAt).toLocaleDateString('vi-VN'),
          };
        }),
        // Project notifications mapped to a simpler display-only shape
        ...projectNotis.map((n: any) => {
          const createdAt = new Date(n.createdAt);
          
          return {
            id: n.id,
            type: 'PROJECT_NOTIFICATION',
            title: `You were added to project "${n.project.projectName}" by ${n.project.creator?.username || 'system'}`,
            subtitle: `Workspace: ${n.project.workspace?.workspaceName || 'N/A'}`,
            message: n.message,
            createdAt: n.createdAt,
            receivedDate: createdAt.toLocaleDateString('vi-VN'),
            // Keep minimal fields so frontend can render without Accept/Decline
          };
        }),
      ];

      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: merged,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get notifications',
        data: [],
      };
    }
  }

  // Accept an invitation
  @Post('accept/:invitationId')
  async acceptInvitation(
    @Param('invitationId') invitationId: string,
    @Request() req,
  ) {
    try {
      const userId = req.user.id;
      const result = await this.notificationService.acceptInvitation(
        parseInt(invitationId),
        userId,
      );
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to accept invitation',
      };
    }
  }

  // Decline an invitation
  @Post('decline/:invitationId')
  async declineInvitation(
    @Param('invitationId') invitationId: string,
  ) {
    try {
      const result = await this.notificationService.declineInvitation(
        parseInt(invitationId),
      );
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to decline invitation',
      };
    }
  }
}
