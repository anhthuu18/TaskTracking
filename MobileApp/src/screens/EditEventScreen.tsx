import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/Colors';
import { eventService, Event } from '../services/eventService';
import { useToastContext } from '../context/ToastContext';

interface EditEventScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: number;
      onEventUpdated?: () => void;
    };
  };
}

const EditEventScreen: React.FC<EditEventScreenProps> = ({
  navigation,
  route,
}) => {
  const { eventId, onEventUpdated } = route.params;
  const { showSuccess, showError } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);

  // Form state
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Date/Time picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);

      // Populate form
      setEventName(eventData.eventName);
      setDescription(eventData.description || '');

      const start = new Date(eventData.startTime);
      const end = new Date(eventData.endTime);

      setStartDate(start);
      setStartTime(start);
      setEndDate(end);
      setEndTime(end);
    } catch (error: any) {
      showError(error.message || 'Failed to load event');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!eventName.trim()) {
      showError('Please enter event name');
      return;
    }

    // Combine date and time
    const combinedStartDate = new Date(startDate);
    combinedStartDate.setHours(startTime.getHours());
    combinedStartDate.setMinutes(startTime.getMinutes());
    combinedStartDate.setSeconds(0);

    const combinedEndDate = new Date(endDate);
    combinedEndDate.setHours(endTime.getHours());
    combinedEndDate.setMinutes(endTime.getMinutes());
    combinedEndDate.setSeconds(0);

    // Validate end time is after start time
    if (combinedEndDate <= combinedStartDate) {
      showError('End time must be after start time');
      return;
    }

    try {
      setSubmitting(true);

      await eventService.updateEvent(eventId, {
        eventName: eventName.trim(),
        description: description.trim() || undefined,
        startTime: combinedStartDate.toISOString(),
        endTime: combinedEndDate.toISOString(),
      });

      showSuccess('Event updated successfully!');
      if (onEventUpdated) {
        onEventUpdated();
      }
      navigation.goBack();
    } catch (error: any) {
      showError(error.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={Colors.neutral.dark}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Name *</Text>
          <TextInput
            style={styles.input}
            value={eventName}
            onChangeText={setEventName}
            placeholder="Enter event name"
            placeholderTextColor={Colors.neutral.medium}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter event description (optional)"
            placeholderTextColor={Colors.neutral.medium}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Project (read-only) */}
        {event?.project && (
          <View style={styles.section}>
            <Text style={styles.label}>Project</Text>
            <View style={styles.readOnlyField}>
              <MaterialIcons
                name="folder"
                size={20}
                color={Colors.neutral.medium}
              />
              <Text style={styles.readOnlyText}>
                {event.project.projectName}
              </Text>
            </View>
          </View>
        )}

        {/* Date & Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          {/* Start Date & Time Row */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.dateTimeText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeField}>
              <Text style={styles.label}>Start Time *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <MaterialIcons
                  name="access-time"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.dateTimeText}>{formatTime(startTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* End Date & Time Row */}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.dateTimeText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateTimeField}>
              <Text style={styles.label}>End Time *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <MaterialIcons
                  name="access-time"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.dateTimeText}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.neutral.white} />
          ) : (
            <>
              <MaterialIcons
                name="check"
                size={20}
                color={Colors.neutral.white}
              />
              <Text style={styles.submitButtonText}>Update Event</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(Platform.OS === 'ios');
            if (selectedTime) {
              setStartTime(selectedTime);
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(Platform.OS === 'ios');
            if (selectedTime) {
              setEndTime(selectedTime);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.neutral.white,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.light + '50',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
});

export default EditEventScreen;
