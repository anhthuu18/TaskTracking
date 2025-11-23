// Task Service - Connects to the Backend Task APIs
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl, getCurrentApiConfig } from '../config/api';
import { Task, CreateTaskDto, UpdateTaskDto, TaskUser } from '../types/Task';

export interface TaskResponse {
  success: boolean;
  message: string;
  data: Task;
}

export interface TaskListResponse {
  success: boolean;
  message: string;
  data: Task[];
}

export interface AssigneeListResponse {
  success: boolean;
  message: string;
  data: TaskUser[];
}

class TaskService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch {
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

      let data: any = {};
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.warn('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (error: any) {
      console.warn('Request failed:', error);
      const isAbort = error?.name === 'AbortError';
      const errorMessage = isAbort ? 'Request timeout' : (error?.message || 'Network error');
      throw new Error(errorMessage);
    } finally {
      clearTimeout(timeout);
    }
  }

  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const url = buildApiUrl(getCurrentApiConfig().ENDPOINTS.TASK.CREATE);
    return this.request<Task>(url, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.GET_BY_PROJECT}/${projectId}`);
    return this.request<Task[]>(url, { method: 'GET' });
  }

  async updateTask(taskId: number, updates: UpdateTaskDto): Promise<Task> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.UPDATE}/${taskId}`);
    return this.request<Task>(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: number): Promise<{ message: string }> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.DELETE}/${taskId}`);
    return this.request<{ message: string }>(url, { method: 'DELETE' });
  }

  async getAvailableAssignees(projectId: number): Promise<TaskUser[]> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.GET_ASSIGNEES}/${projectId}/assignees`);
    return this.request<TaskUser[]>(url, { method: 'GET' });
  }

  async getTasksByWorkspace(workspaceId: number | string): Promise<Task[]> {
    const url = buildApiUrl(`${getCurrentApiConfig().ENDPOINTS.TASK.GET_BY_WORKSPACE}/${workspaceId}`);
    return this.request<Task[]>(url, { method: 'GET' });
  }

  async createDefaultStatuses(projectId: number): Promise<{ message: string }> {
    const base = getCurrentApiConfig().ENDPOINTS.TASK.GET_BY_PROJECT; // '/tasks/project'
    const url = buildApiUrl(`${base}/${projectId}/statuses/default`);
    return this.request<{ message: string }>(url, { method: 'POST' });
  }
}

export const taskService = new TaskService();
