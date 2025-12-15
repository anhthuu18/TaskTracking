import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

class FCMService {
  /**
   * Request permission for push notifications
   */
  async requestUserPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('iOS Authorization status:', authStatus);
      }
      return enabled;
    }
    // Android doesn't need permission for FCM
    return true;
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestUserPermission();
      if (!hasPermission) {
        console.log('Push notification permission denied');
        return null;
      }

      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);

      // Save token locally
      await AsyncStorage.setItem('fcmToken', fcmToken);

      return fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Setup FCM listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
  ) {
    // Create notification channel for Android
    this.createNotificationChannel();

    // Listen to messages when app is in foreground
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);

      // Display notification using notifee
      await this.displayNotification(remoteMessage);

      if (onNotificationReceived) {
        onNotificationReceived(remoteMessage);
      }
    });

    // Listen to messages when app is in background/quit state and user taps notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened from background:', remoteMessage);

      if (onNotificationReceived) {
        onNotificationReceived(remoteMessage);
      }
    });

    // Check if app was opened from a notification (quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened from quit state:', remoteMessage);

          if (onNotificationReceived) {
            onNotificationReceived(remoteMessage);
          }
        }
      });

    // Listen to notification interactions (tap, dismiss, etc.)
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed:', detail.notification);

        if (onNotificationReceived && detail.notification) {
          onNotificationReceived(detail.notification);
        }
      }
    });

    // Background notification handler
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Background notification pressed:', detail.notification);
      }
    });
  }

  /**
   * Create Android notification channel
   */
  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'task_reminders',
        name: 'Task Reminders',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    }
  }

  /**
   * Display notification using notifee
   */
  async displayNotification(remoteMessage: any) {
    try {
      const { notification, data } = remoteMessage;

      await notifee.displayNotification({
        title: notification?.title || 'Task Tracking',
        body: notification?.body || '',
        android: {
          channelId: 'task_reminders',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          vibrationPattern: [300, 500],
        },
        ios: {
          sound: 'default',
        },
        data: data || {},
      });
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  }

  /**
   * Handle notification when tapped
   */
  handleNotificationTap(notification: any, navigation: any) {
    try {
      const data = notification.data || notification;

      // Navigate based on notification type
      if (data.type === 'task_reminder' && data.taskId) {
        // Navigate to task detail
        console.log('Navigating to task:', data.taskId);
        // You can implement navigation here based on your app's navigation structure
        // Example: navigation.navigate('TaskTracking', { task: { id: data.taskId } });
      }
    } catch (error) {
      console.error('Error handling notification tap:', error);
    }
  }
}

export default new FCMService();
