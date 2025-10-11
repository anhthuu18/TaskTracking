// Workspace Service - Kết nối với Backend workspace APIs
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Workspace, 
  WorkspaceMember, 
  CreateWorkspaceRequest, 
  UpdateWorkspaceRequest,
  InviteMemberRequest,
  WorkspaceResponse,
  WorkspaceListResponse,
  WorkspaceMemberResponse,
  DeleteWorkspaceResponse,
  WorkspaceType 
} from '../types/Workspace';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';

class WorkspaceService {
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

  // Tạo workspace mới
  async createWorkspace(workspaceData: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockCreateWorkspace(workspaceData);
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.WORKSPACE.CREATE);
    return this.request<WorkspaceResponse>(url, {
      method: 'POST',
      body: JSON.stringify(workspaceData),
    });
  }

  // Lấy tất cả workspace của user
  async getAllWorkspaces(): Promise<WorkspaceListResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetAllWorkspaces();
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.WORKSPACE.LIST_ALL);
    return this.request<WorkspaceListResponse>(url, {
      method: 'GET',
    });
  }

  // Lấy personal workspace
  async getPersonalWorkspaces(): Promise<WorkspaceListResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetPersonalWorkspaces();
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.WORKSPACE.LIST_PERSONAL);
    return this.request<WorkspaceListResponse>(url, {
      method: 'GET',
    });
  }

  // Lấy group workspace
  async getGroupWorkspaces(): Promise<WorkspaceListResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetGroupWorkspaces();
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.WORKSPACE.LIST_GROUP);
    return this.request<WorkspaceListResponse>(url, {
      method: 'GET',
    });
  }

  // Lấy chi tiết workspace
  async getWorkspaceDetails(workspaceId: number): Promise<WorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetWorkspaceDetails(workspaceId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.WORKSPACE.GET_DETAILS}/${workspaceId}`);
    return this.request<WorkspaceResponse>(url, {
      method: 'GET',
    });
  }

  // Cập nhật workspace
  async updateWorkspace(workspaceId: number, updates: UpdateWorkspaceRequest): Promise<WorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockUpdateWorkspace(workspaceId, updates);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.WORKSPACE.GET_DETAILS}/${workspaceId}`);
    return this.request<WorkspaceResponse>(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Xóa workspace
  async deleteWorkspace(workspaceId: number): Promise<DeleteWorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockDeleteWorkspace(workspaceId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.WORKSPACE.DELETE}/${workspaceId}`);
    return this.request<DeleteWorkspaceResponse>(url, {
      method: 'DELETE',
    });
  }

  // Khôi phục workspace
  async restoreWorkspace(workspaceId: number): Promise<DeleteWorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockRestoreWorkspace(workspaceId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.WORKSPACE.RESTORE}/${workspaceId}`);
    return this.request<DeleteWorkspaceResponse>(url, {
      method: 'PUT',
    });
  }

  // Lấy workspace đã xóa
  async getDeletedWorkspaces(): Promise<WorkspaceListResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetDeletedWorkspaces();
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.WORKSPACE.LIST_DELETED);
    return this.request<WorkspaceListResponse>(url, {
      method: 'GET',
    });
  }

  // Lấy members của workspace
  async getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetWorkspaceMembers(workspaceId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.WORKSPACE.GET_MEMBERS}/${workspaceId}/members`);
    return this.request<WorkspaceMemberResponse>(url, {
      method: 'GET',
    });
  }

  // Mời member vào workspace
  async inviteMemberToWorkspace(workspaceId: number, inviteData: InviteMemberRequest): Promise<DeleteWorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockInviteMember(workspaceId, inviteData);
    }

    const url = buildApiUrl(`/workspace/${workspaceId}/invite-member`);
    return this.request<DeleteWorkspaceResponse>(url, {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  }

  // Lấy danh sách invitations của workspace
  async getWorkspaceInvitations(workspaceId: number): Promise<any> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetWorkspaceInvitations(workspaceId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.WORKSPACE.GET_MEMBERS}/${workspaceId}/invitations`);
    return this.request<any>(url, {
      method: 'GET',
    });
  }

  // Gửi lời mời member
  async inviteMember(workspaceId: number, email: string, role: string): Promise<any> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockInviteMember(workspaceId, { email, inviteType: 'EMAIL' });
    }

    const url = buildApiUrl(`/workspace/${workspaceId}/invite`);
    return this.request<any>(url, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  // Chấp nhận lời mời
  async acceptInvitation(token: string): Promise<DeleteWorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockAcceptInvitation(token);
    }

    const url = buildApiUrl(`/workspace/accept-invitation/${token}`);
    return this.request<DeleteWorkspaceResponse>(url, {
      method: 'POST',
    });
  }

  // ==================== MOCK METHODS ====================
  
  private async mockCreateWorkspace(workspaceData: CreateWorkspaceRequest): Promise<WorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const newWorkspace: Workspace = {
          id: Date.now(),
          workspaceName: workspaceData.workspaceName,
          description: workspaceData.description,
          userId: 1, // Mock user ID
          workspaceType: workspaceData.workspaceType,
          dateCreated: new Date(),
          dateModified: new Date(),
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          memberCount: 1,
          userRole: 'OWNER' as any,
        };

        resolve({
          success: true,
          message: 'Workspace được tạo thành công',
          data: newWorkspace,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetAllWorkspaces(): Promise<WorkspaceListResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockWorkspaces: Workspace[] = [
          {
            id: 1,
            workspaceName: 'Personal Tasks',
            description: 'My personal workspace',
            userId: 1,
            workspaceType: WorkspaceType.PERSONAL,
            dateCreated: new Date('2024-01-01'),
            dateModified: new Date(),
            memberCount: 1,
            userRole: 'OWNER' as any,
          },
          {
            id: 2,
            workspaceName: 'Team Project',
            description: 'Collaborative workspace for team',
            userId: 1,
            workspaceType: WorkspaceType.GROUP,
            dateCreated: new Date('2024-01-15'),
            dateModified: new Date(),
            memberCount: 5,
            userRole: 'ADMIN' as any,
          },
          {
            id: 3,
            workspaceName: 'Design Team',
            description: 'UI/UX design workspace',
            userId: 2,
            workspaceType: WorkspaceType.GROUP,
            dateCreated: new Date('2024-02-01'),
            dateModified: new Date(),
            memberCount: 3,
            userRole: 'MEMBER' as any,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách workspace thành công',
          data: mockWorkspaces,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetPersonalWorkspaces(): Promise<WorkspaceListResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockWorkspaces: Workspace[] = [
          {
            id: 1,
            workspaceName: 'Personal Tasks',
            description: 'My personal workspace',
            userId: 1,
            workspaceType: WorkspaceType.PERSONAL,
            dateCreated: new Date('2024-01-01'),
            dateModified: new Date(),
            memberCount: 1,
            userRole: 'OWNER' as any,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách personal workspace thành công',
          data: mockWorkspaces,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetGroupWorkspaces(): Promise<WorkspaceListResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockWorkspaces: Workspace[] = [
          {
            id: 2,
            workspaceName: 'Team Project',
            description: 'Collaborative workspace for team',
            userId: 1,
            workspaceType: WorkspaceType.GROUP,
            dateCreated: new Date('2024-01-15'),
            dateModified: new Date(),
            memberCount: 5,
            userRole: 'ADMIN' as any,
          },
          {
            id: 3,
            workspaceName: 'Design Team',
            description: 'UI/UX design workspace',
            userId: 2,
            workspaceType: WorkspaceType.GROUP,
            dateCreated: new Date('2024-02-01'),
            dateModified: new Date(),
            memberCount: 3,
            userRole: 'MEMBER' as any,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách group workspace thành công',
          data: mockWorkspaces,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetWorkspaceDetails(workspaceId: number): Promise<WorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockWorkspace: Workspace = {
          id: workspaceId,
          workspaceName: 'Team Project',
          description: 'Collaborative workspace for team',
          userId: 1,
          workspaceType: WorkspaceType.GROUP,
          dateCreated: new Date('2024-01-15'),
          dateModified: new Date(),
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          memberCount: 5,
          userRole: 'ADMIN' as any,
        };

        resolve({
          success: true,
          message: 'Lấy thông tin workspace thành công',
          data: mockWorkspace,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockUpdateWorkspace(workspaceId: number, updates: UpdateWorkspaceRequest): Promise<WorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedWorkspace: Workspace = {
          id: workspaceId,
          workspaceName: updates.workspaceName || 'Updated Workspace',
          description: updates.description,
          userId: 1,
          workspaceType: WorkspaceType.GROUP,
          dateCreated: new Date('2024-01-15'),
          dateModified: new Date(),
          memberCount: 5,
          userRole: 'ADMIN' as any,
        };

        resolve({
          success: true,
          message: 'Workspace đã được cập nhật thành công',
          data: updatedWorkspace,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockDeleteWorkspace(workspaceId: number): Promise<DeleteWorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Workspace đã được xóa thành công',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockRestoreWorkspace(workspaceId: number): Promise<DeleteWorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Workspace đã được khôi phục thành công',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetDeletedWorkspaces(): Promise<WorkspaceListResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockWorkspaces: Workspace[] = [
          {
            id: 99,
            workspaceName: 'Deleted Workspace',
            description: 'This workspace was deleted',
            userId: 1,
            workspaceType: WorkspaceType.GROUP,
            dateCreated: new Date('2024-01-01'),
            dateModified: new Date(),
            memberCount: 2,
            userRole: 'OWNER' as any,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách workspace đã xóa thành công',
          data: mockWorkspaces,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockMembers: WorkspaceMember[] = [
          {
            id: 1,
            workspaceId: workspaceId,
            userId: 1,
            role: 'OWNER' as any,
            joinedAt: new Date('2024-01-01'),
            user: {
              id: 1,
              username: 'john_doe',
              email: 'john@example.com',
              name: 'John Doe',
              avatar: 'https://i.pravatar.cc/150?img=1',
            },
          },
          {
            id: 2,
            workspaceId: workspaceId,
            userId: 2,
            role: 'ADMIN' as any,
            joinedAt: new Date('2024-01-15'),
            user: {
              id: 2,
              username: 'jane_smith',
              email: 'jane@example.com',
              name: 'Jane Smith',
              avatar: 'https://i.pravatar.cc/150?img=2',
            },
          },
          {
            id: 3,
            workspaceId: workspaceId,
            userId: 3,
            role: 'MEMBER' as any,
            joinedAt: new Date('2024-02-01'),
            user: {
              id: 3,
              username: 'bob_wilson',
              email: 'bob@example.com',
              name: 'Bob Wilson',
              avatar: 'https://i.pravatar.cc/150?img=3',
            },
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách members thành công',
          data: mockMembers,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockInviteMember(workspaceId: number, inviteData: InviteMemberRequest): Promise<DeleteWorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Đã gửi lời mời đến ${inviteData.email}`,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetWorkspaceInvitations(workspaceId: number): Promise<any> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockInvitations = [
          {
            id: 1,
            workspaceId: workspaceId,
            email: 'newuser@example.com',
            role: 'MEMBER',
            status: 'pending',
            createdAt: new Date('2024-01-20'),
            invitedBy: 1,
          },
          {
            id: 2,
            workspaceId: workspaceId,
            email: 'designer@example.com',
            role: 'ADMIN',
            status: 'pending',
            createdAt: new Date('2024-01-22'),
            invitedBy: 1,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách invitations thành công',
          data: mockInvitations,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockAcceptInvitation(token: string): Promise<DeleteWorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Đã chấp nhận lời mời thành công',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  // Remove member from workspace
  async removeMemberFromWorkspace(workspaceId: number, memberId: number): Promise<DeleteWorkspaceResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockRemoveMemberFromWorkspace(memberId);
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${API_CONFIG.REAL_API.BASE_URL}/workspace/${workspaceId}/remove-member/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }

      return {
        success: true,
        message: data.message || 'Member removed successfully',
      };
    } catch (error) {
      console.error('Error removing member:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove member',
      };
    }
  }

  private async mockRemoveMemberFromWorkspace(memberId: number): Promise<DeleteWorkspaceResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Member removed successfully',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }
}

export const workspaceService = new WorkspaceService();
