import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.usersService.findById(parseInt(id));
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.update(parseInt(id), updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.usersService.delete(parseInt(id));
  }
}
