import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl } from '../config/api';

export enum SessionType {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export interface TimeTrackingSession {
  id: number;
  taskId: number;
  userId: number;
  sessionType: SessionType;
  duration: number; // in minutes
  startTime: string;
  endTime?: string;
  isCompleted: boolean;
  completedAt?: string;
  dateCreated: string;
  dateModified: string;
}

export interface PomodoroStatistics {
  id: number;
  taskId: number;
  userId: number;
  totalFocusTime: number;
  totalBreakTime: number;
  completedSessions: number;
  totalSessions: number;
  lastTrackedDate?: string;
  dateCreated: string;
  dateModified: string;
}

export interface TrackingHistory {
  date: string;
  sessions: number;
  totalMinutes: number;
  focusMinutes: number;
  breakMinutes: number;
}

class TimeTrackingService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string> || {}),
      };

      const response = await fetch(buildApiUrl(endpoint), {
        ...options,
        headers,
        signal: controller.signal,
      });

      let data: any = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        const errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError';
      const errorMessage = isAbort ? 'Request timeout' : (error?.message || 'Network error');
      throw new Error(errorMessage);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Create a new time tracking session
  async createSession(
    taskId: number,
    sessionType: SessionType,
    duration: number,
    startTime: Date,
    endTime?: Date
  ): Promise<TimeTrackingSession> {
    return this.request<TimeTrackingSession>('/time-tracking/sessions', {
      method: 'POST',
      body: JSON.stringify({
        taskId,
        sessionType,
        duration,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        isCompleted: false,
      }),
    });
  }

  // Update a time tracking session
  async updateSession(
    sessionId: number,
    updates: {
      sessionType?: SessionType;
      duration?: number;
      startTime?: Date;
      endTime?: Date;
      isCompleted?: boolean;
    }
  ): Promise<TimeTrackingSession> {
    const updateData: any = {};
    if (updates.sessionType) updateData.sessionType = updates.sessionType;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.startTime) updateData.startTime = updates.startTime.toISOString();
    if (updates.endTime) updateData.endTime = updates.endTime.toISOString();
    if (updates.isCompleted !== undefined) updateData.isCompleted = updates.isCompleted;

    return this.request<TimeTrackingSession>(`/time-tracking/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Complete a time tracking session
  async completeSession(sessionId: number): Promise<TimeTrackingSession> {
    return this.request<TimeTrackingSession>(`/time-tracking/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  // Get all sessions for a task
  async getSessionsByTask(taskId: number): Promise<TimeTrackingSession[]> {
    return this.request<TimeTrackingSession[]>(`/time-tracking/sessions/task/${taskId}`, {
      method: 'GET',
    });
  }

  // Get sessions for a task today
  async getSessionsByTaskToday(taskId: number): Promise<TimeTrackingSession[]> {
    return this.request<TimeTrackingSession[]>(`/time-tracking/sessions/task/${taskId}/today`, {
      method: 'GET',
    });
  }

  // Delete a session
  async deleteSession(sessionId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/time-tracking/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Get statistics for a task
  async getTaskStatistics(taskId: number): Promise<PomodoroStatistics> {
    return this.request<PomodoroStatistics>(`/time-tracking/stats/${taskId}`, {
      method: 'GET',
    });
  }

  // Get tracking history
  async getTrackingHistory(taskId: number, days: number = 7): Promise<TrackingHistory[]> {
    return this.request<TrackingHistory[]>(`/time-tracking/history/${taskId}?days=${days}`, {
      method: 'GET',
    });
  }

  // Persist timer state locally
  async saveTimerState(taskId: number, timerState: any): Promise<void> {
    const key = `timerState_${taskId}`;
    await AsyncStorage.setItem(key, JSON.stringify(timerState));
  }

  async getTimerState(taskId: number): Promise<any | null> {
    const key = `timerState_${taskId}`;
    const state = await AsyncStorage.getItem(key);
    return state ? JSON.parse(state) : null;
  }

  async clearTimerState(taskId: number): Promise<void> {
    const key = `timerState_${taskId}`;
    await AsyncStorage.removeItem(key);
  }
}

export const timeTrackingService = new TimeTrackingService();

