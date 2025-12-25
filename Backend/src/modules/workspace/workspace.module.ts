import { Module } from "@nestjs/common";
import { WorkspaceController } from "./controllers/workspace.controller";
import { WorkspaceService } from "./services/workspace.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { EmailService } from "../../services/email.service";
import { FirebaseService } from "../../services/firebase.service";

@Module({
  imports: [PrismaModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, EmailService, FirebaseService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
