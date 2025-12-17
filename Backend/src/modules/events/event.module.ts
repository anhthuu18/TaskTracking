import { Module } from "@nestjs/common";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { EmailService } from "../../services/email.service";
import { FirebaseService } from "../../services/firebase.service";

@Module({
  imports: [PrismaModule],
  controllers: [EventController],
  providers: [EventService, EmailService, FirebaseService],
  exports: [EventService],
})
export class EventModule {}
