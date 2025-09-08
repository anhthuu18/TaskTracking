import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from './firebase.service';

export interface OtpConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
}

@Injectable()
export class OtpService {
  private readonly defaultConfig: OtpConfig = {
    length: 4,
    expiryMinutes: 5,
    maxAttempts: 3,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Tạo mã OTP ngẫu nhiên
   */
  private generateOtpCode(length: number = 4): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  /**
   * Tạo và lưu mã OTP mới
   */
  async createOtp(
    phone: string,
    config: Partial<OtpConfig> = {}
  ): Promise<{ otpCode: string; expiresAt: Date }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Xóa các OTP cũ chưa sử dụng của cùng số điện thoại
    await this.prisma.otpCode.deleteMany({
      where: {
        phone,
        isUsed: false,
      },
    });

    // Tạo mã OTP mới
    const otpCode = this.generateOtpCode(finalConfig.length);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + finalConfig.expiryMinutes);

    // Lưu vào database
    await this.prisma.otpCode.create({
      data: {
        phone,
        otpCode,
        expiresAt,
        isUsed: false,
        attempts: 0,
      },
    });

    return { otpCode, expiresAt };
  }

  /**
   * Xác thực mã OTP
   */
  async verifyOtp(
    phone: string,
    otpCode: string
  ): Promise<{ isValid: boolean; message: string }> {
    // Tìm OTP trong database
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        isUsed: false,
      },
      orderBy: {
        dateCreated: 'desc',
      },
    });

    if (!otpRecord) {
      return { isValid: false, message: 'Mã OTP không tồn tại hoặc đã được sử dụng' };
    }

    // Kiểm tra số lần thử
    if (otpRecord.attempts >= this.defaultConfig.maxAttempts) {
      return { isValid: false, message: 'Mã OTP đã bị khóa do nhập sai quá nhiều lần' };
    }

    // Kiểm tra thời gian hết hạn
    if (new Date() > otpRecord.expiresAt) {
      return { isValid: false, message: 'Mã OTP đã hết hạn' };
    }

    // Tăng số lần thử
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    // Kiểm tra mã OTP
    if (otpRecord.otpCode !== otpCode) {
      return { isValid: false, message: 'Mã OTP không chính xác' };
    }

    // Đánh dấu OTP đã được sử dụng
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return { isValid: true, message: 'Xác thực OTP thành công' };
  }

  /**
   * Gửi SMS OTP qua Firebase
   */
  async sendSms(phone: string, message: string): Promise<boolean> {
    try {
      // Sử dụng Firebase service để gửi SMS
      const result = await this.firebaseService.sendSmsOtp(phone, message);
      return result;
    } catch (error) {
      console.error('Firebase SMS Error:', error);
      return false;
    }
  }

  /**
   * Gửi OTP qua SMS
   */
  async sendOtpSms(
    phone: string,
    config: Partial<OtpConfig> = {}
  ): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
    try {
      const { otpCode, expiresAt } = await this.createOtp(phone, config);
      
      const smsMessage = `Mã xác thực của bạn là: ${otpCode}. Mã có hiệu lực trong ${config.expiryMinutes || this.defaultConfig.expiryMinutes} phút.`;
      
      const smsSent = await this.sendSms(phone, smsMessage);
      
      if (!smsSent) {
        throw new BadRequestException('Không thể gửi SMS');
      }

      return {
        success: true,
        message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
        expiresAt,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi gửi mã OTP',
      };
    }
  }

  /**
   * Làm sạch các OTP đã hết hạn
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
