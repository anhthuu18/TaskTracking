import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { CreateUserDTO, CreateUserData } from '../../users/dtos/create-user.dto';
import { LoginDTO } from '../dtos/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDTO) {
    try {
      // Hash password trước khi lưu
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      
      // Loại bỏ confirmPassword trước khi lưu vào database
      const { confirmPassword, ...userData } = createUserDto;
      
      const userDataForDB: CreateUserData = {
        ...userData,
        password: hashedPassword,
      };
      
      const user = await this.usersService.create(userDataForDB);

      // Tạo JWT token
      const payload = { username: user.username, sub: user.id };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            dateCreated: user.dateCreated,
          },
          token,
        },
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username hoặc email đã tồn tại');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDTO) {
    const user = await this.usersService.findByUsername(loginDto.username);
    
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }
    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // Tạo JWT token
    const payload = { username: user.username, sub: user.id };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          dateCreated: user.dateCreated,
        },
        token,
      },
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async logout(user: any) {
    return {
      success: true,
      message: 'Đăng xuất thành công',
      data: {
        userId: user.userId,
        username: user.username
      }
    };
  }
}
