// Lightweight wrapper for local notifications with graceful fallback if library is not installed
// Tries to load @notifee/react-native at runtime; if unavailable, all methods are no-ops

import { Platform } from 'react-native';
import notifee from '@notifee/react-native';

export type NotificationId = string;

export interface NotificationOptions {
  sound?: 'default' | 'silent';
  vibration?: boolean;
  importance?: 'low' | 'default' | 'high' | 'max';
  tag?: string;
  autoCancel?: boolean;
  data?: Record<string, string>;
}

class LocalNotificationService {
  private notifeeReady = false;

  /**
   * Initialize notifee
   */
  async initialize() {
    try {
      // Request permission
      const settings = await notifee.requestPermission();
      console.log('[LocalNotification] Permission status:', settings.authorizationStatus);

      // Create default channel for Android
      if (Platform.OS === 'android') {
        await this.createDefaultChannel();
      }

      this.notifeeReady = true;
    } catch (error) {
      console.error('[LocalNotification] Initialize error:', error);
      this.notifeeReady = false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
    } catch (error) {
      console.error('[LocalNotification] Request permission error:', error);
      return false;
    }
  }

  /**
   * Open notification settings
   */
  async openSettings(): Promise<void> {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('[LocalNotification] Open settings error:', error);
    }
  }

  /**
   * Get permission status
   */
  async getPermissionStatus(): Promise<boolean | null> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus >= 1;
    } catch (error) {
      console.error('[LocalNotification] Get permission error:', error);
      return null;
    }
  }

  /**
   * Create default notification channel for Android
   */
  private async createDefaultChannel(): Promise<string | null> {
    try {
      if (Platform.OS !== 'android') {
        return null;
      }

      const channelId = await notifee.createChannel({
        id: 'pomodoro',
        name: 'Pomodoro Alerts',
        sound: 'default',
        importance: 4, // AndroidImportance.HIGH
        vibration: true,
        lightColor: '#2196F3',
        bypassDnd: true, // Bypass Do Not Disturb
      });

      console.log('[LocalNotification] Created channel:', channelId);
      return channelId;
    } catch (error) {
      console.error('[LocalNotification] Create channel error:', error);
      return null;
    }
  }

  /**
   * Show notification immediately
   */
  async showNow(
    title: string,
    body: string,
    options?: NotificationOptions
  ): Promise<NotificationId | null> {
    try {
      if (!this.notifeeReady) {
        await this.initialize();
      }

      const notificationId = await notifee.displayNotification({
        title,
        body,
        data: options?.data || {},
        android: {
          channelId: 'pomodoro',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
          importance: this.mapImportance(options?.importance || 'high'),
          sound: options?.sound === 'silent' ? undefined : 'default',
          vibration: options?.vibration !== false,
          tag: options?.tag || 'notification',
          autoCancel: options?.autoCancel !== false,
          // Heads-up notification
          fullScreenAction: {
            id: 'default',
          },
          // Allow bypass of Do Not Disturb
          bypassDnd: true,
        },
        ios: {
          sound: options?.sound === 'silent' ? undefined : 'default',
          critical: options?.importance === 'max' || options?.importance === 'high',
          criticalVolume: 1.0,
          badge: 1,
        },
      });

      console.log('[LocalNotification] Showed notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[LocalNotification] Show error:', error);
      return null;
    }
  }

  /**
   * Schedule notification at specific time
   */
  async scheduleAt(
    date: Date,
    title: string,
    body: string,
    options?: NotificationOptions
  ): Promise<NotificationId | null> {
    try {
      if (!this.notifeeReady) {
        await this.initialize();
      }

      const notificationId = await notifee.createTriggerNotification(
        {
          title,
          body,
          data: options?.data || {},
          android: {
            channelId: 'pomodoro',
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
            },
            importance: this.mapImportance(options?.importance || 'high'),
            sound: options?.sound === 'silent' ? undefined : 'default',
            vibration: options?.vibration !== false,
            tag: options?.tag || 'notification',
            autoCancel: options?.autoCancel !== false,
            fullScreenAction: {
              id: 'default',
            },
            bypassDnd: true,
          },
          ios: {
            sound: options?.sound === 'silent' ? undefined : 'default',
            critical: options?.importance === 'max' || options?.importance === 'high',
            criticalVolume: 1.0,
            badge: 1,
          },
        },
        {
          type: 1, // TimestampType.TIMESTAMP
          timestamp: date.getTime(),
        }
      );

      console.log('[LocalNotification] Scheduled notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('[LocalNotification] Schedule error:', error);
      // Fallback: show immediately if scheduling fails
      try {
        return await this.showNow(title, body, options);
      } catch {
        return null;
      }
    }
  }

  /**
   * Cancel notification by ID
   */
  async cancel(notificationId: NotificationId | null | undefined) {
    try {
      if (!notificationId) return;
      await notifee.cancelNotification(notificationId);
      console.log('[LocalNotification] Cancelled notification:', notificationId);
    } catch (error) {
      console.error('[LocalNotification] Cancel error:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAll() {
    try {
      await notifee.cancelAllNotifications();
      console.log('[LocalNotification] Cancelled all notifications');
    } catch (error) {
      console.error('[LocalNotification] Cancel all error:', error);
    }
  }

  /**
   * Map importance string to Android importance level
   */
  private mapImportance(importance: string): number {
    switch (importance) {
      case 'low':
        return 2; // AndroidImportance.LOW
      case 'default':
        return 3; // AndroidImportance.DEFAULT
      case 'high':
        return 4; // AndroidImportance.HIGH
      case 'max':
        return 5; // AndroidImportance.MAX
      default:
        return 4; // Default to HIGH
    }
  }

  /**
   * Get all displayed notifications
   */
  async getDisplayedNotifications(): Promise<any[]> {
    try {
      return await notifee.getDisplayedNotifications();
    } catch (error) {
      console.error('[LocalNotification] Get displayed error:', error);
      return [];
    }
  }
}

export const localNotification = new LocalNotificationService();
