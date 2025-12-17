import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateUserDTO, CreateUserData } from "../dtos/create-user.dto";
import { UpdateUserDTO } from "../dtos/update-user.dto";
import { UserResponse } from "../model/user.model";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UserResponse[]> {
    return this.prisma.user.findMany({
      where: {
        dateDeleted: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true,
      },
    });
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        dateDeleted: null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    return user;
  }

  async create(createUserDto: CreateUserData): Promise<UserResponse> {
    return this.prisma.user.create({
      data: createUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true,
      },
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDTO
  ): Promise<UserResponse> {
    await this.findOne(id); // Kiểm tra user có tồn tại không

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        dateCreated: true,
        dateModified: true,
        dateDeleted: true,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Kiểm tra user có tồn tại không

    await this.prisma.user.update({
      where: { id },
      data: {
        dateDeleted: new Date(),
      },
    });
  }

  async findByUsername(username: string): Promise<any> {
    return this.prisma.user.findFirst({
      where: {
        username,
        dateDeleted: null,
      },
    });
  }

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findFirst({
      where: {
        email,
        dateDeleted: null,
      },
    });
  }

  async findByPhone(phone: string): Promise<any> {
    return this.prisma.user.findFirst({
      where: {
        phone,
        dateDeleted: null,
      },
    });
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  // Method để lấy user với password (chỉ dùng cho authentication)
  async findOneWithPassword(id: number): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        dateDeleted: null,
      },
    });

    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    return user;
  }

  async updateFcmToken(id: number, fcmToken: string): Promise<any> {
    await this.findOne(id); // Check user exists

    return this.prisma.user.update({
      where: { id },
      data: { fcmToken },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        fcmToken: true,
        dateCreated: true,
        dateModified: true,
      },
    });
  }

  async getNotificationPreferences(userId: number): Promise<any> {
    // Find or create user settings
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exists
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          notifyByEmail: true,
          notifyByPush: true,
          dailyWorkMinutes: 480,
        },
      });
    }

    return {
      notifyByEmail: settings.notifyByEmail,
      notifyByPush: settings.notifyByPush,
    };
  }

  async updateNotificationPreferences(
    userId: number,
    notifyByEmail?: boolean,
    notifyByPush?: boolean
  ): Promise<any> {
    await this.findOne(userId);

    // Upsert user settings
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(notifyByEmail !== undefined && { notifyByEmail }),
        ...(notifyByPush !== undefined && { notifyByPush }),
      },
      create: {
        userId,
        notifyByEmail: notifyByEmail ?? true,
        notifyByPush: notifyByPush ?? true,
        dailyWorkMinutes: 480,
      },
    });

    return {
      notifyByEmail: settings.notifyByEmail,
      notifyByPush: settings.notifyByPush,
    };
  }
}
