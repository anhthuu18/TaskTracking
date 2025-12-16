import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateTimeTrackingSessionDto,
  UpdateTimeTrackingSessionDto,
  SessionTypeDto,
} from "./dto";
import { SessionType } from "@prisma/client";

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new time tracking session
   */
  async createSession(
    createSessionDto: CreateTimeTrackingSessionDto,
    userId: number
  ) {
    const { taskId, sessionType, duration, startTime, endTime, isCompleted } =
      createSessionDto;

    // Verify task exists and user has access
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or access denied");
    }

    // Map DTO enum to Prisma enum
    const sessionTypeMap: Record<SessionTypeDto, SessionType> = {
      [SessionTypeDto.FOCUS]: SessionType.FOCUS,
      [SessionTypeDto.SHORT_BREAK]: SessionType.SHORT_BREAK,
      [SessionTypeDto.LONG_BREAK]: SessionType.LONG_BREAK,
    };

    const session = await this.prisma.timeTrackingSession.create({
      data: {
        taskId,
        userId,
        sessionType: sessionTypeMap[sessionType as SessionTypeDto],
        duration,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        isCompleted: isCompleted || false,
      },
    });

    return session;
  }

  /**
   * Update a time tracking session
   */
  async updateSession(
    sessionId: number,
    updateSessionDto: UpdateTimeTrackingSessionDto,
    userId: number
  ) {
    // Verify session exists and user owns it
    const session = await this.prisma.timeTrackingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException("Session not found or access denied");
    }

    const sessionTypeMap: Record<SessionTypeDto, SessionType> = {
      [SessionTypeDto.FOCUS]: SessionType.FOCUS,
      [SessionTypeDto.SHORT_BREAK]: SessionType.SHORT_BREAK,
      [SessionTypeDto.LONG_BREAK]: SessionType.LONG_BREAK,
    };

    const updateData: any = {};

    if (updateSessionDto.sessionType) {
      updateData.sessionType = sessionTypeMap[updateSessionDto.sessionType];
    }
    if (updateSessionDto.duration !== undefined) {
      updateData.duration = updateSessionDto.duration;
    }
    if (updateSessionDto.startTime) {
      updateData.startTime = new Date(updateSessionDto.startTime);
    }
    if (updateSessionDto.endTime) {
      updateData.endTime = new Date(updateSessionDto.endTime);
    }
    if (updateSessionDto.isCompleted !== undefined) {
      updateData.isCompleted = updateSessionDto.isCompleted;
      if (updateSessionDto.isCompleted) {
        updateData.completedAt = new Date();
      }
    }

    const updatedSession = await this.prisma.timeTrackingSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    // Update Pomodoro statistics if session is completed
    if (updateSessionDto.isCompleted) {
      await this.updatePomodoroStats(session.taskId, userId, updatedSession);
    }

    return updatedSession;
  }

  /**
   * Mark session as completed
   */
  async completeSession(sessionId: number, userId: number) {
    const session = await this.prisma.timeTrackingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException("Session not found or access denied");
    }

    const completedSession = await this.prisma.timeTrackingSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        endTime: new Date(),
      },
    });

    // Update Pomodoro statistics
    await this.updatePomodoroStats(session.taskId, userId, completedSession);

    return completedSession;
  }

  /**
   * Get all sessions for a task
   */
  async getSessionsByTask(taskId: number, userId: number) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or access denied");
    }

    const sessions = await this.prisma.timeTrackingSession.findMany({
      where: {
        taskId,
        userId,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return sessions;
  }

  /**
   * Get sessions for a task today
   */
  async getSessionsByTaskToday(taskId: number, userId: number) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or access denied");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.prisma.timeTrackingSession.findMany({
      where: {
        taskId,
        userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return sessions;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: number, userId: number) {
    const session = await this.prisma.timeTrackingSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException("Session not found or access denied");
    }

    await this.prisma.timeTrackingSession.delete({
      where: { id: sessionId },
    });

    return { message: "Session deleted successfully" };
  }

  /**
   * Get Pomodoro statistics for a task
   */
  async getTaskStatistics(taskId: number, userId: number) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or access denied");
    }

    let stats = await this.prisma.pomodoroStatistics.findFirst({
      where: {
        taskId,
        userId,
      },
    });

    // If no stats exist, create default ones
    if (!stats) {
      stats = await this.prisma.pomodoroStatistics.create({
        data: {
          taskId,
          userId,
          totalFocusTime: 0,
          totalBreakTime: 0,
          completedSessions: 0,
          totalSessions: 0,
        },
      });
    }

    return stats;
  }

  /**
   * Get tracking history for a task (grouped by date)
   */
  async getTrackingHistory(taskId: number, userId: number, days: number = 7) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found or access denied");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sessions = await this.prisma.timeTrackingSession.findMany({
      where: {
        taskId,
        userId,
        startTime: {
          gte: startDate,
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    // Group by date
    const historyMap = new Map<string, any>();

    sessions.forEach((session) => {
      const date = new Date(session.startTime);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!historyMap.has(dateKey)) {
        historyMap.set(dateKey, {
          date: dateKey,
          sessions: 0,
          totalMinutes: 0,
          focusMinutes: 0,
          breakMinutes: 0,
        });
      }

      const dayData = historyMap.get(dateKey);
      dayData.sessions += 1;
      dayData.totalMinutes += session.duration;

      if (session.sessionType === SessionType.FOCUS) {
        dayData.focusMinutes += session.duration;
      } else {
        dayData.breakMinutes += session.duration;
      }
    });

    return Array.from(historyMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Private method to update Pomodoro statistics
   * Uses actual elapsed time (endTime - startTime) instead of configured duration
   */
  private async updatePomodoroStats(
    taskId: number,
    userId: number,
    session: any
  ) {
    // Skip if session doesn't have valid time data
    if (!session.startTime) {
      return;
    }

    let stats = await this.prisma.pomodoroStatistics.findFirst({
      where: {
        taskId,
        userId,
      },
    });

    if (!stats) {
      stats = await this.prisma.pomodoroStatistics.create({
        data: {
          taskId,
          userId,
          totalFocusTime: 0,
          totalBreakTime: 0,
          completedSessions: 0,
          totalSessions: 0,
        },
      });
    }

    // Calculate ACTUAL elapsed time in minutes from timestamps
    let actualDurationMinutes = 0;
    if (session.endTime && session.startTime) {
      const startMs = new Date(session.startTime).getTime();
      const endMs = new Date(session.endTime).getTime();
      const elapsedMs = Math.max(0, endMs - startMs);
      actualDurationMinutes = elapsedMs / (1000 * 60); // Convert to minutes
    } else if (session.duration) {
      // Fallback to configured duration if endTime not set
      actualDurationMinutes = session.duration;
    }

    // Check if this session was already counted (prevent duplicate additions)
    // We can check if completedSessions was already incremented for this session
    // by checking if session has been updated before (has completedAt)
    const isFirstTimeComplete =
      !session.completedAt ||
      new Date(session.completedAt).getTime() - new Date().getTime() < 5000; // Within 5 seconds means just completed

    const updateData: any = {
      lastTrackedDate: new Date(),
    };

    // Only increment counters if this is the first time completing
    if (isFirstTimeComplete) {
      updateData.totalSessions = stats.totalSessions + 1;
      updateData.completedSessions = stats.completedSessions + 1;
    }

    // Add actual elapsed time to totals
    if (session.sessionType === SessionType.FOCUS) {
      updateData.totalFocusTime = stats.totalFocusTime + actualDurationMinutes;
    } else {
      updateData.totalBreakTime = stats.totalBreakTime + actualDurationMinutes;
    }

    await this.prisma.pomodoroStatistics.update({
      where: { id: stats.id },
      data: updateData,
    });
  }
}
