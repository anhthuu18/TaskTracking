import { buildApiUrl, getCurrentApiConfig } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CreateEventDto {
  eventName: string;
  description?: string;
  projectId: number;
  startTime: string;
  endTime: string;
}

export interface UpdateEventDto {
  eventName?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

export interface Event {
  id: number;
  eventName: string;
  description?: string;
  projectId: number;
  creatorId: number;
  startTime: string;
  endTime: string;
  dateCreated: string;
  dateModified: string;
  project?: {
    projectName: string;
  };
  creator?: {
    username: string;
    email: string;
  };
}

class EventService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async createEvent(eventData: CreateEventDto): Promise<Event> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl('/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async getEventById(eventId: number): Promise<Event> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl(`/events/${eventId}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  async getEventsByProject(projectId: number): Promise<Event[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        buildApiUrl(`/events/project/${projectId}`),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch events');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEventsByWorkspace(workspaceId: number): Promise<Event[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        buildApiUrl(`/events/workspace/${workspaceId}`),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to fetch workspace events',
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workspace events:', error);
      throw error;
    }
  }

  async updateEvent(
    eventId: number,
    eventData: UpdateEventDto,
  ): Promise<Event> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl(`/events/${eventId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: number): Promise<{ message: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl(`/events/${eventId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
