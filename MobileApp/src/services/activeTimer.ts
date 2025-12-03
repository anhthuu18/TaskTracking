import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

export type ActiveTimerType = 'focus' | 'break' | 'longBreak';

export interface ActiveTimerState {
  taskId: number;
  taskTitle?: string;
  currentSessionIndex: number;
  sessionType: ActiveTimerType;
  durationSec: number; // duration of current session
  isRunning: boolean;
  startedAt?: number; // epoch ms
  expectedEndTs?: number | null; // epoch ms
  remainingAtPause?: number | null; // seconds
  backendSessionId?: number | null;
  scheduledNotificationId?: string | null;
  // Track if session completion was already handled
  completionHandled?: boolean;
}

const STORAGE_KEY = 'activeTimer';

let memory: ActiveTimerState | null = null;
let listeners: Array<(s: ActiveTimerState | null) => void> = [];

/**
 * Active Timer Service
 * Manages the state of the currently running Pomodoro timer
 * Persists state to AsyncStorage for recovery after app restart
 */
export const activeTimer = {
  /**
   * Load timer state from AsyncStorage
   */
  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      memory = raw ? (JSON.parse(raw) as ActiveTimerState) : null;
      console.log('[ActiveTimer] Loaded state:', memory ? 'found' : 'not found');
      return memory;
    } catch (error) {
      console.error('[ActiveTimer] Load error:', error);
      memory = null;
      return null;
    }
  },

  /**
   * Get current timer state from memory
   */
  get(): ActiveTimerState | null {
    return memory;
  },

  /**
   * Set timer state (replace entirely)
   */
  async set(state: ActiveTimerState | null) {
    memory = state;
    try {
      if (state) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('[ActiveTimer] Set state:', state.taskId);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log('[ActiveTimer] Cleared state');
      }
    } catch (error) {
      console.error('[ActiveTimer] Set error:', error);
    }
    listeners.forEach(l => {
      try {
        l(memory);
      } catch (error) {
        console.error('[ActiveTimer] Listener error:', error);
      }
    });
  },

  /**
   * Update timer state (merge with existing)
   */
  async update(patch: Partial<ActiveTimerState>) {
    if (!memory) {
      console.warn('[ActiveTimer] Cannot update: no state loaded');
      return;
    }

    memory = { ...memory, ...patch } as ActiveTimerState;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      console.log('[ActiveTimer] Updated state');
    } catch (error) {
      console.error('[ActiveTimer] Update error:', error);
    }
    listeners.forEach(l => {
      try {
        l(memory);
      } catch (error) {
        console.error('[ActiveTimer] Listener error:', error);
      }
    });
  },

  /**
   * Clear timer state
   */
  async clear() {
    memory = null;
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('[ActiveTimer] Cleared');
    } catch (error) {
      console.error('[ActiveTimer] Clear error:', error);
    }
    listeners.forEach(l => {
      try {
        l(memory);
      } catch (error) {
        console.error('[ActiveTimer] Listener error:', error);
      }
    });
  },

  /**
   * Subscribe to timer state changes
   */
  subscribe(fn: (s: ActiveTimerState | null) => void) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(x => x !== fn);
    };
  },

  /**
   * Calculate remaining time based on expectedEndTs
   * Handles app background/foreground transitions
   */
  getRemainingSeconds(): number {
    if (!memory?.isRunning || !memory?.expectedEndTs) {
      return memory?.remainingAtPause || 0;
    }

    const now = Date.now();
    const remaining = Math.max(0, Math.round((memory.expectedEndTs - now) / 1000));
    return remaining;
  },

  /**
   * Check if session should have completed
   */
  hasSessionCompleted(): boolean {
    if (!memory?.isRunning || !memory?.expectedEndTs) {
      return false;
    }

    const now = Date.now();
    return now >= memory.expectedEndTs;
  },

  /**
   * Mark session completion as handled
   */
  async markCompletionHandled() {
    if (memory) {
      await this.update({ completionHandled: true });
    }
  },

  /**
   * Reset completion flag for next session
   */
  async resetCompletionFlag() {
    if (memory) {
      await this.update({ completionHandled: false });
    }
  },
};
