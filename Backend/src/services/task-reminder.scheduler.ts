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
   * Chạy lúc 9h sáng mỗi ngày (timezone: Asia/Ho_Chi_Minh)
   * Tìm tasks có due date = ngày mai và gửi thông báo
   */
  @Cron("0 9 * * *", {
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

        // Lưu in-app notification
        if (projectId) {
          try {
            await this.prisma.projectNotification.create({
              data: {
                projectId,
                receiverUserId: task.assignee.id,
                taskId: task.id, // Include taskId for navigation
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
            this.logger.log(
              `In-app notification created for task "${task.taskName}"`
            );
          } catch (error) {
            this.logger.error(`Failed to create in-app notification:`, error);
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
}
