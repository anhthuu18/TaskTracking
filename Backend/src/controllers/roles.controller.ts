import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/roles.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async getAllRoles() {
    return await this.rolesService.findAll();
  }

  @Get(':id')
  async getRoleById(@Param('id') id: string) {
    return await this.rolesService.findById(parseInt(id));
  }

  @Post()
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.rolesService.update(parseInt(id), updateRoleDto);
  }

  @Delete(':id')
  async deleteRole(@Param('id') id: string) {
    return await this.rolesService.delete(parseInt(id));
  }
}
