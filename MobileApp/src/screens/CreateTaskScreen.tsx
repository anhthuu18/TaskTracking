import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ScreenLayout, ButtonStyles, Typography } from '../constants/Dimensions';
import { useToastContext } from '../context/ToastContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { workspaceService } from '../services/workspaceService';
import { CreateTaskDto, TaskPriority, TaskUser } from '../types/Task';
import { WorkspaceType } from '../types/Workspace';

// Custom Date Picker Modal Component
const CustomDatePickerModal = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate: Date;
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [displayMonth, setDisplayMonth] = useState(initialDate.getMonth());
  const [displayYear, setDisplayYear] = useState(initialDate.getFullYear());

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (direction: 'prev' | 'next') => {
    let newMonth = displayMonth;
    let newYear = displayYear;

    if (direction === 'prev') {
      newMonth -= 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
    }
    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    const calendarDays = [] as React.ReactNode[];

    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<View key={`empty-start-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = 
        day === selectedDate.getDate() &&
        displayMonth === selectedDate.getMonth() &&
        displayYear === selectedDate.getFullYear();

      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
          onPress={() => setSelectedDate(new Date(displayYear, displayMonth, day))}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return calendarDays;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.navButton}>
              <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {monthNames[displayMonth]} {displayYear}
            </Text>
            <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.navButton}>
              <MaterialIcons name="chevron-right" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekDays}>
            {daysOfWeek.map(day => (
              <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendarDays()}</View>

          <View style={styles.datePickerFooter}>
            <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
              <Text style={styles.datePickerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.datePickerButton, styles.datePickerConfirmButton]} onPress={() => onConfirm(selectedDate)}>
              <Text style={[styles.datePickerButtonText, styles.datePickerConfirmButtonText]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface CreateTaskScreenProps {
  navigation: any;
  route?: {
    params: {
      projectId?: number | string;
      workspaceType?: WorkspaceType | string;
      workspaceId?: number | string;
    };
  };
}

const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ navigation, route }) => {
  const incomingProjectId = route?.params?.projectId;
  const incomingWorkspaceType = route?.params?.workspaceType;
  const incomingWorkspaceId = route?.params?.workspaceId;
  const { showSuccess, showError } = useToastContext();

  // Form State
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [priority, setPriority] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Resolved metadata
  const [projectId, setProjectId] = useState<number | null>(
    typeof incomingProjectId === 'string' ? parseInt(incomingProjectId) : (incomingProjectId ?? null)
  );
  const [workspaceId, setWorkspaceId] = useState<number | null>(
    typeof incomingWorkspaceId === 'string' ? parseInt(incomingWorkspaceId) : (incomingWorkspaceId ?? null)
  );
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType | null>(() => {
    if (!incomingWorkspaceType) return null;
    const typeStr = String(incomingWorkspaceType).toUpperCase();
    if (typeStr === 'GROUP') return WorkspaceType.GROUP;
    if (typeStr === 'PERSONAL') return WorkspaceType.PERSONAL;
    return null;
  });

  // UI State
  const [availableAssignees, setAvailableAssignees] = useState<TaskUser[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAssignees, setIsFetchingAssignees] = useState(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Dropdown/Modal Visibility
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Load current user for PERSONAL auto-assign
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.id) setCurrentUserId(Number(u.id));
          if (workspaceType === WorkspaceType.PERSONAL && u?.id) {
            setAssignedTo(Number(u.id));
          }
          if (!u?.id && u?.email && workspaceId) {
            try {
              const membersRes = await workspaceService.getWorkspaceMembers(Number(workspaceId));
              if (membersRes.success && Array.isArray(membersRes.data)) {
                const me = membersRes.data.find((m: any) => m.user?.email === u.email);
                if (me?.user?.id) {
                  setCurrentUserId(Number(me.user.id));
                  if (workspaceType === WorkspaceType.PERSONAL) {
                    setAssignedTo(Number(me.user.id));
                  }
                }
              }
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Failed to load current user', e);
      }
    };
    loadCurrentUser();
  }, [workspaceId, workspaceType]);

  // Resolve metadata
  useEffect(() => {
    const resolveMeta = async () => {
      try {
        let currentProjectId = projectId;
        let currentWorkspaceId = workspaceId;

        if (!currentProjectId && incomingProjectId !== undefined) {
          const id = typeof incomingProjectId === 'string' ? parseInt(incomingProjectId) : incomingProjectId;
          setProjectId(id ?? null);
          currentProjectId = id ?? null;
        }

        if (!currentWorkspaceId && incomingWorkspaceId !== undefined) {
          const id = typeof incomingWorkspaceId === 'string' ? parseInt(incomingWorkspaceId) : incomingWorkspaceId;
          setWorkspaceId(id ?? null);
          currentWorkspaceId = id ?? null;
        }

        if (!workspaceType && currentProjectId) {
          const res = await projectService.getProjectDetails(currentProjectId);
          if (res?.success && res.data?.workspace) {
            const wt = (res.data.workspace as any).workspaceType as string | undefined;
            if (wt) setWorkspaceType(wt === 'GROUP' ? WorkspaceType.GROUP : WorkspaceType.PERSONAL);
            if (res.data.workspace?.id && !currentWorkspaceId) {
              setWorkspaceId(res.data.workspace.id);
              currentWorkspaceId = res.data.workspace.id;
            }
          }
        }

        if (currentWorkspaceId && !workspaceType) {
          try {
            const wsRes = await workspaceService.getWorkspaceDetails(currentWorkspaceId);
            if (wsRes?.success && wsRes.data?.workspaceType) {
              setWorkspaceType(wsRes.data.workspaceType);
            }
          } catch {}
        }

        if (!currentProjectId && currentWorkspaceId) {
          await fetchProjects(currentWorkspaceId);
        }
      } catch (e: any) {
        console.warn('CreateTaskScreen: Failed to resolve project/workspace type', e?.message || e);
      }
    };
    resolveMeta();
  }, [incomingProjectId, incomingWorkspaceType, incomingWorkspaceId, workspaceId, projectId]);

  // Fetch projects
  const fetchProjects = async (wsId: number) => {
    try {
      setIsFetchingProjects(true);
      const response = await projectService.getProjectsByWorkspace(wsId);
      if (response.success && response.data) {
        setAvailableProjects(response.data);
      } else {
        setAvailableProjects([]);
        showError('Failed to load projects');
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      showError('Failed to load projects: ' + error.message);
      setAvailableProjects([]);
    } finally {
      setIsFetchingProjects(false);
    }
  };

  // Fetch assignees
  useEffect(() => {
    if (workspaceType === WorkspaceType.GROUP && projectId) {
      const fetchAssignees = async () => {
        try {
          setIsFetchingAssignees(true);
          const assignees = await taskService.getAvailableAssignees(projectId);
          setAvailableAssignees(assignees || []);
        } catch (error: any) {
          showError('Failed to load assignees: ' + error.message);
        } finally {
          setIsFetchingAssignees(false);
        }
      };
      fetchAssignees();
    }
  }, [projectId, workspaceType]);

  const handleBack = () => navigation.goBack();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!taskName.trim()) newErrors.taskName = 'Task name is required';
    if (priority === null) newErrors.priority = 'Priority is required';
    if (!projectId) newErrors.projectId = 'Project is required. Please select a project.';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async () => {
    if (!validateForm()) return;
    try {
      setIsLoading(true);
      const effectiveAssignedTo = workspaceType === WorkspaceType.PERSONAL
        ? (assignedTo || currentUserId || undefined)
        : (assignedTo || undefined);

      const taskData: CreateTaskDto = {
        taskName: taskName.trim(),
        projectId: projectId!,
        description: description.trim() || undefined,
        priority: priority || undefined,
        assignedTo: effectiveAssignedTo,
        startTime: startDate?.toISOString() || undefined,
        endTime: endDate?.toISOString() || undefined,
      };

      await taskService.createTask(taskData);
      showSuccess('Task created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating task:', error);
      showError(error.message || 'Failed to create task');
      setErrors(prev => ({ ...prev, general: error.message || 'An unknown error occurred' }));
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: TaskPriority.URGENT, label: 'Urgent', color: Colors.error },
    { value: TaskPriority.HIGHEST, label: 'High', color: Colors.warning },
    { value: TaskPriority.MEDIUM, label: 'Medium', color: Colors.primary },
    { value: TaskPriority.LOW, label: 'Low', color: Colors.accent },
    { value: TaskPriority.LOWEST, label: 'Lowest', color: Colors.neutral.medium },
  ];

  const getSelectedProjectDisplay = () => {
    if (!projectId) return 'Select project';
    const selectedProject = availableProjects.find(p => p.id === projectId);
    return selectedProject?.projectName || `Project ID: ${projectId}`;
  };

  const getSelectedAssigneeDisplay = () => {
    if (!assignedTo) return 'Select assignee';
    const selectedUser = availableAssignees.find(u => u.id === assignedTo);
    return selectedUser?.username || `User ID: ${assignedTo}`;
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('en-GB');
  };

  const renderProjectDropdownMenu = () => {
    if (!showProjectDropdown) return null;
    return (
      <View style={styles.dropdownMenu}>
        <ScrollView style={styles.projectsScrollView} nestedScrollEnabled={true}>
          {availableProjects.length > 0 ? (
            availableProjects.map((project: any) => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectOption}
                onPress={() => {
                  setProjectId(project.id);
                  setShowProjectDropdown(false);
                  setAssignedTo(null);
                  if (workspaceType === WorkspaceType.GROUP) {
                    const fetchAssignees = async () => {
                      try {
                        setIsFetchingAssignees(true);
                        const assignees = await taskService.getAvailableAssignees(project.id);
                        setAvailableAssignees(assignees || []);
                      } catch (error: any) {
                        showError('Failed to load assignees: ' + error.message);
                      } finally {
                        setIsFetchingAssignees(false);
                      }
                    };
                    fetchAssignees();
                  }
                }}
              >
                <View style={styles.projectInfo}>
                  <View style={styles.projectIcon}>
                    <MaterialIcons name="folder" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.projectDetails}>
                    <Text style={styles.projectName}>{project.projectName}</Text>
                    <Text style={styles.projectDescription} numberOfLines={1}>
                      {project.description || 'No description'}
                    </Text>
                  </View>
                </View>
                {projectId === project.id && (
                  <View style={styles.checkbox}>
                    <MaterialIcons name="check" size={20} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyProjectsContainer}>
              <Text style={styles.emptyProjectsText}>No projects available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderMembersDropdownMenu = () => {
    if (!showMembersDropdown) return null;
    return (
      <View style={styles.dropdownMenu}>
        <ScrollView style={styles.membersScrollView} nestedScrollEnabled={true}>
          {availableAssignees.map((member: TaskUser) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberOption}
              onPress={() => {
                setAssignedTo(member.id);
                setShowMembersDropdown(false);
              }}
            >
              <View style={styles.memberInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(member.username || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
              </View>
              {assignedTo === member.id && (
                <View style={styles.checkbox}>
                  <MaterialIcons name="check" size={20} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create task</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Selection - Only show if no projectId provided */}
        {!incomingProjectId && (
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Project</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.projectId && styles.dropdownButtonError]}
                onPress={() => setShowProjectDropdown(!showProjectDropdown)}
                disabled={isFetchingProjects}
              >
                <View style={styles.dropdownContent}>
                  <MaterialIcons name="folder" size={20} color={Colors.neutral.medium} />
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {isFetchingProjects ? 'Loading projects...' : getSelectedProjectDisplay()}
                  </Text>
                </View>
                {isFetchingProjects ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <MaterialIcons name={showProjectDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={Colors.neutral.medium} />
                )}
              </TouchableOpacity>
              {renderProjectDropdownMenu()}
            </View>
            {errors.projectId && <Text style={styles.errorText}>{errors.projectId}</Text>}
          </View>
        )}

        {/* Task Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Task name"
            value={taskName}
            onChangeText={setTaskName}
            style={[styles.textInput, errors.taskName && styles.textInputError]}
            outlineStyle={[styles.inputOutline, errors.taskName && styles.inputOutlineError]}
            theme={{
              colors: {
                primary: errors.taskName ? Colors.semantic.error : Colors.primary,
                outline: errors.taskName ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={<TextInput.Icon icon={() => <MaterialIcons name="assignment" size={20} color={Colors.neutral.medium} />} />}
          />
          {errors.taskName && <Text style={styles.errorText}>{errors.taskName}</Text>}
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Task description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.textInput, styles.multilineTextInput]}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.multilineContent}
            theme={{
              colors: {
                primary: Colors.primary,
                outline: Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={<TextInput.Icon icon={() => <MaterialIcons name="description" size={20} color={Colors.neutral.medium} />} />}
          />
        </View>

        {/* Assignee - only for Group Workspaces */}
        {workspaceType === WorkspaceType.GROUP && (
          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>Assignee</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => { setShowMembersDropdown(!showMembersDropdown); if (!showMembersDropdown) setShowPriorityDropdown(false); }}
                disabled={isFetchingAssignees}
              >
                <View style={styles.dropdownContent}>
                  <MaterialIcons name="people" size={20} color={Colors.neutral.medium} />
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {isFetchingAssignees ? 'Loading members...' : getSelectedAssigneeDisplay()}
                  </Text>
                </View>
                {isFetchingAssignees ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <MaterialIcons name={showMembersDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={Colors.neutral.medium} />
                )}
              </TouchableOpacity>
              {renderMembersDropdownMenu()}
            </View>
          </View>
        )}

        {/* Priority */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Priority</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[styles.dropdownButton, errors.priority && styles.dropdownButtonError]}
              onPress={() => { setShowPriorityDropdown(!showPriorityDropdown); if (!showPriorityDropdown) setShowMembersDropdown(false); }}
            >
              <View style={styles.dropdownContent}>
                <MaterialIcons name="flag" size={20} color={Colors.neutral.medium} />
                <Text style={styles.dropdownText}>
                  {priority ? priorityOptions.find(opt => opt.value === priority)?.label : 'Select priority'}
                </Text>
              </View>
              <MaterialIcons name={showPriorityDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
            {showPriorityDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                  {priorityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownOption}
                      onPress={() => { setPriority(option.value); setShowPriorityDropdown(false); }}
                    >
                      <View style={[styles.priorityIndicator, { backgroundColor: option.color + '20' }]}>
                        <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                      </View>
                      <Text style={styles.dropdownOptionText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          {errors.priority && <Text style={styles.errorText}>{errors.priority}</Text>}
        </View>

        {/* Start Date & End Date */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Start date</Text>
          <TouchableOpacity style={[styles.dateFieldButton, errors.startDate && styles.inputOutlineError]} onPress={() => setShowStartDatePicker(true)}>
            <View style={styles.dateFieldContent}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.neutral.medium} />
              <Text style={styles.dateFieldText}>{formatDateForDisplay(startDate) || 'Select start date'}</Text>
            </View>
          </TouchableOpacity>
          {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
        </View>
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Due date</Text>
          <TouchableOpacity style={[styles.dateFieldButton, errors.endDate && styles.inputOutlineError]} onPress={() => setShowEndDatePicker(true)}>
            <View style={styles.dateFieldContent}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.neutral.medium} />
              <Text style={styles.dateFieldText}>{formatDateForDisplay(endDate) || 'Select due date'}</Text>
            </View>
          </TouchableOpacity>
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
        </View>

      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateTask}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={styles.createButtonText}>Create task</Text>
          )}
        </TouchableOpacity>
        {errors.general && <Text style={[styles.errorText, { textAlign: 'center', marginTop: 10 }]}>{errors.general}</Text>}
      </View>

      {/* Date Picker Modals */}
      {showStartDatePicker && (
        <CustomDatePickerModal
          visible={showStartDatePicker}
          initialDate={startDate || new Date()}
          onConfirm={(date) => { setShowStartDatePicker(false); setStartDate(date); }}
          onClose={() => setShowStartDatePicker(false)}
        />
      )}
      {showEndDatePicker && (
        <CustomDatePickerModal
          visible={showEndDatePicker}
          initialDate={endDate || new Date()}
          onConfirm={(date) => { setShowEndDatePicker(false); setEndDate(date); }}
          onClose={() => setShowEndDatePicker(false)}
        />
      )}

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.headerTopSpacing,
    paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral.light,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: Colors.text, flex: 1, textAlign: 'center', marginRight: 36 },
  headerSpacer: { width: 36 },
  content: { flex: 1, paddingHorizontal: ScreenLayout.contentHorizontalPadding, paddingTop: 12 },
  inputSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  textInput: { backgroundColor: Colors.background, fontSize: 16 },
  inputOutline: { borderRadius: 12, borderWidth: 1 },
  textInputError: { backgroundColor: Colors.background },
  inputOutlineError: { borderColor: Colors.semantic.error },
  multilineTextInput: { minHeight: 80, textAlignVertical: 'top' },
  multilineContent: { paddingTop: 12 },

  dropdownContainer: { position: 'relative', zIndex: 10 },
  dropdownButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  dropdownButtonError: { borderColor: Colors.semantic.error },
  dropdownContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dropdownText: { fontSize: 16, color: Colors.text, flex: 1 },
  dropdownMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: Colors.background,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral.light,
    marginTop: 4, elevation: 12, zIndex: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    maxHeight: 200,
  },
  dropdownScrollView: { maxHeight: 200 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 12 },
  dropdownOptionText: { fontSize: 16, color: Colors.text },

  membersScrollView: { maxHeight: 200 },
  memberOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '50',
  },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '600', color: Colors.surface },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '500', color: Colors.neutral.dark },
  memberEmail: { fontSize: 14, color: Colors.neutral.medium },
  checkbox: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },

  priorityIndicator: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },

  dateFieldButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  dateFieldContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dateFieldText: { fontSize: 16, color: Colors.text, flex: 1 },

  errorText: { color: Colors.semantic.error, fontSize: 12, marginTop: 4, marginLeft: 12 },

  footer: { paddingHorizontal: ScreenLayout.contentHorizontalPadding, paddingBottom: ScreenLayout.footerBottomSpacing, paddingTop: 16 },
  createButton: {
    backgroundColor: Colors.primary, ...ButtonStyles.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', shadowColor: Colors.primary,
  },
  createButtonDisabled: { backgroundColor: Colors.neutral.medium },
  createButtonText: { ...Typography.buttonText, color: Colors.neutral.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerContainer: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20,
    width: '90%', maxWidth: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5,
  },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navButton: { padding: 8 },
  calendarTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  calendarWeekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  calendarDayHeader: { width: 32, textAlign: 'center', color: Colors.neutral.medium, fontWeight: '500' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  calendarDay: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  calendarDaySelected: { backgroundColor: Colors.primary },
  calendarDayText: { fontSize: 16, color: Colors.text },
  calendarDayTextSelected: { color: Colors.surface, fontWeight: 'bold' },
  datePickerFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.neutral.light },
  datePickerButton: { paddingHorizontal: 20, paddingVertical: 10 },
  datePickerConfirmButton: { backgroundColor: Colors.primary, borderRadius: 8, marginLeft: 8 },
  datePickerButtonText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  datePickerConfirmButtonText: { color: Colors.surface },

  projectsScrollView: { maxHeight: 250 },
  projectOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.neutral.light + '50',
  },
  projectInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  projectIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  projectDetails: { flex: 1 },
  projectName: { fontSize: 16, fontWeight: '500', color: Colors.neutral.dark },
  projectDescription: { fontSize: 13, color: Colors.neutral.medium, marginTop: 2 },
  emptyProjectsContainer: { paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' },
  emptyProjectsText: { fontSize: 14, color: Colors.neutral.medium, fontStyle: 'italic' },
});

export default CreateTaskScreen;
