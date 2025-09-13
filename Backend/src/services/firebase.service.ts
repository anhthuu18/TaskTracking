import { Injectable, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private app: admin.app.App;

  constructor() {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      this.app = admin.app();
    }
  }

  /**
   * Gửi SMS OTP - Hiện tại chỉ log ra console để test
   * Firebase Admin SDK không trực tiếp gửi SMS, cần tích hợp với SMS provider
   */
  async sendSmsOtp(phoneNumber: string, otpCode: string): Promise<boolean> {
    try {
      // Format phone number to international format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+84${phoneNumber.substring(1)}`;
      
      // Log OTP để test - trong thực tế sẽ gửi SMS qua Twilio/AWS SNS
      console.log(`🔥 [SMS OTP] Gửi đến ${formattedPhone}`);
      console.log(`📱 Mã OTP: ${otpCode}`);
      console.log(`📨 Nội dung SMS: "Mã xác thực của bạn là: ${otpCode}. Có hiệu lực trong 5 phút."`);
      console.log(`⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`);
      
      // Simulate SMS sending success
      return true;
    } catch (error) {
      console.error('SMS Error:', error);
      return false;
    }
  }

  /**
   * Verify OTP với Firebase custom token
   */
  async verifyOtpToken(phoneNumber: string, otpCode: string, customToken: string): Promise<boolean> {
    try {
      // Verify custom token
      const decodedToken = await this.app.auth().verifyIdToken(customToken);
      
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+84${phoneNumber.substring(1)}`;
      
      // Check if token is valid and matches
      if (decodedToken.otp === otpCode && 
          decodedToken.phone === formattedPhone &&
          decodedToken.expiresAt > Date.now()) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Firebase OTP Verification Error:', error);
      return false;
    }
  }

  /**
   * Verify Firebase ID Token (cho mobile app)
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await this.app.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Firebase Token Verification Error:', error);
      throw new BadRequestException('Firebase token không hợp lệ');
    }
  }

  /**
   * Tạo custom token cho user
   */
  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      const customToken = await this.app.auth().createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error('Firebase Custom Token Error:', error);
      throw new BadRequestException('Không thể tạo Firebase custom token');
    }
  }

  /**
   * Lấy thông tin user từ Firebase
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<admin.auth.UserRecord | null> {
    try {
      const userRecord = await this.app.auth().getUserByPhoneNumber(phoneNumber);
      return userRecord;
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      console.error('Firebase Get User Error:', error);
      throw new BadRequestException('Lỗi khi lấy thông tin user từ Firebase');
    }
  }

  /**
   * Tạo hoặc cập nhật user trong Firebase
   */
  async createOrUpdateUser(phoneNumber: string, additionalInfo?: {
    email?: string;
    displayName?: string;
    disabled?: boolean;
  }): Promise<admin.auth.UserRecord> {
    try {
      // Kiểm tra user đã tồn tại chưa
      let userRecord = await this.getUserByPhoneNumber(phoneNumber);
      
      if (userRecord) {
        // Cập nhật user hiện có
        userRecord = await this.app.auth().updateUser(userRecord.uid, {
          ...additionalInfo,
        });
      } else {
        // Tạo user mới
        userRecord = await this.app.auth().createUser({
          phoneNumber,
          ...additionalInfo,
        });
      }
      
      return userRecord;
    } catch (error) {
      console.error('Firebase Create/Update User Error:', error);
      throw new BadRequestException('Không thể tạo/cập nhật user trong Firebase');
    }
  }
}
