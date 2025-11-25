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
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeTrackingSessionDto, UpdateTimeTrackingSessionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('time-tracking')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  /**
   * Create a new time tracking session
   * POST /time-tracking/sessions
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(@Body() createSessionDto: CreateTimeTrackingSessionDto, @Request() req) {
    return this.timeTrackingService.createSession(createSessionDto, req.user.userId);
  }

  /**
   * Update a time tracking session
   * PUT /time-tracking/sessions/:sessionId
   */
  @Put('sessions/:sessionId')
  async updateSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() updateSessionDto: UpdateTimeTrackingSessionDto,
    @Request() req
  ) {
    return this.timeTrackingService.updateSession(sessionId, updateSessionDto, req.user.userId);
  }

  /**
   * Mark a session as completed
   * POST /time-tracking/sessions/:sessionId/complete
   */
  @Post('sessions/:sessionId/complete')
  @HttpCode(HttpStatus.OK)
  async completeSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Request() req
  ) {
    return this.timeTrackingService.completeSession(sessionId, req.user.userId);
  }

  /**
   * Get all sessions for a task
   * GET /time-tracking/sessions/task/:taskId
   */
  @Get('sessions/task/:taskId')
  async getSessionsByTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req
  ) {
    return this.timeTrackingService.getSessionsByTask(taskId, req.user.userId);
  }

  /**
   * Get sessions for a task today
   * GET /time-tracking/sessions/task/:taskId/today
   */
  @Get('sessions/task/:taskId/today')
  async getSessionsByTaskToday(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req
  ) {
    return this.timeTrackingService.getSessionsByTaskToday(taskId, req.user.userId);
  }

  /**
   * Delete a session
   * DELETE /time-tracking/sessions/:sessionId
   */
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async deleteSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Request() req
  ) {
    return this.timeTrackingService.deleteSession(sessionId, req.user.userId);
  }

  /**
   * Get Pomodoro statistics for a task
   * GET /time-tracking/stats/:taskId
   */
  @Get('stats/:taskId')
  async getTaskStatistics(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Request() req
  ) {
    return this.timeTrackingService.getTaskStatistics(taskId, req.user.userId);
  }

  /**
   * Get tracking history for a task
   * GET /time-tracking/history/:taskId?days=7
   */
  @Get('history/:taskId')
  async getTrackingHistory(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('days') days?: string,
    @Request() req?: any
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.timeTrackingService.getTrackingHistory(taskId, req.user.userId, daysNum);
  }
}

