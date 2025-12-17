import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { EmailService } from "../../services/email.service";
import { FirebaseService } from "../../services/firebase.service";

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private firebaseService: FirebaseService
  ) {}

  async createEvent(createEventDto: CreateEventDto, creatorId: number) {
    // Verify user is member of the project
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: createEventDto.projectId,
        userId: creatorId,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException("You are not a member of this project");
    }

    // Create event
    const event = await this.prisma.event.create({
      data: {
        eventName: createEventDto.eventName,
        description: createEventDto.description,
        projectId: createEventDto.projectId,
        creatorId: creatorId,
        startTime: new Date(createEventDto.startTime),
        endTime: new Date(createEventDto.endTime),
      },
      include: {
        project: {
          select: {
            projectName: true,
            workspace: {
              select: {
                workspaceName: true,
              },
            },
          },
        },
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    // Send notifications to all project members (except creator)
    await this.sendEventCreationNotifications(event);

    return event;
  }

  private async sendEventCreationNotifications(event: any) {
    // Get all project members except creator
    const projectMembers = await this.prisma.projectMember.findMany({
      where: {
        projectId: event.projectId,
        userId: {
          not: event.creatorId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fcmToken: true,
          },
        },
      },
    });

    // Get user settings for notification preferences
    const memberIds = projectMembers.map((pm) => pm.userId);
    const userSettings = await this.prisma.userSettings.findMany({
      where: {
        userId: {
          in: memberIds,
        },
      },
    });

    const settingsMap = new Map(userSettings.map((s) => [s.userId, s]));

    const projectName = event.project.projectName;
    const creatorName = event.creator.username;
    const eventName = event.eventName;
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    // Format dates
    const startTimeStr = startTime.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTimeStr = endTime.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    for (const member of projectMembers) {
      const settings = settingsMap.get(member.userId);
      const notifyByEmail = settings?.notifyByEmail ?? true;
      const notifyByPush = settings?.notifyByPush ?? true;

      const email = member.user.email;
      const username = member.user.username;
      const fcmToken = member.user.fcmToken;

      // Create in-app notification first
      try {
        await this.prisma.projectNotification.create({
          data: {
            projectId: event.projectId,
            receiverUserId: member.userId,
            type: "EVENT_CREATED",
            title: `Event mới: ${eventName}`,
            message: `${creatorName} vừa tạo event "${eventName}" trong project ${projectName}. Thời gian: ${startTimeStr} - ${endTimeStr}`,
          },
        });
      } catch (error) {
        console.error(
          `Failed to create in-app notification for user ${username}:`,
          error
        );
      }

      // Send email notification
      if (notifyByEmail && email) {
        try {
          console.log(`[Event] Sending email to ${email} for event creation`);
          await this.emailService.sendEventCreationNotification(
            email,
            eventName,
            projectName,
            creatorName,
            startTime,
            endTime,
            event.description
          );
          console.log(`[Event] Email sent successfully to ${email}`);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
        }
      }

      // Send push notification
      if (notifyByPush && fcmToken) {
        try {
          await this.firebaseService.sendPushNotification(
            fcmToken,
            {
              title: `📅 Event mới: ${eventName}`,
              body: `${creatorName} vừa tạo event trong project ${projectName}`,
            },
            {
              eventId: event.id.toString(),
              projectId: event.projectId.toString(),
              projectName: projectName,
              type: "event_created",
            }
          );
        } catch (error) {
          console.error(
            `Failed to send push notification to ${username}:`,
            error
          );
        }
      }
    }
  }

  async getEventById(eventId: number, userId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        project: {
          select: {
            projectName: true,
            workspace: {
              select: {
                workspaceName: true,
              },
            },
          },
        },
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    // Verify user is member of the project
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: event.projectId,
        userId: userId,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException("You do not have access to this event");
    }

    return event;
  }

  async getEventsByProject(projectId: number, userId: number) {
    // Verify user is member of the project
    const projectMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
      },
    });

    if (!projectMember) {
      throw new ForbiddenException("You are not a member of this project");
    }

    const events = await this.prisma.event.findMany({
      where: {
        projectId: projectId,
        dateDeleted: null,
      },
      include: {
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return events;
  }

  async getEventsByWorkspace(workspaceId: number, userId: number) {
    // Verify user has access to workspace
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { userId: userId }, // Owner
          {
            workspaceMembers: {
              some: {
                userId: userId,
                dateDeleted: null,
              },
            },
          },
        ],
        dateDeleted: null,
      },
    });

    if (!workspace) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    // Get all projects in the workspace that user is a member of
    const projectMembers = await this.prisma.projectMember.findMany({
      where: {
        userId: userId,
        project: {
          workspaceId: workspaceId,
          dateDeleted: null,
        },
      },
      select: {
        projectId: true,
      },
    });

    const projectIds = projectMembers.map((pm) => pm.projectId);

    if (projectIds.length === 0) {
      return [];
    }

    // Get all events from these projects
    const events = await this.prisma.event.findMany({
      where: {
        projectId: { in: projectIds },
        dateDeleted: null,
      },
      include: {
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
        project: {
          select: {
            projectName: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return events;
  }

  async updateEvent(
    eventId: number,
    updateEventDto: UpdateEventDto,
    userId: number
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    // Only creator can update event
    if (event.creatorId !== userId) {
      throw new ForbiddenException("Only the creator can update this event");
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(updateEventDto.eventName && {
          eventName: updateEventDto.eventName,
        }),
        ...(updateEventDto.description !== undefined && {
          description: updateEventDto.description,
        }),
        ...(updateEventDto.startTime && {
          startTime: new Date(updateEventDto.startTime),
        }),
        ...(updateEventDto.endTime && {
          endTime: new Date(updateEventDto.endTime),
        }),
      },
      include: {
        project: {
          select: {
            projectName: true,
          },
        },
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    return updatedEvent;
  }

  async deleteEvent(eventId: number, userId: number) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    // Only creator can delete event
    if (event.creatorId !== userId) {
      throw new ForbiddenException("Only the creator can delete this event");
    }

    // Soft delete
    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        dateDeleted: new Date(),
      },
    });

    return { message: "Event deleted successfully" };
  }
}
