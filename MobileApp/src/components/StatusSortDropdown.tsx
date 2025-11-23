import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { FlowStatus } from '../types/Project';

interface StatusSortDropdownProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (status: FlowStatus | null) => void;
  selectedStatus: FlowStatus | null;
}

const StatusSortDropdown: React.FC<StatusSortDropdownProps> = ({
  visible,
  onClose,
  onSelect,
  selectedStatus,
}) => {
  if (!visible) return null;

  const statusOptions = [
    { value: null, label: 'All Status', icon: 'list' },
    { value: FlowStatus.NOT_STARTED, label: 'Not Started', icon: 'radio-button-unchecked' },
    { value: FlowStatus.IN_PROGRESS, label: 'In Progress', icon: 'schedule' },
    { value: FlowStatus.COMPLETED, label: 'Completed', icon: 'check-circle' },
    { value: FlowStatus.BLOCKED, label: 'Blocked', icon: 'block' },
  ];

  const handleSelect = (status: FlowStatus | null) => {
    onSelect(status);
    onClose();
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.dropdown}>
        {statusOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionItem}
            onPress={() => handleSelect(option.value)}
          >
            <MaterialIcons 
              name={option.icon} 
              size={20} 
              color={selectedStatus === option.value ? Colors.primary : Colors.neutral.medium} 
            />
            <Text style={[
              styles.optionText,
              selectedStatus === option.value && styles.selectedText
            ]}>
              {option.label}
            </Text>
            {selectedStatus === option.value && (
              <MaterialIcons name="check" size={16} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: 140,
    right: 36,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  selectedText: {
    color: Colors.primary,
  },
});

export default StatusSortDropdown;
