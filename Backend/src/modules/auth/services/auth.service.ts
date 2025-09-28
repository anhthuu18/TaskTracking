import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
import { CreateUserDTO, CreateUserData } from '../../users/dtos/create-user.dto';
import { LoginDTO } from '../dtos/login.dto';
import { GoogleLoginDTO } from '../dtos/google-login.dto';
import { ForgotPasswordDTO, VerifyOtpDTO, ResetPasswordDTO } from '../dtos/forgot-password.dto';
import { OAuth2Client } from 'google-auth-library';
import { OtpService } from '../../../services/otp.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly prisma: PrismaService,
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
      const payload = { username: user.username, email: user.email, sub: user.id };
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
    const payload = { username: user.username, email: user.email, sub: user.id };
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

  // Forgot Password Flow Methods

  /**
   * Bước 1: Gửi OTP đến số điện thoại
   */
  async sendForgotPasswordOtp(forgotPasswordDto: ForgotPasswordDTO) {
    try {
      // Chuẩn hóa số điện thoại (loại bỏ +84, 84 và thay bằng 0)
      const normalizedPhone = this.normalizePhoneNumber(forgotPasswordDto.phone);

      // Kiểm tra user có tồn tại với số điện thoại này không
      const user = await this.usersService.findByPhone(normalizedPhone);
      if (!user) {
        throw new NotFoundException('Không tìm thấy tài khoản với số điện thoại này');
      }

      // Gửi OTP
      const result = await this.otpService.sendOtpSms(
        normalizedPhone,
        { length: 4, expiryMinutes: 5 }
      );

      if (!result.success) {
        throw new BadRequestException(result.message);
      }

      return {
        success: true,
        message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
        data: {
          phone: normalizedPhone,
          expiresAt: result.expiresAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Có lỗi xảy ra khi gửi mã OTP');
    }
  }

  /**
   * Bước 2: Xác thực OTP
   */
  async verifyForgotPasswordOtp(verifyOtpDto: VerifyOtpDTO) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(verifyOtpDto.phone);

      // Xác thực OTP
      const verifyResult = await this.otpService.verifyOtp(
        normalizedPhone,
        verifyOtpDto.otpCode
      );

      if (!verifyResult.isValid) {
        throw new BadRequestException(verifyResult.message);
      }

      return {
        success: true,
        message: 'Xác thực OTP thành công',
        data: {
          phone: normalizedPhone,
          canResetPassword: true,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Có lỗi xảy ra khi xác thực OTP');
    }
  }

  /**
   * Bước 3: Đặt lại mật khẩu
   */
  async resetPassword(resetPasswordDto: ResetPasswordDTO) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(resetPasswordDto.phone);

      // Kiểm tra mật khẩu xác nhận
      if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
        throw new BadRequestException('Mật khẩu xác nhận không khớp');
      }

      // Kiểm tra có OTP đã được xác thực gần đây không (trong vòng 10 phút)
      const recentOtp = await this.prisma.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          isUsed: true,
          dateCreated: {
            gte: new Date(Date.now() - 10 * 60 * 1000), // 10 phút trước
          },
        },
        orderBy: {
          dateCreated: 'desc',
        },
      });

      if (!recentOtp) {
        throw new BadRequestException('Phiên xác thực đã hết hạn. Vui lòng thực hiện lại từ đầu');
      }

      // Tìm user theo số điện thoại
      const user = await this.usersService.findByPhone(normalizedPhone);
      if (!user) {
        throw new NotFoundException('Không tìm thấy tài khoản');
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

      // Cập nhật mật khẩu
      await this.usersService.updatePassword(user.id, hashedPassword);

      // Xóa tất cả OTP cũ của user này để bảo mật
      await this.prisma.otpCode.deleteMany({
        where: {
          phone: normalizedPhone,
        },
      });

      return {
        success: true,
        message: 'Đặt lại mật khẩu thành công',
        data: {
          userId: user.id,
          username: user.username,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Có lỗi xảy ra khi đặt lại mật khẩu');
    }
  }

  /**
   * Helper method: Chuẩn hóa số điện thoại
   */
  private normalizePhoneNumber(phone: string): string {
    // Loại bỏ khoảng trắng và ký tự đặc biệt
    let normalized = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Chuyển đổi +84 hoặc 84 thành 0
    if (normalized.startsWith('+84')) {
      normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('84')) {
      normalized = '0' + normalized.substring(2);
    }
    
    return normalized;
  }
}
