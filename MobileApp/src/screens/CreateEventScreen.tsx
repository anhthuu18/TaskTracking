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
  Dimensions,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ScreenLayout, ButtonStyles, Typography } from '../constants/Dimensions';
import { ProjectMember } from '../types/Project';
import { useToastContext } from '../context/ToastContext';

interface CreateEventScreenProps {
  navigation: any;
  route?: any;
}

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation, route }) => {
  const { projectMembers = [], projectId } = route?.params || {};
  const { showSuccess, showError } = useToastContext();
  
  const [eventName, setEventName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringValue, setRecurringValue] = useState('');
  const [link, setLink] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const formatDateToString = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateToDisplayString = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

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

  const handleDatePickerToggle = () => {
    const today = new Date();
    setDateValue(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setShowDatePicker(true);
    // Close other dropdowns
    setShowMembersDropdown(false);
    setShowRecurringOptions(false);
  };

  const handleTimePickerToggle = () => {
    setShowTimePickerModal(true);
    // Close other dropdowns
    setShowMembersDropdown(false);
    setShowRecurringOptions(false);
    setShowDatePicker(false);
  };

  const handleTimeConfirm = () => {
    setTime(`${selectedHour}:${selectedMinute}`);
    setShowTimePickerModal(false);
  };

  const handleTimeCancel = () => {
    setShowTimePickerModal(false);
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
      const isSelected = dateValue.getDate() === day && 
                        dateValue.getMonth() === currentMonth && 
                        dateValue.getFullYear() === currentYear;
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentMonth && 
                     new Date().getFullYear() === currentYear;
      
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
            setDateValue(newDate);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarDayTextSelected,
            isToday && styles.calendarDayTextToday
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Add empty cells to fill the remaining space (always 42 cells total)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <View key={`empty-end-${i}`} style={styles.calendarDay} />
      );
    }
    
    return days;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
    }

    if (!validateDateFormat(date)) {
      newErrors.date = 'Please enter date in format: dd/mm/yyyy (e.g., 15/12/2024)';
    }

    if (!time.trim()) {
      newErrors.time = 'Time is required';
    }

    if (isRecurring && !recurringValue.trim()) {
      newErrors.recurring = 'Please select repeat frequency';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDateFormat = (dateStr: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateStr);
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const eventData = {
        name: eventName.trim(),
        description: '',
        startDate: new Date(), // Will be parsed from date string
        endDate: new Date(), // Will be parsed from date string
        includeTime: true,
        startTime: time,
        endTime: time,
        location: '',
        assignedMembers: selectedMembers,
        memberIds: selectedMembers.map(id => Number(id)).filter(n => !isNaN(n)),
        isRecurring,
        recurringType: isRecurring ? 'daily' : undefined,
        projectId: projectId || undefined,
      };

      // TODO: Implement actual event creation API call
      // await eventService.createEvent(eventData);
      
      showSuccess('Event created successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating event:', error);
      showError(error.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleTimeSelect = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setTime(`${hour}:${minute}`);
    setShowTimePicker(false);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create event</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Name */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            mode="outlined"
            placeholder="Event name"
            value={eventName}
            onChangeText={setEventName}
            style={[
              styles.textInput,
              errors.eventName && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.eventName && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.eventName ? Colors.semantic.error : Colors.primary,
                outline: errors.eventName ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="event" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          {errors.eventName && (
            <Text style={styles.errorText}>{errors.eventName}</Text>
          )}
        </View>

        {/* Add Member */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Add member</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowMembersDropdown(!showMembersDropdown)}
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

        {/* Date */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity
            style={[styles.dateFieldButton, errors.date && styles.dateFieldButtonError]}
            onPress={handleDatePickerToggle}
          >
            <View style={styles.dateFieldContent}>
              <MaterialIcons name="calendar-today" size={20} color={Colors.neutral.medium} />
              <Text style={styles.dateFieldText}>
                {date || 'Select date'}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.date && (
            <Text style={styles.errorText}>{errors.date}</Text>
          )}
        </View>

        {/* Time */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Time</Text>
          <TouchableOpacity
            style={[styles.timeFieldButton, errors.time && styles.timeFieldButtonError]}
            onPress={handleTimePickerToggle}
          >
            <View style={styles.timeFieldContent}>
              <MaterialIcons name="schedule" size={20} color={Colors.neutral.medium} />
              <Text style={styles.timeFieldText}>
                {time || 'Select time'}
              </Text>
            </View>
          </TouchableOpacity>
          {errors.time && (
            <Text style={styles.errorText}>{errors.time}</Text>
          )}
        </View>

        {/* Link */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Link</Text>
          <TextInput
            mode="outlined"
            placeholder="Add Google Meet link or other meeting link"
            value={link}
            onChangeText={setLink}
            keyboardType="url"
            autoCapitalize="none"
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
                icon={() => <MaterialIcons name="link" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
        </View>

        {/* Recurring Toggle */}
        <View style={styles.inputSection}>
          <View style={styles.toggleContainer}>
            <Text style={styles.sectionLabel}>Repeat</Text>
            <TouchableOpacity
              style={[styles.toggleButton, isRecurring && styles.toggleButtonActive]}
              onPress={() => {
                setIsRecurring(!isRecurring);
                if (!isRecurring) {
                  setShowRecurringOptions(true);
                } else {
                  setShowRecurringOptions(false);
                }
              }}
            >
              <View style={[styles.toggleCircle, isRecurring && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
          
          {isRecurring && (
            <View style={styles.recurringSection}>
              <TouchableOpacity
                style={[styles.dropdownButton, errors.recurring && styles.dropdownButtonError]}
                onPress={() => setShowRecurringOptions(!showRecurringOptions)}
              >
                <View style={styles.dropdownContent}>
                  <MaterialIcons name="repeat" size={20} color={Colors.neutral.medium} />
                  <Text style={styles.dropdownText}>
                    {recurringValue || 'Select day of week'}
                  </Text>
                </View>
                <MaterialIcons name={showRecurringOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={24} color={Colors.neutral.medium} />
              </TouchableOpacity>
              
              {showRecurringOptions && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Monday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Monday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Tuesday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Tuesday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Wednesday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Wednesday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Thursday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Thursday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Friday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Friday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Saturday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Saturday</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setRecurringValue('Sunday');
                      setShowRecurringOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Sunday</Text>
                  </TouchableOpacity>
                </View>
              )}
              {errors.recurring && (
                <Text style={styles.errorText}>{errors.recurring}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            console.log('Modal onRequestClose called');
            setShowDatePicker(false);
          }}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              {/* Header with selected date and buttons */}
              <View style={[styles.datePickerHeader, styles.datePickerHeaderOverride]}>
                <Text style={styles.datePickerSelectedText}>
                  {formatDateToDisplayString(dateValue)}
                </Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Cancel button pressed');
                      setShowDatePicker(false);
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('OK button pressed');
                      setDate(formatDateToString(dateValue));
                      setShowDatePicker(false);
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

      {/* Time Picker Modal */}
      {showTimePickerModal && (
        <Modal
          visible={showTimePickerModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            console.log('Time Modal onRequestClose called');
            setShowTimePickerModal(false);
          }}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContainer}>
              {/* Header with selected time and buttons */}
              <View style={[styles.timePickerHeader, styles.timePickerHeaderOverride]}>
                <Text style={styles.timePickerSelectedText}>
                  {selectedHour}:{selectedMinute}
                </Text>
                <View style={styles.headerButtons}>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Time Cancel button pressed');
                      setShowTimePickerModal(false);
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('Time OK button pressed');
                      handleTimeConfirm();
                    }}
                    style={styles.headerButton}
                  >
                    <Text style={styles.headerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Time picker content */}
              <View style={styles.timePickerContent}>
                <View style={styles.timePickerColumns}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeColumnTitle}>Hour</Text>
                    <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                      {hourOptions.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timeOption,
                            selectedHour === hour && styles.selectedTimeOption
                          ]}
                          onPress={() => setSelectedHour(hour)}
                        >
                          <Text style={[
                            styles.timeOptionText,
                            selectedHour === hour && styles.selectedTimeOptionText
                          ]}>
                            {hour}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeColumnTitle}>Minute</Text>
                    <ScrollView style={styles.timeScrollView} nestedScrollEnabled>
                      {minuteOptions.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timeOption,
                            selectedMinute === minute && styles.selectedTimeOption
                          ]}
                          onPress={() => setSelectedMinute(minute)}
                        >
                          <Text style={[
                            styles.timeOptionText,
                            selectedMinute === minute && styles.selectedTimeOptionText
                          ]}>
                            {minute}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateEvent}
          disabled={isLoading}
        >
          <Text style={[styles.createButtonText, isLoading && styles.createButtonTextDisabled]}>
            {isLoading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
        
        {/* Error Message */}
        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}
      </View>
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
  timePickerMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2000,
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeColumnTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeScrollView: {
    maxHeight: 200,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginVertical: 1,
  },
  selectedTimeOption: {
    backgroundColor: Colors.primary + '20',
  },
  timeOptionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  selectedTimeOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  timePickerActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  timePickerCancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerCancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  timePickerConfirmButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerConfirmText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral.light,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  recurringSection: {
    marginTop: 12,
    position: 'relative',
    zIndex: 1000,
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
  // Date Picker Styles
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
  dateFieldButtonError: {
    borderColor: Colors.semantic.error,
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '90%',
    maxWidth: 350,
    height: 420,
    elevation: 5,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  datePickerHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerHeaderOverride: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  datePickerSelectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.surface,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  datePickerContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  calendarGrid: {
    flex: 1,
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
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDayToday: {
    backgroundColor: Colors.neutral.light,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: Colors.text,
  },
  calendarDayTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  // Time Picker Modal Styles
  timeFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    backgroundColor: Colors.background,
  },
  timeFieldButtonError: {
    borderColor: Colors.semantic.error,
  },
  timeFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  timeFieldText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '90%',
    maxWidth: 350,
    height: 320,
    elevation: 5,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  timePickerHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerHeaderOverride: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  timePickerSelectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.surface,
  },
  timePickerColumns: {
    flexDirection: 'row',
    flex: 1,
  },
});

export default CreateEventScreen;
