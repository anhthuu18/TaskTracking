import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OTPResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  otp: string;
}

const request = async (url: string, options: RequestInit): Promise<OTPResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    
    const json = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      return {
        success: false,
        message: json.message || `HTTP ${res.status}`,
      };
    }
    
    return json as OTPResponse;
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    return {
      success: false,
      message: isAbort ? 'Request timeout' : (err?.message || 'Network error'),
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const otpService = {
  /**
   * Change password (direct without OTP)
   */
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<OTPResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl('/auth/change-password'), {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock validation: current password must be correct
        // In real app, backend will verify this
        resolve({
          success: true,
          message: 'Password changed successfully',
        });
      }, 1000);
    });
  },

  /**
   * Send OTP to user's email for password change verification
   */
  sendOTPForPasswordChange: async (currentPassword: string): Promise<OTPResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl('/auth/send-otp-password-change'), {
        method: 'POST',
        body: JSON.stringify({ currentPassword }),
      });
    }

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate OTP sent
        console.log('Mock OTP sent to email: 123456');
        resolve({
          success: true,
          message: 'OTP sent to your email',
          data: { expiresIn: 300 }, // 5 minutes
        });
      }, 1000);
    });
  },

  /**
   * Verify OTP and change password
   */
  verifyOTPAndChangePassword: async (data: ChangePasswordRequest): Promise<OTPResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl('/auth/change-password-with-otp'), {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate OTP verification
        if (data.otp === '123456') {
          resolve({
            success: true,
            message: 'Password changed successfully',
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid OTP. Please try again.',
          });
        }
      }, 1000);
    });
  },

  /**
   * Resend OTP
   */
  resendOTP: async (currentPassword: string): Promise<OTPResponse> => {
    return otpService.sendOTPForPasswordChange(currentPassword);
  },

  /**
   * Send OTP for email verification (for new registrations)
   */
  sendOTPForEmailVerification: async (email: string): Promise<OTPResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl('/auth/send-otp-email'), {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    }

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Mock OTP sent for email verification: 123456');
        resolve({
          success: true,
          message: 'OTP sent to your email',
          data: { expiresIn: 300 },
        });
      }, 1000);
    });
  },

  /**
   * Verify email with OTP
   */
  verifyEmail: async (email: string, otp: string): Promise<OTPResponse> => {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl('/auth/verify-email'), {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
    }

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        if (otp === '123456') {
          resolve({
            success: true,
            message: 'Email verified successfully',
          });
        } else {
          resolve({
            success: false,
            message: 'Invalid OTP',
          });
        }
      }, 1000);
    });
  },
};

