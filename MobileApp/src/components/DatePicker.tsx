import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label?: string;
  style?: any;
  // Legacy props for backward compatibility
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  label,
  style,
  // Legacy props
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Handle legacy mode (dual date picker)
  const isLegacyMode = startDate && endDate && onStartDateChange && onEndDateChange;

  const formatDate = (dateToFormat: Date) => {
    return dateToFormat.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate && onDateChange) {
      onDateChange(selectedDate);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate && onStartDateChange) {
      onStartDateChange(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate && onEndDateChange) {
      onEndDateChange(selectedDate);
    }
  };

  if (isLegacyMode) {
    // Legacy dual date picker mode
    return (
      <View style={styles.container}>
        <View style={styles.dateRow}>
          {/* Start Date */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
            <Text style={styles.dateText}>{formatDate(startDate!)}</Text>
          </TouchableOpacity>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <View style={styles.arrowLine} />
            <MaterialIcons name="arrow-forward" size={16} color={Colors.neutral.medium} />
          </View>

          {/* End Date */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <MaterialIcons name="event" size={16} color={Colors.primary} />
            <Text style={styles.dateText}>{formatDate(endDate!)}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate!}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate!}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={startDate}
          />
        )}
      </View>
    );
  }

  // New single date picker mode
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.singleDateButton}
        onPress={() => setShowPicker(true)}
      >
        <MaterialIcons name="event" size={16} color={Colors.primary} />
        <Text style={styles.dateText}>
          {label ? `${label}: ` : ''}{formatDate(date)}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  arrowLine: {
    width: 20,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },
  singleDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
});

export default DatePicker;
