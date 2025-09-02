import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { UpdateUserDTO } from '../dtos/update-user.dto';
import { UserResponse } from '../model/user.model';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UserResponse[]> {
    return this.prisma.user.findMany({
      where: {
        dateDeleted: null
      },
      select: {
        id: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true
      }
    });
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        dateDeleted: null
      },
      select: {
        id: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true
      }
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user;
  }

  async create(createUserDto: CreateUserDTO): Promise<UserResponse> {
    return this.prisma.user.create({
      data: createUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true
      }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDTO): Promise<UserResponse> {
    await this.findOne(id); // Kiểm tra user có tồn tại không

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true
      }
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Kiểm tra user có tồn tại không

    await this.prisma.user.update({
      where: { id },
      data: {
        dateDeleted: new Date()
      }
    });
  }
}
