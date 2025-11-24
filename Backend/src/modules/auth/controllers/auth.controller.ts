import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDTO } from '../../users/dtos/create-user.dto';
import { LoginDTO } from '../dtos/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleLoginDTO } from '../dtos/google-login.dto';
import { ForgotPasswordDTO, VerifyOtpDTO, ResetPasswordDTO } from '../dtos/forgot-password.dto';
import { ChangePasswordDTO } from '../dtos/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDTO) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard) //Bảo vệ endpoint này, chỉ user đã login mới được gọi
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return this.authService.logout(req.user);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() googleLoginDto: GoogleLoginDTO) {
    return this.authService.loginWithGoogle(googleLoginDto);
  }

  @Post('google/web')
  @HttpCode(HttpStatus.OK)
  async googleWebLogin(@Body() googleLoginDto: GoogleLoginDTO) {
    return this.authService.loginWithGoogleWeb(googleLoginDto);
  }

  @Post('google/test')
  @HttpCode(HttpStatus.OK)
  async googleLoginTest() {
    // Test endpoint để demo mà không cần Google ID Token thật
    return {
      success: true,
      message: 'Test Google Login endpoint hoạt động',
      data: {
        note: 'Đây là endpoint test. Để test thật, sử dụng /auth/google với Google ID Token hợp lệ'
      }
    };
  }

  // Forgot Password Endpoints

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDTO) {
    return this.authService.sendForgotPasswordOtp(forgotPasswordDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDTO) {
    return this.authService.verifyForgotPasswordOtp(verifyOtpDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDTO) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDTO) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}

