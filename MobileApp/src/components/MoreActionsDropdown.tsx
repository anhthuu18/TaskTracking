import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface MoreActionsDropdownProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  isAdmin?: boolean;
}

const MoreActionsDropdown: React.FC<MoreActionsDropdownProps> = ({
  visible,
  onClose,
  onAction,
  isAdmin = false,
}) => {
  if (!visible) return null;

  const allActions = [
    { 
      id: 'project_setting', 
      title: 'Project setting', 
      icon: 'settings',
      color: Colors.neutral.dark,
      adminOnly: true,
    },
  ];

  const actions = isAdmin ? allActions : [];

  const handleActionPress = (actionId: string) => {
    onAction(actionId);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.dropdown}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionItem,
              index === actions.length - 1 && styles.lastActionItem
            ]}
            onPress={() => handleActionPress(action.id)}
          >
            <MaterialIcons name={action.icon} size={20} color={action.color} />
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.title}
            </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  lastActionItem: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MoreActionsDropdown;
