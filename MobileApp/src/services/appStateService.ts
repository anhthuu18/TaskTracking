/**
 * App State Service
 * Manages app lifecycle events and coordinates between background timer and notification handler
 */

import { AppState, AppStateStatus } from 'react-native';
import { activeTimer } from './activeTimer';
import { backgroundTimerService } from './backgroundTimerService';
import { notificationEventHandler } from './notificationEventHandler';

class AppStateService {
  private appStateSubscription: any = null;
  private currentAppState: AppStateStatus = 'active';
  private listeners: Array<(state: AppStateStatus) => void> = [];

  /**
   * Initialize app state service
   */
  async initialize() {
    try {
      console.log('[AppStateService] Initializing');

      // Initialize background timer service
      await backgroundTimerService.initialize();

      // Initialize notification event handler
      await notificationEventHandler.initialize();

      // Subscribe to app state changes
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      // Get current app state
      const state = await AppState.currentState;
      this.currentAppState = state;

      console.log('[AppStateService] Initialized, current state:', state);
    } catch (error) {
      console.error('[AppStateService] Initialize error:', error);
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = async (state: AppStateStatus) => {
    console.log('[AppStateService] App state changed:', this.currentAppState, '->', state);

    const prevState = this.currentAppState;
    this.currentAppState = state;

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('[AppStateService] Listener error:', error);
      }
    });

    // Handle specific transitions
    if (prevState !== 'active' && state === 'active') {
      // App came to foreground
      await this.handleForeground();
    } else if (state !== 'active') {
      // App went to background or inactive
      await this.handleBackground();
    }
  };

  /**
   * Handle app coming to foreground
   */
  private async handleForeground() {
    try {
      console.log('[AppStateService] App came to foreground');

      // Check if timer was running
      const timerState = activeTimer.get() || await activeTimer.load();
      if (timerState?.isRunning && timerState.expectedEndTs) {
        // Hydrate timer with correct remaining time
        const now = Date.now();
        const timeRemaining = Math.max(0, timerState.expectedEndTs - now);

        console.log('[AppStateService] Timer was running, remaining:', timeRemaining, 'ms');

        // If session completed while in background
        if (timeRemaining === 0) {
          console.log('[AppStateService] Session completed in background');
          // This will be handled by backgroundTimerService
        }
      }

      // Check for pending notification
      const pendingNotification = await notificationEventHandler.checkPendingNotification();
      if (pendingNotification) {
        console.log('[AppStateService] Found pending notification');
        // It will be handled by notificationEventHandler.loadPendingNotificationState()
      }
    } catch (error) {
      console.error('[AppStateService] Foreground handler error:', error);
    }
  }

  /**
   * Handle app going to background
   */
  private async handleBackground() {
    try {
      console.log('[AppStateService] App went to background');

      // Background timer service will handle persistence
      // No action needed here, it's handled by backgroundTimerService
    } catch (error) {
      console.error('[AppStateService] Background handler error:', error);
    }
  }

  /**
   * Subscribe to app state changes
   */
  subscribe(listener: (state: AppStateStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppStateStatus {
    return this.currentAppState;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    backgroundTimerService.destroy();
    notificationEventHandler.destroy();
  }
}

export const appStateService = new AppStateService();


