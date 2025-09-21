import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { CreateEventData } from '../types';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventData) => void;
  projectMembers?: any[];
  projectId?: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onCreateEvent,
  projectMembers = [],
  projectId,
}) => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [includeTime, setIncludeTime] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isSelectingStartTime, setIsSelectingStartTime] = useState(true);
  const [location, setLocation] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderCalendar = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === startDate.getDate();
      const isToday = day === currentDate.getDate();
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && !isSelected && styles.todayDay,
          ]}
          onPress={() => {
            const newDate = new Date(year, month, day);
            if (isSelectingStartDate) {
              setStartDate(newDate);
              if (hasEndDate) {
                setIsSelectingStartDate(false);
              } else {
                setEndDate(newDate);
                setShowCalendar(false);
              }
            } else {
              setEndDate(newDate);
              setIsSelectingStartDate(true);
              setShowCalendar(false);
            }
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayDayText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity>
            <MaterialIcons name="chevron-left" size={24} color={Colors.neutral.dark} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity>
            <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.dark} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysContainer}>
          {days}
        </View>
      </View>
    );
  };

  const handleCreate = () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    const eventData: CreateEventData = {
      name: eventName,
      description,
      startDate,
      endDate: hasEndDate ? endDate : undefined,
      includeTime,
      startTime: includeTime ? startTime : undefined,
      endTime: includeTime ? endTime : undefined,
      location,
      assignedMembers: selectedMembers,
      projectId,
    };

    onCreateEvent(eventData);
    
    // Reset form
    setEventName('');
    setDescription('');
    setLocation('');
    setSelectedMembers([]);
    setHasEndDate(false);
    setIncludeTime(false);
    setShowCalendar(false);
    setIsSelectingStartDate(true);
    setShowTimePicker(false);
    setIsSelectingStartTime(true);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create event</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Event Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={eventName}
              onChangeText={setEventName}
              placeholder="Text"
              placeholderTextColor={Colors.primary}
            />
          </View>

          {/* Add Member */}
          {projectMembers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Add member</Text>
              <View style={styles.membersRow}>
                {projectMembers.slice(0, 1).map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberAvatar,
                      selectedMembers.includes(member.id) && styles.selectedMemberAvatar
                    ]}
                    onPress={() => handleMemberToggle(member.id)}
                  >
                    <Text style={styles.memberInitial}>
                      {member.username.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addMemberButton}>
                  <MaterialIcons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date and time</Text>
            
            {/* Date Selection Display */}
            <View style={styles.dateSelectionContainer}>
              <TouchableOpacity 
                style={[styles.dateButton, isSelectingStartDate && showCalendar && styles.activeButton]}
                onPress={() => {
                  setIsSelectingStartDate(true);
                  setShowCalendar(true);
                }}
              >
                <MaterialIcons name="event" size={20} color={Colors.surface} />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
              {hasEndDate && (
                <TouchableOpacity 
                  style={[styles.dateButton, styles.endDateButton, !isSelectingStartDate && showCalendar && styles.activeButton]}
                  onPress={() => {
                    setIsSelectingStartDate(false);
                    setShowCalendar(true);
                  }}
                >
                  <MaterialIcons name="event" size={20} color={Colors.surface} />
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* End Date Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.sectionLabel}>End date</Text>
              <Switch
                value={hasEndDate}
                onValueChange={setHasEndDate}
                trackColor={{ false: Colors.neutral.light, true: Colors.primary + '40' }}
                thumbColor={hasEndDate ? Colors.primary : Colors.neutral.medium}
              />
            </View>
          </View>

          {/* Include Time Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.sectionLabel}>Include time</Text>
              <Switch
                value={includeTime}
                onValueChange={(value) => {
                  setIncludeTime(value);
                  if (value) {
                    setShowTimePicker(true);
                  }
                }}
                trackColor={{ false: Colors.neutral.light, true: Colors.primary + '40' }}
                thumbColor={includeTime ? Colors.primary : Colors.neutral.medium}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Text"
              placeholderTextColor={Colors.primary}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        {/* Calendar Dialog */}
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <View style={styles.dialogOverlay}>
            <View style={styles.calendarDialog}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>
                  {isSelectingStartDate ? 'Select Start Date' : 'Select End Date'}
                </Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
                </TouchableOpacity>
              </View>
              {renderCalendar()}
            </View>
          </View>
        </Modal>

        {/* Time Picker Dialog */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.dialogOverlay}>
            <View style={styles.timePickerDialog}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Enter Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerContent}>     
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeInputSection}>
                    <View style={styles.timeInputBox}>
                      <TextInput
                        style={styles.timeInputField}
                        value={isSelectingStartTime ? startTime.split(':')[0] : endTime.split(':')[0]}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9]/g, '');
                          if (numericText.length <= 2) {
                            const hour = Math.min(parseInt(numericText) || 0, 23);
                            const currentTime = isSelectingStartTime ? startTime : endTime;
                            const minutes = currentTime.split(':')[1];
                            const newTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
                            if (isSelectingStartTime) {
                              setStartTime(newTime);
                            } else {
                              setEndTime(newTime);
                            }
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        textAlign="center"
                      />
                    </View>
                    <Text style={styles.timeInputLabel}>Hour</Text>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  <View style={styles.timeInputSection}>
                    <View style={styles.timeInputBox}>
                      <TextInput
                        style={styles.timeInputField}
                        value={isSelectingStartTime ? startTime.split(':')[1] : endTime.split(':')[1]}
                        onChangeText={(text) => {
                          const numericText = text.replace(/[^0-9]/g, '');
                          if (numericText.length <= 2) {    
                            const minute = Math.min(parseInt(numericText) || 0, 59);
                            const currentTime = isSelectingStartTime ? startTime : endTime;
                            const hour = currentTime.split(':')[0];
                            const newTime = `${hour}:${minute.toString().padStart(2, '0')}`;
                            if (isSelectingStartTime) {
                              setStartTime(newTime);
                            } else {
                              setEndTime(newTime);
                            }
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        textAlign="center"
                      />
                    </View>
                    <Text style={styles.timeInputLabel}>Minute</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.timeActionButtons}>
                  <TouchableOpacity 
                    style={styles.timeCancelButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.timeCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.timeOkButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.timeOkText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
            <Text style={styles.createButtonText}>Create</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMemberAvatar: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  memberInitial: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  addMemberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  calendarContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.medium,
    width: 40,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  todayDay: {
    backgroundColor: Colors.neutral.light,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  selectedDayText: {
    color: Colors.surface,
    fontWeight: '600',
  },
  todayDayText: {
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.dark,
    borderRadius: 20,
    gap: 8,
    flex: 1,
  },
  endDateButton: {
    backgroundColor: Colors.primary,
  },
  dateText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  activeButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDialog: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    margin: 20,
    maxWidth: 350,
    width: '90%',
  },
  timePickerDialog: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    margin: 20,
    maxWidth: 280,
    width: '75%',
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  timePickerContent: {
    padding: 20,
  },
  timeLabel: {
    fontSize: 16,
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  timeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  currentTimeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  currentTimeText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timeInputSection: {
    alignItems: 'center',
  },
  timeInputBox: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    minWidth: 70,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeInputField: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.neutral.dark,
    textAlign: 'center',
    minWidth: 50,
  },
  timeInputLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  timeActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  timeCancelText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  timeOkButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  timeOkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default CreateEventModal;
