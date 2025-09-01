import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/roles.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.roles.findMany({
      orderBy: { dateCreated: 'asc' },
    });
  }

  async findById(id: number) {
    const role = await this.prisma.roles.findUnique({
      where: { roleID: id },
    });

    if (!role) {
      throw new NotFoundException(`Role với ID ${id} không tồn tại`);
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    return await this.prisma.roles.create({
      data: createRoleDto,
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.findById(id); // Kiểm tra role tồn tại

    return await this.prisma.roles.update({
      where: { roleID: id },
      data: updateRoleDto,
    });
  }

  async delete(id: number) {
    await this.findById(id); // Kiểm tra role tồn tại

    await this.prisma.roles.delete({
      where: { roleID: id },
    });

    return { message: `Đã xóa role với ID ${id}` };
  }
}
