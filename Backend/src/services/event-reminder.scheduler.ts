import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class EventReminderScheduler {
  private readonly logger = new Logger(EventReminderScheduler.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private firebaseService: FirebaseService
  ) {}

  /**
   * Event Reminder Job - Runs every minute
   * Sends reminders for events starting in 60 minutes
   */
  @Cron("* * * * *", {
    name: "event-reminder",
    timeZone: "Asia/Ho_Chi_Minh",
  })
  async sendEventReminders() {
    this.logger.log("Checking for events starting in 60 minutes");

    try {
      // Calculate time range: 60 minutes from now (with 1 minute tolerance)
      const now = new Date();
      const sixtyMinutesLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Time window: 59-61 minutes from now
      const reminderStart = new Date(now.getTime() + 4 * 60 * 1000);
      const reminderEnd = new Date(now.getTime() + 6 * 60 * 1000);

      this.logger.log(
        `Checking for events between ${reminderStart.toISOString()} and ${reminderEnd.toISOString()}`
      );

      // Find all events starting in 60 minutes
      const events = await this.prisma.event.findMany({
        where: {
          startTime: {
            gte: reminderStart,
            lte: reminderEnd,
          },
          dateDeleted: null,
        },
        include: {
          project: {
            select: {
              id: true,
              projectName: true,
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      email: true,
                      fcmToken: true,
                    },
                  },
                },
              },
            },
          },
          creator: {
            select: {
              username: true,
            },
          },
        },
      });

      this.logger.log(`Found ${events.length} events happening tomorrow`);

      for (const event of events) {
        this.logger.log(
          `Processing event: ${event.eventName} (ID: ${event.id})`
        );

        const projectName = event.project.projectName;
        const projectId = event.project.id;

        // Get all project members
        const projectMembers = event.project.members;

        // Get user settings for notification preferences
        const memberIds = projectMembers.map((pm) => pm.userId);
        const userSettings = await this.prisma.userSettings.findMany({
          where: {
            userId: {
              in: memberIds,
            },
          },
        });

        const settingsMap = new Map(userSettings.map((s) => [s.userId, s]));

        // Send notification to each member
        for (const member of projectMembers) {
          const settings = settingsMap.get(member.userId);
          const notifyByEmail = settings?.notifyByEmail ?? true;
          const notifyByPush = settings?.notifyByPush ?? true;

          const email = member.user.email;
          const username = member.user.username;
          const fcmToken = member.user.fcmToken;

          this.logger.log(
            `Sending reminder to ${username} (Email: ${notifyByEmail}, Push: ${notifyByPush})`
          );

          // Check if notification already sent in the last hour
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);

          const existingNotification =
            await this.prisma.projectNotification.findFirst({
              where: {
                projectId: projectId,
                receiverUserId: member.userId,
                type: "EVENT_REMINDER",
                title: {
                  contains: event.eventName,
                },
                createdAt: {
                  gte: oneHourAgo,
                },
              },
            });

          if (existingNotification) {
            this.logger.log(
              `Reminder already sent to ${username} in the last hour, skipping`
            );
            continue;
          }

          // Create in-app notification
          try {
            await this.prisma.projectNotification.create({
              data: {
                projectId: projectId,
                receiverUserId: member.userId,
                type: "EVENT_REMINDER",
                title: `⏰ Nhắc nhở: Event "${event.eventName}"`,
                message: `Event "${
                  event.eventName
                }" sẽ bắt đầu trong 60 phút nữa (${event.startTime.toLocaleString(
                  "vi-VN"
                )})`,
              },
            });
            this.logger.log(`In-app notification created for ${username}`);
          } catch (error) {
            this.logger.error(
              `Failed to create in-app notification for ${username}:`,
              error
            );
          }

          // Send email notification
          if (notifyByEmail && email) {
            try {
              await this.emailService.sendEventReminder(
                email,
                event.eventName,
                projectName,
                event.startTime,
                event.endTime,
                event.description
              );
              this.logger.log(`Email sent to ${email}`);
            } catch (error) {
              this.logger.error(`Failed to send email to ${email}:`, error);
            }
          }

          // Send push notification
          if (notifyByPush && fcmToken) {
            try {
              await this.firebaseService.sendPushNotification(
                fcmToken,
                {
                  title: "⏰ Nhắc nhở Event",
                  body: `"${event.eventName}" sẽ bắt đầu trong 60 phút nữa`,
                },
                {
                  eventId: event.id.toString(),
                  projectId: projectId.toString(),
                  projectName: projectName,
                  type: "event_reminder",
                }
              );
              this.logger.log(`Push notification sent to ${username}`);
            } catch (error) {
              this.logger.error(
                `Failed to send push notification to ${username}:`,
                error
              );
            }
          }
        }
      }

      this.logger.log("Event reminder job completed successfully");
    } catch (error) {
      this.logger.error("Error in event reminder job:", error);
    }
  }
}
