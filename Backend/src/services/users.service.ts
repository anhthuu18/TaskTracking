import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.users.findMany({
      where: { dateDeleted: null },
      select: {
        userID: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.users.findFirst({
      where: { userID: id, dateDeleted: null },
      select: {
        userID: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${id} không tồn tại`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    return await this.prisma.users.create({
      data: createUserDto,
      select: {
        userID: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findById(id); // Kiểm tra user tồn tại

    return await this.prisma.users.update({
      where: { userID: id },
      data: updateUserDto,
      select: {
        userID: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
      },
    });
  }

  async delete(id: number) {
    await this.findById(id); // Kiểm tra user tồn tại

    // Soft delete
    await this.prisma.users.update({
      where: { userID: id },
      data: { dateDeleted: new Date() },
    });

    return { message: `Đã xóa người dùng với ID ${id}` };
  }
}
