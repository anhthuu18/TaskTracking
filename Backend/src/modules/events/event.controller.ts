import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from "@nestjs/common";
import { EventService } from "./event.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("events")
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventService.createEvent(createEventDto, req.user.userId);
  }

  @Get(":id")
  async getEventById(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.eventService.getEventById(id, req.user.userId);
  }

  @Get("project/:projectId")
  async getEventsByProject(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Request() req
  ) {
    return this.eventService.getEventsByProject(projectId, req.user.userId);
  }

  @Get("workspace/:workspaceId")
  async getEventsByWorkspace(
    @Param("workspaceId", ParseIntPipe) workspaceId: number,
    @Request() req
  ) {
    return this.eventService.getEventsByWorkspace(workspaceId, req.user.userId);
  }

  @Put(":id")
  async updateEvent(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req
  ) {
    return this.eventService.updateEvent(id, updateEventDto, req.user.userId);
  }

  @Delete(":id")
  async deleteEvent(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.eventService.deleteEvent(id, req.user.userId);
  }
}
