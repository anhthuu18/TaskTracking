import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());
    
    if (!requiredPermission) {
      return true; // No specific permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = parseInt(request.params.id);

    if (!user || !projectId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user has the required permission for this project
    const hasPermission = await this.checkProjectPermission(
      user.userId,
      projectId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions for this project');
    }

    return true;
  }

  private async checkProjectPermission(
    userId: number,
    projectId: number,
    permissionName: string,
  ): Promise<boolean> {
    // Check if user is project creator (always has all permissions)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.createdBy === userId) {
      return true;
    }

    // Check user's role permissions in the project
    const userMembership = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
      include: {
        projectRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!userMembership) {
      return false;
    }

    // Check if user's role has the required permission
    const hasPermission = userMembership.projectRole.permissions.some(
      (rolePermission) => rolePermission.permission.permissionName === permissionName,
    );

    return hasPermission;
  }
}
