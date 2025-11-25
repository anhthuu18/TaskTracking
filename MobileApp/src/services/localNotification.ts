// Lightweight wrapper for local notifications with graceful fallback if library is not installed
// Tries to load @notifee/react-native at runtime; if unavailable, all methods are no-ops

import { Platform } from 'react-native';

export type NotificationId = string;

class LocalNotificationService {
  private notifee: any | null = null;
  private loaded = false;

  private async ensureLoaded() {
    if (this.loaded) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@notifee/react-native');
      // Merge default and named exports to support both CJS/ESM shapes
      this.notifee = { ...(mod || {}), ...(mod?.default || {}) };
    } catch (e) {
      this.notifee = null;
    }
    this.loaded = true;
  }

  async isAvailable(): Promise<boolean> {
    await this.ensureLoaded();
    return !!this.notifee;
  }

  async requestPermission(): Promise<boolean> {
    await this.ensureLoaded();
    if (!this.notifee) return false; // not available
    const settings = await this.notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  }

  async openSettings(): Promise<void> {
    await this.ensureLoaded();
    if (!this.notifee) return;
    try { await this.notifee.openNotificationSettings(); } catch {}
  }

  async getPermissionStatus(): Promise<boolean | null> {
    await this.ensureLoaded();
    if (!this.notifee) return null;
    try {
      const settings = await this.notifee.getNotificationSettings();
      return settings.authorizationStatus >= 1;
    } catch {
      return null;
    }
  }

  async createDefaultChannel(): Promise<string | null> {
    await this.ensureLoaded();
    if (!this.notifee) return null;

    if (Platform.OS !== 'android') {
      // iOS does not use channels
      return null;
    }

    try {
      // Prefer top-level createChannel if available
      if (typeof this.notifee.createChannel === 'function') {
        const channelId = await this.notifee.createChannel({
          id: 'pomodoro',
          name: 'Pomodoro Alerts',
          sound: 'default',
          importance: this.notifee.AndroidImportance ? this.notifee.AndroidImportance.HIGH : 4,
          vibration: true,
        });
        return channelId;
      }
      // Fallback to android namespace if present
      if (this.notifee.android && typeof this.notifee.android.createChannel === 'function') {
        const channelId = await this.notifee.android.createChannel({
          id: 'pomodoro',
          name: 'Pomodoro Alerts',
          sound: 'default',
          importance: this.notifee.AndroidImportance ? this.notifee.AndroidImportance.HIGH : 4,
          vibration: true,
        });
        return channelId;
      }
      return null;
    } catch (e) {
      // Graceful fallback
      return null;
    }
  }

  async showNow(title: string, body: string): Promise<NotificationId | null> {
    await this.ensureLoaded();
    if (!this.notifee) return null;
    const channelId = await this.createDefaultChannel();
    const notificationId = await this.notifee.displayNotification({
      title,
      body,
      android: {
        channelId: channelId || 'default',
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
      ios: {},
    });
    return notificationId as string;
  }

  async scheduleAt(date: Date, title: string, body: string): Promise<NotificationId | null> {
    await this.ensureLoaded();
    if (!this.notifee) return null;

    try {
      const TriggerType = this.notifee.TriggerType || this.notifee.AndroidTriggerType || {};
      const typeVal = TriggerType.TIMESTAMP ?? 1; // fallback numeric id
      const trigger: any = { type: typeVal, timestamp: date.getTime() };

      const channelId = await this.createDefaultChannel();

      const notificationId = await this.notifee.createTriggerNotification({
        title,
        body,
        android: {
          channelId: channelId || 'default',
          pressAction: { id: 'default' },
          smallIcon: 'ic_launcher',
        },
        ios: {},
      }, trigger);

      return notificationId as string;
    } catch (e) {
      // Graceful fallback: if trigger scheduling fails, attempt immediate notify and return null
      try {
        await this.showNow(title, body);
      } catch {}
      return null;
    }
  }

  async cancel(notificationId: NotificationId | null | undefined) {
    await this.ensureLoaded();
    if (!this.notifee || !notificationId) return;
    try {
      await this.notifee.cancelNotification(notificationId);
    } catch {}
  }

  async cancelAll() {
    await this.ensureLoaded();
    if (!this.notifee) return;
    try {
      await this.notifee.cancelAllNotifications();
    } catch {}
  }
}

export const localNotification = new LocalNotificationService();

