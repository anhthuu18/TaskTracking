import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { WorkspaceMember } from '../types/Workspace';

interface MemberDropdownProps {
  members: WorkspaceMember[];
  selectedMemberIds: string[];
  onMemberSelect: (memberIds: string[]) => void;
  // Legacy props for backward compatibility
  workspaceMembers?: WorkspaceMember[];
  selectedMembers?: string[];
  onMembersChange?: (memberIds: string[]) => void;
}

const MemberDropdown: React.FC<MemberDropdownProps> = ({
  members,
  selectedMemberIds,
  onMemberSelect,
  // Legacy props
  workspaceMembers,
  selectedMembers,
  onMembersChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use new props or fallback to legacy props
  const actualMembers = members || workspaceMembers || [];
  const actualSelectedMembers = selectedMemberIds || selectedMembers || [];
  const actualOnMembersChange = onMemberSelect || onMembersChange || (() => {});

  const toggleMember = (memberId: string) => {
    if (actualSelectedMembers.includes(memberId)) {
      actualOnMembersChange(actualSelectedMembers.filter(id => id !== memberId));
    } else {
      actualOnMembersChange([...actualSelectedMembers, memberId]);
    }
  };

  // Invite-by-email flow removed for simpler dropdown

  const getSelectedMembersDisplay = () => {
    const selectedMemberObjects = actualMembers.filter(member => 
      actualSelectedMembers.includes(String(member.user.id))
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
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownText} numberOfLines={1}>{getSelectedMembersDisplay()}</Text>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          {/* Workspace members list */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Workspace Members</Text>
            <ScrollView style={styles.membersList} nestedScrollEnabled>
              {actualMembers.map((member) => (
                <TouchableOpacity
                  key={String(member.user.id)}
                  style={styles.memberItem}
                  onPress={() => toggleMember(String(member.user.id))}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(member.user.username || member.user.email || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.user.username}</Text>
                      <Text style={styles.memberEmail}>{member.user.email}</Text>
                    </View>
                  </View>
                  <View style={styles.checkbox}>
                    {actualSelectedMembers.includes(String(member.user.id)) && (
                      <MaterialIcons name="check" size={16} color={Colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  dropdownText: {
    flex: 1,
    color: Colors.neutral.medium,
  },
  selectedMembersContainer: {
    flex: 1,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  inviteAvatar: {
    backgroundColor: Colors.accent,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    borderStyle: 'dashed',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    maxHeight: 300,
    zIndex: 1000,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  membersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  inviteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  inviteButton: {
    padding: 8,
  },
  membersList: {
    maxHeight: 150,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  memberEmail: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    padding: 4,
  },
});

export default MemberDropdown;
