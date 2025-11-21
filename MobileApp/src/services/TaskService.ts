// Task Service - Connects to the Backend Task APIs
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';
import { Task, CreateTaskDto, UpdateTaskDto, TaskUser } from '../types/Task';

// Generic response structure for a single task
export interface TaskResponse {
  success: boolean;
  message: string;
  data: Task;
}

// Generic response for a list of tasks
export interface TaskListResponse {
  success: boolean;
  message: string;
  data: Task[];
}

// Generic response for a list of assignees (users)
export interface AssigneeListResponse {
  success: boolean;
  message: string;
  data: TaskUser[];
}

class TaskService {
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

      let data;
      try {
        data = await response.json();
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

  /**
   * Create a new task.
   * @param taskData - The data for the new task.
   * @returns The created task.
   */
  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.TASK.CREATE);
    return this.request<Task>(url, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Get all tasks for a specific project.
   * @param projectId - The ID of the project.
   * @returns A list of tasks.
   */
  async getTasksByProject(projectId: number): Promise<Task[]> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.GET_BY_PROJECT}/${projectId}`);
    return this.request<Task[]>(url, {
      method: 'GET',
    });
  }

  /**
   * Update an existing task.
   * @param taskId - The ID of the task to update.
   * @param updates - The fields to update.
   * @returns The updated task.
   */
  async updateTask(taskId: number, updates: UpdateTaskDto): Promise<Task> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.UPDATE}/${taskId}`);
    return this.request<Task>(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a task.
   * @param taskId - The ID of the task to delete.
   * @returns A confirmation message.
   */
  async deleteTask(taskId: number): Promise<{ message: string }> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.DELETE}/${taskId}`);
    return this.request<{ message: string }>(url, {
      method: 'DELETE',
    });
  }

  /**
   * Get available assignees for a project (i.e., workspace members).
   * @param projectId - The ID of the project.
   * @returns A list of users who can be assigned to tasks.
   */
  async getAvailableAssignees(projectId: number): Promise<TaskUser[]> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.GET_ASSIGNEES}/${projectId}/assignees`);
    return this.request<TaskUser[]>(url, {
      method: 'GET',
    });
  }

  /**
   * Get all tasks for a specific workspace.
   * @param workspaceId - The ID of the workspace.
   * @returns A list of tasks.
   */
  async getTasksByWorkspace(workspaceId: number | string): Promise<Task[]> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.GET_BY_WORKSPACE}/${workspaceId}`);
    return this.request<Task[]>(url, {
      method: 'GET',
    });
  }
}

export const taskService = new TaskService();
