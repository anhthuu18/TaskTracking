import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

const request = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const authToken = await AsyncStorage.getItem('authToken');
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {}),
      },
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: json?.message || `HTTP ${response.status}`,
      };
    }

    return json as ApiResponse<T>;
  } catch (error: any) {
    const isAbort = error?.name === 'AbortError';
    return {
      success: false,
      message: isAbort ? 'Request timeout' : error?.message || 'Network error',
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const userService = {
  async getProfile(): Promise<ApiResponse> {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(
        buildApiUrl(getCurrentApiConfig().ENDPOINTS.USER.PROFILE),
        {
          method: 'GET',
        },
      );
    }

    // Mock response
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      return {
        success: true,
        message: 'Mock profile loaded',
        data: parsed,
      };
    }

    return {
      success: false,
      message: 'No user data available',
    };
  },

  async updateFCMToken(userId: number, fcmToken: string): Promise<ApiResponse> {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl(`/users/${userId}/fcm-token`), {
        method: 'PUT',
        body: JSON.stringify({ fcmToken }),
      });
    }

    // Mock response
    return {
      success: true,
      message: 'FCM token updated (mock)',
      data: { fcmToken },
    };
  },

  async getNotificationPreferences(
    userId: number,
  ): Promise<ApiResponse<{ notifyByEmail: boolean; notifyByPush: boolean }>> {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl(`/users/${userId}/notification-preferences`), {
        method: 'GET',
      });
    }

    // Mock response
    return {
      success: true,
      message: 'Notification preferences loaded (mock)',
      data: {
        notifyByEmail: true,
        notifyByPush: true,
      },
    };
  },

  async updateNotificationPreferences(
    userId: number,
    notifyByEmail?: boolean,
    notifyByPush?: boolean,
  ): Promise<ApiResponse<{ notifyByEmail: boolean; notifyByPush: boolean }>> {
    if (!API_CONFIG.USE_MOCK_API) {
      return request(buildApiUrl(`/users/${userId}/notification-preferences`), {
        method: 'PUT',
        body: JSON.stringify({ notifyByEmail, notifyByPush }),
      });
    }

    // Mock response
    return {
      success: true,
      message: 'Notification preferences updated (mock)',
      data: {
        notifyByEmail: notifyByEmail ?? true,
        notifyByPush: notifyByPush ?? true,
      },
    };
  },
};
