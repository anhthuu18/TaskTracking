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
}

const STORAGE_KEY = 'activeTimer';

let memory: ActiveTimerState | null = null;
let listeners: Array<(s: ActiveTimerState | null) => void> = [];

export const activeTimer = {
  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      memory = raw ? (JSON.parse(raw) as ActiveTimerState) : null;
      return memory;
    } catch {
      memory = null;
      return null;
    }
  },
  get(): ActiveTimerState | null {
    return memory;
  },
  async set(state: ActiveTimerState | null) {
    memory = state;
    if (state) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    listeners.forEach(l => l(memory));
  },
  async update(patch: Partial<ActiveTimerState>) {
    if (!memory) return;
    memory = { ...memory, ...patch } as ActiveTimerState;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    listeners.forEach(l => l(memory));
  },
  async clear() {
    memory = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    listeners.forEach(l => l(memory));
  },
  subscribe(fn: (s: ActiveTimerState | null) => void) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(x => x !== fn);
    };
  },
};



