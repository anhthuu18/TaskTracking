import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, CreateTaskStatusDto, CreateTaskPriorityDto } from './dto';
import { WorkspaceType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new task
   * Business logic:
   * - Task must belong to a project
   * - Project must belong to a workspace
   * - If workspace is PERSONAL, auto-assign to current user
   * - If workspace is GROUP but has no members, assignee field shows only current user
   * - Default status is 'todo'
   * - Default priority is 3
   */
  async createTask(createTaskDto: CreateTaskDto, userId: number) {
    const { projectId, assignedTo, priority, status, ...taskData } = createTaskDto;

    // Verify project exists and user has access
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: null,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        workspace: {
          include: {
            workspaceMembers: {
              where: { dateDeleted: null }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Determine assignee based on workspace type
    let finalAssignedTo = assignedTo;

    if (project.workspace.workspaceType === WorkspaceType.PERSONAL) {
      // Personal workspace: auto-assign to current user
      finalAssignedTo = userId;
    } else if (project.workspace.workspaceType === WorkspaceType.GROUP) {
      // Group workspace
      const workspaceMembers = project.workspace.workspaceMembers;
      
      if (workspaceMembers.length === 0) {
        // No members: auto-assign to current user (owner)
        finalAssignedTo = userId;
      } else {
        // Has members: validate assignedTo if provided
        if (assignedTo) {
          const isValidMember = workspaceMembers.some(m => m.userId === assignedTo);
          if (!isValidMember && assignedTo !== project.workspace.userId) {
            throw new BadRequestException('Assigned user must be a member of the workspace');
          }
        }
      }
    }

    // Validate and normalize status if provided
    let finalStatus = 'To Do'; // Default status
    if (status) {
      const validStatuses = ['To Do', 'In Progress', 'Review', 'Done', 'todo', 'in progress', 'review', 'done'];
      const statusLower = status.toLowerCase();
      
      if (validStatuses.map(s => s.toLowerCase()).includes(statusLower)) {
        // Normalize to title case
        if (statusLower === 'to do' || statusLower === 'todo') {
          finalStatus = 'To Do';
        } else if (statusLower === 'in progress') {
          finalStatus = 'In Progress';
        } else if (statusLower === 'review') {
          finalStatus = 'Review';
        } else if (statusLower === 'done') {
          finalStatus = 'Done';
        }
      } else {
        // Invalid status provided, use default
        finalStatus = 'To Do';
      }
    }

    // Create task with default status 'To Do' and priority 3
    const task = await this.prisma.task.create({
      data: {
        ...taskData,
        projectId,
        workspaceId: project.workspaceId,
        assignedTo: finalAssignedTo,
        priority: priority || 3,
        status: finalStatus,
        createdBy: userId
      },
      include: {
        project: {
          select: {
            id: true,
            projectName: true
          }
        },
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    return task;
  }

  /**
   * Get all tasks for a user
   */
  async getUserTasks(userId: number) {
    return this.prisma.task.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { assignedTo: userId },
          {
            project: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      },
      include: {
        project: {
          select: {
            id: true,
            projectName: true
          }
        },
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { dateCreated: 'desc' }
    });
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: number, userId: number) {
    // Verify user has access to project
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: null,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        project: {
          select: {
            id: true,
            projectName: true
          }
        },
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { dateCreated: 'desc' }
    });
  }

  /**
   * Get tasks by workspace
   */
  async getTasksByWorkspace(workspaceId: number, userId: number) {
    // Verify user has access to workspace
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
        OR: [
          { userId },
          {
            workspaceMembers: {
              some: {
                userId,
                dateDeleted: null
              }
            }
          }
        ]
      }
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    return this.prisma.task.findMany({
      where: { workspaceId },
      include: {
        project: {
          select: {
            id: true,
            projectName: true
          }
        },
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { dateCreated: 'desc' }
    });
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: number, userId: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdBy: userId },
          { assignedTo: userId },
          {
            project: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      },
      include: {
        project: {
          select: {
            id: true,
            projectName: true
          }
        },
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        tracking: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          },
          orderBy: { dateCreated: 'desc' }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    return task;
  }

  /**
   * Update task
   */
  async updateTask(taskId: number, updateTaskDto: UpdateTaskDto, userId: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdBy: userId },
          { assignedTo: userId },
          {
            project: {
              members: {
                some: { userId }
              }
            }
          }
        ]
      },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                workspaceMembers: {
                  where: { dateDeleted: null }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    // Validate assignedTo if provided
    if (updateTaskDto.assignedTo !== undefined) {
      const workspaceMembers = task.project.workspace.workspaceMembers;
      const isValidMember = workspaceMembers.some((m: any) => m.userId === updateTaskDto.assignedTo) || 
                           updateTaskDto.assignedTo === task.project.workspace.userId;
      
      if (!isValidMember && updateTaskDto.assignedTo !== null) {
        throw new BadRequestException('Assigned user must be a member of the workspace');
      }
    }

    // Validate status if provided - use fixed values: To Do, In Progress, Review, Done
    if (updateTaskDto.status) {
      const validStatuses = ['To Do', 'In Progress', 'Review', 'Done', 'todo', 'in progress', 'review', 'done'];
      const statusLower = updateTaskDto.status.toLowerCase();
      
      if (!validStatuses.map(s => s.toLowerCase()).includes(statusLower)) {
        throw new BadRequestException('Invalid status. Valid values: To Do, In Progress, Review, Done');
      }
      
      // Normalize status to title case
      if (statusLower === 'to do' || statusLower === 'todo') {
        updateTaskDto.status = 'To Do';
      } else if (statusLower === 'in progress') {
        updateTaskDto.status = 'In Progress';
      } else if (statusLower === 'review') {
        updateTaskDto.status = 'Review';
      } else if (statusLower === 'done') {
        updateTaskDto.status = 'Done';
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: updateTaskDto,
      include: {
        project: {
          select: {
            id: true,
            projectName: true
          }
        },
        workspace: {
          select: {
            id: true,
            workspaceName: true,
            workspaceType: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: number, userId: number) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdBy: userId },
          {
            project: {
              OR: [
                { createdBy: userId },
                {
                  members: {
                    some: {
                      userId,
                      projectRole: {
                        roleName: 'Admin'
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    await this.prisma.task.delete({
      where: { id: taskId }
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Get available assignees for a project
   * Returns workspace members that can be assigned to tasks
   */
  async getAvailableAssignees(projectId: number, userId: number) {
    // Verify user has access to project
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: null,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        workspace: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            workspaceMembers: {
              where: { dateDeleted: null },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    const workspace = project.workspace;

    if (workspace.workspaceType === WorkspaceType.PERSONAL) {
      // Personal workspace: only owner
      return [workspace.user];
    } else {
      // Group workspace: owner + members
      const members = workspace.workspaceMembers.map(m => m.user);
      
      // Add owner if not already in members
      const ownerInMembers = members.some(m => m.id === workspace.userId);
      if (!ownerInMembers) {
        members.unshift(workspace.user);
      }

      // If no members (only owner), return only owner
      if (workspace.workspaceMembers.length === 0) {
        return [workspace.user];
      }

      return members;
    }
  }

  /**
   * Create default task statuses for a project
   */
  async createDefaultTaskStatuses(projectId: number, userId: number) {
    // Verify user is project admin
    await this.checkProjectAdminPermission(projectId, userId);

    const defaultStatuses = [
      { statusName: 'To Do', description: 'Task is pending', sortOrder: 1 },
      { statusName: 'In Progress', description: 'Task is being worked on', sortOrder: 2 },
      { statusName: 'Review', description: 'Task is under review', sortOrder: 3 },
      { statusName: 'Done', description: 'Task is completed', sortOrder: 4 }
    ];

    const createdStatuses = await Promise.all(
      defaultStatuses.map(status =>
        this.prisma.projectTaskStatus.create({
          data: {
            projectId,
            ...status
          }
        })
      )
    );

    return createdStatuses;
  }

  /**
   * Create custom task status for a project
   */
  async createTaskStatus(projectId: number, createStatusDto: CreateTaskStatusDto, userId: number) {
    // Verify user is project admin
    await this.checkProjectAdminPermission(projectId, userId);

    const status = await this.prisma.projectTaskStatus.create({
      data: {
        projectId,
        ...createStatusDto
      }
    });

    return status;
  }

  /**
   * Get task statuses for a project
   */
  async getTaskStatuses(projectId: number, userId: number) {
    // Verify user has access to project
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.projectTaskStatus.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(statusId: number, updateData: Partial<CreateTaskStatusDto>, userId: number) {
    const status = await this.prisma.projectTaskStatus.findUnique({
      where: { id: statusId }
    });

    if (!status) {
      throw new NotFoundException('Task status not found');
    }

    // Verify user is project admin
    await this.checkProjectAdminPermission(status.projectId, userId);

    return this.prisma.projectTaskStatus.update({
      where: { id: statusId },
      data: updateData
    });
  }

  /**
   * Delete task status
   */
  async deleteTaskStatus(statusId: number, userId: number) {
    const status = await this.prisma.projectTaskStatus.findUnique({
      where: { id: statusId }
    });

    if (!status) {
      throw new NotFoundException('Task status not found');
    }

    // Verify user is project admin
    await this.checkProjectAdminPermission(status.projectId, userId);

    // Check if any tasks are using this status
    const tasksWithStatus = await this.prisma.task.count({
      where: {
        projectId: status.projectId,
        status: status.statusName
      }
    });

    if (tasksWithStatus > 0) {
      throw new BadRequestException('Cannot delete status that is being used by tasks');
    }

    await this.prisma.projectTaskStatus.delete({
      where: { id: statusId }
    });

    return { message: 'Task status deleted successfully' };
  }

  /**
   * Create default task priorities for a project
   */
  async createDefaultTaskPriorities(projectId: number, userId: number) {
    // Verify user is project admin
    await this.checkProjectAdminPermission(projectId, userId);

    const defaultPriorities = [
      { priorityName: 'Lowest', priorityLevel: 1 },
      { priorityName: 'Low', priorityLevel: 2 },
      { priorityName: 'Medium', priorityLevel: 3 },
      { priorityName: 'High', priorityLevel: 4 },
      { priorityName: 'Highest', priorityLevel: 5 }
    ];

    const createdPriorities = await Promise.all(
      defaultPriorities.map(priority =>
        this.prisma.projectTaskPriority.create({
          data: {
            projectId,
            ...priority
          }
        })
      )
    );

    return createdPriorities;
  }

  /**
   * Create custom task priority for a project
   */
  async createTaskPriority(projectId: number, createPriorityDto: CreateTaskPriorityDto, userId: number) {
    // Verify user is project admin
    await this.checkProjectAdminPermission(projectId, userId);

    const priority = await this.prisma.projectTaskPriority.create({
      data: {
        projectId,
        ...createPriorityDto
      }
    });

    return priority;
  }

  /**
   * Get task priorities for a project
   */
  async getTaskPriorities(projectId: number, userId: number) {
    // Verify user has access to project
    await this.checkProjectAccess(projectId, userId);

    return this.prisma.projectTaskPriority.findMany({
      where: { projectId },
      orderBy: { priorityLevel: 'asc' }
    });
  }

  /**
   * Update task priority
   */
  async updateTaskPriority(priorityId: number, updateData: Partial<CreateTaskPriorityDto>, userId: number) {
    const priority = await this.prisma.projectTaskPriority.findUnique({
      where: { id: priorityId }
    });

    if (!priority) {
      throw new NotFoundException('Task priority not found');
    }

    // Verify user is project admin
    await this.checkProjectAdminPermission(priority.projectId, userId);

    return this.prisma.projectTaskPriority.update({
      where: { id: priorityId },
      data: updateData
    });
  }

  /**
   * Delete task priority
   */
  async deleteTaskPriority(priorityId: number, userId: number) {
    const priority = await this.prisma.projectTaskPriority.findUnique({
      where: { id: priorityId }
    });

    if (!priority) {
      throw new NotFoundException('Task priority not found');
    }

    // Verify user is project admin
    await this.checkProjectAdminPermission(priority.projectId, userId);

    // Check if any tasks are using this priority level
    const tasksWithPriority = await this.prisma.task.count({
      where: {
        projectId: priority.projectId,
        priority: priority.priorityLevel
      }
    });

    if (tasksWithPriority > 0) {
      throw new BadRequestException('Cannot delete priority that is being used by tasks');
    }

    await this.prisma.projectTaskPriority.delete({
      where: { id: priorityId }
    });

    return { message: 'Task priority deleted successfully' };
  }

  /**
   * Check if user has admin permission for a project
   */
  private async checkProjectAdminPermission(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
          include: {
            projectRole: true
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Original creator is always admin
    if (project.createdBy === userId) {
      return true;
    }

    // Check if user is admin member
    const userMembership = project.members.find(member => member.userId === userId);
    if (!userMembership || userMembership.projectRole.roleName !== 'Admin') {
      throw new ForbiddenException('Admin permission required');
    }

    return true;
  }

  /**
   * Check if user has access to a project
   */
  private async checkProjectAccess(projectId: number, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: null,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return true;
  }
}

