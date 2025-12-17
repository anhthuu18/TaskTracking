import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "../services/users.service";
import { CreateUserDTO } from "../dtos/create-user.dto";
import { UpdateUserDTO } from "../dtos/update-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: users,
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findOne(+id);
    return {
      success: true,
      message: "Lấy thông tin người dùng thành công",
      data: user,
    };
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDTO) {
    const user = await this.usersService.create(createUserDto);
    return {
      success: true,
      message: "Tạo người dùng thành công",
      data: user,
    };
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDTO) {
    const user = await this.usersService.update(+id, updateUserDto);
    return {
      success: true,
      message: "Cập nhật người dùng thành công",
      data: user,
    };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.usersService.remove(+id);
    return {
      success: true,
      message: "Xóa người dùng thành công",
    };
  }

  @Put(":id/fcm-token")
  async updateFcmToken(
    @Param("id") id: string,
    @Body("fcmToken") fcmToken: string
  ) {
    const user = await this.usersService.updateFcmToken(+id, fcmToken);
    return {
      success: true,
      message: "Cập nhật FCM token thành công",
      data: user,
    };
  }

  @Get(":id/notification-preferences")
  async getNotificationPreferences(@Param("id") id: string) {
    const preferences = await this.usersService.getNotificationPreferences(+id);
    return {
      success: true,
      message: "Lấy cài đặt thông báo thành công",
      data: preferences,
    };
  }

  @Put(":id/notification-preferences")
  async updateNotificationPreferences(
    @Param("id") id: string,
    @Body() body: { notifyByEmail?: boolean; notifyByPush?: boolean }
  ) {
    const preferences = await this.usersService.updateNotificationPreferences(
      +id,
      body.notifyByEmail,
      body.notifyByPush
    );
    return {
      success: true,
      message: "Cập nhật cài đặt thông báo thành công",
      data: preferences,
    };
  }
}
