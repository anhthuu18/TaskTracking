/**
 * Notification Event Handler
 * Handles notification interactions (tap, dismiss, etc.)
 * Integrates with navigation and task tracking
 */

import notifee, { EventType } from '@notifee/react-native';
import { navigationRef } from './NavigationService';
import { activeTimer } from './activeTimer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STATE_KEY = 'notificationState';

export interface NotificationState {
  pendingNotificationId: string | null;
  type?: string; // 'task_reminder' or 'pomodoro'
  sessionType?: 'focus' | 'break' | 'longBreak';
  taskId: number;
  taskTitle?: string;
  taskName?: string;
  projectId?: string;
  projectName?: string;
  timestamp: number;
}

class NotificationEventHandler {
  private initialized = false;
  private recurringNotificationInterval: ReturnType<typeof setInterval> | null =
    null;
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
      console.log(
        '[NotificationEventHandler] Foreground event:',
        type,
        notification?.body,
      );
      console.log(
        '[NotificationEventHandler] Notification data:',
        notification?.data,
      );

      if (type === EventType.PRESS) {
        // User tapped the notification
        console.log(
          '[NotificationEventHandler] Foreground PRESS - calling handleNotificationTap with data:',
          notification?.data,
        );
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
      console.log(
        '[NotificationEventHandler] Background notification data:',
        notification?.data,
      );

      if (type === EventType.PRESS) {
        // User explicitly tapped notification while app was closed
        // Save state so we can handle it when app finishes opening
        if (notification?.data) {
          console.log(
            '[NotificationEventHandler] Background PRESS - saving state with data:',
            notification.data,
          );
          await this.savePendingNotificationState(notification.data);
          // Navigation will be handled by the saved state when app becomes ready
        }
        // DO NOT call handleNotificationTap here - it causes app to open unexpectedly
      }
    });
  }

  /**
   * Handle notification tap
   */
  private async handleNotificationTap(data?: Record<string, string>) {
    try {
      console.log(
        '[NotificationEventHandler] Handling notification tap - received data:',
        JSON.stringify(data),
      );

      // Check notification type
      const notificationType = data?.type;
      console.log(
        '[NotificationEventHandler] Notification type:',
        notificationType,
      );

      if (notificationType === 'task_reminder') {
        // Task reminder notification - navigate to TaskTracking screen
        console.log(
          '[NotificationEventHandler] Routing to handleTaskReminderTap',
        );
        await this.handleTaskReminderTap(data);
        return;
      }

      // Default: Pomodoro session completion notification
      console.log('[NotificationEventHandler] Routing to handlePomodoroTap');
      await this.handlePomodoroTap(data);
    } catch (error) {
      console.error('[NotificationEventHandler] Tap handler error:', error);
    }
  }

  /**
   * Handle task reminder notification tap
   */
  private async handleTaskReminderTap(data?: Record<string, string>) {
    try {
      console.log(
        '[NotificationEventHandler] Task reminder tap - raw data:',
        JSON.stringify(data),
      );

      const taskId = data?.taskId ? parseInt(data.taskId, 10) : 0;
      const taskName = data?.taskName || '';
      const projectId = data?.projectId || '';
      const projectName = data?.projectName || '';

      console.log('[NotificationEventHandler] Parsed values:', {
        taskId,
        taskName,
        projectId,
        projectName,
        dataTaskId: data?.taskId,
        dataTaskName: data?.taskName,
      });

      if (taskId && navigationRef.current) {
        console.log(
          '[NotificationEventHandler] Navigating to TaskTracking with params:',
          {
            taskId: taskId.toString(),
            projectId,
            projectName,
          },
        );
        navigationRef.current.navigate(
          'TaskTracking' as never,
          {
            taskId: taskId.toString(),
            projectId: projectId,
            projectName: projectName,
          } as never,
        );
        console.log(
          '[NotificationEventHandler] Navigation called successfully',
        );
      } else {
        console.warn(
          '[NotificationEventHandler] Cannot navigate - missing taskId or navigation not ready',
          {
            hasTaskId: !!taskId,
            hasNavigation: !!navigationRef.current,
            dataKeys: data ? Object.keys(data) : [],
          },
        );
      }
    } catch (error) {
      console.error(
        '[NotificationEventHandler] Task reminder tap error:',
        error,
      );
    }
  }

  /**
   * Handle pomodoro session notification tap
   */
  private async handlePomodoroTap(data?: Record<string, string>) {
    try {
      // Cancel recurring notification if any
      await this.stopRecurringNotification();

      // Decide whether session actually completed
      let showDialog = true;
      try {
        const st = activeTimer.get() || (await activeTimer.load());
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
      const st2 = activeTimer.get() || (await activeTimer.load());
      const taskId =
        st2?.taskId ?? (data?.taskId ? parseInt(data.taskId, 10) : 0);
      const taskTitle = st2?.taskTitle || data?.taskTitle || '';

      if (taskId && navigationRef.current) {
        navigationRef.current.navigate(
          'TaskTracking' as never,
          {
            task: { id: taskId, title: taskTitle },
            showSessionCompleteDialog: showDialog,
          } as never,
        );
      }
    } catch (error) {
      console.error('[NotificationEventHandler] Pomodoro tap error:', error);
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
        type: data.type || 'pomodoro',
        sessionType: (data.sessionType as any) || 'focus',
        taskId: parseInt(data.taskId, 10) || 0,
        taskTitle: data.taskTitle || '',
        taskName: data.taskName || '',
        projectId: data.projectId || '',
        projectName: data.projectName || '',
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(NOTIFICATION_STATE_KEY, JSON.stringify(state));
      console.log(
        '[NotificationEventHandler] Saved pending notification state',
        state,
      );
    } catch (error) {
      console.error('[NotificationEventHandler] Save state error:', error);
    }
  }

  /**
   * Load pending notification state
   * Processes navigation if user tapped notification while app was in background
   */
  private async loadPendingNotificationState() {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);
      if (raw) {
        const state = JSON.parse(raw) as NotificationState;
        console.log(
          '[NotificationEventHandler] Found pending notification state',
          state,
        );

        // Clear the state first
        await this.clearNotificationState();

        // Wait a bit for navigation to be ready
        setTimeout(() => {
          if (state.type === 'task_reminder') {
            // Task reminder notification
            this.handleTaskReminderTap({
              taskId: state.taskId.toString(),
              taskName: state.taskName || state.taskTitle || '',
              projectId: state.projectId || '',
              projectName: state.projectName || '',
              type: 'task_reminder',
            });
          } else {
            // Pomodoro notification
            this.handlePomodoroTap({
              taskId: state.taskId.toString(),
              taskTitle: state.taskTitle || '',
              sessionType: state.sessionType || 'focus',
            });
          }
        }, 500); // Wait 500ms for navigation to be ready
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
    intervalSeconds: number = 7,
  ) {
    try {
      console.log('[NotificationEventHandler] Starting recurring notification');

      // Stop any existing recurring notification
      await this.stopRecurringNotification();

      // Show initial notification
      const notificationId = await this.showNotificationWithData(
        title,
        body,
        data,
      );
      this.pendingNotificationId = notificationId;

      // Schedule recurring notifications
      this.recurringNotificationInterval = setInterval(async () => {
        try {
          console.log(
            '[NotificationEventHandler] Sending recurring notification',
          );
          await this.showNotificationWithData(title, body, data);
        } catch (error) {
          console.error(
            '[NotificationEventHandler] Recurring notification error:',
            error,
          );
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
    data: Record<string, string>,
  ): Promise<string> {
    try {
      const notificationId = await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: 'pomodoro',
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
      console.error(
        '[NotificationEventHandler] Show notification error:',
        error,
      );
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
   * Handle pending notification manually
   * Should be called when app is ready and user explicitly opened via notification
   */
  async handlePendingNotificationIfExists() {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATION_STATE_KEY);
      if (raw) {
        const state = JSON.parse(raw) as NotificationState;
        console.log(
          '[NotificationEventHandler] Processing pending notification',
        );

        // Check if state is recent (within 5 minutes)
        if (Date.now() - state.timestamp < 5 * 60 * 1000) {
          await this.handleNotificationTap({
            taskId: String(state.taskId),
            taskTitle: state.taskTitle,
            sessionType: state.sessionType,
          });
        } else {
          console.log(
            '[NotificationEventHandler] Pending notification too old, ignoring',
          );
        }

        // Clear the state
        await this.clearNotificationState();
      }
    } catch (error) {
      console.error('[NotificationEventHandler] Handle pending error:', error);
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
