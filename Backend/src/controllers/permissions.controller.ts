import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permissions.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async getAllPermissions() {
    return await this.permissionsService.findAll();
  }

  @Get(':id')
  async getPermissionById(@Param('id') id: string) {
    return await this.permissionsService.findById(parseInt(id));
  }

  @Post()
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.permissionsService.create(createPermissionDto);
  }

  @Put(':id')
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.permissionsService.update(parseInt(id), updatePermissionDto);
  }

  @Delete(':id')
  async deletePermission(@Param('id') id: string) {
    return await this.permissionsService.delete(parseInt(id));
  }
}
