import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '../constants/Colors';
import { localNotification } from '../services/localNotification';
import { activeTimer, ActiveTimerState, ActiveTimerType } from '../services/activeTimer';
import { timeTrackingService, SessionType as ApiSessionType, TimeTrackingSession, TrackingHistory, PomodoroStatistics } from '../services/timeTrackingService';
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

const TaskTrackingScreen: React.FC<TaskTrackingScreenProps> = ({ navigation, route }) => {
  const passedTask = route?.params?.task || null;
  const timerConfig = route?.params?.timerConfig || null; // { focus, shortBreak, longBreak }

  // Load settings: route override > AsyncStorage > defaults
  const [focusMin, setFocusMin] = useState<number>(timerConfig?.focus ?? DEFAULTS.focus);
  const [shortBreakMin, setShortBreakMin] = useState<number>(timerConfig?.shortBreak ?? DEFAULTS.shortBreak);
  const [longBreakMin, setLongBreakMin] = useState<number>(timerConfig?.longBreak ?? DEFAULTS.longBreak);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'timer'|'stats'>('timer');

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
  const currentSession = sessions[currentIdx];

  const [taskStatus, setTaskStatus] = useState<string>(passedTask?.status || 'In Progress');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const statusOptions = ['To Do', 'In Progress', 'Review', 'Done'];

  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const totalSeconds = (currentSession?.duration ?? focusMin) * 60;
  const progress = totalSeconds > 0 ? timeRemaining / totalSeconds : 1;
  const strokeDashoffset = circumference - progress * circumference;

  const title = useMemo(() => {
    return passedTask?.title || passedTask?.taskName || passedTask?.name || 'Task Tracking';
  }, [passedTask]);

  // Build a standard 4-focus-cycle plan (3 short breaks then long break)
  const buildDefaultSessions = (f: number, sb: number, lb: number): Session[] => (
    [
      { id: '1', type: 'focus', duration: f, completed: false },
      { id: '2', type: 'break', duration: sb, completed: false },
      { id: '3', type: 'focus', duration: f, completed: false },
      { id: '4', type: 'break', duration: sb, completed: false },
      { id: '5', type: 'focus', duration: f, completed: false },
      { id: '6', type: 'break', duration: sb, completed: false },
      { id: '7', type: 'focus', duration: f, completed: false },
      { id: '8', type: 'longBreak', duration: lb, completed: false },
    ]
  );

  // Load stored pomodoro settings if not passed via route
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!timerConfig) {
          const raw = await AsyncStorage.getItem('pomodoroSettings');
          if (raw) {
            const s = JSON.parse(raw);
            const f = Number.parseInt(String(s.focus ?? DEFAULTS.focus), 10) || DEFAULTS.focus;
            const sb = Number.parseInt(String(s.shortBreak ?? DEFAULTS.shortBreak), 10) || DEFAULTS.shortBreak;
            const lb = Number.parseInt(String(s.longBreak ?? DEFAULTS.longBreak), 10) || DEFAULTS.longBreak;
            if (!mounted) return;
            setFocusMin(f); setShortBreakMin(sb); setLongBreakMin(lb);
            setSessions(buildDefaultSessions(f, sb, lb));
            setCurrentIdx(0);
            setTimeRemaining(f * 60);
          }
        }
      } catch {}
      if (mounted && sessions.length === 0) {
        const f = timerConfig?.focus ?? focusMin;
        const sb = timerConfig?.shortBreak ?? shortBreakMin;
        const lb = timerConfig?.longBreak ?? longBreakMin;
        setSessions(buildDefaultSessions(f, sb, lb));
        setCurrentIdx(0);
        setTimeRemaining((timerConfig?.focus ?? f) * 60);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate from activeTimer so leaving/returning keeps progress
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let state = activeTimer.get();
        if (!state) state = await activeTimer.load();
        if (!mounted) return;
        if (state && passedTask && Number(state.taskId) === Number(passedTask.id)) {
          // Ensure sessions exist
          if (sessions.length === 0) {
            const f = focusMin, sb = shortBreakMin, lb = longBreakMin;
            setSessions(buildDefaultSessions(f, sb, lb));
          }
          setCurrentIdx(state.currentSessionIndex ?? 0);
          setIsRunning(!!state.isRunning);
          if (state.isRunning && state.expectedEndTs) {
            const rem = Math.max(0, Math.round((state.expectedEndTs - Date.now()) / 1000));
            setTimeRemaining(rem);
          } else if (state.remainingAtPause != null) {
            setTimeRemaining(Math.max(0, state.remainingAtPause));
          } else {
            setTimeRemaining(state.durationSec ?? totalSeconds);
          }
        }
      } catch {}
    })();
    return () => { mounted = false; };
    // Intentionally not including deps to run once after initial sessions set/hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length]);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 300, useNativeDriver: false }).start();
  }, [progress, progressAnim]);

  // Tick
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as any);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeRemaining]);

  const completedFocusSessions = useMemo(
    () => sessions.filter(s => s.type === 'focus' && s.completed).length,
    [sessions]
  );
  const totalFocusSessions = useMemo(
    () => sessions.filter(s => s.type === 'focus').length || 1,
    [sessions]
  );

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`;
  };

  const getSessionTypeColor = (type: SessionType) => {
    switch (type) {
      case 'focus': return Colors.primary;
      case 'break': return Colors.success;
      case 'longBreak': return Colors.accent;
    }
  };

  const scheduleEndNotification = async (secsFromNow: number) => {
    try {
      const ok = await localNotification.requestPermission();
      if (!ok) return null;
      const when = new Date(Date.now() + secsFromNow * 1000);
      const title = currentSession?.type === 'focus' ? 'Focus session complete' : 'Break finished';
      const body = currentSession?.type === 'focus' ? 'Start a break?' : 'Start next focus?';
      const id = await localNotification.scheduleAt(when, title, body);
      return id;
    } catch {
      return null;
    }
  };

  const persistState = async (patch: Partial<ActiveTimerState>) => {
    const current: ActiveTimerState | null = activeTimer.get() || await activeTimer.load();
    if (!current) {
      // Initialize state when first starting
      const init: ActiveTimerState = {
        taskId: Number(passedTask?.id ?? 0),
        taskTitle: title,
        currentSessionIndex: currentIdx,
        sessionType: (currentSession?.type ?? 'focus') as ActiveTimerType,
        durationSec: totalSeconds,
        isRunning: !!patch.isRunning,
        startedAt: patch.startedAt,
        expectedEndTs: patch.expectedEndTs ?? null,
        remainingAtPause: patch.remainingAtPause ?? timeRemaining,
        backendSessionId: null,
        scheduledNotificationId: null,
      };
      await activeTimer.set({ ...init, ...patch } as ActiveTimerState);
      return;
    }
    await activeTimer.update({
      ...patch,
      taskId: Number(passedTask?.id ?? current.taskId),
      taskTitle: title,
      currentSessionIndex: currentIdx,
      sessionType: (currentSession?.type ?? current.sessionType) as ActiveTimerType,
      durationSec: totalSeconds,
    });
  };

  const handleStartPause = async () => {
    if (!currentSession) return;
    if (!isRunning) {
      // Start/resume
      const secs = timeRemaining > 0 ? timeRemaining : totalSeconds;
      const expectedEndTs = Date.now() + secs * 1000;
      const schedId = await scheduleEndNotification(secs);

      try {
        if (currentSession.type !== 'focus') {
          // no-op backend for breaks
        } else if (passedTask?.id) {
          // try create or ensure a session exists
          // This is best-effort, swallow errors to not block UI
          // eslint-disable-next-line no-empty
          try {
            const s = activeTimer.get();
            if (!s?.backendSessionId) {
              const created = await timeTrackingService.createSession(
                Number(passedTask.id),
                ApiSessionType.FOCUS,
                Math.round(totalSeconds / 60),
                new Date()
              );
              await persistState({ backendSessionId: created.id });
            }
          } catch {}
        }
      } catch {}

      setIsRunning(true);
      setTimeRemaining(secs);
      await persistState({
        isRunning: true,
        startedAt: Date.now(),
        expectedEndTs,
        remainingAtPause: null,
        scheduledNotificationId: schedId || null,
      });
    } else {
      // Pause
      const current = activeTimer.get() || await activeTimer.load();
      const rem = current?.expectedEndTs ? Math.max(0, Math.round((current.expectedEndTs - Date.now()) / 1000)) : timeRemaining;
      await localNotification.cancel(current?.scheduledNotificationId || null);
      setIsRunning(false);
      setTimeRemaining(rem);
      await persistState({ isRunning: false, expectedEndTs: null, remainingAtPause: rem, scheduledNotificationId: null });
    }
  };

  const moveToNextSession = async (autoStart: boolean) => {
    const updated = [...sessions];
    if (currentIdx < updated.length) updated[currentIdx].completed = true;
    const nextIdx = Math.min(currentIdx + 1, updated.length - 1);
    setSessions(updated);
    setCurrentIdx(nextIdx);
    const nextSeconds = (updated[nextIdx]?.duration ?? focusMin) * 60;
    setTimeRemaining(nextSeconds);

    await persistState({
      currentSessionIndex: nextIdx as any, // will be overwritten in persist by currentIdx state, but keep for safety
      sessionType: (updated[nextIdx]?.type ?? 'focus') as any,
      isRunning: false,
      expectedEndTs: null,
      remainingAtPause: nextSeconds,
      scheduledNotificationId: null,
    });

    if (autoStart) {
      setTimeout(() => { handleStartPause(); }, 0);
    }
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    try {
      const st = activeTimer.get() || await activeTimer.load();
      await localNotification.cancel(st?.scheduledNotificationId || null);
      await persistState({ isRunning: false, expectedEndTs: null, remainingAtPause: 0, scheduledNotificationId: null });
      if (st?.backendSessionId && currentSession?.type === 'focus') {
        // Best-effort complete
        // eslint-disable-next-line no-empty
        try { await timeTrackingService.completeSession(st.backendSessionId); } catch {}
      }
    } catch {}

    if (!currentSession) return;

    const isFocus = currentSession.type === 'focus';
    Alert.alert(
      isFocus ? 'Focus done' : 'Break finished',
      isFocus ? 'Start break now?' : 'Start next focus?',
      [
        { text: 'Later', style: 'cancel', onPress: () => moveToNextSession(false) },
        { text: 'Start', onPress: () => moveToNextSession(true) },
      ]
    );
  };

  const handleReset = () => {
    if (!currentSession) return;
    Alert.alert(
      'Reset timer',
      'Are you sure you want to reset the current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          const secs = (currentSession.duration) * 60;
          setIsRunning(false);
          setTimeRemaining(secs);
          try {
            const st = activeTimer.get() || await activeTimer.load();
            await localNotification.cancel(st?.scheduledNotificationId || null);
            await persistState({ isRunning: false, expectedEndTs: null, remainingAtPause: secs, scheduledNotificationId: null });
          } catch {}
        }},
      ]
    );
  };

  const notifyNow = async () => {
    await localNotification.requestPermission();
    await localNotification.showNow('Test Notification', 'This is a test notification');
  };

  const notifyIn5s = async () => {
    await localNotification.requestPermission();
    await localNotification.scheduleAt(new Date(Date.now() + 5000), 'Pomodoro Test', 'Scheduled after 5 seconds');
  };

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

      const [statsRes, todayRes, historyRes, allRes] = await Promise.allSettled([
        timeTrackingService.getTaskStatistics(taskIdNum),
        timeTrackingService.getSessionsByTaskToday(taskIdNum),
        timeTrackingService.getTrackingHistory(taskIdNum, 14),
        timeTrackingService.getSessionsByTask(taskIdNum),
      ]);

      // All time totals
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value as PomodoroStatistics;
        // Assume totalFocusTime in minutes -> convert to seconds
        const totalFocusSec = Math.max(0, Math.round((s.totalFocusTime || 0) * 60));
        setTotalFocusSecondsAll(totalFocusSec);
        // completedSessions expected to count focus sessions
        setCompletedSessionsAll(Math.max(0, s.completedSessions || 0));
      } else if (allRes.status === 'fulfilled') {
        const sessions = (allRes.value as TimeTrackingSession[]) || [];
        const focusSessions = sessions.filter(x => String(x.sessionType).toUpperCase().includes('FOCUS'));
        setCompletedSessionsAll(focusSessions.filter(x => x.isCompleted).length);
        const focusSeconds = focusSessions.reduce((acc, x) => {
          if (x.startTime && x.endTime) {
            const d = Math.max(0, Math.round((new Date(x.endTime).getTime() - new Date(x.startTime).getTime()) / 1000));
            return acc + d;
          }
          if (Number.isFinite(x.duration)) return acc + Math.round((x.duration || 0) * 60);
          return acc;
        }, 0);
        setTotalFocusSecondsAll(focusSeconds);
      }

      // Today
      if (todayRes.status === 'fulfilled') {
        const todaySessions = (todayRes.value as TimeTrackingSession[]) || [];
        let fSec = 0, bSec = 0, fCount = 0;
        for (const ss of todaySessions) {
          const upper = String(ss.sessionType).toUpperCase();
          const durSec = ss.startTime && ss.endTime
            ? Math.max(0, Math.round((new Date(ss.endTime).getTime() - new Date(ss.startTime).getTime()) / 1000))
            : Math.round((ss.duration || 0) * 60);
          if (upper.includes('FOCUS')) { fSec += durSec; fCount += ss.isCompleted ? 1 : 0; }
          else { bSec += durSec; }
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
      <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
      </View>

      {/* Task Info */}
      <View style={styles.taskInfoSection}>
        <View style={styles.infoRowSplit}>
          <View style={styles.infoItem}>
            <MaterialIcons name="event" size={16} color={Colors.primary} />
            <Text style={styles.infoLabelSmall}>Due:</Text>
            <Text style={styles.infoValueSmall}>
              {passedTask?.dueDate ? new Date(passedTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <MaterialIcons name="flag" size={16} color={Colors.accent} />
            <Text style={styles.infoLabelSmall}>Status:</Text>
            <TouchableOpacity style={styles.statusDropdownTrigger} onPress={() => setShowStatusDropdown(v => !v)}>
              <Text style={styles.statusValue}>{taskStatus}</Text>
              <MaterialIcons name="arrow-drop-down" size={18} color={Colors.neutral.dark} />
            </TouchableOpacity>
            {showStatusDropdown && (
              <View style={styles.inlineStatusDropdown}>
                {statusOptions.map((status) => (
                  <TouchableOpacity key={status} style={styles.inlineStatusOption} onPress={async () => { 
                    setTaskStatus(status); 
                    setShowStatusDropdown(false); 
                    try {
                      if (passedTask?.id) {
                        const apiStatus = (() => {
                          const s = String(status).toLowerCase();
                          if (s.includes('progress')) return 'In Progress';
                          if (s.includes('review')) return 'Review';
                          if (s.includes('done') || s.includes('complete')) return 'Done';
                          return 'To Do';
                        })();
                        await taskService.updateTask(Number(passedTask.id), { status: apiStatus } as any);
                      }
                    } catch {}
                    route?.params?.onStatusChanged?.(status); 
                  }}>
                    <Text style={[styles.inlineStatusOptionText, taskStatus === status && styles.inlineStatusOptionTextActive]}>{status}</Text>
                    {taskStatus === status && (<MaterialIcons name="check" size={16} color={Colors.primary} />)}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        {!!passedTask?.description && (<Text style={styles.taskDescription}>{passedTask.description}</Text>)}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'timer' && styles.tabActive]} onPress={() => setActiveTab('timer')}>
          <MaterialIcons name="timer" size={20} color={activeTab === 'timer' ? Colors.primary : Colors.neutral.medium} />
          <Text style={[styles.tabText, activeTab === 'timer' && styles.tabTextActive]}>Timer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'stats' && styles.tabActive]} onPress={() => setActiveTab('stats')}>
          <MaterialIcons name="bar-chart" size={20} color={activeTab === 'stats' ? Colors.primary : Colors.neutral.medium} />
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Stats</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'timer' ? (
      <View style={styles.timerTabContainer}>
        <View style={styles.timerFixedSection}>
          <View style={styles.timerCircleContainer}>
            <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
              <Circle cx={radius + strokeWidth} cy={radius + strokeWidth} r={radius} stroke={Colors.neutral.light} strokeWidth={strokeWidth} fill="none" />
              <Circle cx={radius + strokeWidth} cy={radius + strokeWidth} r={radius} stroke={getSessionTypeColor(currentSession?.type || 'focus')} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`} />
            </Svg>
            <View style={styles.timerContent}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.sessionCountText}>
                Session {Math.min(completedFocusSessions + (currentSession?.type === 'focus' && timeRemaining !== totalSeconds ? 1 : 0), totalFocusSessions)} of {totalFocusSessions}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: isRunning ? Colors.warning : Colors.primary }]} onPress={handleStartPause}>
            <Text style={styles.primaryButtonText}>{isRunning ? 'Pause' : (timeRemaining === totalSeconds ? (currentSession?.type === 'focus' ? 'Start Focus' : 'Start Break') : 'Resume')}</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
              <MaterialIcons name="refresh" size={20} color={Colors.neutral.dark} />
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, (currentSession?.type === 'focus') && { opacity: 0.5 }]}
              onPress={() => {
                if (currentSession?.type !== 'focus') {
                  // Skip only when on break
                  moveToNextSession(false);
                }
              }}
              disabled={currentSession?.type === 'focus'}
            >
              <MaterialIcons name="skip-next" size={20} color={Colors.neutral.dark} />
              <Text style={styles.secondaryButtonText}>Skip Break</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Session list */}
        <View style={styles.sessionProgressSection}>
          <Text style={styles.sessionProgressTitle}>Session Progress</Text>
          <ScrollView style={styles.sessionsScrollView} showsVerticalScrollIndicator>
            <View style={styles.sessionsList}>
              {sessions.map((s, i) => (
                <View key={s.id} style={[styles.sessionItem, i === currentIdx && styles.sessionItemActive, s.completed && styles.sessionItemCompleted]}>
                  {s.completed ? (
                    <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  ) : i === currentIdx ? (
                    <View style={[styles.sessionDot, { backgroundColor: getSessionTypeColor(s.type) }]} />
                  ) : (
                    <View style={[styles.sessionDot, { backgroundColor: Colors.neutral.light }]} />
                  )}
                  <Text style={[styles.sessionItemText, i === currentIdx && styles.sessionItemTextActive, s.completed && styles.sessionItemTextCompleted]}>
                    {s.type === 'focus' ? `Focus ${Math.floor(i / 2) + 1}` : s.type === 'longBreak' ? 'Long Break' : 'Break'}
                  </Text>
                  <Text style={styles.sessionDuration}>{s.duration}m</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
      ) : (
        <ScrollView style={styles.statsContainerOuter} contentContainerStyle={styles.statsContent} showsVerticalScrollIndicator={false}>
          {statsLoading ? (
            <View style={{ padding: 24, alignItems: 'center' }}><Text style={{ color: Colors.neutral.medium }}>Loading statistics...</Text></View>
          ) : statsError ? (
            <View style={{ padding: 24 }}><Text style={{ color: Colors.semantic.error }}>{statsError}</Text></View>
          ) : (
            <View style={styles.statsCard}>
              <View style={styles.statsGridCompact}>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                  <MaterialIcons name="timer" size={28} color={Colors.primary} />
                  <Text style={styles.statValue}>{completedSessionsAll}</Text>
                  <Text style={styles.statLabel}>Completed sessions</Text>
                </View>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' }]}>
                  <MaterialIcons name="access-time" size={28} color={Colors.accent} />
                  <Text style={styles.statValue}>{formatHM(totalFocusSecondsAll)}</Text>
                  <Text style={styles.statLabel}>Total focus</Text>
                </View>
              </View>

              <View style={[styles.statsGridCompact, { marginTop: 12 }]}>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '30' }]}>
                  <MaterialIcons name="check-circle" size={28} color={Colors.success} />
                  <Text style={styles.statValue}>{todayFocusSessionsCount}</Text>
                  <Text style={styles.statLabel}>Today sessions</Text>
                </View>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.neutral.light + '40', borderColor: Colors.neutral.light }]}>
                  <MaterialIcons name="bolt" size={28} color={Colors.neutral.dark} />
                  <Text style={styles.statValue}>{formatHM(todayFocusSeconds)}</Text>
                  <Text style={styles.statLabel}>Today focus</Text>
                </View>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '30' }]}>
                  <MaterialIcons name="free-breakfast" size={28} color={Colors.warning} />
                  <Text style={styles.statValue}>{formatHM(todayBreakSeconds)}</Text>
                  <Text style={styles.statLabel}>Today break</Text>
                </View>
              </View>

              <View style={{ marginTop: 20 }}>
                <Text style={styles.sessionProgressTitle}>Task Tracking History</Text>
                {history && history.length > 0 ? (
                  <View style={{ gap: 10 }}>
                    {history.map((r, idx) => (
                      <View key={idx} style={styles.historyItem}>
                        <View style={styles.historyDateSection}>
                          <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
                          <Text style={styles.historyDate}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                        </View>
                        <View style={styles.historyStats}>
                          <View style={styles.historyStatItem}>
                            <MaterialIcons name="timer" size={14} color={Colors.accent} />
                            <Text style={styles.historyStatText}>{r.sessions} sessions</Text>
                          </View>
                          <View style={styles.historyStatItem}>
                            <MaterialIcons name="bolt" size={14} color={Colors.neutral.medium} />
                            <Text style={styles.historyStatText}>{formatHM((r.focusMinutes || 0) * 60)}</Text>
                          </View>
                          <View style={styles.historyStatItem}>
                            <MaterialIcons name="free-breakfast" size={14} color={Colors.warning} />
                            <Text style={styles.historyStatText}>{formatHM((r.breakMinutes || 0) * 60)}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ color: Colors.neutral.medium }}>Task này chưa được tracking.</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <View pointerEvents="box-none" style={styles.fabContainer}>
        <TouchableOpacity accessibilityLabel="test-notify" onPress={notifyNow} style={styles.fab}>
          <MaterialIcons name="notifications" size={22} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '40', zIndex: 10 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.neutral.dark, flex: 1, textAlign: 'center' as const, marginHorizontal: 16 },
  moreButton: { padding: 8 },
  taskInfoSection: { backgroundColor: Colors.neutral.white, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '40', zIndex: 9 },
  infoRowSplit: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 8, gap: 12 },
  infoItem: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  statusItem: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, position: 'relative' as const },
  infoLabelSmall: { fontSize: 13, fontWeight: '600' as const, color: Colors.neutral.dark },
  infoValueSmall: { fontSize: 13, color: Colors.neutral.medium },
  statusDropdownTrigger: { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 2 },
  statusValue: { fontSize: 12, fontWeight: '600' as const, color: Colors.primary },
  inlineStatusDropdown: { position: 'absolute' as const, top: 30, right: 0, backgroundColor: Colors.neutral.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.neutral.light, shadowColor: Colors.neutral.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, minWidth: 120, zIndex: 1000 },
  inlineStatusOption: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '30' },
  inlineStatusOptionText: { fontSize: 13, color: Colors.neutral.dark },
  inlineStatusOptionTextActive: { fontWeight: '700' as const, color: Colors.primary },
  taskDescription: { fontSize: 14, color: Colors.neutral.medium, lineHeight: 20, marginTop: 4 },
  timerTabContainer: { flex: 1, backgroundColor: Colors.neutral.white },
  timerFixedSection: { backgroundColor: Colors.neutral.white, padding: 24, alignItems: 'center' as const },
  timerCircleContainer: { marginBottom: 32, marginTop: 16, position: 'relative' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  timerContent: { position: 'absolute' as const, alignItems: 'center' as const, justifyContent: 'center' as const },
  timerText: { fontSize: 56, fontWeight: '700' as const, color: Colors.neutral.dark, letterSpacing: -2 },
  sessionCountText: { fontSize: 14, color: Colors.neutral.medium, marginTop: 8 },
  primaryButton: { width: '100%', backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 16 },
  primaryButtonText: { color: Colors.neutral.white, fontSize: 17, fontWeight: '700' as const },
  secondaryButtonsRow: { flexDirection: 'row' as const, gap: 12, width: '100%' },
  secondaryButton: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, backgroundColor: Colors.neutral.light + '50', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral.light },
  secondaryButtonText: { color: Colors.neutral.dark, fontSize: 14, fontWeight: '600' as const },
  sessionProgressSection: { flex: 1, backgroundColor: Colors.neutral.white, paddingHorizontal: 24, paddingTop: 16 },
  sessionProgressTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.neutral.dark, marginBottom: 10 },
  sessionsScrollView: { flex: 1 },
  sessionsList: { gap: 8 },
  sessionItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.neutral.light + '20' },
  sessionItemActive: { backgroundColor: Colors.primary + '10', borderWidth: 2, borderColor: Colors.primary + '40' },
  sessionItemCompleted: { backgroundColor: Colors.success + '10' },
  sessionDot: { width: 16, height: 16, borderRadius: 8 },
  sessionItemText: { flex: 1, fontSize: 15, fontWeight: '500' as const, color: Colors.neutral.dark },
  sessionItemTextActive: { fontWeight: '700' as const, color: Colors.primary },
  sessionItemTextCompleted: { color: Colors.neutral.medium },
  sessionDuration: { fontSize: 13, color: Colors.neutral.medium, fontWeight: '600' as const },

  // Tabs
  tabsContainer: { flexDirection: 'row' as const, backgroundColor: Colors.neutral.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '40' },
  tab: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' as const },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: '600' as const, color: Colors.neutral.medium },
  tabTextActive: { color: Colors.primary },

  // Stats styles
  statsContainerOuter: { flex: 1, backgroundColor: Colors.neutral.white },
  statsContent: { padding: 16 },
  statsCard: { backgroundColor: Colors.neutral.white, padding: 8 },
  statsGridCompact: { flexDirection: 'row' as const, gap: 12 },
  statItemCompact: { flex: 1, alignItems: 'center' as const, padding: 16, borderRadius: 10, gap: 6, borderWidth: 1.5 },
  statValue: { fontSize: 22, fontWeight: '700' as const, color: Colors.neutral.dark },
  statLabel: { fontSize: 11, color: Colors.neutral.medium, textAlign: 'center' as const, fontWeight: '500' as const },

  // History styles
  historyItem: { backgroundColor: Colors.neutral.white, padding: 14, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.primary + '30', borderLeftWidth: 4, borderLeftColor: Colors.primary },
  historyDateSection: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 8 },
  historyDate: { fontSize: 13, fontWeight: '700' as const, color: Colors.neutral.dark },
  historyStats: { flexDirection: 'row' as const, gap: 12 },
  historyStatItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  historyStatText: { fontSize: 12, color: Colors.neutral.medium, fontWeight: '500' as const },

  // FAB
  fabContainer: { position: 'absolute' as const, bottom: 20, right: 20 },
  fab: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const, elevation: 6 },
} as const;

export default TaskTrackingScreen;
