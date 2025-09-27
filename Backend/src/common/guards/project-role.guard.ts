import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('projectRoles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const projectId = parseInt(request.params.id || request.params.projectId);

    if (!projectId) {
      throw new ForbiddenException('Project ID is required');
    }

    // Check project access and user role
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: null,
      },
      include: {
        members: {
          where: {
            userId: user.id,
          },
          include: {
            projectRole: true,
          },
        },
      },
    });

    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }

    // Check if user is project creator (always has admin rights)
    if (project.createdBy === user.id) {
      return true;
    }

    // Check if user is a member with required role
    const member = project.members[0];
    if (!member) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const hasPermission = requiredRoles.includes(member.projectRole.roleName);
    if (!hasPermission) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(' or ')}, your role: ${member.projectRole.roleName}`);
    }

    return true;
  }
}

