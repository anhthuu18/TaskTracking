import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./modules/users/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { EventModule } from "./modules/events/event.module";
import { EmailService } from "./services/email.service";
import { FirebaseService } from "./services/firebase.service";
import { TaskReminderScheduler } from "./services/task-reminder.scheduler";
import { EventReminderScheduler } from "./services/event-reminder.scheduler";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    WorkspaceModule,
    ProjectsModule,
    NotificationModule,
    TasksModule,
    EventModule,
  ],
  providers: [
    EmailService,
    FirebaseService,
    TaskReminderScheduler,
    EventReminderScheduler,
  ],
})
export class AppModule {}
