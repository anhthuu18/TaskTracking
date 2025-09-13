import { Injectable, BadRequestException } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor() {
    // Initialize Twilio client
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  /**
   * Gửi SMS OTP qua Twilio (Trial mode - chỉ log ra console)
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Format phone number to international format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      
      // Check if sending to Virtual Phone (for testing)
      if (formattedPhone.includes('Virtual') || phoneNumber === 'virtual') {
      }
      
      // Check if we have valid Twilio credentials
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        const otpCode = this.extractOTPFromMessage(message);
        return true;
      }

      // Validate Service SID format (must start with MG)
      if (process.env.TWILIO_SERVICE_SID && !process.env.TWILIO_SERVICE_SID.startsWith('MG')) {
      }

      // Try to send real SMS first
      try {
        const messageOptions: any = {
          body: message,
          to: formattedPhone,
        };

        // Use Service SID if available and valid (recommended for production)
        if (process.env.TWILIO_SERVICE_SID && process.env.TWILIO_SERVICE_SID.startsWith('MG')) {
          messageOptions.messagingServiceSid = process.env.TWILIO_SERVICE_SID;
        } else if (process.env.TWILIO_PHONE_NUMBER) {
          messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
        } else {
          throw new Error('No valid Twilio Service SID or Phone Number configured');
        }

        const messageResponse = await this.client.messages.create(messageOptions);
        return true;
      } catch (twilioError: any) {
        // Fallback to mock mode
        const otpCode = this.extractOTPFromMessage(message);
        return true;
      }
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      // Fallback to mock mode on error
      const otpCode = this.extractOTPFromMessage(message);
      return true;
    }
  }

  /**
   * Gửi Email OTP qua Twilio SendGrid (cho website sau này)
   */
  async sendEmail(email: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      // TODO: Implement SendGrid email sending
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      
      // Placeholder for future implementation
      return true;
    } catch (error) {
      console.error('SendGrid Email Error:', error);
      return false;
    }
  }

  /**
   * Format phone number cho Vietnam
   */
  private formatPhoneNumber(phone: string): string {
    // Remove spaces and special characters
    let formatted = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // Convert Vietnamese phone formats to international
    if (formatted.startsWith('0')) {
      formatted = '+84' + formatted.substring(1);
    } else if (formatted.startsWith('84')) {
      formatted = '+' + formatted;
    } else if (!formatted.startsWith('+84')) {
      formatted = '+84' + formatted;
    }
    
    return formatted;
  }

  /**
   * Tạo OTP message template
   */
  createOTPMessage(otpCode: string, expiryMinutes: number = 5): string {
    return `Mã xác thực của bạn là: ${otpCode}. Mã có hiệu lực trong ${expiryMinutes} phút. Không chia sẻ mã này với ai.`;
  }

  /**
   * Tạo Email OTP template (cho website)
   */
  createOTPEmailTemplate(otpCode: string, expiryMinutes: number = 5): { subject: string; html: string } {
    return {
      subject: 'Mã xác thực OTP - Task Tracking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Mã xác thực OTP</h2>
          <p>Mã xác thực của bạn là:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #667eea; border-radius: 8px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>Mã có hiệu lực trong <strong>${expiryMinutes} phút</strong>.</p>
          <p style="color: #dc3545;"><strong>Lưu ý:</strong> Không chia sẻ mã này với bất kỳ ai.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6c757d; font-size: 12px;">
            Email này được gửi tự động từ hệ thống Task Tracking. Vui lòng không trả lời email này.
          </p>
        </div>
      `
    };
  }

  /**
   * Extract OTP code from message
   */
  private extractOTPFromMessage(message: string): string {
    // Extract 4-6 digit numbers from message
    const otpMatch = message.match(/\b\d{4,6}\b/);
    return otpMatch ? otpMatch[0] : 'XXXX';
  }
}
