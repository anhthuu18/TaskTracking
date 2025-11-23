import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Put,
  Body, 
  Param, 
  HttpCode, 
  HttpStatus, 
  UseGuards, 
  Request,
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto } from '../dtos/create-workspace.dto';
import { WorkspaceResponseDto } from '../dtos/workspace-response.dto';
import { InviteMemberDto } from '../dtos/invite-member.dto';
import { AddMemberDto } from '../dtos/add-member.dto';
import { WorkspaceMemberResponseDto } from '../dtos/workspace-member-response.dto';
import { InvitationResponseDto } from '../dtos/invitation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('workspace')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('create-workspace')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceResponseDto;
  }> {
    const workspace = await this.workspaceService.create(createWorkspaceDto, req.user.id);
    
    return {
      success: true,
      message: 'Workspace được tạo thành công',
      data: workspace,
    };
  }

  @Get('list-all')
  @HttpCode(HttpStatus.OK)
  async findAll(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceResponseDto[];
  }> {
    const workspaces = await this.workspaceService.findAllByUser(req.user.id);
    
    return {
      success: true,
      message: 'Lấy danh sách workspace thành công',
      data: workspaces,
    };
  }

  @Get('list-personal')
  @HttpCode(HttpStatus.OK)
  async getPersonalWorkspaces(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceResponseDto[];
  }> {
    const workspaces = await this.workspaceService.getPersonalWorkspaces(req.user.id);
    
    return {
      success: true,
      message: 'Lấy danh sách personal workspace thành công',
      data: workspaces,
    };
  }

  @Get('list-group')
  @HttpCode(HttpStatus.OK)
  async getGroupWorkspaces(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceResponseDto[];
  }> {
    const workspaces = await this.workspaceService.getGroupWorkspaces(req.user.id);
    
    return {
      success: true,
      message: 'Lấy danh sách group workspace thành công',
      data: workspaces,
    };
  }

  @Get('get-details/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceResponseDto;
  }> {
    const workspace = await this.workspaceService.findOne(id, req.user.id);
    
    return {
      success: true,
      message: 'Lấy thông tin workspace thành công',
      data: workspace,
    };
  }

  @Delete('delete-workspace/:id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.workspaceService.delete(id, req.user.id);
    
    return {
      success: true,
      message: 'Workspace đã được xóa thành công',
    };
  }

  @Put('restore-workspace/:id')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.workspaceService.restore(id, req.user.id);
    
    return {
      success: true,
      message: 'Workspace đã được khôi phục thành công',
    };
  }

  @Get('list-deleted')
  @HttpCode(HttpStatus.OK)
  async getDeletedWorkspaces(@Request() req): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceResponseDto[];
  }> {
    const workspaces = await this.workspaceService.getDeletedWorkspaces(req.user.id);
    
    return {
      success: true,
      message: 'Lấy danh sách workspace đã xóa thành công',
      data: workspaces,
    };
  }

  @Post(':id/invite-member')
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(
    @Param('id', ParseIntPipe) workspaceId: number,
    @Body() inviteMemberDto: InviteMemberDto,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data: InvitationResponseDto;
  }> {
    const invitation = await this.workspaceService.inviteMember(
      workspaceId,
      inviteMemberDto,
      req.user.id
    );

    return {
      success: true,
      message: 'Gửi lời mời thành công',
      data: invitation,
    };
  }

  @Post('accept-invitation')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Query('token') token: string
  ): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceMemberResponseDto;
  }> {
    const member = await this.workspaceService.acceptInvitation(token);

    return {
      success: true,
      message: 'Chấp nhận lời mời thành công',
      data: member,
    };
  }

  @Post(':id/add-member')
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('id', ParseIntPipe) workspaceId: number,
    @Body() addMemberDto: AddMemberDto,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceMemberResponseDto;
  }> {
    const member = await this.workspaceService.addMember(
      workspaceId,
      addMemberDto,
      req.user.id
    );

    return {
      success: true,
      message: 'Thêm thành viên thành công',
      data: member,
    };
  }

  @Delete(':id/remove-member/:memberId')
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id', ParseIntPipe) workspaceId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.workspaceService.removeMember(workspaceId, memberId, req.user.id);

    return {
      success: true,
      message: 'Xóa thành viên thành công',
    };
  }

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  async getMembers(
    @Param('id', ParseIntPipe) workspaceId: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data: WorkspaceMemberResponseDto[];
  }> {
    const members = await this.workspaceService.getMembers(workspaceId, req.user.id);

    return {
      success: true,
      message: 'Lấy danh sách thành viên thành công',
      data: members,
    };
  }

  @Get(':id/invitations')
  @HttpCode(HttpStatus.OK)
  async getPendingInvitations(
    @Param('id', ParseIntPipe) workspaceId: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
    data: InvitationResponseDto[];
  }> {
    const invitations = await this.workspaceService.getPendingInvitations(
      workspaceId,
      req.user.id
    );

    return {
      success: true,
      message: 'Lấy danh sách lời mời thành công',
      data: invitations,
    };
  }

  @Delete('cancel-invitation/:invitationId')
  @HttpCode(HttpStatus.OK)
  async cancelInvitation(
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @Request() req
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.workspaceService.cancelInvitation(invitationId, req.user.id);

    return {
      success: true,
      message: 'Hủy lời mời thành công',
    };
  }
}
