import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { CreateEventData } from '../types';
import { ProjectMember } from '../types/Project';
import { useToastContext } from '../context/ToastContext';

// Project Member Dropdown Component
interface ProjectMemberDropdownProps {
  members: ProjectMember[];
  selectedMemberIds: string[];
  onMemberSelect: (memberIds: string[]) => void;
}

const ProjectMemberDropdown: React.FC<ProjectMemberDropdownProps> = ({
  members,
  selectedMemberIds,
  onMemberSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onMemberSelect(selectedMemberIds.filter(id => id !== memberId));
    } else {
      onMemberSelect([...selectedMemberIds, memberId]);
    }
  };

  const getSelectedMembersDisplay = () => {
    const selectedMemberObjects = members.filter(member => 
      selectedMemberIds.includes(String(member.id))
    );
    const totalSelected = selectedMemberObjects.length;
    if (totalSelected === 0) {
      return 'Select members';
    }
    
    if (totalSelected <= 3) {
      const names = selectedMemberObjects.map(m => m.user.username);
      return names.join(', ');
    }
    
    return `${totalSelected} members selected`;
  };

  return (
    <View style={dropdownStyles.container}>
      <TouchableOpacity
        style={dropdownStyles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={dropdownStyles.dropdownText} numberOfLines={1}>{getSelectedMembersDisplay()}</Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={dropdownStyles.dropdown}>
          <View style={dropdownStyles.membersSection}>
            <Text style={dropdownStyles.sectionTitle}>Project Members</Text>
            <ScrollView style={dropdownStyles.membersList} nestedScrollEnabled>
              {members.map((member) => (
                <TouchableOpacity
                  key={String(member.id)}
                  style={dropdownStyles.memberItem}
                  onPress={() => toggleMember(String(member.id))}
                >
                  <View style={dropdownStyles.memberInfo}>
                    <View style={dropdownStyles.avatar}>
                      <Text style={dropdownStyles.avatarText}>
                        {(member.user.username || member.user.email || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={dropdownStyles.memberDetails}>
                      <Text style={dropdownStyles.memberName}>
                        {member.user.username || member.user.email}
                      </Text>
                      <Text style={dropdownStyles.memberEmail}>
                        {member.user.email}
                      </Text>
                    </View>
                  </View>
                  <View style={dropdownStyles.checkbox}>
                    {selectedMemberIds.includes(String(member.id)) && (
                      <MaterialIcons name="check" size={20} color={Colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

// Time Dropdown Component
interface TimeDropdownProps {
  selectedHour: string;
  selectedMinute: string;
  onTimeSelect: (hour: string, minute: string) => void;
}

const TimeDropdown: React.FC<TimeDropdownProps> = ({
  selectedHour,
  selectedMinute,
  onTimeSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState(selectedHour);
  const [tempMinute, setTempMinute] = useState(selectedMinute);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleConfirm = () => {
    onTimeSelect(tempHour, tempMinute);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempHour(selectedHour);
    setTempMinute(selectedMinute);
    setIsOpen(false);
  };

  const getDisplayTime = () => {
    if (!selectedHour || !selectedMinute) return 'Select time';
    return `${selectedHour}:${selectedMinute}`;
  };

  return (
    <View style={timeDropdownStyles.container}>
      <TouchableOpacity
        style={timeDropdownStyles.dropdownButton}
        onPress={() => {
          setTempHour(selectedHour);
          setTempMinute(selectedMinute);
          setIsOpen(!isOpen);
        }}
      >
        <Text style={timeDropdownStyles.dropdownText}>{getDisplayTime()}</Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={timeDropdownStyles.dropdown}>
          <View style={timeDropdownStyles.timePickerContent}>
            <View style={timeDropdownStyles.timeColumn}>
              <Text style={timeDropdownStyles.timeColumnTitle}>Hour</Text>
              <ScrollView style={timeDropdownStyles.timeScrollView} nestedScrollEnabled>
                {hourOptions.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      timeDropdownStyles.timeOption,
                      tempHour === hour && timeDropdownStyles.selectedTimeOption
                    ]}
                    onPress={() => setTempHour(hour)}
                  >
                    <Text style={[
                      timeDropdownStyles.timeOptionText,
                      tempHour === hour && timeDropdownStyles.selectedTimeOptionText
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={timeDropdownStyles.timeColumn}>
              <Text style={timeDropdownStyles.timeColumnTitle}>Minute</Text>
              <ScrollView style={timeDropdownStyles.timeScrollView} nestedScrollEnabled>
                {minuteOptions.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      timeDropdownStyles.timeOption,
                      tempMinute === minute && timeDropdownStyles.selectedTimeOption
                    ]}
                    onPress={() => setTempMinute(minute)}
                  >
                    <Text style={[
                      timeDropdownStyles.timeOptionText,
                      tempMinute === minute && timeDropdownStyles.selectedTimeOptionText
                    ]}>
                      {minute}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={timeDropdownStyles.actions}>
            <TouchableOpacity
              style={timeDropdownStyles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={timeDropdownStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={timeDropdownStyles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={timeDropdownStyles.confirmButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventData) => void;
  projectMembers?: ProjectMember[];
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringValue, setRecurringValue] = useState('');
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('10');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const { showSuccess, showError } = useToastContext();

  const resetForm = () => {
    setEventName('');
    setSelectedMembers([]);
    setDate('');
    setTime('');
    setIsRecurring(false);
    setRecurringValue('');
    setLink('');
    setIsLoading(false);
    setShowTimePicker(false);
    setSelectedHour('10');
    setSelectedMinute('00');
    setShowRecurringOptions(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMemberSelect = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
  };

  const handleTimeSelect = (hour: string, minute: string) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setTime(`${hour}:${minute}`);
    setShowTimePicker(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  };

  const validateDateFormat = (dateStr: string) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateStr);
  };

  const handleCreate = async () => {
    if (!eventName.trim()) {
      showError('Please enter an event name');
      return;
    }

    if (!date.trim()) {
      showError('Please enter a date');
      return;
    }

    if (!validateDateFormat(date)) {
      showError('Please enter date in format: dd/mm/yyyy (e.g., 15/12/2024)');
      return;
    }

    if (!time.trim()) {
      showError('Please enter a time');
      return;
    }

    if (isRecurring && !recurringValue.trim()) {
      showError('Please enter recurring value (e.g., 2, 3, 4...)');
      return;
    }

    const eventData: CreateEventData = {
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

    try {
      setIsLoading(true);
      await onCreateEvent(eventData);
      showSuccess('Event created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating event:', error);
      showError('Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));




  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerSideSpacer} />
              <Text style={styles.headerTitle}>Create event</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Event Name */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Event name"
                  placeholderTextColor={Colors.neutral.medium}
                  value={eventName}
                  onChangeText={setEventName}
                  maxLength={100}
                />
              </View>

              {/* Add Member */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add member</Text>
                <ProjectMemberDropdown
                  members={projectMembers}
                  selectedMemberIds={selectedMembers}
                  onMemberSelect={handleMemberSelect}
                />
              </View>

              {/* Date */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="dd/mm/yyyy (e.g., 15/12/2024)"
                  placeholderTextColor={Colors.neutral.medium}
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numeric"
                />
              </View>

              {/* Time */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Time</Text>
                <TimeDropdown
                  selectedHour={selectedHour}
                  selectedMinute={selectedMinute}
                  onTimeSelect={handleTimeSelect}
                />
              </View>

              {/* Link */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Link</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add Google Meet link or other meeting link"
                  placeholderTextColor={Colors.neutral.medium}
                  value={link}
                  onChangeText={setLink}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              {/* Recurring Toggle */}
              <View style={styles.section}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.sectionTitle}>Repeat</Text>
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
                      style={styles.textInput}
                      onPress={() => setShowRecurringOptions(!showRecurringOptions)}
                    >
                      <View style={styles.dropdownInput}>
                        <Text style={[
                          styles.dropdownText,
                          !recurringValue && styles.placeholderText
                        ]}>
                          {recurringValue || 'Select day of week'}
                        </Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.neutral.medium} />
                      </View>
                    </TouchableOpacity>
                    
                    {showRecurringOptions && (
                      <View style={styles.recurringDropdown}>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Monday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Monday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Tuesday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Tuesday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Wednesday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Wednesday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Thursday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Thursday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Friday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Friday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Saturday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Saturday</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.recurringOption}
                          onPress={() => {
                            setRecurringValue('Sunday');
                            setShowRecurringOptions(false);
                          }}
                        >
                          <Text style={styles.recurringOptionText}>Sunday</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Create Button */}
            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={handleCreate} 
                style={[styles.createButton, (!eventName.trim() || isLoading) && styles.createButtonDisabled]}
                disabled={!eventName.trim() || isLoading}
                activeOpacity={0.8}
              >
                <Text style={[styles.createButtonText, (!eventName.trim() || isLoading) && styles.createButtonTextDisabled]}>
                  {isLoading ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
    textAlign: 'center',
  },
  headerSideSpacer: { width: 64 },
  content: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
    backgroundColor: Colors.surface,
  },
  descriptionInput: {
    minHeight: 100,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    flex: 1,
  },
  placeholderText: {
    color: Colors.neutral.medium,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: Colors.neutral.white,
  },
  // Picker styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  pickerContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    backgroundColor: Colors.background,
    gap: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  pickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.surface,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  selectedTimeOption: {
    backgroundColor: Colors.primary + '10',
  },
  timeOptionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  selectedTimeOptionText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 8,
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
  recurringSection: {
    marginTop: 12,
    position: 'relative',
    zIndex: 1000,
  },
  recurringDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  recurringOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '50',
  },
  recurringOptionText: {
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  selectedMemberOption: {
    backgroundColor: Colors.primary + '10',
  },
  memberOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberOptionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberOptionAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  memberOptionDetails: {
    flex: 1,
  },
  memberOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  memberOptionEmail: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
});

// Dropdown styles
const dropdownStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '20',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  membersSection: {
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.neutral.light + '30',
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
});

// Time Dropdown styles
const timeDropdownStyles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '20',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    maxHeight: 150,
  },
  timeOption: {
    paddingVertical: 12,
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
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.surface,
  },
});

export default CreateEventModal;