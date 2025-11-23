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
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto, CreateProjectRoleDto } from './dto';
import { InviteProjectMemberDto } from './dto/invite-project-member.dto';
import { ProjectInvitationResponseDto } from './dto/project-invitation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create-project')
  async createProject(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.createProject(createProjectDto, req.user.userId);
  }

  @Get('list-all')
  async getUserProjects(@Request() req) {
    return this.projectsService.getUserProjects(req.user.userId);
  }

  @Get('list-by-workspace/:workspaceId')
  async getProjectsByWorkspace(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Request() req
  ) {
    return this.projectsService.getProjectsByWorkspace(workspaceId, req.user.userId);
  }

  @Get('get-details/:id')
  async getProject(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.getProjectById(id, req.user.userId);
  }

  @Put('update-project/:id')
  async updateProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    return this.projectsService.updateProject(id, updateProjectDto, req.user.userId);
  }

  @Delete('delete-project/:id')
  async deleteProject(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.deleteProject(id, req.user.userId);
  }

  @Put('restore-project/:id')
  async restoreProject(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.restoreProject(id, req.user.userId);
  }

  @Get('list-deleted')
  async getDeletedProjects(@Request() req) {
    return this.projectsService.getDeletedProjects(req.user.userId);
  }

  @Post('add-member/:id')
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() addMemberDto: AddMemberDto,
    @Request() req,
  ) {
    return this.projectsService.addMember(id, addMemberDto, req.user.userId);
  }

  @Delete('remove-member/:id/:memberId')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Request() req,
  ) {
    return this.projectsService.removeMember(id, memberId, req.user.userId);
  }

  @Post('create-role/:id')
  async createProjectRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() createRoleDto: CreateProjectRoleDto,
    @Request() req,
  ) {
    return this.projectsService.createProjectRole(id, createRoleDto, req.user.userId);
  }

  @Put('promote-admin/:id/:memberId')
  async promoteToAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Request() req,
  ) {
    return this.projectsService.promoteToAdmin(id, memberId, req.user.userId);
  }

  @Get('list-permissions')
  async getPermissions() {
    return this.projectsService.getPermissions();
  }

  @Post(':id/invite-member')
  async inviteProjectMember(
    @Param('id', ParseIntPipe) projectId: number,
    @Body() inviteDto: InviteProjectMemberDto,
    @Request() req,
  ) {
    const invitation = await this.projectsService.inviteProjectMember(
      projectId,
      inviteDto,
      req.user.userId
    );

    return {
      statusCode: 201,
      message: 'Gửi lời mời project thành công',
      data: invitation,
    };
  }

  @Post('accept-invitation')
  async acceptProjectInvitation(@Query('token') token: string) {
    const member = await this.projectsService.acceptProjectInvitation(token);

    return {
      statusCode: 200,
      message: 'Chấp nhận lời mời project thành công',
      data: member,
    };
  }

  @Get(':id/invitations')
  async getPendingProjectInvitations(
    @Param('id', ParseIntPipe) projectId: number,
    @Request() req,
  ) {
    const invitations = await this.projectsService.getPendingProjectInvitations(
      projectId,
      req.user.userId
    );

    return {
      statusCode: 200,
      message: 'Lấy danh sách lời mời project thành công',
      data: invitations,
    };
  }

  @Delete('cancel-invitation/:invitationId')
  async cancelProjectInvitation(
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @Request() req,
  ) {
    await this.projectsService.cancelProjectInvitation(invitationId, req.user.userId);

    return {
      statusCode: 200,
      message: 'Hủy lời mời project thành công',
    };
  }

  @Post(':id/star')
  async toggleStar(@Param('id', ParseIntPipe) projectId: number, @Request() req) {
    const result = await this.projectsService.toggleStar(projectId, req.user.userId);
    return {
      statusCode: 200,
      message: `Project star status updated successfully.`,
      data: result,
    };
  }

  @Post(':id/log-access')
  async updateLastOpened(@Param('id', ParseIntPipe) projectId: number, @Request() req) {
    const result = await this.projectsService.updateLastOpened(projectId, req.user.userId);
    return {
      statusCode: 200,
      message: result.message,
    };
  }
}
