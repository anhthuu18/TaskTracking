import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { TimeTrackingController } from "./time-tracking.controller";
import { TimeTrackingService } from "./time-tracking.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { TaskReminderScheduler } from "../../services/task-reminder.scheduler";
import { EmailService } from "../../services/email.service";
import { FirebaseService } from "../../services/firebase.service";

@Module({
  imports: [PrismaModule],
  controllers: [TasksController, TimeTrackingController],
  providers: [
    TasksService,
    TimeTrackingService,
    TaskReminderScheduler,
    EmailService,
    FirebaseService,
  ],
  exports: [TasksService, TimeTrackingService],
})
export class TasksModule {}
