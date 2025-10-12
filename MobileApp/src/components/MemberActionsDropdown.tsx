import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface MemberActionsDropdownProps {
  visible: boolean;
  onClose: () => void;
  onEditRole: () => void;
  onRemoveMember: () => void;
}

const MemberActionsDropdown: React.FC<MemberActionsDropdownProps> = ({
  visible,
  onClose,
  onEditRole,
  onRemoveMember,
}) => {
  if (!visible) return null;

  const actions = [
    {
      id: 'edit_role',
      title: 'Edit Role',
      icon: 'edit',
      color: Colors.neutral.dark,
      onPress: onEditRole,
    },
    {
      id: 'remove_member',
      title: 'Remove Member',
      icon: 'person-remove',
      color: Colors.error,
      onPress: onRemoveMember,
    },
  ];

  const handleActionPress = (action: any) => {
    onClose();
    action.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownMenu}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.dropdownItem}
              onPress={() => handleActionPress(action)}
            >
              <MaterialIcons name={action.icon} size={20} color={action.color} />
              <Text style={[styles.dropdownItemText, { color: action.color }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MemberActionsDropdown;

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface MemberActionsDropdownProps {
  visible: boolean;
  onClose: () => void;
  onEditRole: () => void;
  onRemoveMember: () => void;
}

const MemberActionsDropdown: React.FC<MemberActionsDropdownProps> = ({
  visible,
  onClose,
  onEditRole,
  onRemoveMember,
}) => {
  if (!visible) return null;

  const actions = [
    {
      id: 'edit_role',
      title: 'Edit Role',
      icon: 'edit',
      color: Colors.neutral.dark,
      onPress: onEditRole,
    },
    {
      id: 'remove_member',
      title: 'Remove Member',
      icon: 'person-remove',
      color: Colors.error,
      onPress: onRemoveMember,
    },
  ];

  const handleActionPress = (action: any) => {
    onClose();
    action.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.dropdownMenu}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.dropdownItem}
              onPress={() => handleActionPress(action)}
            >
              <MaterialIcons name={action.icon} size={20} color={action.color} />
              <Text style={[styles.dropdownItemText, { color: action.color }]}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MemberActionsDropdown;
