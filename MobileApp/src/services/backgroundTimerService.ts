/**
 * Background Timer Service
 * Handles timer continuation when app is in background using native timer
 * Triggers session completion events and notifications
 */

import { AppState, NativeEventEmitter, NativeModules, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activeTimer, ActiveTimerState } from './activeTimer';
import { localNotification } from './localNotification';
import { notificationEventHandler } from './notificationEventHandler';
import * as NavigationService from './NavigationService';

const BACKGROUND_TIMER_KEY = 'backgroundTimerState';

export interface BackgroundTimerState {
  isRunning: boolean;
  expectedEndTs: number | null;
  lastCheckTs: number;
  sessionType: 'focus' | 'break' | 'longBreak';
  taskId: number;
  taskTitle: string;
}

class BackgroundTimerService {
  private appStateSubscription: any = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private lastAppState: string = 'active';
  private listeners: Array<(event: string, data?: any) => void> = [];

  /**
   * Initialize background timer service
   * Should be called once at app startup
   */
  async initialize() {
    try {
      // Load any persisted background timer state
      const raw = await AsyncStorage.getItem(BACKGROUND_TIMER_KEY);
      if (raw) {
        const state = JSON.parse(raw) as BackgroundTimerState;
        // If timer was running when app closed, check if session completed
        if (state.isRunning && state.expectedEndTs) {
          await this.checkSessionCompletion(state);
        }
      }

      // Setup AppState listener
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

      // Start periodic check (every 1 second when active, every 5 seconds when background)
      this.startPeriodicCheck();
    } catch (error) {
      console.error('[BackgroundTimerService] Initialize error:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Handle app state changes (active/background/inactive)
   */
  private handleAppStateChange = async (state: string) => {
    console.log('[BackgroundTimerService] App state changed:', state);
    this.lastAppState = state;

    if (state === 'active') {
      // App came to foreground
      try {
        const timerState = activeTimer.get() || await activeTimer.load();
        if (timerState?.isRunning && timerState.expectedEndTs) {
          // Check if session completed while in background
          await this.checkSessionCompletion(timerState);
        }
      } catch (error) {
        console.error('[BackgroundTimerService] Foreground check error:', error);
      }
    } else if (state === 'background') {
      // App went to background
      try {
        const timerState = activeTimer.get() || await activeTimer.load();
        if (timerState?.isRunning) {
          // Persist background timer state
          await this.persistBackgroundState(timerState);
        }
      } catch (error) {
        console.error('[BackgroundTimerService] Background persist error:', error);
      }
    }
  };

  /**
   * Start periodic check for session completion
   */
  private startPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every 1 second
    this.checkInterval = setInterval(async () => {
      try {
        const timerState = activeTimer.get() || await activeTimer.load();
        if (timerState?.isRunning && timerState.expectedEndTs) {
          const now = Date.now();
          const timeRemaining = Math.max(0, timerState.expectedEndTs - now);

          // If session should have ended
          if (timeRemaining === 0) {
            console.log('[BackgroundTimerService] Session completed, triggering notification');
            await this.handleSessionCompletion(timerState);
          }
        }
      } catch (error) {
        console.error('[BackgroundTimerService] Check error:', error);
      }
    }, 1000);
  }

  /**
   * Check if session completed while app was in background
   */
  private async checkSessionCompletion(timerState: ActiveTimerState) {
    const now = Date.now();
    const timeRemaining = Math.max(0, (timerState.expectedEndTs || 0) - now);

    if (timeRemaining === 0) {
      console.log('[BackgroundTimerService] Session completed in background');
      await this.handleSessionCompletion(timerState);
    }
  }

  /**
   * Handle session completion
   * Trigger notification and emit event
   */
  private async handleSessionCompletion(timerState: ActiveTimerState) {
    try {
      // Prevent duplicate handling across screen/background
      const current = activeTimer.get() || await activeTimer.load();
      if (current?.completionHandled) {
        return; // someone else (screen) already handled
      }

      // Mark as handled immediately to avoid race
      await activeTimer.update({ completionHandled: true, isRunning: false, remainingAtPause: 0, expectedEndTs: null });

      // Emit event for listeners
      this.emit('sessionCompleted', {
        taskId: timerState.taskId,
        taskTitle: timerState.taskTitle,
        sessionType: timerState.sessionType,
      });

      const route = NavigationService.getCurrentRoute();
      const isOnTracking = String(route?.name || '').toLowerCase() === 'tasktracking';
      const isForeground = this.lastAppState === 'active';

      // Cancel any scheduled end notification to avoid duplicates
      try {
        const st = activeTimer.get() || await activeTimer.load();
        await localNotification.cancel(st?.scheduledNotificationId || null);
        await activeTimer.update({ scheduledNotificationId: null });
      } catch {}

      if (isForeground) {
        // App is open but user is on another screen: show a lightweight confirm dialog here
        if (!isOnTracking) {
          try {
            Alert.alert(
              timerState.sessionType === 'focus' ? 'Focus Session Complete!' : 'Break Time Over!',
              timerState.sessionType === 'focus' ? 'Time for a break. Continue?' : 'Ready for next focus?',
              [
                { text: 'OK', onPress: () => {
                    NavigationService.navigate('TaskTracking', {
                      task: { id: timerState.taskId, title: timerState.taskTitle },
                      showSessionCompleteDialog: true,
                    });
                  }
                },
              ]
            );
          } catch {
            // Fallback navigate if Alert fails
            NavigationService.navigate('TaskTracking', {
              task: { id: timerState.taskId, title: timerState.taskTitle },
              showSessionCompleteDialog: true,
            });
          }
        }
      } else {
        // App in background: show exactly one push notification
        await this.showSessionCompletionNotification(timerState);
      }

      // Clear background state
      await AsyncStorage.removeItem(BACKGROUND_TIMER_KEY);
    } catch (error) {
      console.error('[BackgroundTimerService] Completion handler error:', error);
    }
  }

  /**
   * Show session completion notification
   */
  private async showSessionCompletionNotification(timerState: ActiveTimerState) {
    try {
      const isFocus = timerState.sessionType === 'focus';
      const title = isFocus ? 'Focus Session Complete!' : 'Break Time Over!';
      const body = isFocus
        ? 'Time for a break. Tap to continue.'
        : 'Ready for next focus session? Tap to start.';

      // Show notification with high priority and sound, include data payload
      await localNotification.showNow(title, body, {
        sound: 'default',
        vibration: true,
        importance: 'high',
        tag: 'session-complete',
        autoCancel: false,
        data: {
          taskId: String(timerState.taskId),
          taskTitle: timerState.taskTitle || '',
          sessionType: timerState.sessionType,
        },
      });
    } catch (error) {
      console.error('[BackgroundTimerService] Notification error:', error);
    }
  }

  /**
   * Persist background timer state
   */
  private async persistBackgroundState(timerState: ActiveTimerState) {
    try {
      const bgState: BackgroundTimerState = {
        isRunning: true,
        expectedEndTs: timerState.expectedEndTs || null,
        lastCheckTs: Date.now(),
        sessionType: timerState.sessionType,
        taskId: timerState.taskId,
        taskTitle: timerState.taskTitle || '',
      };
      await AsyncStorage.setItem(BACKGROUND_TIMER_KEY, JSON.stringify(bgState));
    } catch (error) {
      console.error('[BackgroundTimerService] Persist error:', error);
    }
  }

  /**
   * Subscribe to background timer events
   */
  subscribe(listener: (event: string, data?: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data?: any) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('[BackgroundTimerService] Listener error:', error);
      }
    });
  }

  /**
   * Clear background timer state
   */
  async clearBackgroundState() {
    try {
      await AsyncStorage.removeItem(BACKGROUND_TIMER_KEY);
    } catch (error) {
      console.error('[BackgroundTimerService] Clear error:', error);
    }
  }

  /**
   * Get current background timer state
   */
  async getBackgroundState(): Promise<BackgroundTimerState | null> {
    try {
      const raw = await AsyncStorage.getItem(BACKGROUND_TIMER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('[BackgroundTimerService] Get state error:', error);
      return null;
    }
  }
}

export const backgroundTimerService = new BackgroundTimerService();

