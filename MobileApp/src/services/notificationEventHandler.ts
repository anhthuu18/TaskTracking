/**
 * Notification Event Handler
 * Handles notification interactions (tap, dismiss, etc.)
 * Integrates with navigation and task tracking
 */

import notifee, { EventType } from '@notifee/react-native';
import { NavigationService } from './NavigationService';
import { activeTimer } from './activeTimer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STATE_KEY = 'notificationState';

export interface NotificationState {
  pendingNotificationId: string | null;
  sessionType: 'focus' | 'break' | 'longBreak';
  taskId: number;
  taskTitle: string;
  timestamp: number;
}

class NotificationEventHandler {
  private initialized = false;
  private recurringNotificationInterval: ReturnType<typeof setInterval> | null = null;
  private pendingNotificationId: string | null = null;

  /**
   * Initialize notification event listeners
   * Should be called once at app startup
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('[NotificationEventHandler] Initializing');

      // Handle foreground notifications
      this.setupForegroundHandler();

      // Handle background notifications (when app is closed)
      this.setupBackgroundHandler();

      // Load any pending notification state
      await this.loadPendingNotificationState();

      this.initialized = true;
    } catch (error) {
      console.error('[NotificationEventHandler] Initialize error:', error);
    }
  }

  /**
   * Setup foreground notification handler
   * Called when app is in foreground and notification is tapped
   */
  private setupForegroundHandler() {
    notifee.onForegroundEvent(async ({ type, notification }) => {
      console.log('[NotificationEventHandler] Foreground event:', type, notification?.body);

      if (type === EventType.PRESS) {
        // User tapped the notification
        await this.handleNotificationTap(notification?.data);
      } else if (type === EventType.DISMISS) {
        // User dismissed the notification
        await this.handleNotificationDismiss(notification?.data);
      }
    });
  }

  /**
   * Setup background notification handler
   * Called when app is closed and notification is tapped
   */
  private setupBackgroundHandler() {
    notifee.onBackgroundEvent(async ({ type, notification }) => {
      console.log('[NotificationEventHandler] Background event:', type);

      if (type === EventType.PRESS) {
        // User tapped notification while app was closed
        // Save state so we can handle it when app opens
        if (notification?.data) {
          await this.savePendingNotificationState(notification.data);
        }
      }
    });
  }

  /**
   * Handle notification tap
   */
  private async handleNotificationTap(data?: Record<string, string>) {
    try {
      console.log('[NotificationEventHandler] Handling notification tap');

      // Cancel recurring notification if any
      await this.stopRecurringNotification();

      // Decide whether session actually completed
      let showDialog = true;
      try {
        const st = activeTimer.get() || await activeTimer.load();
        if (st?.expectedEndTs) {
          const deltaMs = st.expectedEndTs - Date.now();
          // Treat as completed if within 1.5s late or already past
          if (deltaMs > 1500 && st.isRunning) {
            showDialog = false;
          } else {
            // Normalize state to completed so UI can advance reliably
            await activeTimer.update({
              isRunning: false,
              remainingAtPause: 0,
              expectedEndTs: null,
              completionHandled: true,
            });
          }
        }
      } catch {}

      // Clear notification state
      await this.clearNotificationState();

      // Navigate to TaskTrackingScreen - prefer active timer's taskId for accuracy
      const st2 = activeTimer.get() || await activeTimer.load();
      const taskId = st2?.taskId ?? (data?.taskId ? parseInt(data.taskId, 10) : 0);
      const taskTitle = st2?.taskTitle || data?.taskTitle || '';
      if (taskId) {
        NavigationService.navigate('TaskTracking', {
          task: { id: taskId, title: taskTitle },
          showSessionCompleteDialog: showDialog,
        });
      }
    } catch (error) {
      console.error('[NotificationEventHandler] Tap handler error:', error);
    }
  }

  /**
   * Handle notification dismiss
   */
  private async handleNotificationDismiss(data?: Record<string, string>) {
    try {
      console.log('[NotificationEventHandler] Notification dismissed');
      // Don't stop recurring notification on dismiss
      // Only stop when user explicitly taps
    } catch (error) {
      console.error('[NotificationEventHandler] Dismiss handler error:', error);
    }
  }

  /**
   * Save pending notification state for when app opens
   */
  private async savePendingNotificationState(data: Record<string, string>) {
    try {
      const state: NotificationState = {
        pendingNotificationId: data.notificationId || null,
        sessionType: (data.sessionType as any) || 'focus',
        taskId: parseInt(data.taskId, 10) || 0,
        taskTitle: data.taskTitle || '',
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
      console.log('[NotificationEventHandler] Saved pending notification state');
    } catch (error) {
      console.error('[NotificationEventHandler] Save state error:', error);
    }
  }

  /**
   * Load pending notification state
   */
  private async loadPendingNotificationState() {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);
      if (raw) {
        const state = JSON.parse(raw) as NotificationState;
        console.log('[NotificationEventHandler] Found pending notification state');

        // If state is recent (within 5 minutes), handle it
        if (Date.now() - state.timestamp < 5 * 60 * 1000) {
          await this.handleNotificationTap({
            taskId: String(state.taskId),
            taskTitle: state.taskTitle,
            sessionType: state.sessionType,
          });
        }

        // Clear the state
        await this.clearNotificationState();
      }
    } catch (error) {
      console.error('[NotificationEventHandler] Load state error:', error);
    }
  }

  /**
   * Clear notification state
   */
  private async clearNotificationState() {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_STATE_KEY);
      this.pendingNotificationId = null;
    } catch (error) {
      console.error('[NotificationEventHandler] Clear state error:', error);
    }
  }

  /**
   * Start recurring notification
   * Sends notification every X seconds until user taps it
   */
  async startRecurringNotification(
    title: string,
    body: string,
    data: Record<string, string>,
    intervalSeconds: number = 7
  ) {
    try {
      console.log('[NotificationEventHandler] Starting recurring notification');

      // Stop any existing recurring notification
      await this.stopRecurringNotification();

      // Show initial notification
      const notificationId = await this.showNotificationWithData(title, body, data);
      this.pendingNotificationId = notificationId;

      // Schedule recurring notifications
      this.recurringNotificationInterval = setInterval(async () => {
        try {
          console.log('[NotificationEventHandler] Sending recurring notification');
          await this.showNotificationWithData(title, body, data);
        } catch (error) {
          console.error('[NotificationEventHandler] Recurring notification error:', error);
        }
      }, intervalSeconds * 1000);

      // Save state
      await this.savePendingNotificationState(data);
    } catch (error) {
      console.error('[NotificationEventHandler] Start recurring error:', error);
    }
  }

  /**
   * Stop recurring notification
   */
  async stopRecurringNotification() {
    try {
      if (this.recurringNotificationInterval) {
        clearInterval(this.recurringNotificationInterval);
        this.recurringNotificationInterval = null;
      }

      if (this.pendingNotificationId) {
        await notifee.cancelNotification(this.pendingNotificationId);
        this.pendingNotificationId = null;
      }

      await this.clearNotificationState();
      console.log('[NotificationEventHandler] Stopped recurring notification');
    } catch (error) {
      console.error('[NotificationEventHandler] Stop recurring error:', error);
    }
  }

  /**
   * Show notification with data payload
   */
  private async showNotificationWithData(
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<string> {
    try {
      const notificationId = await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: 'pomodoro',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
          // High priority to ensure notification shows
          importance: 4, // AndroidImportance.HIGH
          sound: 'default',
          vibration: true,
          tag: 'session-complete',
          autoCancel: false,
          // Heads-up notification
          fullScreenAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
          critical: true,
          criticalVolume: 1.0,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('[NotificationEventHandler] Show notification error:', error);
      throw error;
    }
  }

  /**
   * Check if there's a pending notification to handle
   */
  async checkPendingNotification(): Promise<NotificationState | null> {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('[NotificationEventHandler] Check pending error:', error);
      return null;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.recurringNotificationInterval) {
      clearInterval(this.recurringNotificationInterval);
    }
  }
}

export const notificationEventHandler = new NotificationEventHandler();


