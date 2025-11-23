import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface Member {
  id: string;
  name: string;
  avatar?: string;
}

interface MemberSortDropdownProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (memberId: string | null) => void;
  members: Member[];
  selectedMember: string | null;
}

const MemberSortDropdown: React.FC<MemberSortDropdownProps> = ({
  visible,
  onClose,
  onSelect,
  members,
  selectedMember,
}) => {
  if (!visible) return null;

  const handleSelect = (memberId: string | null) => {
    onSelect(memberId);
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
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => handleSelect(null)}
        >
          <MaterialIcons 
            name="group" 
            size={20} 
            color={selectedMember === null ? Colors.primary : Colors.neutral.medium} 
          />
          <Text style={[
            styles.optionText, 
            selectedMember === null && styles.selectedText
          ]}>
            All Members
          </Text>
          {selectedMember === null && (
            <MaterialIcons name="check" size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
        
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.optionItem}
            onPress={() => handleSelect(member.id)}
          >
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>
                {(member.name || member.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[
              styles.optionText,
              selectedMember === member.id && styles.selectedText
            ]}>
              {member.name}
            </Text>
            {selectedMember === member.id && (
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
    left: 36,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 160,
    maxHeight: 200,
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
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.surface,
  },
});

export default MemberSortDropdown;
