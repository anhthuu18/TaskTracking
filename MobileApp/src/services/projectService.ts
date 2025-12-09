// Project Service - Kết nối với Backend project APIs
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Project, 
  ProjectMember, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  InviteProjectMemberRequest,
  UpdateMemberRoleRequest,
  ProjectResponse,
  ProjectListResponse,
  ProjectMemberResponse,
  DeleteProjectResponse,
  ProjectMemberRole 
} from '../types/Project';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';

class ProjectService {
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

      // remove verbose request logs

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      // remove verbose response logs

      let data;
      try {
        data = await response.json();
        // remove verbose data logs
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        data = {};
      }

      if (!response.ok) {
        const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (error: any) {
      console.error('Request failed:', error);
      const isAbort = error?.name === 'AbortError';
      const errorMessage = isAbort ? 'Request timeout' : (error?.message || 'Network error');
      throw new Error(errorMessage);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Tạo project mới
  async createProject(projectData: CreateProjectRequest): Promise<ProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockCreateProject(projectData);
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.PROJECT.CREATE);
    const backendResponse = await this.request<any>(url, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });

    // Backend trả về object trực tiếp, cần wrap thành format mong đợi
    return {
      success: true,
      message: 'Project được tạo thành công',
      data: backendResponse,
    };
  }

  // Lấy danh sách project theo workspace
  async getProjectsByWorkspace(workspaceId: number): Promise<ProjectListResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetProjectsByWorkspace(workspaceId);
    }

    // Sử dụng endpoint list-by-workspace với workspaceId
    const endpointsProject = (getCurrentApiConfig() as any).ENDPOINTS.PROJECT;
    const listByWorkspace = endpointsProject.LIST_BY_WORKSPACE || endpointsProject.LIST_ALL;
    const url = buildApiUrl(`${listByWorkspace}/${workspaceId}`);
    const backendResponse = await this.request<any[]>(url, {
        method: 'GET',
    });

    // Backend trả về array trực tiếp, cần wrap thành format mong đợi
    return {
      success: true,
      message: 'Lấy danh sách project thành công',
      data: backendResponse || [],
    };
  }

  // Lấy chi tiết project
  async getProjectDetails(projectId: number): Promise<ProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetProjectDetails(projectId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.GET_DETAILS}/${projectId}`);
    const backendResponse = await this.request<any>(url, {
        method: 'GET',
    });

    // Map projectRole to role for members
    if (backendResponse?.members && Array.isArray(backendResponse.members)) {
      backendResponse.members = backendResponse.members.map((member: any) => {
        // Map projectRole.roleName to ProjectMemberRole enum
        let role = ProjectMemberRole.MEMBER;
        if (member.projectRole?.roleName === 'Admin') {
          role = ProjectMemberRole.ADMIN;
        } else if (member.projectRole?.roleName === 'Owner') {
          role = ProjectMemberRole.OWNER;
        }
        return {
          ...member,
          role,
          // Normalize join date field name for UI components
          joinedAt: member.joinedAt || member.dateJoined || member.joined_at || member.joined || null,
        };
      });
    }

    // Backend trả về object trực tiếp, cần wrap thành format mong đợi
    return {
      success: true,
      message: 'Lấy thông tin project thành công',
      data: backendResponse,
    };
  }

  // Add member directly (no accept flow, member must already be in workspace)
  async addMemberToProject(projectId: number, userId: number, projectRoleId?: number): Promise<DeleteProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return { success: true, message: 'Member added (mock)' } as any;
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.ADD_MEMBER}/${projectId}`);
    const body: any = { userId, projectRoleId };
    return this.request<DeleteProjectResponse>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Create a project role (used to ensure 'Member' role exists)
  async createProjectRole(projectId: number, roleName: string, description?: string, permissionIds?: number[]): Promise<any> {
    if (API_CONFIG.USE_MOCK_API) {
      return { id: 2, roleName };
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.CREATE_ROLE}/${projectId}`);
    return this.request<any>(url, {
      method: 'POST',
      body: JSON.stringify({ roleName, description, permissionIds }),
    });
  }

  // Cập nhật project
  async updateProject(projectId: number, updates: UpdateProjectRequest): Promise<ProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockUpdateProject(projectId, updates);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.UPDATE}/${projectId}`);
    const backendResponse = await this.request<any>(url, {
      method: 'PUT',
        body: JSON.stringify(updates),
      });

    // Backend trả về object trực tiếp, cần wrap thành format mong đợi
    return {
      success: true,
      message: 'Project đã được cập nhật thành công',
      data: backendResponse,
    };
  }

  // Xóa project
  async deleteProject(projectId: number): Promise<DeleteProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockDeleteProject(projectId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.DELETE}/${projectId}`);
    const backendResponse = await this.request<any>(url, {
      method: 'DELETE',
    });

    // Backend trả về { message: string }, cần wrap thành format mong đợi
    return {
      success: true,
      message: backendResponse?.message || 'Project đã được xóa thành công',
    };
  }

  // Khôi phục project
  async restoreProject(projectId: number): Promise<DeleteProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockRestoreProject(projectId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.RESTORE}/${projectId}`);
    const backendResponse = await this.request<any>(url, {
      method: 'PUT',
    });

    // Backend trả về object trực tiếp, cần wrap thành format mong đợi
    return {
      success: true,
      message: 'Project đã được khôi phục thành công',
    };
  }

  // Lấy project đã xóa
  async getDeletedProjects(): Promise<ProjectListResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetDeletedProjects();
    }

    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.PROJECT.LIST_DELETED);
    const backendResponse = await this.request<any[]>(url, {
      method: 'GET',
    });

    // Backend trả về array trực tiếp, cần wrap thành format mong đợi
    return {
      success: true,
      message: 'Lấy danh sách project đã xóa thành công',
      data: backendResponse || [],
    };
  }

  // Lấy members của project (backend không có GET /projects/get-members/:id)
  // -> dùng GET /projects/get-details/:id rồi lấy field members
  async getProjectMembers(projectId: number): Promise<ProjectMemberResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockGetProjectMembers(projectId);
    }

    const detailsUrl = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.GET_DETAILS}/${projectId}`);
    const project = await this.request<any>(detailsUrl, { method: 'GET' });
    let members: ProjectMember[] = project?.members || project?.data?.members || [];

    // Map projectRole to role for members
    members = members.map((member: any) => {
      let role = ProjectMemberRole.MEMBER;
      if (member.projectRole?.roleName === 'Admin') {
        role = ProjectMemberRole.ADMIN;
      } else if (member.projectRole?.roleName === 'Owner') {
        role = ProjectMemberRole.OWNER;
      }
      return {
        ...member,
        role
      };
    });

    // Ensure project owner appears as a member-like entry for permission mapping
    const owner = project?.user || project?.data?.user;
    if (owner && !members.some((m: any) => m.userId === owner.id)) {
      const ownerMember: ProjectMember = {
        id: -owner.id,
        projectId: project?.id || project?.data?.id || projectId,
        userId: owner.id,
        role: ProjectMemberRole.OWNER,
        joinedAt: new Date(),
        user: { id: owner.id, username: owner.username, email: owner.email },
      };
      members = [ownerMember, ...members];
    }

    return {
      success: true,
      message: 'Fetched project members',
      data: members,
    };
  }

  // Mời member vào project
  async inviteMemberToProject(projectId: number, inviteData: InviteProjectMemberRequest): Promise<DeleteProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockInviteMember(projectId, inviteData);
    }

    // Backend uses route: POST /projects/:id/invite-member
    const base = getCurrentApiConfig().ENDPOINTS.PROJECT.INVITE_MEMBER;
    const url = buildApiUrl(base.replace(':id', String(projectId)));
    // Auto send to both CHANNELs if backend supports single value; default to IN_APP
    const payload = { ...inviteData } as any;
    if (!payload.inviteType) {
      payload.inviteType = 'IN_APP';
    }
    return this.request<DeleteProjectResponse>(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Xóa member khỏi project
  async removeMemberFromProject(projectId: number, memberId: number): Promise<DeleteProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockRemoveMember(projectId, memberId);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.REMOVE_MEMBER}/${projectId}/${memberId}`);
    return this.request<DeleteProjectResponse>(url, {
      method: 'DELETE',
    });
  }

  // Cập nhật role của member
  async updateMemberRole(projectId: number, memberId: number, roleData: UpdateMemberRoleRequest): Promise<DeleteProjectResponse> {
    if (API_CONFIG.USE_MOCK_API) {
      return this.mockUpdateMemberRole(projectId, memberId, roleData);
    }

    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.PROJECT.UPDATE_MEMBER_ROLE}/${projectId}/${memberId}`);
    return this.request<DeleteProjectResponse>(url, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  }

  async toggleStarProject(projectId: number): Promise<{ success: boolean; isStarred: boolean }> {
    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.PROJECT.STAR_PROJECT.replace(':id', String(projectId)));
    return this.request<{ success: boolean; isStarred: boolean }>(url, {
      method: 'POST',
    });
  }

  async updateProjectLastOpened(projectId: number): Promise<{ success: boolean }> {
    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.PROJECT.UPDATE_LAST_OPENED.replace(':id', String(projectId)));  
    return this.request<{ success: boolean }>(url, {
      method: 'POST',
    });
  }

  // ==================== MOCK METHODS ====================
  
  private async mockCreateProject(projectData: CreateProjectRequest): Promise<ProjectResponse> {
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProject: Project = {
          id: Date.now(),
          projectName: projectData.projectName,
          description: projectData.description,
          workspaceId: projectData.workspaceId,
          userId: 1, // Mock user ID
          dateCreated: new Date(),
          dateModified: new Date(),
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
          workspace: {
            id: projectData.workspaceId,
            workspaceName: 'Mock Workspace',
          },
          memberCount: 1,
          userRole: ProjectMemberRole.OWNER,
        };

        resolve({
          success: true,
          message: 'Project được tạo thành công',
          data: newProject,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetProjectsByWorkspace(workspaceId: number): Promise<ProjectListResponse> {
    console.log('Mock API: Getting projects by workspace', workspaceId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProjects: Project[] = [
          {
            id: 1,
            projectName: 'Mobile App Development',
            description: 'React Native mobile application',
            workspaceId: workspaceId,
            userId: 1,
            dateCreated: new Date('2024-01-01'),
            dateModified: new Date(),
            workspace: {
              id: workspaceId,
              workspaceName: 'Tech Team',
            },
            memberCount: 4,
            userRole: ProjectMemberRole.OWNER,
          },
          {
            id: 2,
            projectName: 'Website Redesign',
            description: 'Complete website overhaul',
            workspaceId: workspaceId,
            userId: 2,
            dateCreated: new Date('2024-01-15'),
            dateModified: new Date(),
            workspace: {
              id: workspaceId,
              workspaceName: 'Tech Team',
            },
            memberCount: 3,
            userRole: ProjectMemberRole.ADMIN,
          },
          {
            id: 3,
            projectName: 'API Integration',
            description: 'Third-party API integrations',
            workspaceId: workspaceId,
            userId: 1,
            dateCreated: new Date('2024-02-01'),
            dateModified: new Date(),
            workspace: {
              id: workspaceId,
              workspaceName: 'Tech Team',
            },
            memberCount: 2,
            userRole: ProjectMemberRole.MEMBER,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách project thành công',
          data: mockProjects,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetProjectDetails(projectId: number): Promise<ProjectResponse> {
    console.log('Mock API: Getting project details', projectId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProject: Project = {
          id: projectId,
          projectName: 'Mobile App Development',
          description: 'React Native mobile application with advanced features',
          workspaceId: 1,
          userId: 1,
          dateCreated: new Date('2024-01-01'),
          dateModified: new Date(),
          user: {
            id: 1,
            username: 'john_doe',
            email: 'john@example.com',
          },
          workspace: {
            id: 1,
            workspaceName: 'Tech Team',
          },
          memberCount: 4,
          userRole: ProjectMemberRole.OWNER,
        };

        resolve({
          success: true,
          message: 'Lấy thông tin project thành công',
          data: mockProject,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockUpdateProject(projectId: number, updates: UpdateProjectRequest): Promise<ProjectResponse> {
    console.log('Mock API: Updating project', projectId, updates);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedProject: Project = {
          id: projectId,
          projectName: updates.projectName || 'Updated Project',
          description: updates.description,
          workspaceId: 1,
          userId: 1,
          dateCreated: new Date('2024-01-01'),
          dateModified: new Date(),
          memberCount: 4,
          userRole: ProjectMemberRole.OWNER,
        };

        resolve({
          success: true,
          message: 'Project đã được cập nhật thành công',
          data: updatedProject,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockDeleteProject(projectId: number): Promise<DeleteProjectResponse> {
    console.log('Mock API: Deleting project', projectId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Project đã được xóa thành công',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockRestoreProject(projectId: number): Promise<DeleteProjectResponse> {
    console.log('Mock API: Restoring project', projectId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Project đã được khôi phục thành công',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetDeletedProjects(): Promise<ProjectListResponse> {
    console.log('Mock API: Getting deleted projects');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProjects: Project[] = [
          {
            id: 99,
            projectName: 'Deleted Project',
            description: 'This project was deleted',
            workspaceId: 1,
            userId: 1,
            dateCreated: new Date('2024-01-01'),
            dateModified: new Date(),
            memberCount: 2,
            userRole: ProjectMemberRole.OWNER,
          },
        ];

        resolve({
          success: true,
          message: 'Lấy danh sách project đã xóa thành công',
          data: mockProjects,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockGetProjectMembers(projectId: number): Promise<ProjectMemberResponse> {
    console.log('Mock API: Getting project members', projectId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockMembers: ProjectMember[] = [
          {
            id: 1,
            projectId: projectId,
            userId: 1,
            role: ProjectMemberRole.OWNER,
            joinedAt: new Date('2024-01-01'),
            user: {
              id: 1,
              username: 'john_doe',
              email: 'john@example.com',
            },
          },
          {
            id: 2,
            projectId: projectId,
            userId: 2,
            role: ProjectMemberRole.ADMIN,
            joinedAt: new Date('2024-01-15'),
            user: {
              id: 2,
              username: 'jane_smith',
              email: 'jane@example.com',
            },
          },
          {
            id: 3,
            projectId: projectId,
            userId: 3,
            role: ProjectMemberRole.MEMBER,
            joinedAt: new Date('2024-02-01'),
            user: {
              id: 3,
              username: 'bob_wilson',
              email: 'bob@example.com',
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

  private async mockInviteMember(projectId: number, inviteData: InviteProjectMemberRequest): Promise<DeleteProjectResponse> {
    console.log('Mock API: Inviting member to project', projectId, inviteData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Đã gửi lời mời đến ${inviteData.email}`,
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockRemoveMember(projectId: number, memberId: number): Promise<DeleteProjectResponse> {
    console.log('Mock API: Removing member from project', projectId, memberId);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Member đã được xóa khỏi project',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockUpdateMemberRole(projectId: number, memberId: number, roleData: UpdateMemberRoleRequest): Promise<DeleteProjectResponse> {
    console.log('Mock API: Updating member role', projectId, memberId, roleData);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Role của member đã được cập nhật',
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  }

  private async mockToggleStarProject(projectId: number): Promise<{ success: boolean; isStarred: boolean }> {
    console.log('Mock API: Toggling star for project', projectId);
    return new Promise((resolve) => {
      setTimeout(() => {
        const isStarred = Math.random() > 0.5;
        resolve({
          success: true,
          isStarred: isStarred,
        });
      }, 100);
    });
  }

  private async mockUpdateProjectLastOpened(projectId: number): Promise<{ success: boolean }> {
    console.log('Mock API: Updating last opened for project', projectId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  }
}

export const projectService = new ProjectService();