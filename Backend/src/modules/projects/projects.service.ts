import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto, CreateProjectRoleDto } from './dto';
import { InviteProjectMemberDto } from './dto/invite-project-member.dto';
import { ProjectInvitationResponseDto } from './dto/project-invitation-response.dto';
import { EmailService } from '../../services/email.service';
import { InviteType, InvitationStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

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

    // Load project basic info for notifications/email
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        projectName: true, 
        workspaceId: true,
        workspace: {
          select: { workspaceName: true }
        }
      }
    });

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

    // Create in-app notification for the added member
    try {
      await this.prisma.projectNotification.create({
        data: {
          projectId,
          receiverUserId: newUserId,
          title: 'Added to project',
          message: `You were added to project "${project.projectName}" in workspace "${project.workspace.workspaceName}"`,
        },
      });
    } catch (e) {
      // non-blocking
    }

    // Optional: send email notification (no accept needed)
    try {
      if (member.user?.email) {
        await this.emailService.sendProjectNotification(
          member.user.email,
          project.projectName,
          project.workspace.workspaceName,
          'System',
          'You were added to the project'
        );
      }
    } catch (e) {
      // non-blocking
    }

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

  // Invite member to project via email or in-app (Hierarchical Approach - Step 2)
  async inviteProjectMember(projectId: number, inviteDto: InviteProjectMemberDto, inviterId: number): Promise<ProjectInvitationResponseDto> {
    const { email, inviteType, roleId, message } = inviteDto;

    // Check if user has admin permission
    await this.checkAdminPermission(projectId, inviterId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: true,
        projectRoles: true
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // HIERARCHICAL APPROACH: Check if user exists and is workspace member first
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // User exists - check workspace membership
      const workspaceMember = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: project.workspaceId,
          userId: user.id,
          dateDeleted: null
        }
      });

      if (!workspaceMember) {
        throw new BadRequestException(
          `Người dùng phải là thành viên của workspace "${project.workspace.workspaceName}" trước khi có thể được mời vào project này. ` +
          `Vui lòng mời họ vào workspace trước.`
        );
      }
    } else {
      // User doesn't exist - they need to be invited to workspace first
      throw new BadRequestException(
        `Người dùng với email "${email}" chưa đăng ký tài khoản hoặc chưa là thành viên của workspace. ` +
        `Vui lòng mời họ vào workspace "${project.workspace.workspaceName}" trước.`
      );
    }

    // Check if user is already a project member
    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        user: { email }
      }
    });

    if (existingMember) {
      throw new BadRequestException('Người dùng đã là thành viên của project này');
    }

    // HIERARCHICAL APPROACH: Handle existing pending invitation smartly
    const existingInvitation = await this.prisma.projectInvitation.findFirst({
      where: {
        projectId,
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingInvitation) {
      // Update existing invitation instead of throwing error
      const updatedInvitation = await this.prisma.projectInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          message: message || existingInvitation.message,
          invitedBy: inviterId,
          roleId: roleId || existingInvitation.roleId,
          updatedAt: new Date(),
        },
        include: {
          project: {
            include: {
              workspace: {
                select: {
                  id: true,
                  workspaceName: true
                }
              }
            }
          },
          inviter: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // Resend email if EMAIL type
      if (inviteType === InviteType.EMAIL) {
        const acceptUrl = `${process.env.FRONTEND_URL}/accept-project-invitation?token=${existingInvitation.token}`;
        await this.emailService.sendProjectInvitation(
          email,
          project.projectName,
          project.workspace.workspaceName,
          updatedInvitation.inviter.username,
          acceptUrl,
          message || 'Lời mời project đã được gửi lại'
        );
      }

      return {
        id: updatedInvitation.id,
        projectId: updatedInvitation.projectId,
        email: updatedInvitation.email,
        invitedBy: updatedInvitation.invitedBy,
        inviteType: updatedInvitation.inviteType,
        status: updatedInvitation.status,
        token: updatedInvitation.token,
        message: updatedInvitation.message,
        roleId: updatedInvitation.roleId,
        expiresAt: updatedInvitation.expiresAt,
        createdAt: updatedInvitation.createdAt,
        project: {
          id: updatedInvitation.project.id,
          projectName: updatedInvitation.project.projectName,
          workspace: updatedInvitation.project.workspace
        },
        inviter: updatedInvitation.inviter
      };
    }

    // Validate role if provided
    let assignedRoleId = roleId;
    if (roleId) {
      const role = await this.prisma.projectRole.findFirst({
        where: {
          id: roleId,
          projectId
        }
      });

      if (!role) {
        throw new NotFoundException('Project role not found');
      }
    } else {
      // Get default member role
      const memberRole = await this.prisma.projectRole.findFirst({
        where: {
          projectId,
          roleName: { not: 'Admin' }
        }
      });
      assignedRoleId = memberRole?.id;
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await this.prisma.projectInvitation.create({
      data: {
        projectId,
        email,
        invitedBy: inviterId,
        inviteType,
        token,
        message,
        roleId: assignedRoleId,
        expiresAt
      },
      include: {
        project: {
          include: {
            workspace: {
              select: {
                id: true,
                workspaceName: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Send email if EMAIL type
    if (inviteType === InviteType.EMAIL) {
      const acceptUrl = `${process.env.FRONTEND_URL}/accept-project-invitation?token=${token}`;
      await this.emailService.sendProjectInvitation(
        email,
        project.projectName,
        project.workspace.workspaceName,
        invitation.inviter.username,
        acceptUrl,
        message
      );
    }

    return {
      id: invitation.id,
      projectId: invitation.projectId,
      email: invitation.email,
      invitedBy: invitation.invitedBy,
      inviteType: invitation.inviteType,
      status: invitation.status,
      token: invitation.token,
      message: invitation.message,
      roleId: invitation.roleId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      project: {
        id: invitation.project.id,
        projectName: invitation.project.projectName,
        workspace: invitation.project.workspace
      },
      inviter: invitation.inviter
    };
  }

  // Accept project invitation (Hierarchical Approach - Enforced)
  async acceptProjectInvitation(token: string): Promise<any> {
    const invitation = await this.prisma.projectInvitation.findFirst({
      where: {
        token,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      },
      include: {
        project: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!invitation) {
      throw new NotFoundException('Lời mời không hợp lệ hoặc đã hết hạn');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (!user) {
      throw new BadRequestException('Người dùng chưa đăng ký tài khoản');
    }

    // HIERARCHICAL APPROACH: Strictly enforce workspace membership requirement
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: invitation.project.workspaceId,
        userId: user.id,
        dateDeleted: null
      }
    });

    if (!workspaceMember) {
      throw new BadRequestException(
        `Bạn phải là thành viên của workspace "${invitation.project.workspace.workspaceName}" trước khi có thể tham gia project này. ` +
        `Vui lòng liên hệ với quản trị viên workspace để được mời vào workspace trước.`
      );
    }

    // Check if already a project member
    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId: invitation.projectId,
        userId: user.id
      }
    });

    if (existingMember) {
      throw new BadRequestException('Bạn đã là thành viên của project này');
    }

    // Get default role if none specified
    let roleId = invitation.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.projectRole.findFirst({
        where: {
          projectId: invitation.projectId,
          roleName: { not: 'Admin' }
        }
      });
      roleId = defaultRole?.id || 1;
    }

    // Add user as project member and update invitation status
    const [member] = await this.prisma.$transaction([
      this.prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: user.id,
          projectRoleId: roleId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          projectRole: {
            select: {
              id: true,
              roleName: true
            }
          }
        }
      }),
      this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date()
        }
      })
    ]);

    return member;
  }

  // Get pending project invitations
  async getPendingProjectInvitations(projectId: number, userId: number): Promise<ProjectInvitationResponseDto[]> {
    // Check admin permission
    await this.checkAdminPermission(projectId, userId);

    const invitations = await this.prisma.projectInvitation.findMany({
      where: {
        projectId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      },
      include: {
        project: {
          include: {
            workspace: {
              select: {
                id: true,
                workspaceName: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return invitations.map(invitation => ({
      id: invitation.id,
      projectId: invitation.projectId,
      email: invitation.email,
      invitedBy: invitation.invitedBy,
      inviteType: invitation.inviteType,
      status: invitation.status,
      token: invitation.token,
      message: invitation.message,
      roleId: invitation.roleId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      project: {
        id: invitation.project.id,
        projectName: invitation.project.projectName,
        workspace: invitation.project.workspace
      },
      inviter: invitation.inviter
    }));
  }

  // Cancel project invitation
  async cancelProjectInvitation(invitationId: number, userId: number): Promise<void> {
    const invitation = await this.prisma.projectInvitation.findFirst({
      where: {
        id: invitationId,
        status: InvitationStatus.PENDING
      },
      include: {
        project: true
      }
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check permission - admin or inviter can cancel
    const isInviter = invitation.invitedBy === userId;
    let isAdmin = false;

    try {
      await this.checkAdminPermission(invitation.projectId, userId);
      isAdmin = true;
    } catch {
      // User is not admin
    }

    if (!isAdmin && !isInviter) {
      throw new ForbiddenException('You do not have permission to cancel this invitation');
    }

    await this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REJECTED }
    });
  }
}
