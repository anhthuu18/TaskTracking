import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/Colors';
import { ScreenLayout, ButtonStyles, Typography } from '../constants/Dimensions';
import { ProjectMember } from '../types/Project';
import { useToastContext } from '../context/ToastContext';

interface CreateTaskScreenProps {
  navigation: any;
  route?: any;
}

const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ navigation, route }) => {
  const { projectMembers = [], projectId } = route?.params || {};
  const { showSuccess, showError } = useToastContext();
  
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [priority, setPriority] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateValue, setStartDateValue] = useState(new Date());
  const [endDateValue, setEndDateValue] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [endCurrentMonth, setEndCurrentMonth] = useState(new Date().getMonth());
  const [endCurrentYear, setEndCurrentYear] = useState(new Date().getFullYear());
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleMembersDropdownToggle = () => {
    setShowMembersDropdown(!showMembersDropdown);
    // Close other dropdowns
    setShowPriorityDropdown(false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handlePriorityDropdownToggle = () => {
    setShowPriorityDropdown(!showPriorityDropdown);
    // Close other dropdowns
    setShowMembersDropdown(false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleStartDatePickerToggle = () => {
    const today = new Date();
    setStartDateValue(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setShowStartDatePicker(true);
    // Close other dropdowns
    setShowMembersDropdown(false);
    setShowPriorityDropdown(false);
    setShowEndDatePicker(false);
  };

  const handleEndDatePickerToggle = () => {
    const today = new Date();
    setEndDateValue(today);
    setEndCurrentMonth(today.getMonth());
    setEndCurrentYear(today.getFullYear());
    setShowEndDatePicker(true);
    // Close other dropdowns
    setShowMembersDropdown(false);
    setShowPriorityDropdown(false);
    setShowStartDatePicker(false);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!taskName.trim()) {
      newErrors.taskName = 'Task name is required';
    }

    if (!priority) {
      newErrors.priority = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const taskData = {
        taskName: taskName.trim(),
        description: description.trim() || undefined,
        projectId: projectId || undefined,
        assignedMembers: selectedMembers,
        priority,
        status: 'todo', // Always set to todo when creating
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      };

      // TODO: Implement actual task creation API call
      // await taskService.createTask(taskData);
      
      showSuccess('Task created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating task:', error);
      showError(error.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: Colors.error },
    { value: 'high', label: 'High', color: Colors.warning },
    { value: 'medium', label: 'Medium', color: Colors.primary },
    { value: 'low', label: 'Low', color: Colors.accent },
    { value: 'lowest', label: 'Lowest', color: Colors.neutral.medium },
  ];

  const getSelectedMembersDisplay = () => {
    const selectedMemberObjects = projectMembers.filter((member: ProjectMember) => 
      selectedMembers.includes(String(member.id))
    );
    const totalSelected = selectedMemberObjects.length;
    if (totalSelected === 0) {
      return 'Select members';
    }
    
    if (totalSelected <= 3) {
      const names = selectedMemberObjects.map((m: ProjectMember) => m.user.username);
      return names.join(', ');
    }
    
    return `${totalSelected} members selected`;
  };

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };


  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    // Convert from dd/mm/yyyy to dd/mm/yyyy format for display
    return dateStr;
  };

  const formatDateToString = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateToDisplayString = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    
    return `${dayName}, ${monthName} ${day}`;
  };

  const handleStartDateConfirm = () => {
    console.log('Start date confirm clicked');
    setStartDate(formatDateToString(startDateValue));
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = () => {
    console.log('End date confirm clicked');
    setEndDate(formatDateToString(endDateValue));
    setShowEndDatePicker(false);
  };

  const handleStartDateCancel = () => {
    console.log('Start date cancel clicked');
    setShowStartDatePicker(false);
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay}>
          <Text style={styles.calendarDayText}></Text>
        </View>
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === startDateValue.getDate() && 
                        currentMonth === startDateValue.getMonth() && 
                        currentYear === startDateValue.getFullYear();
      const isToday = day === new Date().getDate() && 
                     currentMonth === new Date().getMonth() && 
                     currentYear === new Date().getFullYear();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
            isToday && styles.calendarDayToday
          ]}
          onPress={() => {
            const newDate = new Date(currentYear, currentMonth, day);
            setStartDateValue(newDate);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && !isSelected && styles.calendarDayTextToday
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Add empty cells to always have 42 cells (6 rows x 7 days)
    const totalCells = firstDayOfMonth + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <View key={`empty-end-${i}`} style={styles.calendarDay}>
          <Text style={styles.calendarDayText}></Text>
        </View>
      );
    }
    
    return days;
  };

  const renderEndCalendarDays = () => {
    const daysInMonth = new Date(endCurrentYear, endCurrentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(endCurrentYear, endCurrentMonth, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDay}>
          <Text style={styles.calendarDayText}></Text>
        </View>
      );
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === endDateValue.getDate() && 
                        endCurrentMonth === endDateValue.getMonth() && 
                        endCurrentYear === endDateValue.getFullYear();
      const isToday = day === new Date().getDate() && 
                     endCurrentMonth === new Date().getMonth() && 
                     endCurrentYear === new Date().getFullYear();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
            isToday && styles.calendarDayToday
          ]}
          onPress={() => {
            const newDate = new Date(endCurrentYear, endCurrentMonth, day);
            setEndDateValue(newDate);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && !isSelected && styles.calendarDayTextToday
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Add empty cells to always have 42 cells (6 rows x 7 days)
    const totalCells = firstDayOfMonth + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <View key={`empty-end-${i}`} style={styles.calendarDay}>
          <Text style={styles.calendarDayText}></Text>
        </View>
      );
    }
    
    return days;
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

  const navigateEndMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (endCurrentMonth === 0) {
        setEndCurrentMonth(11);
        setEndCurrentYear(endCurrentYear - 1);
      } else {
        setEndCurrentMonth(endCurrentMonth - 1);
      }
    } else {
      if (endCurrentMonth === 11) {
        setEndCurrentMonth(0);
        setEndCurrentYear(endCurrentYear + 1);
      } else {
        setEndCurrentMonth(endCurrentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create task</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Task Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Task name"
            value={taskName}
            onChangeText={setTaskName}
            style={[
              styles.textInput,
              errors.taskName && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.taskName && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.taskName ? Colors.semantic.error : Colors.primary,
                outline: errors.taskName ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="assignment" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          {errors.taskName && (
            <Text style={styles.errorText}>{errors.taskName}</Text>
          )}
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
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="description" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
        </View>

        {/* Assigned Members */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Assigned to</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={handleMembersDropdownToggle}
            >
              <View style={styles.dropdownContent}>
                <MaterialIcons name="people" size={20} color={Colors.neutral.medium} />
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {getSelectedMembersDisplay()}
                </Text>
              </View>
              <MaterialIcons name={showMembersDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
            {showMembersDropdown && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={styles.membersScrollView} nestedScrollEnabled>
                  {projectMembers.map((member: ProjectMember) => (
                    <TouchableOpacity
                      key={String(member.id)}
                      style={styles.memberOption}
                      onPress={() => toggleMember(String(member.id))}
                    >
                      <View style={styles.memberInfo}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {(member.user.username || member.user.email || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>
                            {member.user.username || member.user.email}
                          </Text>
                          <Text style={styles.memberEmail}>
                            {member.user.email}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.checkbox}>
                        {selectedMembers.includes(String(member.id)) && (
                          <MaterialIcons name="check" size={20} color={Colors.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Priority</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={[styles.dropdownButton, errors.priority && styles.dropdownButtonError]}
              onPress={handlePriorityDropdownToggle}
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
                <ScrollView 
                  style={styles.dropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {priorityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setPriority(option.value);
                        setShowPriorityDropdown(false);
                      }}
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
          {errors.priority && (
            <Text style={styles.errorText}>{errors.priority}</Text>
          )}
        </View>


        {/* Start Date */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Start date</Text>
        <TouchableOpacity
          style={styles.dateFieldButton}
          onPress={handleStartDatePickerToggle}
        >
            <View style={styles.dateFieldContent}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.neutral.medium} />
              <Text style={styles.dateFieldText}>
                {startDate || 'Select start date'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Due Date */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Due date</Text>
        <TouchableOpacity
          style={styles.dateFieldButton}
          onPress={handleEndDatePickerToggle}
        >
            <View style={styles.dateFieldContent}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.neutral.medium} />
              <Text style={styles.dateFieldText}>
                {endDate || 'Select due date'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Estimated Duration */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Estimated duration (minutes)</Text>
          <TextInput
            mode="outlined"
            placeholder="Enter estimated duration"
            value={estimatedDuration}
            onChangeText={setEstimatedDuration}
            keyboardType="numeric"
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
                icon={() => <MaterialIcons name="timer" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
        </View>

      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateTask}
          disabled={isLoading}
        >
          <Text style={[styles.createButtonText, isLoading && styles.createButtonTextDisabled]}>
            {isLoading ? 'Creating...' : 'Create task'}
          </Text>
        </TouchableOpacity>
        
        {/* Error Message */}
        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}
      </View>


      {/* Start Date Picker Modal - Simple Test */}
      {showStartDatePicker && (
        <Modal
          visible={showStartDatePicker}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            console.log('Modal onRequestClose called');
            setShowStartDatePicker(false);
          }}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              {/* Header with selected date and buttons */}
              <View style={[styles.datePickerHeader, styles.datePickerHeaderOverride]}>
                <Text style={styles.datePickerSelectedText}>
                  {formatDateToDisplayString(startDateValue)}
                </Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Cancel button pressed');
                      setShowStartDatePicker(false);
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('OK button pressed');
                      setStartDate(formatDateToString(startDateValue));
                      setShowStartDatePicker(false);
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Calendar content */}
              <View style={styles.datePickerContent}>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarNavigation}>
                    <TouchableOpacity 
                      onPress={() => navigateMonth('prev')}
                      style={styles.navButton}
                    >
                      <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>
                      {getMonthName(currentMonth)} {currentYear}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => navigateMonth('next')}
                      style={styles.navButton}
                    >
                      <MaterialIcons name="chevron-right" size={24} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.calendarGrid}>
                    <View style={styles.calendarHeader}>
                      <Text style={styles.calendarDayHeader}>S</Text>
                      <Text style={styles.calendarDayHeader}>M</Text>
                      <Text style={styles.calendarDayHeader}>T</Text>
                      <Text style={styles.calendarDayHeader}>W</Text>
                      <Text style={styles.calendarDayHeader}>T</Text>
                      <Text style={styles.calendarDayHeader}>F</Text>
                      <Text style={styles.calendarDayHeader}>S</Text>
                    </View>
                    <View style={styles.calendarDays}>
                      {renderCalendarDays()}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* End Date Picker Modal */}
      {showEndDatePicker && (
        <Modal
          visible={showEndDatePicker}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            console.log('End Modal onRequestClose called');
            setShowEndDatePicker(false);
          }}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              {/* Header with selected date and buttons */}
              <View style={[styles.datePickerHeader, styles.datePickerHeaderOverride]}>
                <Text style={styles.datePickerSelectedText}>
                  {formatDateToDisplayString(endDateValue)}
                </Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('End Cancel button pressed');
                      setShowEndDatePicker(false);
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('End OK button pressed');
                      setEndDate(formatDateToString(endDateValue));
                      setShowEndDatePicker(false);
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Calendar content */}
              <View style={styles.datePickerContent}>
                <View style={styles.calendarContainer}>
                  <View style={styles.calendarNavigation}>
                    <TouchableOpacity 
                      onPress={() => navigateEndMonth('prev')}
                      style={styles.navButton}
                    >
                      <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>
                      {getMonthName(endCurrentMonth)} {endCurrentYear}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => navigateEndMonth('next')}
                      style={styles.navButton}
                    >
                      <MaterialIcons name="chevron-right" size={24} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.calendarGrid}>
                    <View style={styles.calendarHeader}>
                      <Text style={styles.calendarDayHeader}>S</Text>
                      <Text style={styles.calendarDayHeader}>M</Text>
                      <Text style={styles.calendarDayHeader}>T</Text>
                      <Text style={styles.calendarDayHeader}>W</Text>
                      <Text style={styles.calendarDayHeader}>T</Text>
                      <Text style={styles.calendarDayHeader}>F</Text>
                      <Text style={styles.calendarDayHeader}>S</Text>
                    </View>
                    <View style={styles.calendarDays}>
                      {renderEndCalendarDays()}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.headerTopSpacing,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 44, // Compensate for back button width
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.contentTopSpacing,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: Colors.background,
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  textInputError: {
    backgroundColor: Colors.background,
  },
  inputOutlineError: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.semantic.error,
  },
  multilineTextInput: {
    minHeight: 80,
  },
  multilineContent: {
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    position: 'relative',
  },
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
  dropdownButtonError: {
    borderColor: Colors.semantic.error,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  membersScrollView: {
    maxHeight: 200,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  memberEmail: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    backgroundColor: Colors.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.surface,
    textAlign: 'center',
    flex: 1,
  },
  modalSave: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  modalDateRangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '50',
  },
  modalDateRangeText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.surface,
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalDateInputSection: {
    marginBottom: 20,
  },
  modalDateInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalDateInput: {
    backgroundColor: Colors.background,
    fontSize: 16,
  },
  modalInputOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  modalDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  modalDateButtonText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  // Material Design Date Picker styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  datePickerContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 0,
    width: '90%',
    maxWidth: 350,
    height: 420, // Fixed height to prevent size changes
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.surface,
    textAlign: 'center',
    flex: 1,
  },
  datePickerCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  datePickerOkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  datePickerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  datePickerSelectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '50',
  },
  datePickerSelectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.surface,
    flex: 1,
  },
  datePicker: {
    backgroundColor: Colors.background,
  },
  datePickerContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Calendar styles
  calendarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  calendarGrid: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDayHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
    width: 40,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDayToday: {
    backgroundColor: Colors.semantic.success + '20',
    borderWidth: 1,
    borderColor: Colors.semantic.success,
  },
  calendarDayText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: Colors.semantic.success,
    fontWeight: '600',
  },
  // Date Field styles
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
  dateFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dateFieldText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
    paddingTop: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    ...ButtonStyles.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: Colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  createButtonText: {
    ...Typography.buttonText,
    color: Colors.neutral.white,
  },
  createButtonTextDisabled: {
    color: Colors.neutral.medium,
  },
  // Calendar Navigation styles
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.neutral.light,
  },
  // Header button styles
  datePickerHeaderSpacer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.surface + '20',
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.surface,
  },
  // Override header styles for rounded corners
  datePickerHeaderOverride: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});

export default CreateTaskScreen;
