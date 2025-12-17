import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  AppState,
  AppStateStatus,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../constants/Colors';
import { localNotification } from '../services/localNotification';
import {
  activeTimer,
  ActiveTimerState,
  ActiveTimerType,
} from '../services/activeTimer';
import { notificationEventHandler } from '../services/notificationEventHandler';
import { backgroundTimerService } from '../services/backgroundTimerService';
import {
  timeTrackingService,
  SessionType as ApiSessionType,
  TimeTrackingSession,
  TrackingHistory,
  PomodoroStatistics,
} from '../services/timeTrackingService';
import { taskService } from '../services';

interface TaskTrackingScreenProps {
  navigation: any;
  route: any;
}

type SessionType = 'focus' | 'break' | 'longBreak';

interface Session {
  id: string;
  type: SessionType;
  duration: number; // minutes
  completed: boolean;
}

const DEFAULTS = { focus: 25, shortBreak: 5, longBreak: 15 };
const RECURRING_NOTIFICATION_INTERVAL = 7; // seconds

const TaskTrackingScreen: React.FC<TaskTrackingScreenProps> = ({
  navigation,
  route,
}) => {
  const initialTask = route?.params?.task || null;
  const taskIdParam = route?.params?.taskId || null;
  const timerConfig = route?.params?.timerConfig || null;
  const showSessionCompleteDialog =
    route?.params?.showSessionCompleteDialog || false;

  // Task state - can be loaded from params or fetched via taskId
  const [passedTask, setPassedTask] = useState(initialTask);
  const [taskLoading, setTaskLoading] = useState(false);

  // Fetch task if taskId is provided but task object is not
  useEffect(() => {
    let mounted = true;

    if (taskIdParam && !initialTask) {
      console.log('[TaskTrackingScreen] Fetching task with ID:', taskIdParam);
      setTaskLoading(true);

      taskService
        .getTaskById(parseInt(taskIdParam, 10))
        .then(task => {
          if (mounted && task) {
            console.log(
              '[TaskTrackingScreen] Task fetched successfully:',
              task.taskName,
            );
            setPassedTask(task);
          }
        })
        .catch(error => {
          console.error('[TaskTrackingScreen] Failed to fetch task:', error);
          // Show error and navigate back
          Alert.alert('Error', 'Failed to load task details');
          navigation.goBack();
        })
        .finally(() => {
          if (mounted) {
            setTaskLoading(false);
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, [taskIdParam, initialTask, navigation]);

  // Load settings: route override > AsyncStorage > defaults
  const [focusMin, setFocusMin] = useState<number>(
    timerConfig?.focus ?? DEFAULTS.focus,
  );
  const [shortBreakMin, setShortBreakMin] = useState<number>(
    timerConfig?.shortBreak ?? DEFAULTS.shortBreak,
  );
  const [longBreakMin, setLongBreakMin] = useState<number>(
    timerConfig?.longBreak ?? DEFAULTS.longBreak,
  );

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>('timer');

  // Stats state
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [completedSessionsAll, setCompletedSessionsAll] = useState(0);
  const [totalFocusSecondsAll, setTotalFocusSecondsAll] = useState(0);
  const [todayFocusSeconds, setTodayFocusSeconds] = useState(0);
  const [todayBreakSeconds, setTodayBreakSeconds] = useState(0);
  const [todayFocusSessionsCount, setTodayFocusSessionsCount] = useState(0);
  const [history, setHistory] = useState<TrackingHistory[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const currentSession = sessions[currentIdx];

  const [taskStatus, setTaskStatus] = useState<string>(
    passedTask?.status || 'In Progress',
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');
  const hydrationDoneRef = useRef(false);
  const sessionCompleteDialogShownRef = useRef(false);
  const handlingCompleteRef = useRef(false);

  const statusOptions = ['To Do', 'In Progress', 'Review', 'Done'];

  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const totalSeconds = (currentSession?.duration ?? focusMin) * 60;
  // When not running and remaining is 0, display full duration instead of 00:00
  const effectiveRemaining =
    isRunning || timeRemaining > 0 ? timeRemaining : totalSeconds;
  const progress = totalSeconds > 0 ? effectiveRemaining / totalSeconds : 1;
  const strokeDashoffset = circumference - progress * circumference;

  const title = useMemo(() => {
    return (
      passedTask?.title ||
      passedTask?.taskName ||
      passedTask?.name ||
      'Task Tracking'
    );
  }, [passedTask]);

  // Build a standard 4-focus-cycle plan (3 short breaks then long break)
  const buildDefaultSessions = (
    f: number,
    sb: number,
    lb: number,
  ): Session[] => [
    { id: '1', type: 'focus', duration: f, completed: false },
    { id: '2', type: 'break', duration: sb, completed: false },
    { id: '3', type: 'focus', duration: f, completed: false },
    { id: '4', type: 'break', duration: sb, completed: false },
    { id: '5', type: 'focus', duration: f, completed: false },
    { id: '6', type: 'break', duration: sb, completed: false },
    { id: '7', type: 'focus', duration: f, completed: false },
    { id: '8', type: 'longBreak', duration: lb, completed: false },
  ];

  // Load pomodoro settings: route override > AsyncStorage > defaults (avoid race)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('pomodoroSettings');
        const stored = raw ? JSON.parse(raw) : {};
        const f =
          Number.parseInt(
            String(timerConfig?.focus ?? stored.focus ?? DEFAULTS.focus),
            10,
          ) || DEFAULTS.focus;
        const sb =
          Number.parseInt(
            String(
              timerConfig?.shortBreak ??
                stored.shortBreak ??
                DEFAULTS.shortBreak,
            ),
            10,
          ) || DEFAULTS.shortBreak;
        const lb =
          Number.parseInt(
            String(
              timerConfig?.longBreak ?? stored.longBreak ?? DEFAULTS.longBreak,
            ),
            10,
          ) || DEFAULTS.longBreak;
        if (!mounted) return;
        setFocusMin(f);
        setShortBreakMin(sb);
        setLongBreakMin(lb);
        if (sessions.length === 0) {
          setSessions(buildDefaultSessions(f, sb, lb));
          setCurrentIdx(0);
          setTimeRemaining(f * 60);
        }
      } catch (e) {
        if (sessions.length === 0) {
          const f = timerConfig?.focus ?? DEFAULTS.focus;
          const sb = timerConfig?.shortBreak ?? DEFAULTS.shortBreak;
          const lb = timerConfig?.longBreak ?? DEFAULTS.longBreak;
          setFocusMin(+f);
          setShortBreakMin(+sb);
          setLongBreakMin(+lb);
          setSessions(buildDefaultSessions(+f, +sb, +lb));
          setCurrentIdx(0);
          setTimeRemaining(+f * 60);
        }
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: mark sessions completed up to index
  const markCompletedUpTo = (idx: number, base: Session[]) =>
    base.map((s, i) => ({ ...s, completed: i < idx ? true : s.completed }));

  // Hydrate from activeTimer on mount - happens once to initialize
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Only hydrate once on mount
        if (hydrationDoneRef.current) return;

        let state = activeTimer.get();
        if (!state) state = await activeTimer.load();

        if (!mounted) return;

        if (state) {
          // Ensure sessions exist
          let baseSessions = sessions;
          if (baseSessions.length === 0) {
            const f = focusMin,
              sb = shortBreakMin,
              lb = longBreakMin;
            baseSessions = buildDefaultSessions(f, sb, lb);
          }

          const idx = state.currentSessionIndex ?? 0;
          setSessions(markCompletedUpTo(idx, baseSessions));
          setCurrentIdx(idx);
          setIsRunning(!!state.isRunning);

          const fullDur = ((baseSessions[idx]?.duration ?? focusMin) * 60) | 0;
          if (state.isRunning && state.expectedEndTs) {
            const rem = Math.max(
              0,
              Math.round((state.expectedEndTs - Date.now()) / 1000),
            );
            setTimeRemaining(rem > 0 ? rem : fullDur);
          } else if (state.remainingAtPause != null) {
            const rem = Math.max(0, state.remainingAtPause);
            setTimeRemaining(rem > 0 ? rem : fullDur);
          } else {
            const dur =
              state.durationSec && state.durationSec > 0
                ? state.durationSec
                : fullDur;
            setTimeRemaining(dur);
          }

          hydrationDoneRef.current = true;
        }
      } catch (error) {
        console.error('[TaskTrackingScreen] Hydration error:', error);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length]);

  // Sync helper when screen is focused
  const syncFromActiveTimer = async () => {
    try {
      const st = activeTimer.get() || (await activeTimer.load());
      if (!st || !passedTask || Number(st.taskId) !== Number(passedTask.id))
        return;

      // IMPORTANT: Use stored duration from activeTimer state, not current focusMin
      // because focusMin might still be default value if settings haven't loaded yet
      const storedDuration = st.durationSec;

      // Ensure sessions exist and completed flags are correct
      let base = sessions;
      if (base.length === 0) {
        // Load settings first to get correct durations
        let f = focusMin,
          sb = shortBreakMin,
          lb = longBreakMin;
        try {
          const raw = await AsyncStorage.getItem('pomodoroSettings');
          const stored = raw ? JSON.parse(raw) : {};
          f =
            Number.parseInt(
              String(timerConfig?.focus ?? stored.focus ?? DEFAULTS.focus),
              10,
            ) || DEFAULTS.focus;
          sb =
            Number.parseInt(
              String(
                timerConfig?.shortBreak ??
                  stored.shortBreak ??
                  DEFAULTS.shortBreak,
              ),
              10,
            ) || DEFAULTS.shortBreak;
          lb =
            Number.parseInt(
              String(
                timerConfig?.longBreak ??
                  stored.longBreak ??
                  DEFAULTS.longBreak,
              ),
              10,
            ) || DEFAULTS.longBreak;
        } catch {}
        base = buildDefaultSessions(f, sb, lb);
      }
      const idx = st.currentSessionIndex ?? 0;
      setSessions(markCompletedUpTo(idx, base));
      setCurrentIdx(idx);

      // Update running/remaining - prioritize stored duration from activeTimer
      const sessionDuration = base[idx]?.duration ?? focusMin;
      const fullDur = storedDuration || sessionDuration * 60;

      let remaining = 0;
      if (st.isRunning && st.expectedEndTs) {
        remaining = Math.max(
          0,
          Math.round((st.expectedEndTs - Date.now()) / 1000),
        );
        setIsRunning(true);
        setTimeRemaining(remaining > 0 ? remaining : fullDur);
      } else if (st.remainingAtPause != null) {
        remaining = Math.max(0, st.remainingAtPause);
        setIsRunning(false);
        setTimeRemaining(remaining > 0 ? remaining : fullDur);
      } else {
        remaining = fullDur;
        setIsRunning(false);
        setTimeRemaining(fullDur);
      }

      // If session was completed in background: advance to next session paused and show dialog
      if (st.completionHandled && remaining === 0 && !st.isRunning) {
        try {
          const updated = [...base];
          if (idx < updated.length) updated[idx].completed = true;
          const nextIdx = Math.min(idx + 1, updated.length - 1);
          const nextSeconds =
            ((updated[nextIdx]?.duration ?? focusMin) * 60) | 0;
          setSessions(updated);
          setCurrentIdx(nextIdx);
          setIsRunning(false);
          setTimeRemaining(nextSeconds);
          await activeTimer.update({
            currentSessionIndex: nextIdx,
            sessionType: (updated[nextIdx]?.type as any) || 'focus',
            isRunning: false,
            expectedEndTs: null,
            remainingAtPause: nextSeconds,
            completionHandled: false,
          });
        } catch {}
        if (isScreenFocused && !sessionCompleteDialogShownRef.current) {
          sessionCompleteDialogShownRef.current = true;
          handleShowSessionCompleteDialog();
        }
      }
    } catch {}
  };

  // Handle screen focus/blur - ALWAYS sync timer state when screen becomes focused
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      setIsScreenFocused(true);
      // reset flags so dialog can show again when navigating via notify
      sessionCompleteDialogShownRef.current = false;
      handlingCompleteRef.current = false;

      // CRITICAL: Always sync from activeTimer when screen focuses to prevent reset
      if (isActive) {
        syncFromActiveTimer();
      }

      // If session complete dialog should be shown (e.g., from tapping notification)
      if (
        showSessionCompleteDialog &&
        !sessionCompleteDialogShownRef.current &&
        isActive
      ) {
        sessionCompleteDialogShownRef.current = true;
        setTimeout(async () => {
          if (!isActive) return;
          try {
            // Ensure UI moves to next session (paused) before showing dialog
            const st = activeTimer.get() || (await activeTimer.load());
            let base = sessions;
            if (base.length === 0) {
              // Load settings
              let f = focusMin,
                sb = shortBreakMin,
                lb = longBreakMin;
              try {
                const raw = await AsyncStorage.getItem('pomodoroSettings');
                const stored = raw ? JSON.parse(raw) : {};
                f =
                  Number.parseInt(
                    String(
                      timerConfig?.focus ?? stored.focus ?? DEFAULTS.focus,
                    ),
                    10,
                  ) || DEFAULTS.focus;
                sb =
                  Number.parseInt(
                    String(
                      timerConfig?.shortBreak ??
                        stored.shortBreak ??
                        DEFAULTS.shortBreak,
                    ),
                    10,
                  ) || DEFAULTS.shortBreak;
                lb =
                  Number.parseInt(
                    String(
                      timerConfig?.longBreak ??
                        stored.longBreak ??
                        DEFAULTS.longBreak,
                    ),
                    10,
                  ) || DEFAULTS.longBreak;
              } catch {}
              base = buildDefaultSessions(f, sb, lb);
            }
            const idx = st?.currentSessionIndex ?? currentIdx;
            const rem = st?.expectedEndTs
              ? Math.max(0, Math.round((st.expectedEndTs - Date.now()) / 1000))
              : st?.remainingAtPause ?? 0;
            if (rem <= 0 || st?.completionHandled) {
              const updated = [...base];
              if (idx < updated.length) updated[idx].completed = true;
              const nextIdx = Math.min(idx + 1, updated.length - 1);
              const nextSeconds =
                ((updated[nextIdx]?.duration ??
                  (st?.durationSec ? st.durationSec / 60 : focusMin)) *
                  60) |
                0;
              setSessions(updated);
              setCurrentIdx(nextIdx);
              setIsRunning(false);
              setTimeRemaining(nextSeconds);
              await activeTimer.update({
                currentSessionIndex: nextIdx,
                sessionType: (updated[nextIdx]?.type as any) || 'focus',
                isRunning: false,
                expectedEndTs: null,
                remainingAtPause: nextSeconds,
                completionHandled: false,
              });
            }
          } catch {}
          if (isActive) {
            handleShowSessionCompleteDialog();
          }
        }, 200);
      }

      return () => {
        isActive = false;
        setIsScreenFocused(false);
      };
    }, [showSessionCompleteDialog]),
  );

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [isRunning, timeRemaining, currentIdx]);

  const handleAppStateChange = async (state: AppStateStatus) => {
    console.log(
      '[TaskTrackingScreen] App state:',
      appStateRef.current,
      '->',
      state,
    );
    const previousState = appStateRef.current;
    appStateRef.current = state;

    if (state === 'active' && previousState !== 'active') {
      // App came to foreground - sync timer state
      try {
        const timerState = activeTimer.get() || (await activeTimer.load());
        if (timerState?.expectedEndTs) {
          const rem = Math.max(
            0,
            Math.round((timerState.expectedEndTs - Date.now()) / 1000),
          );
          console.log(
            '[TaskTrackingScreen] Recalculated remaining (on resume):',
            rem,
          );

          // Sync state - keep isRunning as-is (don't force pause)
          if (isScreenFocused) {
            setTimeRemaining(rem);
            setIsRunning(timerState.isRunning);

            // If session completed while in background, handle it
            if (rem === 0 && !timerState.completionHandled) {
              console.log(
                '[TaskTrackingScreen] Session completed in background',
              );
              await handleSessionComplete(false);
            }
          }
        }
      } catch (e) {
        console.warn('[TaskTrackingScreen] Foreground recalc error:', e);
      }
    } else if (state === 'background' || state === 'inactive') {
      // App going to background - DON'T auto-pause, just schedule notification
      // User must tap Pause if they want to pause
      try {
        const st = activeTimer.get() || (await activeTimer.load());
        if (st?.isRunning && timeRemaining > 0) {
          const endTs = st.expectedEndTs || Date.now() + timeRemaining * 1000;
          await activeTimer.update({ expectedEndTs: endTs });
          const granted = await localNotification.requestPermission();
          // Cancel previous scheduled notification
          try {
            await localNotification.cancel(st?.scheduledNotificationId || null);
          } catch {}
          if (granted && endTs > Date.now()) {
            const scheduledId = await localNotification.scheduleAt(
              new Date(endTs),
              st.sessionType === 'focus'
                ? 'Focus session complete'
                : 'Break finished',
              st.sessionType === 'focus'
                ? 'Time for a break. Tap to continue.'
                : 'Ready for next focus? Tap to continue.',
              {
                data: {
                  taskId: String(passedTask?.id || 0),
                  taskTitle: title,
                  sessionType: st.sessionType,
                },
              },
            );
            await activeTimer.update({
              scheduledNotificationId: scheduledId || null,
            });
          }
        }
      } catch (e) {
        console.warn(
          '[TaskTrackingScreen] Background notification schedule error:',
          e,
        );
      }
    }
  };

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  // Tick - only when screen is focused and running
  useEffect(() => {
    if (isRunning && timeRemaining > 0 && isScreenFocused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current as any);
            // Natural completion (not skipped) - show modal/notification
            handleSessionComplete(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeRemaining, isScreenFocused]);

  const completedFocusSessions = useMemo(
    () => sessions.filter(s => s.type === 'focus' && s.completed).length,
    [sessions],
  );
  const totalFocusSessions = useMemo(
    () => sessions.filter(s => s.type === 'focus').length || 1,
    [sessions],
  );

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`;
  };

  const getSessionTypeColor = (type: SessionType) => {
    switch (type) {
      case 'focus':
        return Colors.primary;
      case 'break':
        return Colors.success;
      case 'longBreak':
        return Colors.accent;
    }
  };

  const persistState = async (patch: Partial<ActiveTimerState>) => {
    const current: ActiveTimerState | null =
      activeTimer.get() || (await activeTimer.load());

    // Determine target session index/type/duration based on patch or current UI state
    const targetIndex = patch.currentSessionIndex ?? currentIdx;
    const targetType =
      (patch.sessionType as ActiveTimerType) ??
      (sessions[targetIndex]?.type as ActiveTimerType) ??
      (currentSession?.type as ActiveTimerType) ??
      'focus';
    const targetDurationSec =
      patch.durationSec ??
      ((sessions[targetIndex]?.duration ??
        (targetType === 'longBreak'
          ? longBreakMin
          : targetType === 'break'
          ? shortBreakMin
          : focusMin)) *
        60) |
        0;

    if (!current) {
      // Initialize state when first starting
      const init: ActiveTimerState = {
        taskId: Number(passedTask?.id ?? 0),
        taskTitle: title,
        currentSessionIndex: targetIndex,
        sessionType: targetType,
        durationSec: targetDurationSec,
        isRunning: !!patch.isRunning,
        startedAt: patch.startedAt,
        expectedEndTs: patch.expectedEndTs ?? null,
        remainingAtPause: patch.remainingAtPause ?? timeRemaining,
        backendSessionId: null,
        scheduledNotificationId: null,
        completionHandled: false,
      };
      await activeTimer.set({
        ...init,
        ...patch,
        currentSessionIndex: targetIndex,
        sessionType: targetType,
        durationSec: targetDurationSec,
      } as ActiveTimerState);
      return;
    }

    await activeTimer.update({
      ...patch,
      taskId: Number(passedTask?.id ?? current.taskId),
      taskTitle: title,
      currentSessionIndex: targetIndex,
      sessionType: targetType,
      durationSec: targetDurationSec,
    });
  };

  const handleStartPause = async () => {
    if (!currentSession) return;

    if (!isRunning) {
      // Start/resume
      const secs = timeRemaining > 0 ? timeRemaining : totalSeconds;
      const expectedEndTs = Date.now() + secs * 1000;

      try {
        if (currentSession.type === 'focus' && passedTask?.id) {
          // Try create or ensure a session exists
          try {
            const s = activeTimer.get();
            if (!s?.backendSessionId) {
              const created = await timeTrackingService.createSession(
                Number(passedTask.id),
                ApiSessionType.FOCUS,
                Math.round(totalSeconds / 60),
                new Date(),
              );
              await persistState({ backendSessionId: created.id });
            }
          } catch (error) {
            console.error('[TaskTrackingScreen] Backend session error:', error);
          }
        }
      } catch {}

      // Schedule one end notification so it can fire even if user navigates away or app goes background
      let scheduledId: string | null = null;
      try {
        const granted = await localNotification.requestPermission();
        const cur = activeTimer.get() || (await activeTimer.load());
        try {
          await localNotification.cancel(cur?.scheduledNotificationId || null);
        } catch {}
        if (granted) {
          scheduledId = await localNotification.scheduleAt(
            new Date(expectedEndTs),
            currentSession.type === 'focus'
              ? 'Focus session complete'
              : 'Break finished',
            currentSession.type === 'focus'
              ? 'Time for a break.'
              : 'Ready for next focus?',
            {
              data: {
                taskId: String(passedTask?.id || 0),
                taskTitle: title,
                sessionType: currentSession.type,
              },
            },
          );
        }
      } catch (e) {
        console.warn('[TaskTrackingScreen] Schedule notification error:', e);
      }

      setIsRunning(true);
      setTimeRemaining(secs);
      await persistState({
        isRunning: true,
        startedAt: Date.now(),
        expectedEndTs,
        remainingAtPause: null,
        scheduledNotificationId: scheduledId || null,
      });
    } else {
      // Pause
      const current = activeTimer.get() || (await activeTimer.load());
      const rem = current?.expectedEndTs
        ? Math.max(0, Math.round((current.expectedEndTs - Date.now()) / 1000))
        : timeRemaining;

      // Cancel scheduled end notification when pausing
      try {
        await localNotification.cancel(
          current?.scheduledNotificationId || null,
        );
      } catch {}

      setIsRunning(false);
      setTimeRemaining(rem);
      await persistState({
        isRunning: false,
        expectedEndTs: null,
        remainingAtPause: rem,
        scheduledNotificationId: null,
      });
    }
  };

  const moveToNextSession = async (
    autoStart: boolean,
    skipByUser: boolean = false,
  ) => {
    const updated = [...sessions];
    if (currentIdx < updated.length) updated[currentIdx].completed = true;
    const nextIdx = Math.min(currentIdx + 1, updated.length - 1);

    // Derive next session and duration BEFORE updating state to avoid race conditions
    const nextSession = updated[nextIdx];
    const nextSeconds = ((nextSession?.duration ?? focusMin) * 60) | 0;

    // Apply state updates
    setSessions(updated);
    setCurrentIdx(nextIdx);
    setTimeRemaining(nextSeconds);

    // Stop any recurring notification
    await notificationEventHandler.stopRecurringNotification();

    // Reset handling flag for next session
    handlingCompleteRef.current = false;

    if (autoStart && nextSession) {
      // Auto start next session deterministically here (no setTimeout)
      const expectedEndTs = Date.now() + nextSeconds * 1000;
      setIsRunning(true);

      // Best-effort backend create for focus session
      try {
        if (nextSession.type === 'focus' && passedTask?.id) {
          const s = activeTimer.get() || (await activeTimer.load());
          if (!s?.backendSessionId) {
            const created = await timeTrackingService.createSession(
              Number(passedTask.id),
              ApiSessionType.FOCUS,
              Math.round(nextSession.duration ?? focusMin),
              new Date(),
            );
            await persistState({ backendSessionId: created.id });
          }
        }
      } catch {}

      await persistState({
        currentSessionIndex: nextIdx,
        sessionType: nextSession.type as any,
        isRunning: true,
        startedAt: Date.now(),
        expectedEndTs,
        remainingAtPause: null,
        scheduledNotificationId: null,
        completionHandled: false,
      });
    } else {
      // Do not start automatically, just land on next session paused
      await persistState({
        currentSessionIndex: nextIdx,
        sessionType: (nextSession?.type ?? 'focus') as any,
        isRunning: false,
        expectedEndTs: null,
        remainingAtPause: nextSeconds,
        scheduledNotificationId: null,
        completionHandled: false,
      });
    }
  };

  const handleSessionComplete = async (skipByUser: boolean = false) => {
    if (handlingCompleteRef.current) {
      console.log(
        '[TaskTrackingScreen] Session complete ignored (already handling)',
      );
      return;
    }
    handlingCompleteRef.current = true;

    console.log(
      '[TaskTrackingScreen] Session complete, skipByUser:',
      skipByUser,
    );
    setIsRunning(false);

    try {
      const st = activeTimer.get() || (await activeTimer.load());

      // Mark completion as handled
      if (st && !st.completionHandled) {
        await activeTimer.markCompletionHandled();
      }

      if (currentSession?.type === 'focus') {
        try {
          // Only call backend if we have an auth token and a known session id
          const token = await AsyncStorage.getItem('authToken');
          if (token && st?.backendSessionId) {
            await timeTrackingService.completeSession(st.backendSessionId);
          }
        } catch (error: any) {
          // Do not surface a redbox for backend issues; just warn in dev
          const msg = error?.message || String(error);
          if (__DEV__)
            console.warn('[TaskTrackingScreen] completeSession failed:', msg);
        }
      }
    } catch (error) {
      console.error('[TaskTrackingScreen] Session complete error:', error);
    }

    if (!currentSession) {
      handlingCompleteRef.current = false;
      return;
    }

    // Cancel any scheduled end notification to avoid duplicates
    try {
      const cur = activeTimer.get() || (await activeTimer.load());
      await localNotification.cancel(cur?.scheduledNotificationId || null);
      await activeTimer.update({ scheduledNotificationId: null });
    } catch {}

    // DON'T show notification/modal if user manually skipped
    if (skipByUser) {
      console.log(
        '[TaskTrackingScreen] User manually skipped, no notification',
      );
      try {
        await activeTimer.update({
          isRunning: false,
          expectedEndTs: null,
          remainingAtPause: 0,
          completionHandled: true,
        });
      } catch {}
      handlingCompleteRef.current = false;
      return;
    }

    if (isScreenFocused) {
      // Option 1: In-app dialog + vibration, no push notification
      try {
        Vibration.vibrate([0, 600, 250, 600]);
      } catch {}
      // Persist completion to avoid re-trigger loops on resume
      try {
        await activeTimer.update({
          isRunning: false,
          expectedEndTs: null,
          remainingAtPause: 0,
          completionHandled: true,
        });
      } catch {}
      handleShowSessionCompleteDialog();
    } else {
      // Option 2: App not focused: show exactly one push notification
      try {
        await localNotification.requestPermission();
        await localNotification.showNow(
          currentSession.type === 'focus'
            ? 'Focus session complete'
            : 'Break finished',
          currentSession.type === 'focus'
            ? 'Time for a break.'
            : 'Ready for next focus?',
        );
      } catch (e) {
        console.warn('[TaskTrackingScreen] showNow notification error:', e);
      }
      // Persist completion to avoid re-trigger loops on resume
      try {
        await activeTimer.update({
          isRunning: false,
          expectedEndTs: null,
          remainingAtPause: 0,
          completionHandled: true,
        });
      } catch {}
    }

    handlingCompleteRef.current = false;
  };

  const handleShowSessionCompleteDialog = () => {
    if (!currentSession) return;

    const isFocus = currentSession.type === 'focus';
    Alert.alert(
      isFocus ? 'Focus Session Complete!' : 'Break Time Over!',
      isFocus
        ? 'Time for a break. Ready to continue?'
        : 'Ready for next focus session?',
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => moveToNextSession(false),
        },
        { text: 'Start', onPress: () => moveToNextSession(true) },
      ],
    );
  };

  const showSessionCompletionNotification = async () => {
    try {
      if (!currentSession) return;

      const isFocus = currentSession.type === 'focus';
      const title = isFocus ? 'Focus Session Complete!' : 'Break Time Over!';
      const body = isFocus
        ? 'Time for a break. Tap to continue.'
        : 'Ready for next focus session? Tap to start.';

      // Start recurring notification
      await notificationEventHandler.startRecurringNotification(
        title,
        body,
        {
          taskId: String(passedTask?.id || 0),
          taskTitle: title,
          sessionType: currentSession.type,
        },
        RECURRING_NOTIFICATION_INTERVAL,
      );
    } catch (error) {
      console.error('[TaskTrackingScreen] Notification error:', error);
    }
  };

  const handleReset = () => {
    if (!currentSession) return;
    Alert.alert(
      'Restart All Sessions',
      'Reset all sessions and start from Focus 1? This will clear all completed sessions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart All',
          style: 'destructive',
          onPress: async () => {
            // Stop timer
            setIsRunning(false);

            // Rebuild fresh sessions
            const freshSessions = buildDefaultSessions(
              focusMin,
              shortBreakMin,
              longBreakMin,
            );
            setSessions(freshSessions);
            setCurrentIdx(0);

            // Reset to first focus session
            const firstFocusDuration = freshSessions[0].duration * 60;
            setTimeRemaining(firstFocusDuration);

            // Clear activeTimer state
            try {
              await activeTimer.clear();
              await persistState({
                currentSessionIndex: 0,
                sessionType: 'focus',
                isRunning: false,
                expectedEndTs: null,
                remainingAtPause: firstFocusDuration,
                scheduledNotificationId: null,
                completionHandled: false,
              });
            } catch {}
          },
        },
      ],
    );
  };

  // Test notification function removed - not needed in production

  // ---- Stats fetching ----
  const formatHM = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m${s ? ` ${s}s` : ''}`;
    return `${s}s`;
  };

  const fetchStats = async () => {
    if (!passedTask?.id) return;
    try {
      setStatsLoading(true);
      setStatsError(null);

      const taskIdNum = Number(passedTask.id);

      const [statsRes, todayRes, historyRes, allRes] = await Promise.allSettled(
        [
          timeTrackingService.getTaskStatistics(taskIdNum),
          timeTrackingService.getSessionsByTaskToday(taskIdNum),
          timeTrackingService.getTrackingHistory(taskIdNum, 14),
          timeTrackingService.getSessionsByTask(taskIdNum),
        ],
      );

      // All time totals - Use statistics API first, fallback to calculating from sessions
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value as PomodoroStatistics;
        const totalFocusSec = Math.max(
          0,
          Math.round((s.totalFocusTime || 0) * 60),
        );
        setTotalFocusSecondsAll(totalFocusSec);
        setCompletedSessionsAll(Math.max(0, s.completedSessions || 0));
      } else if (allRes.status === 'fulfilled') {
        // Fallback: Calculate from all sessions if statistics API fails
        const sessions = (allRes.value as TimeTrackingSession[]) || [];
        const focusSessions = sessions.filter(
          x =>
            String(x.sessionType).toUpperCase().includes('FOCUS') &&
            x.isCompleted,
        );
        setCompletedSessionsAll(focusSessions.length);

        // Calculate total focus time from actual elapsed time
        const focusSeconds = focusSessions.reduce((acc, x) => {
          if (x.startTime && x.endTime) {
            const d = Math.max(
              0,
              Math.round(
                (new Date(x.endTime).getTime() -
                  new Date(x.startTime).getTime()) /
                  1000,
              ),
            );
            return acc + d;
          }
          // Fallback to duration if timestamps missing
          if (Number.isFinite(x.duration))
            return acc + Math.round((x.duration || 0) * 60);
          return acc;
        }, 0);
        setTotalFocusSecondsAll(focusSeconds);
      }

      // Today - Only count COMPLETED sessions
      if (todayRes.status === 'fulfilled') {
        const todaySessions = (todayRes.value as TimeTrackingSession[]) || [];
        let fSec = 0,
          bSec = 0,
          fCount = 0;
        for (const ss of todaySessions) {
          // IMPORTANT: Only count completed sessions
          if (!ss.isCompleted) continue;

          const upper = String(ss.sessionType).toUpperCase();
          // Use actual elapsed time from timestamps
          const durSec =
            ss.startTime && ss.endTime
              ? Math.max(
                  0,
                  Math.round(
                    (new Date(ss.endTime).getTime() -
                      new Date(ss.startTime).getTime()) /
                      1000,
                  ),
                )
              : Math.round((ss.duration || 0) * 60);

          if (upper.includes('FOCUS')) {
            fSec += durSec;
            fCount += 1;
          } else {
            bSec += durSec;
          }
        }
        setTodayFocusSeconds(fSec);
        setTodayBreakSeconds(bSec);
        setTodayFocusSessionsCount(fCount);
      }

      // History
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value as TrackingHistory[]);
      }
    } catch (e: any) {
      setStatsError(e?.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        backgroundColor={Colors.neutral.white}
        barStyle="dark-content"
      />

      {/* Show loading if task is being fetched */}
      {taskLoading && (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: Colors.neutral.medium }}>Loading task...</Text>
        </View>
      )}

      {/* Show content only when task is loaded or not being fetched */}
      {!taskLoading && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={Colors.neutral.dark}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity style={styles.moreButton}>
              <MaterialIcons
                name="more-vert"
                size={24}
                color={Colors.neutral.dark}
              />
            </TouchableOpacity>
          </View>

          {/* Task Info */}
          <View style={styles.taskInfoSection}>
            <View style={styles.infoRowSplit}>
              <View style={styles.infoItem}>
                <MaterialIcons name="event" size={16} color={Colors.primary} />
                <Text style={styles.infoLabelSmall}>Due:</Text>
                <Text style={styles.infoValueSmall}>
                  {passedTask?.dueDate
                    ? new Date(passedTask.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <MaterialIcons name="flag" size={16} color={Colors.accent} />
                <Text style={styles.infoLabelSmall}>Status:</Text>
                <TouchableOpacity
                  style={styles.statusDropdownTrigger}
                  onPress={() => setShowStatusDropdown(v => !v)}
                >
                  <Text style={styles.statusValue}>{taskStatus}</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={18}
                    color={Colors.neutral.dark}
                  />
                </TouchableOpacity>
                {showStatusDropdown && (
                  <View style={styles.inlineStatusDropdown}>
                    {statusOptions.map(status => (
                      <TouchableOpacity
                        key={status}
                        style={styles.inlineStatusOption}
                        onPress={async () => {
                          setTaskStatus(status);
                          setShowStatusDropdown(false);
                          try {
                            if (passedTask?.id) {
                              const apiStatus = (() => {
                                const s = String(status).toLowerCase();
                                if (s.includes('progress'))
                                  return 'In Progress';
                                if (s.includes('review')) return 'Review';
                                if (
                                  s.includes('done') ||
                                  s.includes('complete')
                                )
                                  return 'Done';
                                return 'To Do';
                              })();
                              await taskService.updateTask(
                                Number(passedTask.id),
                                {
                                  status: apiStatus,
                                } as any,
                              );
                            }
                          } catch {}
                          route?.params?.onStatusChanged?.(status);
                        }}
                      >
                        <Text
                          style={[
                            styles.inlineStatusOptionText,
                            taskStatus === status &&
                              styles.inlineStatusOptionTextActive,
                          ]}
                        >
                          {status}
                        </Text>
                        {taskStatus === status && (
                          <MaterialIcons
                            name="check"
                            size={16}
                            color={Colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {!!passedTask?.description && (
              <Text style={styles.taskDescription}>
                {passedTask.description}
              </Text>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'timer' && styles.tabActive]}
              onPress={() => setActiveTab('timer')}
            >
              <MaterialIcons
                name="timer"
                size={20}
                color={
                  activeTab === 'timer' ? Colors.primary : Colors.neutral.medium
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'timer' && styles.tabTextActive,
                ]}
              >
                Timer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
              onPress={() => setActiveTab('stats')}
            >
              <MaterialIcons
                name="bar-chart"
                size={20}
                color={
                  activeTab === 'stats' ? Colors.primary : Colors.neutral.medium
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'stats' && styles.tabTextActive,
                ]}
              >
                Stats
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'timer' ? (
            <View style={styles.timerTabContainer}>
              <View style={styles.timerFixedSection}>
                <View style={styles.timerCircleContainer}>
                  <Svg
                    width={radius * 2 + strokeWidth * 2}
                    height={radius * 2 + strokeWidth * 2}
                  >
                    <Circle
                      cx={radius + strokeWidth}
                      cy={radius + strokeWidth}
                      r={radius}
                      stroke={Colors.neutral.light}
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    <Circle
                      cx={radius + strokeWidth}
                      cy={radius + strokeWidth}
                      r={radius}
                      stroke={getSessionTypeColor(
                        currentSession?.type || 'focus',
                      )}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${radius + strokeWidth} ${
                        radius + strokeWidth
                      })`}
                    />
                  </Svg>
                  <View style={styles.timerContent}>
                    <Text style={styles.timerText}>
                      {formatTime(effectiveRemaining)}
                    </Text>
                    <Text style={styles.sessionCountText}>
                      Session{' '}
                      {Math.min(
                        completedFocusSessions +
                          (currentSession?.type === 'focus' &&
                          timeRemaining !== totalSeconds
                            ? 1
                            : 0),
                        totalFocusSessions,
                      )}{' '}
                      of {totalFocusSessions}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: isRunning
                        ? Colors.warning
                        : Colors.primary,
                    },
                  ]}
                  onPress={handleStartPause}
                >
                  <Text style={styles.primaryButtonText}>
                    {isRunning
                      ? 'Pause'
                      : timeRemaining === 0 || timeRemaining === totalSeconds
                      ? currentSession?.type === 'focus'
                        ? 'Start Focus'
                        : 'Start Break'
                      : 'Resume'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.secondaryButtonsRow}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleReset}
                  >
                    <MaterialIcons
                      name="refresh"
                      size={20}
                      color={Colors.neutral.dark}
                    />
                    <Text style={styles.secondaryButtonText}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      currentSession?.type === 'focus' && { opacity: 0.5 },
                    ]}
                    onPress={async () => {
                      if (currentSession?.type !== 'focus') {
                        // User manually skips - no notification
                        await handleSessionComplete(true);
                        await moveToNextSession(false, true);
                      }
                    }}
                    disabled={currentSession?.type === 'focus'}
                  >
                    <MaterialIcons
                      name="skip-next"
                      size={20}
                      color={Colors.neutral.dark}
                    />
                    <Text style={styles.secondaryButtonText}>Skip Break</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Session list */}
              <View style={styles.sessionProgressSection}>
                <Text style={styles.sessionProgressTitle}>
                  Session Progress
                </Text>
                <ScrollView
                  style={styles.sessionsScrollView}
                  showsVerticalScrollIndicator
                >
                  <View style={styles.sessionsList}>
                    {sessions.map((s, i) => (
                      <View
                        key={s.id}
                        style={[
                          styles.sessionItem,
                          i === currentIdx && styles.sessionItemActive,
                          s.completed && styles.sessionItemCompleted,
                        ]}
                      >
                        {s.completed ? (
                          <MaterialIcons
                            name="check-circle"
                            size={20}
                            color={Colors.success}
                          />
                        ) : i === currentIdx ? (
                          <View
                            style={[
                              styles.sessionDot,
                              { backgroundColor: getSessionTypeColor(s.type) },
                            ]}
                          />
                        ) : (
                          <View
                            style={[
                              styles.sessionDot,
                              { backgroundColor: Colors.neutral.light },
                            ]}
                          />
                        )}
                        <Text
                          style={[
                            styles.sessionItemText,
                            i === currentIdx && styles.sessionItemTextActive,
                            s.completed && styles.sessionItemTextCompleted,
                          ]}
                        >
                          {s.type === 'focus'
                            ? `Focus ${Math.floor(i / 2) + 1}`
                            : s.type === 'longBreak'
                            ? 'Long Break'
                            : 'Break'}
                        </Text>
                        <Text style={styles.sessionDuration}>
                          {s.duration}m
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          ) : (
            <ScrollView
              style={styles.statsContainerOuter}
              contentContainerStyle={styles.statsContent}
              showsVerticalScrollIndicator={false}
            >
              {statsLoading ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: Colors.neutral.medium }}>
                    Loading statistics...
                  </Text>
                </View>
              ) : statsError ? (
                <View style={{ padding: 24 }}>
                  <Text style={{ color: Colors.semantic.error }}>
                    {statsError}
                  </Text>
                </View>
              ) : (
                <View style={styles.statsCard}>
                  <View style={styles.statsGridCompact}>
                    <View
                      style={[
                        styles.statItemCompact,
                        {
                          backgroundColor: Colors.primary + '15',
                          borderColor: Colors.primary + '30',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="timer"
                        size={28}
                        color={Colors.primary}
                      />
                      <Text style={styles.statValue}>
                        {completedSessionsAll}
                      </Text>
                      <Text style={styles.statLabel}>Completed sessions</Text>
                    </View>
                    <View
                      style={[
                        styles.statItemCompact,
                        {
                          backgroundColor: Colors.accent + '15',
                          borderColor: Colors.accent + '30',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="access-time"
                        size={28}
                        color={Colors.accent}
                      />
                      <Text style={styles.statValue}>
                        {formatHM(totalFocusSecondsAll)}
                      </Text>
                      <Text style={styles.statLabel}>Total focus</Text>
                    </View>
                  </View>

                  <View style={[styles.statsGridCompact, { marginTop: 12 }]}>
                    <View
                      style={[
                        styles.statItemCompact,
                        {
                          backgroundColor: Colors.success + '15',
                          borderColor: Colors.success + '30',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="check-circle"
                        size={28}
                        color={Colors.success}
                      />
                      <Text style={styles.statValue}>
                        {todayFocusSessionsCount}
                      </Text>
                      <Text style={styles.statLabel}>Today sessions</Text>
                    </View>
                    <View
                      style={[
                        styles.statItemCompact,
                        {
                          backgroundColor: Colors.neutral.light + '40',
                          borderColor: Colors.neutral.light,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="bolt"
                        size={28}
                        color={Colors.neutral.dark}
                      />
                      <Text style={styles.statValue}>
                        {formatHM(todayFocusSeconds)}
                      </Text>
                      <Text style={styles.statLabel}>Today focus</Text>
                    </View>
                    <View
                      style={[
                        styles.statItemCompact,
                        {
                          backgroundColor: Colors.warning + '15',
                          borderColor: Colors.warning + '30',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="free-breakfast"
                        size={28}
                        color={Colors.warning}
                      />
                      <Text style={styles.statValue}>
                        {formatHM(todayBreakSeconds)}
                      </Text>
                      <Text style={styles.statLabel}>Today break</Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.sessionProgressTitle}>
                      Task Tracking History
                    </Text>
                    {history && history.length > 0 ? (
                      <View style={{ gap: 10 }}>
                        {history.map((r, idx) => (
                          <View key={idx} style={styles.historyItem}>
                            <View style={styles.historyDateSection}>
                              <MaterialIcons
                                name="calendar-today"
                                size={16}
                                color={Colors.primary}
                              />
                              <Text style={styles.historyDate}>
                                {new Date(r.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                            <View style={styles.historyStats}>
                              <View style={styles.historyStatItem}>
                                <MaterialIcons
                                  name="timer"
                                  size={14}
                                  color={Colors.accent}
                                />
                                <Text style={styles.historyStatText}>
                                  {r.sessions} sessions
                                </Text>
                              </View>
                              <View style={styles.historyStatItem}>
                                <MaterialIcons
                                  name="bolt"
                                  size={14}
                                  color={Colors.neutral.medium}
                                />
                                <Text style={styles.historyStatText}>
                                  {formatHM((r.focusMinutes || 0) * 60)}
                                </Text>
                              </View>
                              <View style={styles.historyStatItem}>
                                <MaterialIcons
                                  name="free-breakfast"
                                  size={14}
                                  color={Colors.warning}
                                />
                                <Text style={styles.historyStatText}>
                                  {formatHM((r.breakMinutes || 0) * 60)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={{ paddingVertical: 16 }}>
                        <Text style={{ color: Colors.neutral.medium }}>
                          Task này chưa được tracking.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
    zIndex: 10,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.neutral.dark,
    flex: 1,
    textAlign: 'center' as const,
    marginHorizontal: 16,
  },
  moreButton: { padding: 8 },
  taskInfoSection: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
    zIndex: 9,
  },
  infoRowSplit: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    position: 'relative' as const,
  },
  infoLabelSmall: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.neutral.dark,
  },
  infoValueSmall: { fontSize: 13, color: Colors.neutral.medium },
  statusDropdownTrigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  inlineStatusDropdown: {
    position: 'absolute' as const,
    top: 30,
    right: 0,
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
    zIndex: 1000,
  },
  inlineStatusOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '30',
  },
  inlineStatusOptionText: { fontSize: 13, color: Colors.neutral.dark },
  inlineStatusOptionTextActive: {
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
    marginTop: 4,
  },
  timerTabContainer: { flex: 1, backgroundColor: Colors.neutral.white },
  timerFixedSection: {
    backgroundColor: Colors.neutral.white,
    padding: 24,
    alignItems: 'center' as const,
  },
  timerCircleContainer: {
    marginBottom: 32,
    marginTop: 16,
    position: 'relative' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  timerContent: {
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: Colors.neutral.dark,
    letterSpacing: -2,
  },
  sessionCountText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.neutral.white,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  secondaryButtonsRow: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    backgroundColor: Colors.neutral.light + '50',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  secondaryButtonText: {
    color: Colors.neutral.dark,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sessionProgressSection: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sessionProgressTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.neutral.dark,
    marginBottom: 10,
  },
  sessionsScrollView: { flex: 1 },
  sessionsList: { gap: 8 },
  sessionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '20',
  },
  sessionItemActive: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  sessionItemCompleted: { backgroundColor: Colors.success + '10' },
  sessionDot: { width: 16, height: 16, borderRadius: 8 },
  sessionItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.neutral.dark,
  },
  sessionItemTextActive: { fontWeight: '700' as const, color: Colors.primary },
  sessionItemTextCompleted: { color: Colors.neutral.medium },
  sessionDuration: {
    fontSize: 13,
    color: Colors.neutral.medium,
    fontWeight: '600' as const,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent' as const,
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.neutral.medium,
  },
  tabTextActive: { color: Colors.primary },

  // Stats styles
  statsContainerOuter: { flex: 1, backgroundColor: Colors.neutral.white },
  statsContent: { padding: 16 },
  statsCard: { backgroundColor: Colors.neutral.white, padding: 8 },
  statsGridCompact: { flexDirection: 'row' as const, gap: 12 },
  statItemCompact: {
    flex: 1,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.neutral.dark,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.neutral.medium,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },

  // History styles
  historyItem: {
    backgroundColor: Colors.neutral.white,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  historyDateSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.neutral.dark,
  },
  historyStats: { flexDirection: 'row' as const, gap: 12 },
  historyStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  historyStatText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500' as const,
  },

  // FAB
  fabContainer: { position: 'absolute' as const, bottom: 20, right: 20 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: 6,
  },
} as const;

export default TaskTrackingScreen;
