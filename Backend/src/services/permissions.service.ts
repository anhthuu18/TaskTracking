import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.permissions.findMany({
      orderBy: { dateCreated: 'asc' },
    });
  }

  async findById(id: number) {
    const permission = await this.prisma.permissions.findUnique({
      where: { permissionID: id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission với ID ${id} không tồn tại`);
    }

    return permission;
  }

  async create(createPermissionDto: CreatePermissionDto) {
    return await this.prisma.permissions.create({
      data: createPermissionDto,
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    await this.findById(id); // Kiểm tra permission tồn tại

    return await this.prisma.permissions.update({
      where: { permissionID: id },
      data: updatePermissionDto,
    });
  }

  async delete(id: number) {
    await this.findById(id); // Kiểm tra permission tồn tại

    await this.prisma.permissions.delete({
      where: { permissionID: id },
    });

    return { message: `Đã xóa permission với ID ${id}` };
  }
}
