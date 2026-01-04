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
   * Event Reminder Job - Runs every 60 minutes (every hour)
   * Sends reminders for events starting in 60 minutes
   */
  @Cron("*/1 * * * *", {
    name: "event-reminder",
    timeZone: "Asia/Ho_Chi_Minh",
  })
  async sendEventReminders() {
    const now = new Date();
    this.logger.log(`\n========================================`);
    this.logger.log(
      `⏰ EVENT REMINDER JOB STARTED at ${now.toLocaleString("vi-VN")}`
    );
    this.logger.log(`========================================\n`);

    try {
      // Time window: 4-6 minutes from now (for testing)
      const reminderStart = new Date(now.getTime() + 4 * 60 * 1000);
      const reminderEnd = new Date(now.getTime() + 6 * 60 * 1000);

      this.logger.log(`🔍 Searching for events starting between:`);
      this.logger.log(
        `   Start: ${reminderStart.toLocaleString(
          "vi-VN"
        )} (${reminderStart.toISOString()})`
      );
      this.logger.log(
        `   End:   ${reminderEnd.toLocaleString(
          "vi-VN"
        )} (${reminderEnd.toISOString()})`
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
            `\n👤 Processing member: ${username} (ID: ${member.userId})`
          );
          this.logger.log(`   Email: ${email}`);
          this.logger.log(
            `   FCM Token: ${fcmToken ? "EXISTS ✓" : "MISSING ✗"}`
          );
          this.logger.log(
            `   Notify by Email: ${notifyByEmail ? "YES ✓" : "NO ✗"}`
          );
          this.logger.log(
            `   Notify by Push: ${notifyByPush ? "YES ✓" : "NO ✗"}`
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
                  body: `"${event.eventName}" sẽ bắt đầu trong 5 phút nữa`,
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
          } else if (!fcmToken) {
            this.logger.warn(
              `Skipping push notification for ${username}: No FCM token`
            );
          } else if (!notifyByPush) {
            this.logger.log(
              `Skipping push notification for ${username}: User disabled push notifications`
            );
          }
        }
      }

      this.logger.log("Event reminder job completed successfully");
    } catch (error) {
      this.logger.error("Error in event reminder job:", error);
    }
  }
}
