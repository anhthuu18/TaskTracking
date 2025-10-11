import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';

export interface Notification {
  id: number;
  workspaceId: number;
  email: string;
  invitedBy: number;
  inviteType: 'EMAIL' | 'IN_APP';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  token: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  workspace: {
    id: number;
    workspaceName: string;
    workspaceType: 'PERSONAL' | 'GROUP';
  };
  inviter: {
    id: number;
    username: string;
    email: string;
  };
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
}

export interface ProjectInvitePayload {
  projectId: number;
  emails: string[];
  message?: string;
}

class NotificationService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string> || {}),
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data as T;
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError';
      throw new Error(isAbort ? 'Request timeout' : (error?.message || 'Network error'));
    } finally {
      clearTimeout(timeout);
    }
  }

  // Get user notifications
  async getUserNotifications(): Promise<NotificationResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetUserNotifications();
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.NOTIFICATION.GET_ALL);
    return this.request<NotificationResponse>(url, {
      method: 'GET',
    });
  }

  // Accept an invitation
  async acceptInvitation(invitationId: number): Promise<ActionResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockAcceptInvitation(invitationId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.NOTIFICATION.ACCEPT}/${invitationId}`);
    return this.request<ActionResponse>(url, {
      method: 'POST',
    });
  }

  // Create in-app notifications for project invite (no accept/reject required)
  async createProjectInviteNotification(payload: ProjectInvitePayload): Promise<ActionResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Project invites sent' }), API_CONFIG.MOCK_DELAY));
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.NOTIFICATION.PROJECT_INVITE);
    return this.request<ActionResponse>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Decline an invitation
  async declineInvitation(invitationId: number): Promise<ActionResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockDeclineInvitation(invitationId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.NOTIFICATION.DECLINE}/${invitationId}`);
    return this.request<ActionResponse>(url, {
      method: 'POST',
    });
  }

  // ==================== MOCK METHODS ====================
  
  private async mockGetUserNotifications(): Promise<NotificationResponse> {

    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockNotifications: Notification[] = [
          {
            id: 1,
            workspaceId: 2,
            email: 'anhthuu18@gmail.com',
            invitedBy: 1,
            inviteType: 'EMAIL',
            status: 'PENDING',
            token: 'mock-token-1',
            message: 'Welcome to our team! We\'d love to have you join our project.',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            createdAt: new Date('2024-01-20').toISOString(),
            updatedAt: new Date('2024-01-20').toISOString(),
            workspace: {
              id: 2,
              workspaceName: 'Team Project Alpha',
              workspaceType: 'GROUP',
            },
            inviter: {
              id: 1,
              username: 'john_doe',
              email: 'john@example.com',
            },
          },
          {
            id: 2,
            workspaceId: 3,
            email: 'anhthuu18@gmail.com',
            invitedBy: 2,
            inviteType: 'EMAIL',
            status: 'PENDING',
            token: 'mock-token-2',
            message: 'We need your design expertise for our new project.',
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            createdAt: new Date('2024-01-22').toISOString(),
            updatedAt: new Date('2024-01-22').toISOString(),
            workspace: {
              id: 3,
              workspaceName: 'Design Team',
              workspaceType: 'GROUP',
            },
            inviter: {
              id: 2,
              username: 'jane_smith',
              email: 'jane@example.com',
            },
          },
        ];

        resolve({
          success: true,
          message: 'Notifications retrieved successfully',
          data: mockNotifications,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockAcceptInvitation(invitationId: number): Promise<ActionResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Successfully joined workspace',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockDeclineInvitation(invitationId: number): Promise<ActionResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Invitation declined',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }
}

export const notificationService = new NotificationService();
