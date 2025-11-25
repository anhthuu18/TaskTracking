import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TimeTrackingController } from './time-tracking.controller';
import { TimeTrackingService } from './time-tracking.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController, TimeTrackingController],
  providers: [TasksService, TimeTrackingService],
  exports: [TasksService, TimeTrackingService],
})
export class TasksModule {}


