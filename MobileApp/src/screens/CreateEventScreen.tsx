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
  Alert,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import {
  ScreenLayout,
  ButtonStyles,
  Typography,
} from '../constants/Dimensions';
import { useToastContext } from '../context/ToastContext';
import { projectService } from '../services/projectService';
import { workspaceService } from '../services/workspaceService';
import { eventService } from '../services/eventService';

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
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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
      calendarDays.push(
        <View key={`empty-start-${i}`} style={styles.calendarDay} />,
      );
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
          onPress={() =>
            setSelectedDate(new Date(displayYear, displayMonth, day))
          }
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      );
    }

    return calendarDays;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => handleMonthChange('prev')}
              style={styles.navButton}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={Colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {monthNames[displayMonth]} {displayYear}
            </Text>
            <TouchableOpacity
              onPress={() => handleMonthChange('next')}
              style={styles.navButton}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={Colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekDays}>
            {daysOfWeek.map(day => (
              <Text key={day} style={styles.calendarDayHeader}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendarDays()}</View>

          <View style={styles.datePickerFooter}>
            <TouchableOpacity style={styles.datePickerButton} onPress={onClose}>
              <Text style={styles.datePickerButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.datePickerButton, styles.datePickerConfirmButton]}
              onPress={() => onConfirm(selectedDate)}
            >
              <Text
                style={[
                  styles.datePickerButtonText,
                  styles.datePickerConfirmButtonText,
                ]}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface CreateEventScreenProps {
  navigation: any;
  route?: any;
}

interface Project {
  id: number;
  projectName: string;
  workspaceId: number;
}

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({
  navigation,
  route,
}) => {
  const { showSuccess, showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Form fields
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Initialize dates and times with defaults (9 AM to 9 PM)
  const getDefaultStartTime = () => {
    const date = new Date();
    date.setHours(9, 0, 0, 0); // 9:00 AM
    return date;
  };

  const getDefaultEndTime = () => {
    const date = new Date();
    date.setHours(21, 0, 0, 0); // 9:00 PM
    return date;
  };

  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(getDefaultEndTime());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Project selection
  const [projects, setProjects] = useState<
    Array<Project & { workspaceType?: string }>
  >([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Load user's projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      console.log('CreateEventScreen: Loading all projects');

      // Get ALL projects from backend (from all workspaces)
      const response = await projectService.getAllProjects();
      console.log('CreateEventScreen: All projects response:', response);

      if (response.success && response.data) {
        // Fetch workspace details for each project to get workspace type
        const projectsWithType = await Promise.all(
          response.data.map(async (project: any) => {
            try {
              // Get workspace info if available
              if (project.workspace || project.workspaceId) {
                const wsId = project.workspace?.id || project.workspaceId;
                const workspaceDetails =
                  await workspaceService.getWorkspaceDetails(wsId);
                const workspaceType =
                  workspaceDetails?.data?.workspaceType ||
                  workspaceDetails?.data?.type ||
                  'PERSONAL';
                return {
                  ...project,
                  workspaceType,
                };
              }
              return {
                ...project,
                workspaceType: 'PERSONAL',
              };
            } catch (error) {
              console.error('Error fetching workspace details:', error);
              return {
                ...project,
                workspaceType: 'PERSONAL',
              };
            }
          }),
        );

        console.log(
          'CreateEventScreen: Projects with workspace types:',
          projectsWithType,
        );
        setProjects(projectsWithType);

        // Pre-select project if passed from route
        if (route?.params?.projectId) {
          const preselected = projectsWithType.find(
            (p: any) => p.id === parseInt(route.params.projectId, 10),
          );
          if (preselected) {
            setSelectedProject(preselected);
          }
        }
      } else {
        console.log('CreateEventScreen: No projects found or API error');
        setProjects([]);
      }
    } catch (error) {
      console.error('CreateEventScreen: Error loading projects:', error);
      showError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateEvent = async () => {
    // Validation
    if (!eventName.trim()) {
      showError('Please enter event name');
      return;
    }

    if (!selectedProject) {
      showError('Please select a project');
      return;
    }

    // Combine date and time for start and end
    const combinedStartDate = new Date(startDate);
    combinedStartDate.setHours(
      startTime.getHours(),
      startTime.getMinutes(),
      0,
      0,
    );

    const combinedEndDate = new Date(endDate);
    combinedEndDate.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    if (combinedEndDate <= combinedStartDate) {
      showError('End time must be after start time');
      return;
    }

    try {
      setLoading(true);

      // Check token before making request
      const token = await AsyncStorage.getItem('authToken');
      console.log('CreateEventScreen: Token exists:', !!token);

      if (!token) {
        showError('Authentication error. Please login again.');
        return;
      }

      const eventData = {
        eventName: eventName.trim(),
        description: description.trim(),
        projectId: selectedProject.id,
        startTime: combinedStartDate.toISOString(),
        endTime: combinedEndDate.toISOString(),
      };

      console.log('CreateEventScreen: Creating event with data:', eventData);

      await eventService.createEvent(eventData);

      showSuccess('Event created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating event:', error);
      showError(error?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeForDisplay = (time: Date | null) => {
    if (!time) return '';
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSelectedProjectDisplay = () => {
    if (!selectedProject) return 'Select project';
    return selectedProject.projectName;
  };

  const renderProjectDropdownMenu = () => {
    if (!showProjectDropdown) return null;
    return (
      <View style={styles.dropdownMenu}>
        <ScrollView
          style={styles.projectsScrollView}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          persistentScrollbar={true}
        >
          {projects.length > 0 ? (
            projects.map(project => (
              <TouchableOpacity
                key={project.id}
                style={styles.projectOption}
                onPress={() => {
                  setSelectedProject(project);
                  setShowProjectDropdown(false);
                }}
              >
                <View style={styles.projectInfo}>
                  <View style={styles.projectIcon}>
                    <MaterialIcons
                      name="folder"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.projectDetails}>
                    <Text style={styles.projectName}>
                      {project.projectName}
                    </Text>
                    <View style={styles.projectMetaRow}>
                      {project.workspaceType && (
                        <View style={styles.workspaceTypeContainer}>
                          <MaterialIcons
                            name={
                              project.workspaceType === 'GROUP'
                                ? 'groups'
                                : 'person'
                            }
                            size={12}
                            color={Colors.neutral.medium}
                          />
                          <Text style={styles.workspaceTypeLabel}>
                            {project.workspaceType === 'GROUP'
                              ? 'Group'
                              : 'Personal'}
                          </Text>
                        </View>
                      )}
                      {project.workspace?.workspaceName && (
                        <Text style={styles.workspaceNameLabel}>
                          • {project.workspace.workspaceName}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                {selectedProject?.id === project.id && (
                  <View style={styles.checkbox}>
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyProjectsContainer}>
              <Text style={styles.emptyProjectsText}>
                No projects available
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Time Picker Modal Component
  const TimePickerModal = ({
    visible,
    onClose,
    onConfirm,
    initialTime,
  }: {
    visible: boolean;
    onClose: () => void;
    onConfirm: (time: Date) => void;
    initialTime: Date;
  }) => {
    const [selectedHour, setSelectedHour] = useState(initialTime.getHours());
    const [selectedMinute, setSelectedMinute] = useState(
      initialTime.getMinutes(),
    );

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const handleConfirm = () => {
      const newTime = new Date(initialTime);
      newTime.setHours(selectedHour, selectedMinute, 0, 0);
      onConfirm(newTime);
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            <View style={styles.timePickerContent}>
              <View style={styles.timeColumn}>
                <ScrollView style={styles.timeScrollView}>
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedHour === hour &&
                            styles.timeOptionTextSelected,
                        ]}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.timeColumn}>
                <ScrollView style={styles.timeScrollView}>
                  {minutes.map(minute => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedMinute === minute &&
                            styles.timeOptionTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.timePickerFooter}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={onClose}
              >
                <Text style={styles.datePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  styles.datePickerConfirmButton,
                ]}
                onPress={handleConfirm}
              >
                <Text
                  style={[
                    styles.datePickerButtonText,
                    styles.datePickerConfirmButtonText,
                  ]}
                >
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={Colors.neutral.white}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create event</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Event Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Event name"
            value={eventName}
            onChangeText={setEventName}
            style={styles.textInput}
            outlineStyle={styles.inputOutline}
            theme={{
              colors: {
                primary: Colors.primary,
                outline: Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon
                icon={() => (
                  <MaterialIcons
                    name="event"
                    size={20}
                    color={Colors.neutral.medium}
                  />
                )}
              />
            }
          />
        </View>

        {/* Project Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Project</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowProjectDropdown(!showProjectDropdown)}
              disabled={loadingProjects}
            >
              <View style={styles.dropdownContent}>
                <MaterialIcons
                  name="folder"
                  size={20}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {loadingProjects
                    ? 'Loading projects...'
                    : getSelectedProjectDisplay()}
                </Text>
              </View>
              {loadingProjects ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <MaterialIcons
                  name={
                    showProjectDropdown
                      ? 'keyboard-arrow-up'
                      : 'keyboard-arrow-down'
                  }
                  size={24}
                  color={Colors.neutral.medium}
                />
              )}
            </TouchableOpacity>
            {renderProjectDropdownMenu()}
          </View>
        </View>

        {/* Start Date & Time */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Start date & time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateFieldButton, styles.dateFieldHalf]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <View style={styles.dateFieldContent}>
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.dateFieldText}>
                  {formatDateForDisplay(startDate)}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateFieldButton, styles.timeFieldHalf]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <View style={styles.dateFieldContent}>
                <MaterialIcons
                  name="access-time"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.dateFieldText}>
                  {formatTimeForDisplay(startTime)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* End Date & Time */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Due date & time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateFieldButton, styles.dateFieldHalf]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <View style={styles.dateFieldContent}>
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.dateFieldText}>
                  {formatDateForDisplay(endDate)}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateFieldButton, styles.timeFieldHalf]}
              onPress={() => setShowEndTimePicker(true)}
            >
              <View style={styles.dateFieldContent}>
                <MaterialIcons
                  name="access-time"
                  size={18}
                  color={Colors.neutral.medium}
                />
                <Text style={styles.dateFieldText}>
                  {formatTimeForDisplay(endTime)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Event description"
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
            left={
              <TextInput.Icon
                icon={() => (
                  <MaterialIcons
                    name="description"
                    size={20}
                    color={Colors.neutral.medium}
                  />
                )}
              />
            }
          />
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Text style={styles.createButtonText}>Create event</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modals */}
      {showStartDatePicker && (
        <CustomDatePickerModal
          visible={showStartDatePicker}
          initialDate={startDate}
          onConfirm={date => {
            setShowStartDatePicker(false);
            setStartDate(date);
          }}
          onClose={() => setShowStartDatePicker(false)}
        />
      )}

      {showEndDatePicker && (
        <CustomDatePickerModal
          visible={showEndDatePicker}
          initialDate={endDate}
          onConfirm={date => {
            setShowEndDatePicker(false);
            setEndDate(date);
          }}
          onClose={() => setShowEndDatePicker(false)}
        />
      )}

      {/* Time Picker Modals */}
      {showStartTimePicker && (
        <TimePickerModal
          visible={showStartTimePicker}
          initialTime={startTime}
          onConfirm={time => {
            setShowStartTimePicker(false);
            setStartTime(time);
          }}
          onClose={() => setShowStartTimePicker(false)}
        />
      )}

      {showEndTimePicker && (
        <TimePickerModal
          visible={showEndTimePicker}
          initialTime={endTime}
          onConfirm={time => {
            setShowEndTimePicker(false);
            setEndTime(time);
          }}
          onClose={() => setShowEndTimePicker(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.headerTopSpacing,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 36,
  },
  headerSpacer: { width: 36 },
  content: {
    flex: 1,
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: 12,
  },
  inputSection: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textInput: { backgroundColor: Colors.background, fontSize: 16 },
  inputOutline: { borderRadius: 12, borderWidth: 1 },
  multilineTextInput: { minHeight: 80, textAlignVertical: 'top' },
  multilineContent: { paddingTop: 12 },

  dropdownContainer: { position: 'relative', zIndex: 10000 },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownText: { fontSize: 16, color: Colors.text, flex: 1 },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    marginTop: 4,
    maxHeight: 250,
    elevation: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    maxHeight: 300,
  },

  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  dateFieldHalf: {
    flex: 1,
  },
  timeFieldHalf: {
    flex: 0.8,
  },
  dateFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateFieldText: { fontSize: 14, color: Colors.text, flex: 1 },

  footer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: Colors.primary,
    ...ButtonStyles.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: Colors.primary,
  },
  createButtonDisabled: { backgroundColor: Colors.neutral.medium },
  createButtonText: { ...Typography.buttonText, color: Colors.neutral.white },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Date Picker Styles
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: { padding: 8 },
  calendarTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDayHeader: {
    width: 32,
    textAlign: 'center',
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  calendarDaySelected: { backgroundColor: Colors.primary },
  calendarDayText: { fontSize: 16, color: Colors.text },
  calendarDayTextSelected: { color: Colors.surface, fontWeight: 'bold' },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },
  datePickerButton: { paddingHorizontal: 20, paddingVertical: 10 },
  datePickerConfirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginLeft: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  datePickerConfirmButtonText: { color: Colors.surface },

  // Time Picker Styles
  timePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  timeColumn: {
    flex: 1,
    height: 200,
  },
  timeScrollView: {
    flex: 1,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
  },
  timeOptionText: {
    fontSize: 18,
    color: Colors.text,
  },
  timeOptionTextSelected: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 8,
  },
  timePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },

  // Project Modal Styles - Changed to dropdown
  projectsScrollView: {
    maxHeight: 200,
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectDetails: { flex: 1 },
  projectName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workspaceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  workspaceTypeLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
  },
  workspaceNameLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
  },
  emptyProjectsContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyProjectsText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    fontStyle: 'italic',
  },
  checkbox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateEventScreen;
