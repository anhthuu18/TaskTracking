import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateWorkspaceDto } from '../dtos/create-workspace.dto';
import { WorkspaceResponseDto } from '../dtos/workspace-response.dto';
import { WorkspaceType, MemberRole } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: number): Promise<WorkspaceResponseDto> {
    const { workspaceName, description, workspaceType } = createWorkspaceDto;

    // Create workspace
    const workspace = await this.prisma.workspace.create({
      data: {
        workspaceName,
        description,
        workspaceType,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // If GROUP workspace, automatically add creator as OWNER member
    if (workspaceType === WorkspaceType.GROUP) {
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: userId,
          role: MemberRole.OWNER,
        },
      });
    }

    return {
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      memberCount: workspaceType === WorkspaceType.GROUP ? 1 : undefined,
      userRole: workspaceType === WorkspaceType.GROUP ? MemberRole.OWNER : undefined,
    };
  }

  async findAllByUser(userId: number): Promise<WorkspaceResponseDto[]> {
    // Find workspaces where user is owner
    const ownedWorkspaces = await this.prisma.workspace.findMany({
      where: {
        userId,
        dateDeleted: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
        },
      },
    });

    // Find workspaces where user is member (GROUP only)
    const memberWorkspaces = await this.prisma.workspace.findMany({
      where: {
        workspaceType: WorkspaceType.GROUP,
        dateDeleted: null,
        workspaceMembers: {
          some: {
            userId,
            dateDeleted: null,
          },
        },
        NOT: {
          userId, // Exclude owned workspaces (already included above)
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];

    return allWorkspaces.map((workspace) => {
      const userMember = workspace.workspaceMembers.find(member => member.userId === userId);
      
      return {
        id: workspace.id,
        workspaceName: workspace.workspaceName,
        description: workspace.description,
        userId: workspace.userId,
        workspaceType: workspace.workspaceType,
        dateCreated: workspace.dateCreated,
        dateModified: workspace.dateModified,
        user: workspace.user,
        memberCount: workspace.workspaceType === WorkspaceType.GROUP ? workspace.workspaceMembers.length : undefined,
        userRole: workspace.userId === userId ? MemberRole.OWNER : userMember?.role,
      };
    });
  }

  async findOne(id: number, userId: number): Promise<WorkspaceResponseDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        dateDeleted: null,
        OR: [
          { userId }, // User is owner
          {
            workspaceType: WorkspaceType.GROUP,
            workspaceMembers: {
              some: {
                userId,
                dateDeleted: null,
              },
            },
          }, // User is member of GROUP workspace
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy workspace hoặc bạn không có quyền truy cập');
    }

    const userMember = workspace.workspaceMembers.find(member => member.userId === userId);

    return {
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      memberCount: workspace.workspaceType === WorkspaceType.GROUP ? workspace.workspaceMembers.length : undefined,
      userRole: workspace.userId === userId ? MemberRole.OWNER : userMember?.role,
    };
  }

  async delete(id: number, userId: number): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        dateDeleted: null,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy workspace');
    }

    // Only owner can delete workspace
    if (workspace.userId !== userId) {
      throw new ForbiddenException('Chỉ owner mới có thể xóa workspace');
    }

    // Soft delete workspace
    await this.prisma.workspace.update({
      where: { id },
      data: {
        dateDeleted: new Date(),
      },
    });

    // Soft delete all workspace members
    await this.prisma.workspaceMember.updateMany({
      where: {
        workspaceId: id,
        dateDeleted: null,
      },
      data: {
        dateDeleted: new Date(),
      },
    });

    // TODO: When Project model is implemented, also soft delete all projects in this workspace
    // await this.prisma.project.updateMany({
    //   where: {
    //     workspaceId: id,
    //     dateDeleted: null,
    //   },
    //   data: {
    //     dateDeleted: new Date(),
    //   },
    // });
  }

  async getPersonalWorkspaces(userId: number): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        userId,
        workspaceType: WorkspaceType.PERSONAL,
        dateDeleted: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateCreated: 'desc',
      },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      userRole: MemberRole.OWNER,
    }));
  }

  async getGroupWorkspaces(userId: number): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        workspaceType: WorkspaceType.GROUP,
        dateDeleted: null,
        OR: [
          { userId }, // User is owner
          {
            workspaceMembers: {
              some: {
                userId,
                dateDeleted: null,
              },
            },
          }, // User is member
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: null,
          },
        },
      },
      orderBy: {
        dateCreated: 'desc',
      },
    });

    return workspaces.map((workspace) => {
      const userMember = workspace.workspaceMembers.find(member => member.userId === userId);
      
      return {
        id: workspace.id,
        workspaceName: workspace.workspaceName,
        description: workspace.description,
        userId: workspace.userId,
        workspaceType: workspace.workspaceType,
        dateCreated: workspace.dateCreated,
        dateModified: workspace.dateModified,
        user: workspace.user,
        memberCount: workspace.workspaceMembers.length,
        userRole: workspace.userId === userId ? MemberRole.OWNER : userMember?.role,
      };
    });
  }

  async restore(id: number, userId: number): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        dateDeleted: { not: null }, // Must be soft deleted
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy workspace đã bị xóa');
    }

    // Only owner can restore workspace
    if (workspace.userId !== userId) {
      throw new ForbiddenException('Chỉ owner mới có thể khôi phục workspace');
    }

    // Restore workspace
    await this.prisma.workspace.update({
      where: { id },
      data: {
        dateDeleted: null,
      },
    });

    // Restore all workspace members
    await this.prisma.workspaceMember.updateMany({
      where: {
        workspaceId: id,
        dateDeleted: { not: null },
      },
      data: {
        dateDeleted: null,
      },
    });

    // TODO: When Project model is implemented, also restore all projects in this workspace
    // await this.prisma.project.updateMany({
    //   where: {
    //     workspaceId: id,
    //     dateDeleted: { not: null },
    //   },
    //   data: {
    //     dateDeleted: null,
    //   },
    // });
  }

  async getDeletedWorkspaces(userId: number): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        userId, // Only owner can see deleted workspaces
        dateDeleted: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        workspaceMembers: {
          where: {
            dateDeleted: { not: null },
          },
        },
      },
      orderBy: {
        dateDeleted: 'desc',
      },
    });

    return workspaces.map((workspace) => ({
      id: workspace.id,
      workspaceName: workspace.workspaceName,
      description: workspace.description,
      userId: workspace.userId,
      workspaceType: workspace.workspaceType,
      dateCreated: workspace.dateCreated,
      dateModified: workspace.dateModified,
      user: workspace.user,
      memberCount: workspace.workspaceType === WorkspaceType.GROUP ? workspace.workspaceMembers.length : undefined,
      userRole: MemberRole.OWNER,
    }));
  }
}
