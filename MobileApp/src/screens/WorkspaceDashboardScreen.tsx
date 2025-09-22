import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CreateProjectModal, WorkspaceActionDropdown, AddMemberModal } from '../components';
import { Colors } from '../constants/Colors';

import { projectService } from '../services/projectService';

const Tab = createBottomTabNavigator();

const DashboardContent = ({ navigation, route }: { navigation: any; route?: any }) => {
  const workspace = route?.params?.workspace;
  const [selectedTab, setSelectedTab] = React.useState<'overview' | 'analytics'>('overview');
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Load projects when workspace changes
  useEffect(() => {
    console.log('🔍 Workspace changed:', workspace);
    if (workspace?.id) {
      loadProjects();
    } else {
      // If no workspace ID, load with default ID 1 for testing
      console.log('⚠️ No workspace ID, loading with default ID 1');
      loadProjects();
    }
  }, [workspace?.id]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const workspaceId = workspace?.id || 1;
      console.log('🔍 Loading projects for workspace:', workspaceId, 'workspace object:', workspace);
      const response = await projectService.getProjectsByWorkspace(workspaceId);
      console.log('📡 Projects response:', response);
      
      if (response.success) {
        setProjects(response.data);
        console.log('✅ Projects loaded:', response.data.length);
      } else {
        console.error('❌ Failed to load projects:', response.message);
        setProjects([]);
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Failed to load projects:', errorMessage);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Sample tasks data (will be replaced with real API)
  const allTasks = [
    {
      id: '1',
      title: 'API Integration Testing',
      project: 'Mane UiKit',
      projectId: 'mane-uikit',
      dueDate: new Date('2025-01-15'),
      priority: 'urgent',
      icon: 'assignment',
      color: '#FF5252',
    },
    {
      id: '2',
      title: 'Mobile App UI Design',
      project: 'Mobile App',
      projectId: 'mobile-app',
      dueDate: new Date('2025-01-16'),
      priority: 'high',
      icon: 'assignment',
      color: '#FF9800',
    },
    {
      id: '3',
      title: 'Database Optimization',
      project: 'Backend',
      projectId: 'backend',
      dueDate: new Date('2025-01-17'),
      priority: 'medium',
      icon: 'storage',
      color: '#2196F3',
    },
    {
      id: '4',
      title: 'User Authentication',
      project: 'Backend',
      projectId: 'backend',
      dueDate: new Date('2025-01-18'),
      priority: 'high',
      icon: 'security',
      color: '#FF9800',
    },
    {
      id: '5',
      title: 'Component Library Update',
      project: 'Mane UiKit',
      projectId: 'mane-uikit',
      dueDate: new Date('2025-01-19'),
      priority: 'medium',
      icon: 'widgets',
      color: '#2196F3',
    },
    {
      id: '6',
      title: 'Performance Testing',
      project: 'Mobile App',
      projectId: 'mobile-app',
      dueDate: new Date('2025-01-20'),
      priority: 'low',
      icon: 'speed',
      color: '#9C27B0',
    },
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

      {/* Content based on selected tab */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <View>
            {/* Projects Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Projects</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ProjectList')}>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              
              {loadingProjects ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading projects...</Text>
                </View>
              ) : projects.length > 0 ? (
                <TouchableOpacity 
                  style={styles.projectCard}
                  onPress={() => navigation.navigate('ProjectList')}
                  activeOpacity={0.7}
                >
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{projects[0].projectName}</Text>
                    <Text style={styles.memberCount}>
                      Members: {projects[0]?.memberCount || 1}
                    </Text>
                  </View>
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {projects[0]?.description}
                  </Text>
                  <View style={styles.projectProgress}>
                    <View style={styles.progressBar}>
                      <View style={styles.progressFill} />
                    </View>
                    <Text style={styles.tasksText}>24/48 tasks</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyProjectsContainer}>
                  <MaterialIcons name="folder-open" size={48} color={Colors.neutral.light} />
                  <Text style={styles.emptyProjectsText}>No projects yet</Text>
                  <Text style={styles.emptyProjectsSubtext}>Create your first project to get started</Text>
                </View>
              )}
            </View>

            {/* Tasks Due Soon Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="schedule" size={20} color={Colors.warning} />
                <Text style={styles.sectionTitle}>Tasks Due Soon</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See all</Text>
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
                  <TouchableOpacity key={task.id} style={styles.taskCard} activeOpacity={0.7}>
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
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {selectedTab === 'analytics' && (
          <View>
              {/* Task Statistics Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="analytics" size={20} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Task Statistics</Text>
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
              </View>

              {/* Calendar Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="calendar-today" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Calendar</Text>
                </View>
              </View>

              <View style={styles.calendarSection}>
                <View style={styles.calendarHeader}>
                    <TouchableOpacity>
                    <MaterialIcons name="chevron-left" size={24} color={Colors.neutral.dark} />
                    </TouchableOpacity>
                  <Text style={styles.calendarMonth}>January 2025</Text>
                    <TouchableOpacity>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.dark} />
                    </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekdays}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={styles.calendarWeekday}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
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
                        {isCurrentMonth ? (
                          <Text style={[
                            styles.calendarDayText,
                            isToday && styles.calendarTodayText
                          ]}>
                            {dayNumber}
                          </Text>
                        ) : (
                          <Text style={styles.calendarInactiveDayText}>
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
                  <Text style={styles.upcomingEventsTitle}>Upcoming Events</Text>
                  
                  <View style={styles.eventItem}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDateDay}>18</Text>
                      <Text style={styles.eventDateMonth}>Jan</Text>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>Team Meeting</Text>
                      <Text style={styles.eventTime}>10:00 AM - 11:00 AM</Text>
                      <Text style={styles.eventProject}>Mane UiKit</Text>
                    </View>
                    <View style={[styles.eventTypeDot, { backgroundColor: Colors.primary }]} />
                  </View>

                  <View style={styles.eventItem}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDateDay}>20</Text>
                      <Text style={styles.eventDateMonth}>Jan</Text>
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>Database Migration Due</Text>
                      <Text style={styles.eventTime}>All day</Text>
                      <Text style={styles.eventProject}>Backend</Text>
                    </View>
                    <View style={[styles.eventTypeDot, { backgroundColor: Colors.error }]} />
          </View>

                  <View style={styles.eventItem}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDateDay}>25</Text>
                      <Text style={styles.eventDateMonth}>Jan</Text>
                </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>Sprint Review</Text>
                      <Text style={styles.eventTime}>2:00 PM - 3:30 PM</Text>
                      <Text style={styles.eventProject}>Mobile App</Text>
                </View>
                    <View style={[styles.eventTypeDot, { backgroundColor: Colors.accent }]} />
                </View>
                </View>
              </View>
            </View>
              </View>
        )}
      </ScrollView>
              </View>
  );
};

// Settings Screen Component
const SettingsScreen = () => (
  <ScrollView style={styles.tabContainer} showsVerticalScrollIndicator={false}>
    <View style={styles.settingsContent}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <View style={styles.settingsItem}>
        <MaterialIcons name="person" size={24} color={Colors.primary} />
        <Text style={styles.settingsItemText}>Profile Settings</Text>
          </View>

      <View style={styles.settingsItem}>
        <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        <Text style={styles.settingsItemText}>Notifications</Text>
          </View>

      <View style={styles.settingsItem}>
        <MaterialIcons name="security" size={24} color={Colors.primary} />
        <Text style={styles.settingsItemText}>Privacy & Security</Text>
                  </View>
            </View>
          </ScrollView>
);

// Voice Commands Screen Component
const VoiceScreen = () => (
  <View style={styles.tabContainer}>
    <View style={styles.centerContent}>
      <View style={styles.voiceIcon}>
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
          <MaterialIcons name="notifications" size={24} color={Colors.primary} />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>New task assigned</Text>
          <Text style={styles.notificationSubtitle}>You have been assigned to "API Integration"</Text>
          <Text style={styles.notificationTime}>2 hours ago</Text>
        </View>
      </View>

      <View style={styles.notificationItem}>
        <View style={styles.notificationIcon}>
          <MaterialIcons name="group-add" size={24} color={Colors.accent} />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>New member joined</Text>
          <Text style={styles.notificationSubtitle}>John Doe joined the workspace</Text>
          <Text style={styles.notificationTime}>1 day ago</Text>
        </View>
      </View>
  </View>
  </ScrollView>
);

const WorkspaceDashboardScreen = ({ navigation, route }: { navigation: any; route?: any }) => {
  const workspace = route?.params?.workspace;
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  const handleCreateProject = () => {
    setShowCreateProjectModal(true);
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleMemberAdded = async () => {
    console.log('Member added successfully');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.workspaceInfo}>
            <View style={styles.dashboardIcon}>
              <MaterialIcons name="dashboard" size={24} color={Colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.dashboardTitle}>Dashboard</Text>
              <Text style={styles.welcomeSubtitle}>Welcome, {workspace?.name || 'Workspace'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowActionDropdown(true)}
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
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        >
          {() => <DashboardContent navigation={navigation} route={route} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Voice" 
          component={VoiceScreen}
          options={{
            title: 'Voice',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="mic" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Notifications" 
          component={NotificationScreen}
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="notifications" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      
      {/* Modals */}
      <WorkspaceActionDropdown
        visible={showActionDropdown}
        onClose={() => setShowActionDropdown(false)}
        onCreateProject={handleCreateProject}
        onAddMember={handleAddMember}
      />

      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        workspaceId={workspace?.id || 0}
        onMemberAdded={handleMemberAdded}
      />

      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        workspaceId={workspace?.id || 0}
        workspaceMembers={[]}
        onProjectCreated={async (project: any) => {
          setShowCreateProjectModal(false);
          console.log('Project created:', project);
          // Reload projects after creation
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  headerLeft: {
    flex: 1,
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: Colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeTabButton: {
    backgroundColor: Colors.primary + '20',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeTabButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  projectsScrollView: {
    marginHorizontal: -10,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  projectContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
    marginBottom: 12,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectStatText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
  },
  emptyProjectsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: 280,
    marginHorizontal: 10,
  },
  emptyProjectsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
    marginTop: 12,
  },
  emptyProjectsSubtext: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  filterContainer: {
    marginBottom: 16,
  },
  tasksList: {
    marginTop: 8,
  },
  analyticsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 16,
  },
  settingsContent: {
    padding: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    marginLeft: 12,
  },
  
  // Section Title Row
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Task Project Style
  taskProject: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
    marginBottom: 4,
  },

  // Priority Badge Styles
  highBadge: {
    backgroundColor: Colors.warning + '20',
  },
  mediumBadge: {
    backgroundColor: Colors.primary + '20',
  },
  lowBadge: {
    backgroundColor: Colors.accent + '20',
  },

  // Deadline Styles
  upcoming: {
    color: Colors.neutral.medium,
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
    flex: 1,
    marginBottom: 20,
  },

  // Task Card Styles
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
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
    marginTop: 4,
  },
  deadlineText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  urgentBadge: {
    backgroundColor: Colors.error + '20',
  },
  dueSoon: {
    color: Colors.warning,
  },
  overdue: {
    color: Colors.error,
  },

  // Enhanced Analytics Styles
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
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
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
    textAlign: 'center',
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
    textAlign: 'center',
    fontWeight: '500',
  },

  // Calendar Styles
  calendarSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarWeekday: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.medium,
    textAlign: 'center',
    width: 40,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '500',
  },
  calendarTodayText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  calendarInactiveDayText: {
    fontSize: 14,
    color: Colors.neutral.light,
  },
  eventDot: {
    position: 'absolute',
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

  // Upcoming Events Styles
  upcomingEvents: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    paddingTop: 16,
    marginTop: 16,
  },
  upcomingEventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  eventDate: {
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  eventDateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },
  eventDateMonth: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  eventContent: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginBottom: 2,
  },
  eventProject: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  eventTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },


  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    flex: 1,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  teamMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  memberAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  moreMembersText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
  },

  projectProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '50%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  tasksText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },



  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  voiceIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  centerSubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginBottom: 24,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
    marginLeft: 8,
  },
  notificationContent: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
});

export default WorkspaceDashboardScreen;