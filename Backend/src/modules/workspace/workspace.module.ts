import { Module } from '@nestjs/common';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceService } from './services/workspace.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailService } from '../../services/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, EmailService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
