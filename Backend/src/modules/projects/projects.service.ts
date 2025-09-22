import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto, CreateProjectRoleDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Create a new project - creator becomes admin automatically
  async createProject(createProjectDto: CreateProjectDto, userId: number) {
    const { projectName, workspaceId, description } = createProjectDto;

    // Verify user has access to the workspace
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { userId: userId }, // Owner
          {
            workspaceMembers: {
              some: {
                userId: userId,
                dateDeleted: null
              }
            }
          }
        ],
        dateDeleted: null
      }
    });

    if (!workspace) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Create project
    const project = await this.prisma.project.create({
      data: {
        projectName,
        workspaceId,
        description,
        createdBy: userId
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        }
      }
    });

    // Create default admin role for this project
    const adminRole = await this.prisma.projectRole.create({
      data: {
        projectId: project.id,
        roleName: 'Admin',
        description: 'Project administrator with full permissions'
      }
    });

    // Add creator as admin member
    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: userId,
        projectRoleId: adminRole.id
      }
    });

    return {
      ...project,
      adminRole
    };
  }

  // Get all projects for a user
  async getUserProjects(userId: number) {
    return this.prisma.project.findMany({
      where: {
        dateDeleted: null,
        OR: [
          { createdBy: userId }, // Projects created by user
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true }
            },
            projectRole: {
              select: { id: true, roleName: true }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { dateCreated: 'desc' }
    });
  }

  // Get projects by workspace for a user
  async getProjectsByWorkspace(workspaceId: number, userId: number) {
    // First verify user has access to the workspace
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { userId: userId }, // Owner
          {
            workspaceMembers: {
              some: {
                userId: userId,
                dateDeleted: null
              }
            }
          }
        ],
        dateDeleted: null
      }
    });

    if (!workspace) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Get projects in the workspace that user has access to
    return this.prisma.project.findMany({
      where: {
        workspaceId: workspaceId,
        dateDeleted: null,
        OR: [
          { createdBy: userId }, // Projects created by user
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true }
            },
            projectRole: {
              select: { id: true, roleName: true }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { dateCreated: 'desc' }
    });
  }

  // Get project by ID with permission check
  async getProjectById(projectId: number, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: null,
        OR: [
          { createdBy: userId },
          {
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, email: true }
            },
            projectRole: {
              select: { id: true, roleName: true, description: true }
            }
          }
        },
        projectRoles: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    return project;
  }

  // Update project - only admins can update
  async updateProject(projectId: number, updateProjectDto: UpdateProjectDto, userId: number) {
    await this.checkAdminPermission(projectId, userId);

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: updateProjectDto,
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        }
      }
    });

    return updatedProject;
  }

  // Delete project - only admins can delete
  async deleteProject(projectId: number, userId: number) {
    await this.checkAdminPermission(projectId, userId);

    // Soft delete
    await this.prisma.project.update({
      where: { id: projectId },
      data: { dateDeleted: new Date() }
    });

    return { message: 'Project deleted successfully' };
  }

  // Restore deleted project - only admins can restore
  async restoreProject(projectId: number, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        dateDeleted: { not: null }
      }
    });

    if (!project) {
      throw new NotFoundException('Deleted project not found');
    }

    // Check if user was admin before deletion
    const wasAdmin = project.createdBy === userId || await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        projectRole: {
          roleName: 'Admin'
        }
      }
    });

    if (!wasAdmin) {
      throw new ForbiddenException('Only project admins can restore projects');
    }

    const restoredProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { dateDeleted: null },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        }
      }
    });

    return restoredProject;
  }

  // Get deleted projects for a user
  async getDeletedProjects(userId: number) {
    return this.prisma.project.findMany({
      where: {
        dateDeleted: { not: null },
        OR: [
          { createdBy: userId }, // Projects created by user
          {
            members: {
              some: {
                userId: userId,
                projectRole: {
                  roleName: 'Admin'
                }
              }
            }
          }
        ]
      },
      include: {
        creator: {
          select: { id: true, username: true, email: true }
        },
        workspace: {
          select: { id: true, workspaceName: true }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { dateDeleted: 'desc' }
    });
  }

  // Add member to project - only admins can add members
  async addMember(projectId: number, addMemberDto: AddMemberDto, userId: number) {
    await this.checkAdminPermission(projectId, userId);

    const { userId: newUserId, projectRoleId } = addMemberDto;

    // Check if user is already a member
    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: newUserId
      }
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    // Verify the role exists for this project
    const role = await this.prisma.projectRole.findFirst({
      where: {
        id: projectRoleId,
        projectId
      }
    });

    if (!role) {
      throw new NotFoundException('Project role not found');
    }

    // Add member
    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: newUserId,
        projectRoleId
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        projectRole: {
          select: { id: true, roleName: true }
        }
      }
    });

    return member;
  }

  // Remove member from project - only admins can remove members (except original admin)
  async removeMember(projectId: number, memberId: number, userId: number) {
    await this.checkAdminPermission(projectId, userId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    const member = await this.prisma.projectMember.findUnique({
      where: { id: memberId }
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing the original project creator
    if (member.userId === project.createdBy) {
      throw new ForbiddenException('Cannot remove the original project creator');
    }

    await this.prisma.projectMember.delete({
      where: { id: memberId }
    });

    return { message: 'Member removed successfully' };
  }

  // Create project role - only admins can create roles
  async createProjectRole(projectId: number, createRoleDto: CreateProjectRoleDto, userId: number) {
    await this.checkAdminPermission(projectId, userId);

    const { roleName, description, permissionIds } = createRoleDto;

    const role = await this.prisma.projectRole.create({
      data: {
        projectId,
        roleName,
        description
      }
    });

    // Add permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        projectRoleId: role.id,
        permissionId
      }));

      await this.prisma.projectRolePermission.createMany({
        data: rolePermissions
      });
    }

    return this.prisma.projectRole.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  // Promote user to admin - only existing admins can promote others
  async promoteToAdmin(projectId: number, memberId: number, userId: number) {
    await this.checkAdminPermission(projectId, userId);

    // Get admin role for this project
    const adminRole = await this.prisma.projectRole.findFirst({
      where: {
        projectId,
        roleName: 'Admin'
      }
    });

    if (!adminRole) {
      throw new NotFoundException('Admin role not found for this project');
    }

    // Update member role to admin
    const updatedMember = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { projectRoleId: adminRole.id },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        },
        projectRole: {
          select: { id: true, roleName: true }
        }
      }
    });

    return updatedMember;
  }

  // Get available permissions
  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { permissionName: 'asc' }
    });
  }

  // Check if user has admin permission for a project
  private async checkAdminPermission(projectId: number, userId: number) {
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

  // Check if user is member of project
  async checkMemberPermission(projectId: number, userId: number) {
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });

    return !!membership;
  }
}
