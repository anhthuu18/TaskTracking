import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { ScreenLayout } from '../constants/Dimensions';
import type { RootStackParamList } from '../navigation/AppNavigator';

// Home Screen Component
const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [selectedTab, setSelectedTab] = React.useState<'overview' | 'analytics'>('overview');

  return (
  <View style={styles.tabContainer}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.neutral.medium} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="tune" size={20} color={Colors.neutral.medium} />
        </TouchableOpacity>
      </View>

      {/* Tab Section */}
      <View style={styles.tabSection}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'overview' && styles.activeTabButton]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'overview' && styles.activeTabButtonText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'analytics' && styles.activeTabButton]}
          onPress={() => setSelectedTab('analytics')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'analytics' && styles.activeTabButtonText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.homeContent}>
          {selectedTab === 'analytics' ? (
            // Analytics Content
            <>
              {/* Task Statistics Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="analytics" size={20} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Task Statistics</Text>
                </View>
              </View>

              {/* Statistics Blocks */}
              <View style={styles.statisticsContainer}>
                <View style={styles.statBlock}>
                  <View style={styles.statIconContainer}>
                    <MaterialIcons name="add-task" size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.statNumber}>24</Text>
                  <Text style={styles.statLabel}>Tasks Created</Text>
                  <Text style={styles.statPeriod}>Last 7 days</Text>
                </View>

                <View style={styles.statBlock}>
                  <View style={styles.statIconContainer}>
                    <MaterialIcons name="task-alt" size={24} color={Colors.success} />
                  </View>
                  <Text style={styles.statNumber}>18</Text>
                  <Text style={styles.statLabel}>Tasks Completed</Text>
                  <Text style={styles.statPeriod}>Last 7 days</Text>
                </View>

                <View style={styles.statBlock}>
                  <View style={styles.statIconContainer}>
                    <MaterialIcons name="schedule" size={24} color={Colors.warning} />
                  </View>
                  <Text style={styles.statNumber}>6</Text>
                  <Text style={styles.statLabel}>Due Soon</Text>
                  <Text style={styles.statPeriod}>Next 3 days</Text>
                </View>
              </View>

              {/* Calendar Section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="event" size={20} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Calendar Events</Text>
                </View>
              </View>

              <View style={styles.calendarSection}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarMonth}>January 2025</Text>
                  <View style={styles.calendarNavigation}>
                    <TouchableOpacity>
                      <MaterialIcons name="chevron-left" size={24} color={Colors.neutral.medium} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.calendarGrid}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={index} style={styles.calendarDayHeader}>{day}</Text>
                  ))}
                  
                  {Array.from({ length: 35 }, (_, index) => {
                    const dayNumber = index - 6 + 1;
                    const isCurrentMonth = dayNumber > 0 && dayNumber <= 31;
                    const hasEvent = [5, 12, 18, 25].includes(dayNumber);
                    const isToday = dayNumber === 15;
                    
                    return (
                      <View key={index} style={[
                        styles.calendarDay,
                        isToday && styles.calendarToday,
                        hasEvent && styles.calendarEventDay
                      ]}>
                        {isCurrentMonth && (
                          <Text style={[
                            styles.calendarDayText,
                            isToday && styles.calendarTodayText,
                            hasEvent && styles.calendarEventText
                          ]}>
                            {dayNumber}
                          </Text>
                        )}
                        {hasEvent && <View style={styles.eventDot} />}
                      </View>
                    );
                  })}
                </View>

                {/* Upcoming Events */}
                <View style={styles.upcomingEvents}>
                  <Text style={styles.upcomingTitle}>Upcoming Events</Text>
                  <View style={styles.eventItem}>
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>10:00</Text>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>Team Meeting</Text>
                      <Text style={styles.eventDate}>Today, Jan 15, 2025</Text>
                    </View>
                  </View>
                  <View style={styles.eventItem}>
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>14:30</Text>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>Project Review</Text>
                      <Text style={styles.eventDate}>Tomorrow, Jan 16, 2025</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            // Overview Content (existing)
            <>
              {/* Your Project Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="apps" size={20} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Your project</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProjectList')}>
              <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>

          {/* Project Card */}
          <View style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>Mane UiKit</Text>
              <View style={styles.teamMembers}>
                <View style={[styles.memberAvatar, { backgroundColor: Colors.overlay.pink }]}>
                  <Text style={styles.memberInitial}>A</Text>
                </View>
                <View style={[styles.memberAvatar, { backgroundColor: Colors.overlay.purple }]}>
                  <Text style={styles.memberInitial}>B</Text>
                </View>
                <View style={[styles.memberAvatar, { backgroundColor: Colors.overlay.coral }]}>
                  <Text style={styles.memberInitial}>C</Text>
                </View>
                <View style={styles.memberCount}>
                  <Text style={styles.memberCountText}>+4</Text>
                </View>
              </View>
            </View>

            <View style={styles.projectDates}>
              <View style={styles.dateItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
                <Text style={styles.dateText}>01/01/2021</Text>
              </View>
              <View style={styles.dateSeparator} />
              <View style={styles.dateItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.primary} />
                <Text style={[styles.dateText, { color: Colors.primary }]}>01/02/2021</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressText}>50%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '50%' }]} />
              </View>
              <Text style={styles.tasksText}>24/48 tasks</Text>
            </View>
          </View>

          {/* Tasks Due Soon Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="schedule" size={20} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Tasks due soon</Text>
            </View>
            <TouchableOpacity>
              <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>

          {/* Tasks List */}
          <View style={styles.tasksList}>
            <View style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <MaterialIcons name="assignment" size={24} color={Colors.error} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>API Integration Testing</Text>
                <View style={styles.taskDeadline}>
                  <MaterialIcons name="schedule" size={14} color={Colors.error} />
                  <Text style={[styles.deadlineText, styles.overdue]}>Due: Today, Jan 15</Text>
                </View>
              </View>
              <View style={[styles.priorityBadge, styles.urgentBadge]}>
                <Text style={styles.priorityText}>Urgent</Text>
              </View>
            </View>

            <View style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <MaterialIcons name="assignment" size={24} color={Colors.warning} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>Mobile App UI Design</Text>
                <View style={styles.taskDeadline}>
                  <MaterialIcons name="schedule" size={14} color={Colors.warning} />
                  <Text style={[styles.deadlineText, styles.dueSoon]}>Due: Tomorrow, Jan 16</Text>
                </View>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>High</Text>
              </View>
            </View>

            <View style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <MaterialIcons name="assignment" size={24} color={Colors.warning} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>Database Migration</Text>
                <View style={styles.taskDeadline}>
                  <MaterialIcons name="schedule" size={14} color={Colors.warning} />
                  <Text style={[styles.deadlineText, styles.dueSoon]}>Due: Jan 18, 2025</Text>
                </View>
              </View>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Medium</Text>
              </View>
            </View>

            <View style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <MaterialIcons name="assignment" size={24} color={Colors.neutral.dark} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>Design System Review</Text>
                <View style={styles.taskDeadline}>
                  <MaterialIcons name="schedule" size={14} color={Colors.neutral.medium} />
                  <Text style={styles.deadlineText}>Deadline: 07/01/2021</Text>
                </View>
              </View>
            </View>
          </View>
            </>
          )}
        </View>
      </ScrollView>
  </View>
);
};


// Voice Screen Component
const VoiceScreen = () => (
  <View style={styles.tabContainer}>
    <View style={styles.centerContent}>
      <View style={styles.voiceIconContainer}>
        <MaterialIcons name="mic" size={48} color={Colors.primary} />
      </View>
      <Text style={styles.centerTitle}>Voice Commands</Text>
      <Text style={styles.centerSubtitle}>Use voice to manage your tasks</Text>
      <TouchableOpacity style={styles.voiceButton}>
        <MaterialIcons name="mic" size={24} color={Colors.neutral.white} />
        <Text style={styles.voiceButtonText}>Start Recording</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Notification Screen Component
const NotificationScreen = () => (
  <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.notificationContent}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      
      <View style={styles.notificationItem}>
        <View style={styles.notificationIcon}>
          <MaterialIcons name="task_alt" size={20} color={Colors.semantic.success} />
        </View>
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>Task Completed</Text>
          <Text style={styles.notificationMessage}>Project documentation has been completed</Text>
          <Text style={styles.notificationTime}>2 hours ago</Text>
        </View>
      </View>

      <View style={styles.notificationItem}>
        <View style={styles.notificationIcon}>
          <MaterialIcons name="assignment" size={20} color={Colors.primary} />
        </View>
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>New Task Assigned</Text>
          <Text style={styles.notificationMessage}>You have been assigned a new task</Text>
          <Text style={styles.notificationTime}>4 hours ago</Text>
        </View>
      </View>

      <View style={styles.notificationItem}>
        <View style={styles.notificationIcon}>
          <MaterialIcons name="schedule" size={20} color={Colors.semantic.warning} />
        </View>
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>Deadline Reminder</Text>
          <Text style={styles.notificationMessage}>Project deadline is approaching</Text>
          <Text style={styles.notificationTime}>1 day ago</Text>
        </View>
      </View>
  </View>
  </ScrollView>
);

const SettingsScreen = () => (
  <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.settingsContent}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <MaterialIcons name="person" size={24} color={Colors.neutral.medium} />
          <Text style={styles.settingsItemText}>Profile</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <MaterialIcons name="delete" size={24} color={Colors.neutral.medium} />
          <Text style={styles.settingsItemText}>Trash</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Preferences</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <MaterialIcons name="notifications" size={24} color={Colors.neutral.medium} />
          <Text style={styles.settingsItemText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <MaterialIcons name="palette" size={24} color={Colors.neutral.medium} />
          <Text style={styles.settingsItemText}>Theme</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <MaterialIcons name="help" size={24} color={Colors.neutral.medium} />
          <Text style={styles.settingsItemText}>Help & Support</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <MaterialIcons name="info" size={24} color={Colors.neutral.medium} />
          <Text style={styles.settingsItemText}>About</Text>
          <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
        </TouchableOpacity>
      </View>
  </View>
  </ScrollView>
);

const Tab = createBottomTabNavigator();

type WorkspaceDashboardRouteProp = RouteProp<RootStackParamList, 'WorkspaceDashboard'>;

const WorkspaceDashboardScreen: React.FC = () => {
  const route = useRoute<WorkspaceDashboardRouteProp>();
  const { workspace } = route.params || {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
        <Text style={styles.title}>Dashboard</Text>
          <MaterialIcons name="info-outline" size={20} color={Colors.neutral.medium} />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            // Navigate to add project screen
            console.log('Add new project');
          }}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>
      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: styles.tabBar,
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen 
          name="Voice" 
          component={VoiceScreen}
          options={{
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="mic" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Notifications" 
          component={NotificationScreen}
          options={{
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="notifications" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: ScreenLayout.headerTopSpacing,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 70,
    paddingBottom: 12,
    paddingTop: 8,
  },
  
  // Home Screen Styles
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.light + '40',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.neutral.medium,
    fontWeight: '400',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeTabButtonText: {
    color: Colors.neutral.white,
  },
  scrollContent: {
    flex: 1,
  },
  homeContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    marginLeft: 8,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  teamMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  memberInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.neutral.white,
  },
  memberCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.neutral.white,
  },
  projectDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginLeft: 4,
  },
  dateSeparator: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    position: 'relative',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  tasksText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  taskDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
  },
  overdue: {
    color: Colors.error,
    fontWeight: '600',
  },
  dueSoon: {
    color: Colors.warning,
    fontWeight: '600',
  },
  priorityBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  urgentBadge: {
    backgroundColor: Colors.error + '20',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
  },

  // Analytics Screen Styles
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBlock: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    textAlign: 'center',
    marginBottom: 4,
  },
  statPeriod: {
    fontSize: 12,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  calendarSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  calendarNavigation: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.medium,
    paddingVertical: 8,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarToday: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  calendarEventDay: {
    backgroundColor: Colors.accent + '20',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  calendarTodayText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  calendarEventText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  upcomingEvents: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    paddingTop: 16,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTime: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    paddingVertical: 8,
    marginRight: 12,
  },
  eventTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },

  // Voice Screen Styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  voiceIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  centerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  centerSubtitle: {
    fontSize: 16,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginBottom: 32,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  voiceButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Notification Screen Styles
  notificationContent: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },

  // Settings Screen Styles
  settingsContent: {
    padding: 20,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingsItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  settingsItemSubtext: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.neutral.light,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surface,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },


});

export default WorkspaceDashboardScreen;
