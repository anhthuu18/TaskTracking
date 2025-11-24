import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/Colors';

interface TaskTrackingScreenProps {
  navigation: any;
  route: any;
}

type SessionType = 'focus' | 'break' | 'longBreak';

interface Session {
  id: string;
  type: SessionType;
  duration: number; // in minutes
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
}

const TaskTrackingScreen: React.FC<TaskTrackingScreenProps> = ({ navigation, route }) => {
  const task = route?.params?.task || {
    id: '1',
    title: 'Design Q3 Report Graphics',
    description: 'Create a set of visually compelling graphics for the quarterly report.',
    dueDate: new Date('2024-08-25'),
    status: 'In Progress',
    priority: 'high',
  };

  // Pomodoro settings (mock data)
  const FOCUS_DURATION = 25; // minutes
  const SHORT_BREAK_DURATION = 5; // minutes
  const LONG_BREAK_DURATION = 15; // minutes
  const SESSIONS_BEFORE_LONG_BREAK = 4;

  // State
  const [activeTab, setActiveTab] = useState<'timer' | 'stats'>('timer');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [taskStatus, setTaskStatus] = useState(task.status || 'In Progress');
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(FOCUS_DURATION * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([
    { id: '1', type: 'focus', duration: FOCUS_DURATION, completed: false },
    { id: '2', type: 'break', duration: SHORT_BREAK_DURATION, completed: false },
    { id: '3', type: 'focus', duration: FOCUS_DURATION, completed: false },
    { id: '4', type: 'break', duration: SHORT_BREAK_DURATION, completed: false },
    { id: '5', type: 'focus', duration: FOCUS_DURATION, completed: false },
    { id: '6', type: 'break', duration: SHORT_BREAK_DURATION, completed: false },
    { id: '7', type: 'focus', duration: FOCUS_DURATION, completed: false },
    { id: '8', type: 'longBreak', duration: LONG_BREAK_DURATION, completed: false },
  ]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const currentSession = sessions[currentSessionIndex];
  const totalSeconds = currentSession ? currentSession.duration * 60 : FOCUS_DURATION * 60;
  const progress = timeRemaining / totalSeconds;

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    // Mark current session as completed
    const updatedSessions = [...sessions];
    updatedSessions[currentSessionIndex].completed = true;
    updatedSessions[currentSessionIndex].endTime = new Date();
    setSessions(updatedSessions);

    // Move to next session or finish
    if (currentSessionIndex < sessions.length - 1) {
      const nextIndex = currentSessionIndex + 1;
      setCurrentSessionIndex(nextIndex);
      setTimeRemaining(sessions[nextIndex].duration * 60);
    } else {
      // All sessions completed!
      console.log('All Pomodoro sessions completed!');
    }
  };

  const handleStartPause = () => {
    if (!isRunning && !currentSession.startTime) {
      // Start session for the first time
      const updatedSessions = [...sessions];
      updatedSessions[currentSessionIndex].startTime = new Date();
      setSessions(updatedSessions);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(currentSession.duration * 60);
    
    // Reset current session
    const updatedSessions = [...sessions];
    updatedSessions[currentSessionIndex].completed = false;
    updatedSessions[currentSessionIndex].startTime = undefined;
    updatedSessions[currentSessionIndex].endTime = undefined;
    setSessions(updatedSessions);
  };

  const handleSkipBreak = () => {
    if (currentSession.type !== 'focus' && currentSessionIndex < sessions.length - 1) {
      // Mark current break as completed and skip
      const updatedSessions = [...sessions];
      updatedSessions[currentSessionIndex].completed = true;
      setSessions(updatedSessions);

      const nextIndex = currentSessionIndex + 1;
      setCurrentSessionIndex(nextIndex);
      setTimeRemaining(sessions[nextIndex].duration * 60);
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeLabel = (type: SessionType) => {
    switch (type) {
      case 'focus':
        return 'Focus Session';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
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

  const completedFocusSessions = sessions.filter(s => s.type === 'focus' && s.completed).length;
  const totalFocusSessions = sessions.filter(s => s.type === 'focus').length;

  // Circular progress calculation
  const radius = 100;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  // Status options
  const statusOptions = ['To Do', 'In Progress', 'Review', 'Done'];

  // Mock statistics for this task
  const taskStats = {
    focusSessions: completedFocusSessions,
    totalTime: completedFocusSessions * FOCUS_DURATION,
    completionPercent: Math.round((completedFocusSessions / totalFocusSessions) * 100),
  };

  // Mock tracking history
  const trackingHistory = [
    { date: '2025-11-23', sessions: 4, totalMinutes: 100 },
    { date: '2025-11-22', sessions: 3, totalMinutes: 75 },
    { date: '2025-11-21', sessions: 2, totalMinutes: 50 },
    { date: '2025-11-20', sessions: 5, totalMinutes: 125 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
      
      {/* Header - Sticky */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Detail & Pomodoro</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
      </View>

      {/* Task Info Section - Sticky */}
      <View style={styles.taskInfoSection}>
          {/* Due Date & Status - Same Row */}
          <View style={styles.infoRowSplit}>
            {/* Due Date */}
            <View style={styles.infoItem}>
              <MaterialIcons name="event" size={16} color={Colors.primary} />
              <Text style={styles.infoLabelSmall}>Due:</Text>
              <Text style={styles.infoValueSmall}>
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>

            {/* Status with Dropdown */}
            <View style={styles.statusItem}>
              <MaterialIcons name="flag" size={16} color={Colors.accent} />
              <Text style={styles.infoLabelSmall}>Status:</Text>
              <TouchableOpacity 
                style={styles.statusDropdownTrigger}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.statusValue}>{taskStatus}</Text>
                <MaterialIcons name="arrow-drop-down" size={18} color={Colors.neutral.dark} />
              </TouchableOpacity>
              
              {/* Inline Dropdown Menu */}
              {showStatusDropdown && (
                <View style={styles.inlineStatusDropdown}>
                  {statusOptions.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={styles.inlineStatusOption}
                      onPress={() => {
                        setTaskStatus(status);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.inlineStatusOptionText,
                        taskStatus === status && styles.inlineStatusOptionTextActive
                      ]}>
                        {status}
                      </Text>
                      {taskStatus === status && (
                        <MaterialIcons name="check" size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
        </View>

      {/* Tabs - Sticky */}
      <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'timer' && styles.tabActive]}
            onPress={() => setActiveTab('timer')}
          >
            <MaterialIcons 
              name="timer" 
              size={20} 
              color={activeTab === 'timer' ? Colors.primary : Colors.neutral.medium} 
            />
            <Text style={[styles.tabText, activeTab === 'timer' && styles.tabTextActive]}>
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
              color={activeTab === 'stats' ? Colors.primary : Colors.neutral.medium} 
            />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
              Stats
            </Text>
          </TouchableOpacity>
        </View>

      {/* Tab Content */}
      {activeTab === 'timer' ? (
        <View style={styles.timerTabContainer}>
          {/* Fixed Timer Section */}
          <View style={styles.timerFixedSection}>
            {/* Circular Progress with SVG */}
            <View style={styles.timerCircleContainer}>
              <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
                {/* Background Circle */}
                <Circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke={Colors.neutral.light}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress Circle */}
                <Circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke={getSessionTypeColor(currentSession.type)}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
                />
              </Svg>
              <View style={styles.timerContent}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.sessionCountText}>
                  Session {completedFocusSessions + 1} of {totalFocusSessions}
                </Text>
              </View>
            </View>

            {/* Primary Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: isRunning ? Colors.warning : Colors.primary }]}
              onPress={handleStartPause}
            >
              <Text style={styles.primaryButtonText}>
                {isRunning ? 'Pause Focus' : timeRemaining === totalSeconds ? 'Start Focus' : 'Resume'}
              </Text>
            </TouchableOpacity>

            {/* Secondary Buttons */}
            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleReset}
                disabled={!isRunning && timeRemaining === totalSeconds}
              >
                <MaterialIcons name="refresh" size={20} color={Colors.neutral.dark} />
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.secondaryButton,
                  currentSession.type === 'focus' && styles.secondaryButtonDisabled
                ]}
                onPress={handleSkipBreak}
                disabled={currentSession.type === 'focus'}
              >
                <MaterialIcons 
                  name="skip-next" 
                  size={20} 
                  color={currentSession.type === 'focus' ? Colors.neutral.medium : Colors.neutral.dark} 
                />
                <Text style={[
                  styles.secondaryButtonText,
                  currentSession.type === 'focus' && styles.secondaryButtonTextDisabled
                ]}>
                  Skip Break
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Session Progress */}
          <View style={styles.sessionProgressSection}>
            <Text style={styles.sessionProgressTitle}>Session Progress</Text>
            <ScrollView 
              style={styles.sessionsScrollView}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <View style={styles.sessionsList}>
                {sessions.map((session, index) => (
                  <View 
                    key={session.id} 
                    style={[
                      styles.sessionItem,
                      index === currentSessionIndex && styles.sessionItemActive,
                      session.completed && styles.sessionItemCompleted,
                    ]}
                  >
                    {session.completed ? (
                      <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                    ) : index === currentSessionIndex ? (
                      <View style={[styles.sessionDot, { backgroundColor: getSessionTypeColor(session.type) }]} />
                    ) : (
                      <View style={[styles.sessionDot, { backgroundColor: Colors.neutral.light }]} />
                    )}
                    <Text style={[
                      styles.sessionItemText,
                      index === currentSessionIndex && styles.sessionItemTextActive,
                      session.completed && styles.sessionItemTextCompleted,
                    ]}>
                      {session.type === 'focus' ? `Focus ${Math.floor(index / 2) + 1}` : session.type === 'longBreak' ? 'Long Break' : 'Break'}
                    </Text>
                    <Text style={styles.sessionDuration}>{session.duration}m</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.contentScrollView}
          scrollEnabled={true}
        >
          <View style={styles.statsCard}>
            {/* Task Statistics */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Task Statistics</Text>
              <View style={styles.statsGridCompact}>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                  <MaterialIcons name="timer" size={32} color={Colors.primary} />
                  <Text style={styles.statValue}>{taskStats.focusSessions}</Text>
                  <Text style={styles.statLabel}>Completed Sessions</Text>
                </View>
                <View style={[styles.statItemCompact, { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' }]}>
                  <MaterialIcons name="access-time" size={32} color={Colors.accent} />
                  <Text style={styles.statValue}>{taskStats.totalTime}m</Text>
                  <Text style={styles.statLabel}>Total Time Tracked</Text>
                </View>
              </View>
            </View>

            {/* Task Tracking History */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Task Tracking History</Text>
              <View style={styles.historyList}>
                {trackingHistory.map((record, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.historyDateSection}>
                      <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
                      <Text style={styles.historyDate}>
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.historyStats}>
                      <View style={styles.historyStatItem}>
                        <MaterialIcons name="timer" size={14} color={Colors.accent} />
                        <Text style={styles.historyStatText}>{record.sessions} sessions</Text>
                      </View>
                      <View style={styles.historyStatItem}>
                        <MaterialIcons name="access-time" size={14} color={Colors.neutral.medium} />
                        <Text style={styles.historyStatText}>{record.totalMinutes}m</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  moreButton: {
    padding: 8,
  },
  taskInfoSection: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
    zIndex: 9,
  },
  infoRowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  infoLabelSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  infoValueSmall: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  statusDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  inlineStatusDropdown: {
    position: 'absolute',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '30',
  },
  inlineStatusOptionText: {
    fontSize: 13,
    color: Colors.neutral.dark,
  },
  inlineStatusOptionTextActive: {
    fontWeight: '700',
    color: Colors.primary,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
    zIndex: 8,
  },
  timerTabContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  timerFixedSection: {
    backgroundColor: Colors.neutral.white,
    padding: 24,
    alignItems: 'center',
  },
  contentScrollView: {
    flex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.medium,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  timerCircleContainer: {
    marginBottom: 32,
    marginTop: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '700',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.neutral.white,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonTextDisabled: {
    color: Colors.neutral.medium,
  },
  sessionProgressSection: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sessionProgressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 10,
  },
  sessionsScrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: Colors.neutral.white,
    padding: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 16,
  },
  statsGridCompact: {
    flexDirection: 'row',
    gap: 12,
  },
  statItemCompact: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.neutral.medium,
    textAlign: 'center',
    fontWeight: '500',
  },
  sessionsList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sessionItemCompleted: {
    backgroundColor: Colors.success + '10',
  },
  sessionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  sessionItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  sessionItemTextActive: {
    fontWeight: '700',
    color: Colors.primary,
  },
  sessionItemTextCompleted: {
    color: Colors.neutral.medium,
  },
  sessionDuration: {
    fontSize: 13,
    color: Colors.neutral.medium,
    fontWeight: '600',
  },
  historyList: {
    gap: 10,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.neutral.dark,
  },
  historyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  historyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
});

export default TaskTrackingScreen;

