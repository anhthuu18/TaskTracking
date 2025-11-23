import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, WorkspaceType } from '@prisma/client';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<MemberRole[]>('workspaceRoles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspaceId = parseInt(request.params.id || request.params.workspaceId);

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID is required');
    }

    // Check workspace access and user role
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        dateDeleted: null,
      },
      include: {
        workspaceMembers: {
          where: {
            userId: user.id,
            dateDeleted: null,
          },
        },
      },
    });

    if (!workspace) {
      throw new ForbiddenException('Workspace not found or access denied');
    }

    let userRole: MemberRole;

    // Determine user role
    if (workspace.userId === user.id) {
      userRole = MemberRole.OWNER;
    } else if (workspace.workspaceType === WorkspaceType.GROUP) {
      const member = workspace.workspaceMembers[0];
      if (!member) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
      userRole = member.role;
    } else {
      // Personal workspace - only owner can access
      throw new ForbiddenException('Access denied to personal workspace');
    }

    // Check if user role is sufficient
    const hasPermission = requiredRoles.includes(userRole);
    if (!hasPermission) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(' or ')}, your role: ${userRole}`);
    }

    return true;
  }
}

