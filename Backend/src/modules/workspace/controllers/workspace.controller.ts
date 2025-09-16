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
  ParseIntPipe 
} from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto } from '../dtos/create-workspace.dto';
import { WorkspaceResponseDto } from '../dtos/workspace-response.dto';
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
}
