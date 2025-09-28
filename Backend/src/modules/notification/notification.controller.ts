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
      
      // Get notifications by email (since invitations are sent to email)
      const notifications = await this.notificationService.getNotificationsByEmail(userEmail);
      
      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications,
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
