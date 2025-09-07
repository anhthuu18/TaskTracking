import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { CreateUserDTO, CreateUserData } from '../../users/dtos/create-user.dto';
import { LoginDTO } from '../dtos/login.dto';
import { GoogleLoginDTO } from '../dtos/google-login.dto';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    // Sử dụng Android Client ID làm default
    this.googleClient = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);
  }

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

  async loginWithGoogle(googleLoginDto: GoogleLoginDTO) {
    try {
      // Verify Google ID token với Android Client ID
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleLoginDto.idToken,
        audience: [process.env.GOOGLE_ANDROID_CLIENT_ID, process.env.GOOGLE_WEB_CLIENT_ID],
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new UnauthorizedException('Google token không hợp lệ');
      }

      const { sub: googleUserId, email, name, picture, email_verified } = payload;

      // Kiểm tra email đã được verify chưa
      if (!email_verified) {
        throw new UnauthorizedException('Email chưa được xác thực bởi Google');
      }

      // Tìm user theo email
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Tạo user mới nếu chưa tồn tại
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const createUserData: CreateUserData = {
          username: name || email.split('@')[0],
          email: email,
          password: hashedPassword,
          phone: null,
        };

        user = await this.usersService.create(createUserData);
      }

      // Tạo JWT token
      const jwtPayload = { username: user.username, sub: user.id };
      const token = this.jwtService.sign(jwtPayload);

      return {
        success: true,
        message: 'Đăng nhập Google thành công',
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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Đăng nhập Google thất bại');
    }
  }

  async loginWithGoogleWeb(googleLoginDto: GoogleLoginDTO) {
    try {
      // Tạo OAuth2Client mới cho Web
      const webGoogleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);
      
      // Verify Google ID token với Web Client ID
      const ticket = await webGoogleClient.verifyIdToken({
        idToken: googleLoginDto.idToken,
        audience: process.env.GOOGLE_WEB_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new UnauthorizedException('Google token không hợp lệ');
      }

      const { sub: googleUserId, email, name, picture, email_verified } = payload;

      // Kiểm tra email đã được verify chưa
      if (!email_verified) {
        throw new UnauthorizedException('Email chưa được xác thực bởi Google');
      }

      // Tìm user theo email
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Tạo user mới nếu chưa tồn tại
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const createUserData: CreateUserData = {
          username: name || email.split('@')[0],
          email: email,
          password: hashedPassword,
          phone: null,
        };

        user = await this.usersService.create(createUserData);
      }

      // Tạo JWT token
      const jwtPayload = { username: user.username, sub: user.id };
      const token = this.jwtService.sign(jwtPayload);

      return {
        success: true,
        message: 'Đăng nhập Google Web thành công',
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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Đăng nhập Google Web thất bại');
    }
  }
}
