import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { MemberRole } from '../types/Workspace';
import { Task } from '../types/Task';
import { CreateTaskEventDropdown, CreateProjectModal, MemberSortDropdown, AddMemberModal, ProjectSettingModal, SwipeableMemberCard, TaskFilterDropdown, TaskCardModern } from '../components';
import ProjectNotificationModal from '../components/ProjectNotificationModal';
import { projectService } from '../services';
import { mockProject, mockTasks } from '../services/sharedMockData';
import { getRoleColor } from '../styles/cardStyles';
import { Event } from '../types/Event';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  const initialProject = route.params?.project;
  const [project, setProject] = useState<Project | null>(initialProject);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showMemberSort, setShowMemberSort] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members' | 'calendar'>('tasks');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<Event[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<ProjectMember[]>([]);
  
  // Member management modals
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<ProjectMember | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showProjectNotificationModal, setShowProjectNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProjectSettingModal, setShowProjectSettingModal] = useState(false);
  const [showTaskFilter, setShowTaskFilter] = useState(false);
  const [taskFilter, setTaskFilter] = useState({ priority: 'All', dueDate: 'All', assigneeId: null } as any);

  const getFilteredTasks = () => {
    const tasks = projectTasks;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return tasks.filter((t) => {
      // priority
      if (taskFilter.priority !== 'All') {
        const p = String(t.priority || '').toLowerCase();
        const want = String(taskFilter.priority || '').toLowerCase();
        if (p !== want) return false;
      }
      // assignee
      if (taskFilter.assigneeId) {
        if (String(t.assignee || '') !== String(taskFilter.assigneeId)) return false;
      }
      // due date
      const due = t.dueDate ? new Date(t.dueDate) : null;
      switch (taskFilter.dueDate) {
        case 'Overdue':
          if (!(due && due < new Date(now.getFullYear(), now.getMonth(), now.getDate()))) return false;
          break;
        case 'Today':
          if (!(due && due.toDateString() === new Date().toDateString())) return false;
          break;
        case 'Tomorrow': {
          const tm = new Date();
          tm.setDate(tm.getDate() + 1);
          if (!(due && due.toDateString() === tm.toDateString())) return false;
          break;
        }
        case 'ThisWeek':
          if (!(due && due >= startOfWeek && due < endOfWeek)) return false;
          break;
        case 'NextWeek': {
          const ns = new Date(endOfWeek);
          const ne = new Date(endOfWeek);
          ne.setDate(ne.getDate() + 7);
          if (!(due && due >= ns && due < ne)) return false;
          break;
        }
        case 'NoDue':
          if (due) return false;
          break;
        default:
          break;
      }
      return true;
    });
  };

  // Mock: Set current user as admin for testing
  const isCurrentUserAdmin = true;

  useEffect(() => {
    if (initialProject?.id) {
      setLoading(true);
      Promise.all([
        loadProjectDetails(initialProject.id),
        loadNotificationCount(),
      ]).finally(() => {
        // Keep using mock data for tasks for now
        setProjectTasks(mockTasks);
        setLoading(false);
      });
    }
  }, [initialProject?.id]);

  const loadNotificationCount = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await notificationService.getProjectNotificationCount(project.id);
      // setNotificationCount(response.data.count);
      
      // For now, use mock count (2 unread notifications)
      setNotificationCount(2);
    } catch (error) {
      console.error('Error loading notification count:', error);
      setNotificationCount(0);
    }
  };

  const loadProjectDetails = async (projectId: number | string) => {
    try {
      const response = await projectService.getProjectDetails(Number(projectId));
      if (response.success && response.data) {
        setProject(response.data);
        // API returns members inside project details
        if (response.data.members) {
          setProjectMembers(response.data.members);
        }
      } else {
        console.error('Failed to load project details:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading project details:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };


  // Member management functions
  const handleEditMemberRole = (newRole: ProjectMemberRole) => {
    if (!memberToEdit) return;
    
    setProjectMembers(prev => 
      prev.map(member => 
        member.id === memberToEdit.id 
          ? { ...member, role: newRole }
          : member
      )
    );
    
    setShowEditRoleModal(false);
    setMemberToEdit(null);
    setSelectedRole(null);
    
    // TODO: Call API to update member role
    console.log(`Updated ${memberToEdit.user.username} role to ${newRole}`);
  };

  const handleRoleSelect = (role: ProjectMemberRole) => {
    setSelectedRole(role);
    setShowRoleDropdown(false);
  };

  const handleSaveRole = () => {
    if (selectedRole && memberToEdit) {
      handleEditMemberRole(selectedRole);
    }
  };

  const handleAddMember = (memberId: number, role: ProjectMemberRole) => {
    // TODO: Call API to add member to project
    console.log(`Adding member ${memberId} with role ${role}`);
    
    // For now, just add to mock data
    const newMember: ProjectMember = {
      id: Date.now(), // Temporary ID
      projectId: project.id,
      userId: memberId,
      role: role,
      joinedAt: new Date(),
      user: {
        id: memberId,
        username: `user_${memberId}`, // Temporary username
        email: `user${memberId}@example.com`, // Temporary email
      }
    };
    
    setProjectMembers(prev => [...prev, newMember]);
  };

  const handleUpdateProject = (name: string, description: string) => {
    // TODO: Implement API call to update project
    // For now, just update local state
    setProject(prev => ({
      ...prev,
      projectName: name,
      description: description,
    }));
    setShowProjectSettingModal(false);
  };

  const handleDeleteMember = () => {
    if (!memberToEdit) return;
    
    setProjectMembers(prev => 
      prev.filter(member => member.id !== memberToEdit.id)
    );
    
    setShowDeleteConfirmModal(false);
    setMemberToEdit(null);
    
    // TODO: Call API to remove member from project
    console.log(`Removed ${memberToEdit.user.username} from project`);
  };

  const renderMemberCard = (member: ProjectMember) => {
    // Convert ProjectMember to WorkspaceMember format for MemberCard component
    const workspaceMember = {
      id: member.id,
      workspaceId: 1, // Default workspace ID
      userId: member.user.id,
      role: member.role as any, // Convert ProjectMemberRole to MemberRole
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        username: member.user.username,
        email: member.user.email,
        name: member.user.username, // Use username as name
      }
    };

    const currentUserRole = isCurrentUserAdmin ? MemberRole.OWNER : MemberRole.MEMBER;

    return (
      <SwipeableMemberCard
        key={member.id}
        member={workspaceMember}
        onPress={() => {
          // TODO: Navigate to member profile or show member details
          console.log('Member pressed:', member.id);
        }}
        showActions={isCurrentUserAdmin} // Only show actions for admin users
        currentUserRole={currentUserRole}
        onRemove={() => {
          setMemberToEdit(member);
          setShowDeleteConfirmModal(true);
        }}
        onEditRole={() => {
          setMemberToEdit(member);
          setSelectedRole(member.role);
          setShowEditRoleModal(true);
        }}
      />
    );
  };

  // Calendar helper functions
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const getWeekdayName = (day: number) => {
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return weekdays[day];
  };

  const getEventsForSelectedDate = () => {
    return mockEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === selectedDate.getDate() &&
             eventDate.getMonth() === selectedDate.getMonth() &&
             eventDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth && 
                        selectedDate.getFullYear() === currentYear;
      const today = new Date();
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentMonth && 
                     today.getFullYear() === currentYear;
      
      // Check if there are events on this day
      const hasEvents = mockEvents.some(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.getDate() === day &&
               eventDate.getMonth() === currentMonth &&
               eventDate.getFullYear() === currentYear;
      });
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected
          ]}
          onPress={() => {
            const newDate = new Date(currentYear, currentMonth, day);
            setSelectedDate(newDate);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && styles.calendarDayTextToday
          ]}>
            {day}
          </Text>
          {hasEvents && (
            <View style={[
              styles.eventDot,
              isSelected && styles.eventDotSelected
            ]} />
          )}
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const renderCalendarTab = () => {
    const selectedDateEvents = getEventsForSelectedDate();
    
    return (
      <ScrollView style={styles.calendarTabContent} showsVerticalScrollIndicator={false}>
        {/* Create Event Button */}
        <TouchableOpacity 
          style={styles.createEventButtonModern}
          onPress={() => navigation.navigate('CreateEvent', { 
            projectMembers: projectMembers, 
            projectId: String(project.id) 
          })}
        >
          <MaterialIcons name="add" size={16} color={Colors.neutral.white} />
          <Text style={styles.createEventButtonModernText}>Create Event</Text>
        </TouchableOpacity>

        {/* Calendar Grid */}
        <View style={styles.calendarContainerModern}>
          {/* Calendar Header */}
          <View style={styles.calendarHeaderModern}>
            <TouchableOpacity 
              onPress={() => navigateMonth('prev')}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-left" size={20} color={Colors.neutral.dark} />
            </TouchableOpacity>
            <View style={styles.calendarTitleContainer}>
              <Text style={styles.calendarTitleModern}>
                {getMonthName(currentMonth)}
              </Text>
              <Text style={styles.calendarYearModern}>
                {currentYear}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigateMonth('next')}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Weekday Headers */}
            <View style={styles.calendarHeaderRow}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <Text key={day} style={styles.weekdayHeader}>
                  {getWeekdayName(day)}
                </Text>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.calendarDaysContainer}>
              {renderCalendarDays()}
            </View>
          </View>
        </View>

        {/* Selected Date Display */}
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateText}>
            {formatEventDate(selectedDate)}
          </Text>
          {selectedDateEvents.length > 0 && (
            <Text style={styles.eventCountText}>
              {selectedDateEvents.length} event{selectedDateEvents.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          {selectedDateEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No events</Text>
              <Text style={styles.emptySubtitle}>
                No events scheduled for this date
              </Text>
            </View>
          ) : (
            selectedDateEvents.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventItemModern}>
                <View style={styles.eventLeft}>
                  <View style={styles.eventTimeContainer}>
                    {event.includeTime && event.startTime && (
                      <Text style={styles.eventTime}>{event.startTime}</Text>
                    )}
                  </View>
                  <View style={styles.eventDivider} />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                  <View style={styles.eventFooter}>
                    {event.location && (
                      <View style={styles.eventMeta}>
                        <MaterialIcons name="location-on" size={14} color={Colors.neutral.medium} />
                        <Text style={styles.eventMetaText}>{event.location}</Text>
                      </View>
                    )}
                    {event.assignedMembers.length > 0 && (
                      <View style={styles.eventMeta}>
                        <MaterialIcons name="people" size={14} color={Colors.neutral.medium} />
                        <Text style={styles.eventMetaText}>
                          {event.assignedMembers.length} member{event.assignedMembers.length > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    );
  };

  const renderTaskCard = (task: Task) => {
    // Convert Task to TaskSummary format for TaskCardModern
    const taskSummary = {
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      projectName: project.projectName,
      assigneeName: task.assignee || '',
      tags: task.tags || [],
      estimatedHours: (task as any).estimatedHours,
      actualHours: (task as any).actualHours,
    };
    
    return (
      <TaskCardModern
        key={task.id}
        task={taskSummary as any}
        onPress={() => {
          // TODO: Navigate to task detail
          console.log('Task pressed:', task.id);
        }}
        onStatusPress={() => {
          // TODO: Handle status change
          console.log('Status pressed:', task.id);
        }}
        onAssigneePress={() => {
          // TODO: Handle assignee press
          console.log('Assignee pressed:', task.id);
        }}
      />
    );
  };

  if (loading || !project) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'tasks') {
      return (
        <View style={styles.tabContent}>
          {/* Single filter chip */}
          <View style={styles.filterBar}>
            <TouchableOpacity style={styles.filterChip} onPress={() => setShowTaskFilter(true)}>
              <MaterialIcons name="filter-alt" size={16} color={Colors.primary} />
              <Text style={styles.filterChipText}>Filter</Text>
            </TouchableOpacity>
          </View>
          {projectTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="assignment" size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <Text style={styles.emptySubtitle}>Create your first task to get started</Text>
            </View>
          ) : (
            (() => {
              const filtered = getFilteredTasks();
              if (filtered.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="filter-list" size={32} color={Colors.neutral.medium} />
                    <Text style={styles.emptyTitle}>No tasks match current filters</Text>
                    <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setTaskFilter({ priority: 'All', dueDate: 'All', assigneeId: null } as any)}>
                      <Text style={styles.clearFilterText}>Clear filter</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return (
            <View style={styles.tasksList}>
              {filtered.map((task) => renderTaskCard(task))}
            </View>
              );
            })()
          )}
        </View>
      );
    } else if (activeTab === 'calendar') {
      return renderCalendarTab();
    } else {
      return (
        <View style={styles.tabContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : projectMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="group" size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>Invite members to collaborate on this project</Text>
            </View>
          ) : (
            <View style={styles.membersSection}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Members ({projectMembers.length})</Text>
                {true && ( // TODO: Check if current user is admin
                  <TouchableOpacity 
                    style={styles.addMemberButton}
                    onPress={() => {
                      setShowAddMemberModal(true);
                    }}
                  >
                    <MaterialIcons name="person-add" size={16} color={Colors.surface} />
                    <Text style={styles.addMemberButtonText}>Add Member</Text>
                  </TouchableOpacity>
                )}
              </View>
            <View style={styles.membersGrid}>
              {projectMembers.map(renderMemberCard)}
              </View>
            </View>
          )}
        </View>
      );
    }
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project detail</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowDropdown(true)}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
          <View style={styles.projectLeft}>
              <Text style={styles.projectTitle}>{project.projectName}</Text>
            </View>
          <View style={styles.projectActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => {
                setShowProjectNotificationModal(true);
              }}
            >
              <MaterialIcons name="notifications" size={24} color={Colors.neutral.dark} />
              {/* Notification badge */}
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isCurrentUserAdmin && (
            <TouchableOpacity 
              style={styles.moreActionsButton}
                onPress={() => setShowProjectSettingModal(true)}
            >
              <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
            )}
          </View>
            </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabSection}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tasks' && styles.activeTabButton]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'tasks' && styles.activeTabButtonText]}>
              All Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'calendar' && styles.activeTabButton]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'calendar' && styles.activeTabButtonText]}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'members' && styles.activeTabButton]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'members' && styles.activeTabButtonText]}>
              Members
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
        {renderTabContent()}
      </ScrollView>

      {/* Create Task/Event Dropdown */}
      <CreateTaskEventDropdown
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onCreateTask={() => navigation.navigate('CreateTask', { 
          projectMembers: projectMembers, 
          projectId: String(project.id) 
        })}
        onCreateEvent={() => navigation.navigate('CreateEvent', { 
          projectMembers: projectMembers, 
          projectId: String(project.id) 
        })}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={(project: any) => {
          setShowCreateProjectModal(false);
          console.log('Project created:', project);
        }}
      />

      {/* Create Task and Event are now separate screens */}

      {/* Task Filter Dropdown */}
      <TaskFilterDropdown
        visible={showTaskFilter}
        onClose={() => setShowTaskFilter(false)}
        value={taskFilter}
        onChange={setTaskFilter}
        assignees={projectMembers.map(m => ({ id: String(m.user.id), name: m.user.username }))}
      />

      {/* Member Sort Dropdown */}
      <MemberSortDropdown
        visible={showMemberSort}
        onClose={() => setShowMemberSort(false)}
        onSelect={setSelectedMember}
        members={projectMembers.map(m => ({ 
          id: m.id.toString(), 
          name: m.user.username, 
          username: m.user.username 
        }))}
        selectedMember={selectedMember}
      />

      {/* Edit Member Role Modal */}
      <Modal
        visible={showEditRoleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.compactModalContainer}>
            <Text style={styles.compactModalTitle}>Edit Role</Text>
            
            <View style={styles.memberInfoCompact}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {memberToEdit?.user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfoText}>
                <Text style={styles.memberNameCompact}>{memberToEdit?.user.username}</Text>
                <Text style={styles.memberEmailCompact}>{memberToEdit?.user.email}</Text>
              </View>
            </View>
            
            <View style={styles.roleSelection}>
              <Text style={styles.roleLabel}>Role</Text>
              <TouchableOpacity
                style={styles.roleDropdown}
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
              >
                <View style={styles.roleDropdownContent}>
                  <View style={[
                    styles.roleIndicator,
                    { backgroundColor: getRoleColor(selectedRole || memberToEdit?.role || ProjectMemberRole.MEMBER) }
                  ]} />
                  <Text style={styles.roleDropdownText}>
                    {selectedRole || memberToEdit?.role || 'MEMBER'}
                  </Text>
                </View>
                <MaterialIcons 
                  name={showRoleDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={Colors.neutral.medium} 
                />
              </TouchableOpacity>
              
              {showRoleDropdown && (
                <View style={styles.roleDropdownMenu}>
                  <TouchableOpacity
                    style={styles.roleDropdownItem}
                    onPress={() => handleRoleSelect(ProjectMemberRole.ADMIN)}
                  >
                    <View style={[styles.roleIndicator, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.roleDropdownItemText}>Admin</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.roleDropdownItem}
                    onPress={() => handleRoleSelect(ProjectMemberRole.MEMBER)}
                  >
                    <View style={[styles.roleIndicator, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.roleDropdownItemText}>Member</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.compactModalActions}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setShowEditRoleModal(false)}
              >
                <Text style={styles.compactCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactSaveButton}
                onPress={handleSaveRole}
              >
                <Text style={styles.compactSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.compactModalContainer}>
            <View style={styles.deleteIconContainer}>
              <MaterialIcons name="delete" size={32} color={Colors.error} />
            </View>
            
            <Text style={styles.compactModalTitle}>Remove Member</Text>
            <Text style={styles.compactModalSubtitle}>
              Remove {memberToEdit?.user.username} from this project?
            </Text>
            
            <View style={styles.compactModalActions}>
              <TouchableOpacity
                style={styles.compactCancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.compactCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.compactDeleteButton}
                onPress={handleDeleteMember}
              >
                <Text style={styles.compactDeleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
        workspaceMembers={workspaceMembers}
        projectMembers={projectMembers}
      />

      {/* Project Notification Modal */}
      <ProjectNotificationModal
        visible={showProjectNotificationModal}
        onClose={() => setShowProjectNotificationModal(false)}
        projectId={project.id}
        projectName={project.projectName}
      />

      {/* Project Setting Modal */}
      <ProjectSettingModal
        visible={showProjectSettingModal}
        onClose={() => setShowProjectSettingModal(false)}
        projectName={project.projectName}
        projectDescription={project.description || ''}
        onUpdateProject={handleUpdateProject}
        isAdmin={isCurrentUserAdmin}
      />

    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  projectInfo: {
    padding: 12,
    backgroundColor: Colors.surface,
  },
  titleSection: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  adminText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreActionsButton: {
    padding: 4,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 16,
    gap: 6,
    flex: 1,
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
    flex: 1,
  },
  datesSection: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },
  descriptionSection: {
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    color: Colors.neutral.medium,
    lineHeight: 24,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.neutral.light + '40',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  infoCardLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  infoCardValue: {
    fontSize: 14,
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  clearFilterText: {
    color: Colors.surface,
    fontWeight: '600',
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  tabContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tasksList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  filterChipText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterClearIcon: {
    marginLeft: 4,
  },
  projectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.surface,
  },
  membersSection: {
    paddingHorizontal: 16,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMemberButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  membersGrid: {
    gap: 8,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginBottom: 24,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: Colors.error,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  memberInfoSection: {
    marginBottom: 24,
  },
  infoField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.neutral.dark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  roleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  roleDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleDropdownText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
  
  // Compact Modal Styles
  compactModalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 380,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  compactModalSubtitle: {
    fontSize: 13,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginBottom: 20,
  },
  memberInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  memberInfoText: {
    flex: 1,
  },
  memberNameCompact: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 1,
  },
  memberEmailCompact: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  roleSelection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
    marginBottom: 6,
  },
  roleDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  roleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  roleDropdownItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  compactModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  compactCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  compactCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  compactSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  compactSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  compactDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
  },
  compactDeleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  deleteIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  // Calendar tab styles
  calendarHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  createEventButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  calendarDatePickerContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  compactDatePickerWrapper: {
    width: '80%',
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  eventCardBody: {
    gap: 8,
  },
  eventCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventCardText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    flex: 1,
  },
  // Modern Calendar Styles
  calendarTabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  createEventButtonModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  createEventButtonModernText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  calendarContainerModern: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '40',
  },
  calendarHeaderModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '60',
  },
  navButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.neutral.light + '30',
  },
  calendarTitleContainer: {
    alignItems: 'center',
  },
  calendarTitleModern: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  calendarYearModern: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  calendarGrid: {
    marginTop: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  weekdayHeader: {
    fontSize: 10,
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
    color: Colors.neutral.medium,
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: 16,
    position: 'relative',
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDayToday: {
    backgroundColor: Colors.neutral.light,
  },
  calendarDayText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  eventDotSelected: {
    backgroundColor: Colors.neutral.white,
  },
  selectedDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  eventCountText: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  eventsSection: {
    flex: 1,
    paddingBottom: 20,
  },
  eventItemModern: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  eventLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  eventTimeContainer: {
    minWidth: 50,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  eventDivider: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.primary,
    marginVertical: 8,
    borderRadius: 1,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
});

export default ProjectDetailScreen;
