import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { ScreenLayout } from '../constants/Dimensions';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { CreateProjectModal, CreateActionDropdown, CreateTaskModal, CreateEventModal } from '../components';

// Home Screen Component
const HomeScreen = ({ navigation, workspace }: { navigation: any; workspace?: any }) => {
  const [selectedTab, setSelectedTab] = React.useState<'overview' | 'analytics'>('overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState(false);
  
  const dropdownOptions = [
    { id: 'task', title: 'Create task', icon: 'add_task' },
    { id: 'project', title: 'Create project', icon: 'folder' },
    { id: 'event', title: 'Create event', icon: 'event' },
  ];

  const filterOptions = [
    { id: 'all', title: 'All Projects' },
    { id: 'mane-uikit', title: 'Mane UiKit' },
    { id: 'mobile-app', title: 'Mobile App' },
    { id: 'backend', title: 'Backend' },
  ];

  const getFilterTitle = () => {
    const option = filterOptions.find(opt => opt.id === taskFilter);
    return option ? option.title : 'All Projects';
  };

  // Sample tasks data
  const allTasks = [
    {
      id: '1',
      title: 'API Integration Testing',
      project: 'Mane UiKit',
      projectId: 'mane-uikit',
      dueDate: new Date('2025-01-15'),
      priority: 'urgent',
      icon: 'assignment',
      color: Colors.error,
    },
    {
      id: '2',
      title: 'Mobile App UI Design',
      project: 'Mobile App',
      projectId: 'mobile-app',
      dueDate: new Date('2025-01-16'),
      priority: 'high',
      icon: 'assignment',
      color: Colors.warning,
    },
    {
      id: '3',
      title: 'Database Optimization',
      project: 'Backend',
      projectId: 'backend',
      dueDate: new Date('2025-01-17'),
      priority: 'medium',
      icon: 'storage',
      color: Colors.primary,
    },
    {
      id: '4',
      title: 'User Authentication',
      project: 'Backend',
      projectId: 'backend',
      dueDate: new Date('2025-01-18'),
      priority: 'high',
      icon: 'security',
      color: Colors.warning,
    },
    {
      id: '5',
      title: 'Component Library Update',
      project: 'Mane UiKit',
      projectId: 'mane-uikit',
      dueDate: new Date('2025-01-19'),
      priority: 'medium',
      icon: 'widgets',
      color: Colors.primary,
    },
    {
      id: '6',
      title: 'Performance Testing',
      project: 'Mobile App',
      projectId: 'mobile-app',
      dueDate: new Date('2025-01-20'),
      priority: 'low',
      icon: 'speed',
      color: Colors.accent,
    },
  ];

  // Filter and sort tasks
  const getFilteredTasks = () => {
    let filtered = allTasks;
    
    // Filter by project if not 'all'
    if (taskFilter !== 'all') {
      filtered = allTasks.filter(task => task.projectId === taskFilter);
    }
    
    // Sort by due date (closest first)
    filtered = filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    
    // Limit to 5 tasks for 'all' filter
    if (taskFilter === 'all') {
      filtered = filtered.slice(0, 5);
    }
    
    return filtered;
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return styles.urgentBadge;
      case 'high':
        return styles.highBadge;
      case 'medium':
        return styles.mediumBadge;
      case 'low':
        return styles.lowBadge;
      default:
        return styles.mediumBadge;
    }
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Due: Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Due: Tomorrow';
    } else {
      return `Due: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
  };

  const getDeadlineStyle = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return styles.overdue;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return styles.dueSoon;
    } else {
      return styles.upcoming;
    }
  };

  const handleDropdownSelect = (option: any) => {
    setShowDropdown(false);
    switch (option.id) {
      case 'task':
        //setShowCreateTaskModal(true);
        break;
      case 'project':
        setIsCreateProjectModalVisible(true);
        break;
      case 'event':
        //setShowCreateEventModal(true);
        break;
    }
  };

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
                  <Text style={styles.sectionTitle}>Workspace Overview</Text>
                </View>
              </View>

              {/* Enhanced Statistics Grid */}
              <View style={styles.enhancedStatsContainer}>
                <View style={styles.statsRow}>
                  <View style={styles.enhancedStatBlock}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="assignment" size={20} color={Colors.primary} />
                      <Text style={styles.statTitle}>Total Tasks</Text>
                    </View>
                    <Text style={styles.statMainNumber}>48</Text>
                    <View style={styles.statProgress}>
                      <View style={styles.statProgressBar}>
                        <View style={[styles.statProgressFill, { width: '75%', backgroundColor: Colors.primary }]} />
                      </View>
                      <Text style={styles.statProgressText}>75% Active</Text>
                    </View>
                  </View>

                  <View style={styles.enhancedStatBlock}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="check_circle" size={20} color={Colors.success} />
                      <Text style={styles.statTitle}>Completed</Text>
                    </View>
                    <Text style={styles.statMainNumber}>36</Text>
                    <View style={styles.statProgress}>
                      <View style={styles.statProgressBar}>
                        <View style={[styles.statProgressFill, { width: '90%', backgroundColor: Colors.success }]} />
                      </View>
                      <Text style={styles.statProgressText}>+12 this week</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.enhancedStatBlock}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="schedule" size={20} color={Colors.warning} />
                      <Text style={styles.statTitle}>Due Soon</Text>
                    </View>
                    <Text style={styles.statMainNumber}>6</Text>
                    <View style={styles.statProgress}>
                      <View style={styles.statProgressBar}>
                        <View style={[styles.statProgressFill, { width: '60%', backgroundColor: Colors.warning }]} />
                      </View>
                      <Text style={styles.statProgressText}>Next 7 days</Text>
                    </View>
                  </View>

                  <View style={styles.enhancedStatBlock}>
                    <View style={styles.statHeader}>
                      <MaterialIcons name="trending_up" size={20} color={Colors.accent} />
                      <Text style={styles.statTitle}>Productivity</Text>
                    </View>
                    <Text style={styles.statMainNumber}>92%</Text>
                    <View style={styles.statProgress}>
                      <View style={styles.statProgressBar}>
                        <View style={[styles.statProgressFill, { width: '92%', backgroundColor: Colors.accent }]} />
                      </View>
                      <Text style={styles.statProgressText}>↗ +5% vs last week</Text>
                    </View>
                  </View>
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
                    const hasEvent = [5, 12, 18, 25].includes(dayNumber); // Meeting days
                    const hasUrgentTask = [15, 16].includes(dayNumber); // Urgent tasks
                    const hasHighTask = [20, 22].includes(dayNumber); // High priority tasks
                    const hasMediumTask = [18, 24].includes(dayNumber); // Medium priority tasks
                    const isToday = dayNumber === 15;
                    
                    return (
                      <TouchableOpacity key={index} style={[
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
                        {hasEvent && <View style={[styles.eventDot, styles.meetingDot]} />}
                        {hasUrgentTask && <View style={[styles.eventDot, styles.urgentTaskDot]} />}
                        {hasHighTask && <View style={[styles.eventDot, styles.highTaskDot]} />}
                        {hasMediumTask && <View style={[styles.eventDot, styles.mediumTaskDot]} />}
                      </TouchableOpacity>
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

          {/* Project Card - Clickable */}
          <TouchableOpacity 
            style={styles.projectCard}
            onPress={() => navigation.navigate('ProjectList')}
            activeOpacity={0.7}
          >
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
          </TouchableOpacity>

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

          {/* Project Filter Dropdown */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.filterDropdownButton}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Text style={styles.filterDropdownText}>{getFilterTitle()}</Text>
              <MaterialIcons 
                name={showFilterDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={20} 
                color={Colors.neutral.medium} 
              />
            </TouchableOpacity>
            
            {showFilterDropdown && (
              <View style={styles.filterDropdownMenu}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterDropdownItem,
                      taskFilter === option.id && styles.activeFilterDropdownItem
                    ]}
                    onPress={() => {
                      setTaskFilter(option.id);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.filterDropdownItemText,
                      taskFilter === option.id && styles.activeFilterDropdownItemText
                    ]}>
                      {option.title}
                    </Text>
                    {taskFilter === option.id && (
                      <MaterialIcons name="check" size={16} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Tasks List - Scrollable */}
          <ScrollView style={styles.tasksScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.tasksList}>
              {getFilteredTasks().map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskIcon}>
                    <MaterialIcons name={task.icon as any} size={24} color={task.color} />
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskProject}>{task.project}</Text>
                    <View style={styles.taskDeadline}>
                      <MaterialIcons name="schedule" size={14} color={task.color} />
                      <Text style={[styles.deadlineText, getDeadlineStyle(task.dueDate)]}>
                        {formatDueDate(task.dueDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.priorityBadge, getPriorityBadgeStyle(task.priority)]}>
                    <Text style={styles.priorityText}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Dropdown Menu */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownMenu}>
            {dropdownOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.dropdownItem}
                onPress={() => handleDropdownSelect(option)}
              >
                <MaterialIcons name={option.icon} size={20} color={Colors.neutral.dark} />
                <Text style={styles.dropdownItemText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  const navigation = useNavigation();
  const { workspace } = route.params || {};
  const [isCreateProjectModalVisible, setIsCreateProjectModalVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <MaterialIcons name="dashboard" size={24} color={Colors.primary} />
              <Text style={styles.title}>Dashboard</Text>
            </View>
            <Text style={styles.workspaceWelcome}>
              Welcome to {workspace?.name || 'Your Workspace'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowDropdown(true)}
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
          options={{
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        >
          {(props) => <HomeScreen {...props} workspace={workspace} />}
        </Tab.Screen>

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
      
      <CreateActionDropdown
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onCreateProject={() => setIsCreateProjectModalVisible(true)}
        onCreateTask={() => setShowCreateTaskModal(true)}
        onCreateEvent={() => setShowCreateEventModal(true)}
      />

      <CreateProjectModal
        visible={isCreateProjectModalVisible}
        onClose={() => setIsCreateProjectModalVisible(false)}
        onProjectCreated={(project: any) => {
          setIsCreateProjectModalVisible(false);
          console.log('Project created:', project);
        }}
      />

      <CreateTaskModal
        visible={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={(taskData: any) => {
          setShowCreateTaskModal(false);
          console.log('Task created:', taskData);
        }}
        isPersonalWorkspace={true}
      />

      <CreateEventModal
        visible={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onCreateEvent={(eventData: any) => {
          setShowCreateEventModal(false);
          console.log('Event created:', eventData);
        }}
      />
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
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  workspaceWelcome: {
    fontSize: 14,
    color: Colors.neutral.medium,
    fontWeight: '500',
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
    marginBottom: 2,
  },
  taskProject: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
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
  upcoming: {
    color: Colors.neutral.medium,
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
  highBadge: {
    backgroundColor: Colors.warning + '20',
  },
  mediumBadge: {
    backgroundColor: Colors.primary + '20',
  },
  lowBadge: {
    backgroundColor: Colors.accent + '20',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
  },

  // Filter Styles
  filterContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  filterScrollView: {
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeFilterChipText: {
    color: Colors.neutral.white,
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  filterDropdownText: {
    fontSize: 14,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    marginTop: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  activeFilterDropdownItem: {
    backgroundColor: Colors.primary + '10',
  },
  filterDropdownItemText: {
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  activeFilterDropdownItemText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  tasksScrollView: {
    maxHeight: 200,
    marginBottom: 20,
  },

  // Dropdown Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },

  // Enhanced Analytics Screen Styles
  enhancedStatsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  enhancedStatBlock: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.medium,
  },
  statMainNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  statProgress: {
    gap: 6,
  },
  statProgressBar: {
    height: 4,
    backgroundColor: Colors.neutral.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statProgressText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
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
    borderRadius: 20,
  },
  calendarToday: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  calendarEventDay: {
    backgroundColor: Colors.primary + '20',
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
  },
  meetingDot: {
    backgroundColor: Colors.primary,
    bottom: 8,
  },
  urgentTaskDot: {
    backgroundColor: Colors.error,
    bottom: 4,
  },
  highTaskDot: {
    backgroundColor: Colors.warning,
    bottom: 4,
    right: 8,
  },
  mediumTaskDot: {
    backgroundColor: Colors.success,
    bottom: 4,
    left: 8,
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
