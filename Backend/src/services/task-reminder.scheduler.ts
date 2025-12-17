import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class TaskReminderScheduler {
  private readonly logger = new Logger(TaskReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService
  ) {}

  /**
   * Chạy lúc 5h chiều mỗi ngày (timezone: Asia/Ho_Chi_Minh)
   * Tìm tasks có due date = ngày mai và gửi thông báo
   */
  @Cron("20 12 * * *", {
    timeZone: "Asia/Ho_Chi_Minh",
  })
  async sendTaskReminders() {
    this.logger.log("Starting task reminder job...");

    try {
      // Lấy ngày mai (midnight)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Ngày sau ngày mai (để query tasks due vào ngày mai)
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      this.logger.log(
        `Finding tasks due on ${tomorrow.toLocaleDateString("vi-VN")}`
      );

      // Tìm tasks có due date vào ngày mai và có assignee
      const tasks = await this.prisma.task.findMany({
        where: {
          endTime: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
          assignedTo: {
            not: null,
          },
        },
        include: {
          assignee: {
            include: {
              userSettings: true,
            },
          },
          project: {
            select: {
              projectName: true,
              id: true,
            },
          },
        },
      });

      this.logger.log(`Found ${tasks.length} tasks due tomorrow`);

      // Gửi notifications cho từng task
      for (const task of tasks) {
        if (!task.assignee) continue;

        const { email, username, fcmToken, userSettings } = task.assignee;
        const projectName = task.project?.projectName || "Personal Task";
        const projectId = task.project?.id;

        // Check user notification preferences
        const notifyByEmail = userSettings?.notifyByEmail ?? true;
        const notifyByPush = userSettings?.notifyByPush ?? true;

        // CHECK DUPLICATE FIRST to prevent duplicate emails and notifications
        // Check if we already sent a reminder for THIS SPECIFIC task TODAY
        let alreadyNotified = false;
        if (projectId) {
          try {
            // Get start and end of today to check if we already sent today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const existingNotification =
              await this.prisma.projectNotification.findFirst({
                where: {
                  taskId: task.id,
                  receiverUserId: task.assignee.id,
                  type: "TASK_REMINDER",
                  // Check if notification was created TODAY
                  createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                  },
                },
              });

            if (existingNotification) {
              this.logger.log(
                `Reminder already sent today for task "${task.taskName}" (Notification ID: ${existingNotification.id}), skipping ALL notifications (email, push, in-app)`
              );
              alreadyNotified = true;
            }
          } catch (error) {
            this.logger.error(`Failed to check existing notification:`, error);
          }
        } else {
          // If no projectId, we can't create in-app notification anyway, so skip this task
          this.logger.log(
            `Task "${task.taskName}" has no projectId, skipping notifications`
          );
          continue;
        }

        // Skip if already notified today
        if (alreadyNotified) {
          continue;
        }

        // CREATE IN-APP NOTIFICATION FIRST as a "lock" to prevent race condition
        // This prevents duplicate notifications if scheduler runs multiple times concurrently
        // We create in-app notification first, then send email/push
        // If in-app creation fails (duplicate), we skip everything to avoid duplicates
        let notificationCreated = false;
        if (projectId) {
          try {
            await this.prisma.projectNotification.create({
              data: {
                projectId,
                receiverUserId: task.assignee.id,
                taskId: task.id,
                type: "TASK_REMINDER",
                title: "Task sắp đến hạn",
                message: `Task "${
                  task.taskName
                }" sẽ hết hạn vào ngày ${task.endTime.toLocaleDateString(
                  "vi-VN"
                )}`,
                isRead: false,
              },
            });
            notificationCreated = true;
            this.logger.log(
              `In-app notification created for task "${task.taskName}"`
            );
          } catch (error) {
            // If creation fails (likely due to unique constraint = duplicate), skip this task entirely
            this.logger.warn(
              `Duplicate notification detected for task "${task.taskName}", skipping email/push to prevent duplicates`
            );
            continue;
          }
        } else {
          // No projectId = can't track duplicates properly, skip
          this.logger.log(
            `Task "${task.taskName}" has no projectId, skipping to prevent untracked duplicates`
          );
          continue;
        }

        // At this point, in-app notification was created successfully
        // Now send email and push notifications based on user preferences

        // Gửi email notification
        if (notifyByEmail && email) {
          try {
            await this.emailService.sendTaskReminder(
              email,
              task.taskName,
              projectName,
              task.endTime
            );
            this.logger.log(
              `Email sent to ${email} for task "${task.taskName}"`
            );
          } catch (error) {
            this.logger.error(`Failed to send email to ${email}:`, error);
          }
        }

        // Gửi push notification
        if (notifyByPush && fcmToken) {
          try {
            await this.firebaseService.sendPushNotification(
              fcmToken,
              {
                title: "⏰ Task sắp đến hạn",
                body: `"${task.taskName}" sẽ hết hạn vào ngày mai`,
              },
              {
                taskId: task.id.toString(),
                taskName: task.taskName,
                projectId: projectId?.toString() || "",
                projectName,
                type: "task_reminder",
              }
            );
            this.logger.log(
              `Push notification sent to ${username} for task "${task.taskName}"`
            );
          } catch (error) {
            this.logger.error(
              `Failed to send push notification to ${username}:`,
              error
            );
          }
        }
      }

      this.logger.log("Task reminder job completed successfully");
    } catch (error) {
      this.logger.error("Error in task reminder job:", error);
    }
  }

  /**
   * Manual trigger for testing (call this endpoint to test without waiting for cron)
   */
  async sendTaskRemindersNow() {
    this.logger.log("Manual trigger: Starting task reminder job now...");
    await this.sendTaskReminders();
  }

  /**
   * Cleanup old notifications (older than 10 days)
   * Chạy lúc 2h sáng mỗi ngày
   */
  @Cron("0 2 * * *", {
    timeZone: "Asia/Ho_Chi_Minh",
  })
  async cleanupOldNotifications() {
    this.logger.log("Starting notification cleanup job...");

    try {
      // Calculate date 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const result = await this.prisma.projectNotification.deleteMany({
        where: {
          createdAt: {
            lt: tenDaysAgo,
          },
        },
      });

      this.logger.log(
        `Notification cleanup completed. Deleted ${result.count} old notifications.`
      );
    } catch (error) {
      this.logger.error("Error in notification cleanup job:", error);
    }
  }
}
