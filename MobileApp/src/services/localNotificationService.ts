import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';

const LAST_CHECK_KEY = 'last_notification_check';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface ProjectNotification {
  id: number;
  projectId: number;
  taskId?: number; // Optional: only for TASK_REMINDER type
  type: string;
  title: string;
  message: string;
  createdAt: string;
  projectName?: string;
}

class LocalNotificationService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private currentWorkspaceId: number | null = null;

  /**
   * Initialize notification channels for Android
   */
  async initialize() {
    try {
      // Create notification channel for task reminders
      await notifee.createChannel({
        id: 'task_reminders',
        name: 'Task Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      // Create channel for project notifications
      await notifee.createChannel({
        id: 'project_updates',
        name: 'Project Updates',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });

      console.log('✅ Local notification channels created');

      // Setup notification tap handler
      this.setupNotificationHandlers();
    } catch (error) {
      console.error('❌ Failed to initialize local notifications:', error);
    }
  }

  /**
   * Setup handlers for notification events (tap, dismiss, etc.)
   */
  private setupNotificationHandlers() {
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        // User tapped on notification
        const { notification } = detail;
        const data = notification?.data;

        if (data?.projectId && data?.taskId) {
          // Navigate to task detail - will be handled by navigation service
          this.handleNotificationTap(data as any);
        }
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        const { notification } = detail;
        const data = notification?.data;

        if (data?.projectId && data?.taskId) {
          this.handleNotificationTap(data as any);
        }
      }
    });
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  private handleNotificationTap(data: {
    projectId: string;
    taskId?: string;
    type: string;
  }) {
    // Store navigation intent in AsyncStorage
    // Will be picked up by AppNavigator on next render
    AsyncStorage.setItem('pending_navigation', JSON.stringify(data))
      .then(() => console.log('📍 Navigation intent stored:', data))
      .catch(err => console.error('Failed to store navigation intent:', err));
  }

  /**
   * Set current workspace context for filtering notifications
   */
  setWorkspaceContext(workspaceId: number | null) {
    this.currentWorkspaceId = workspaceId;
    console.log('🏢 Workspace context set:', workspaceId);
  }

  /**
   * Start polling for new notifications
   */
  async startPolling(workspaceId: number) {
    // Stop existing polling
    this.stopPolling();

    // Set workspace context
    this.setWorkspaceContext(workspaceId);

    // Initial check
    await this.checkForNewNotifications();

    // Setup interval
    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, CHECK_INTERVAL);

    console.log('🔔 Local notification polling started (5 min interval)');
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🔕 Local notification polling stopped');
    }
  }

  /**
   * Check for new notifications since last check
   */
  private async checkForNewNotifications() {
    try {
      if (!this.currentWorkspaceId) {
        return; // No workspace context
      }

      // Get last check timestamp
      const lastCheckStr = await AsyncStorage.getItem(LAST_CHECK_KEY);
      const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(0);

      // Fetch project notifications for current workspace
      const response = await notificationService.getProjectNotifications(
        this.currentWorkspaceId,
      );

      if (!response.success || !response.data) {
        return;
      }

      // Filter notifications created after last check
      const newNotifications = response.data.filter((n: any) => {
        const createdAt = new Date(n.createdAt);
        return createdAt > lastCheck;
      });

      if (newNotifications.length > 0) {
        console.log(`📬 Found ${newNotifications.length} new notifications`);

        // Display local notifications
        for (const notification of newNotifications) {
          // Convert API response to ProjectNotification
          const n = notification as any; // API response type
          const projectNotification: ProjectNotification = {
            id: n.id,
            projectId: n.projectId || 0,
            taskId: n.taskId,
            type: n.type || 'PROJECT_MEMBER_ADDED',
            title: n.title || 'Notification',
            message: n.message || '',
            createdAt: n.createdAt,
            projectName: n.projectName,
          };
          await this.displayNotification(projectNotification);
        }
      }

      // Update last check timestamp
      await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    } catch (error) {
      console.error('❌ Error checking notifications:', error);
    }
  }

  /**
   * Display a local notification using @notifee
   */
  private async displayNotification(notification: ProjectNotification) {
    try {
      const isTaskReminder = notification.type === 'TASK_REMINDER';
      const channelId = isTaskReminder ? 'task_reminders' : 'project_updates';

      await notifee.displayNotification({
        title: notification.title,
        body: notification.message || 'Tap to view details',
        android: {
          channelId,
          importance: isTaskReminder
            ? AndroidImportance.HIGH
            : AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_notification', // Make sure this icon exists in android/app/src/main/res/
          color: isTaskReminder ? '#EF4444' : '#3B82F6', // Red for reminders, blue for updates
        },
        data: {
          notificationId: notification.id.toString(),
          projectId: notification.projectId.toString(),
          taskId: notification.taskId?.toString() || '', // Include taskId for navigation
          type: notification.type,
        },
      });

      console.log('✅ Local notification displayed:', notification.title);
    } catch (error) {
      console.error('❌ Failed to display notification:', error);
    }
  }

  /**
   * Manual trigger - display notification immediately (for testing)
   */
  async displayTestNotification() {
    await notifee.displayNotification({
      title: '🧪 Test Notification',
      body: 'Local notification system is working!',
      android: {
        channelId: 'task_reminders',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        color: '#3B82F6',
      },
    });
    console.log('✅ Test notification sent');
  }

  /**
   * Clear all displayed notifications
   */
  async clearAllNotifications() {
    await notifee.cancelAllNotifications();
    console.log('🗑️ All local notifications cleared');
  }

  /**
   * Request notification permissions (iOS)
   */
  async requestPermissions() {
    try {
      const settings = await notifee.requestPermission();
      console.log('📱 Notification permissions:', settings.authorizationStatus);
      return settings.authorizationStatus === 1; // 1 = authorized
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }
}

export const localNotificationService = new LocalNotificationService();
