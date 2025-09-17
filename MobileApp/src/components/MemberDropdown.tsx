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
import { WorkspaceMember } from '../types/Project';

interface MemberDropdownProps {
  members: WorkspaceMember[];
  selectedMemberIds: string[];
  onMemberSelect: (memberIds: string[]) => void;
  // Legacy props for backward compatibility
  workspaceMembers?: WorkspaceMember[];
  selectedMembers?: string[];
  onMembersChange?: (memberIds: string[]) => void;
  inviteEmails?: string[];
  onInviteEmailsChange?: (emails: string[]) => void;
}

const MemberDropdown: React.FC<MemberDropdownProps> = ({
  members,
  selectedMemberIds,
  onMemberSelect,
  // Legacy props
  workspaceMembers,
  selectedMembers,
  onMembersChange,
  inviteEmails = [],
  onInviteEmailsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  // Use new props or fallback to legacy props
  const actualMembers = members || workspaceMembers || [];
  const actualSelectedMembers = selectedMemberIds || selectedMembers || [];
  const actualOnMembersChange = onMemberSelect || onMembersChange || (() => {});
  const actualInviteEmails = inviteEmails || [];
  const actualOnInviteEmailsChange = onInviteEmailsChange || (() => {});

  const toggleMember = (memberId: string) => {
    if (actualSelectedMembers.includes(memberId)) {
      actualOnMembersChange(actualSelectedMembers.filter(id => id !== memberId));
    } else {
      actualOnMembersChange([...actualSelectedMembers, memberId]);
    }
  };

  const handleInviteEmail = () => {
    const email = inviteEmail.trim().toLowerCase();
    
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Check if email already exists in workspace members
    const existingMember = actualMembers.find(member => 
      member.email.toLowerCase() === email
    );
    
    if (existingMember) {
      Alert.alert('Member Exists', 'This user is already a member of the workspace');
      return;
    }

    // Check if email already in invite list
    if (actualInviteEmails.includes(email)) {
      Alert.alert('Already Invited', 'This email has already been added to the invite list');
      return;
    }

    actualOnInviteEmailsChange([...actualInviteEmails, email]);
    setInviteEmail('');
  };

  const removeInviteEmail = (email: string) => {
    actualOnInviteEmailsChange(actualInviteEmails.filter(e => e !== email));
  };

  const getSelectedMembersDisplay = () => {
    const selectedMemberObjects = actualMembers.filter(member => 
      actualSelectedMembers.includes(member.id)
    );
    
    const totalSelected = selectedMemberObjects.length + actualInviteEmails.length;
    
    if (totalSelected === 0) {
      return 'Select members';
    }
    
    if (totalSelected <= 3) {
      const names = [
        ...selectedMemberObjects.map(m => m.username),
        ...actualInviteEmails.map(e => e.split('@')[0])
      ];
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
        <View style={styles.selectedMembersContainer}>
          {/* Avatar display for selected members */}
          <View style={styles.avatarContainer}>
            {actualMembers
              .filter(member => actualSelectedMembers.includes(member.id))
              .slice(0, 3)
              .map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.avatar,
                    { marginLeft: index > 0 ? -8 : 0 }
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {member.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
            {actualInviteEmails.slice(0, 3 - actualSelectedMembers.length).map((email, index) => (
              <View
                key={email}
                style={[
                  styles.avatar,
                  styles.inviteAvatar,
                  { marginLeft: (actualSelectedMembers.length + index) > 0 ? -8 : 0 }
                ]}
              >
                <Text style={styles.avatarText}>
                  {email.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton}>
              <MaterialIcons name="add" size={16} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>
        </View>
        <MaterialIcons 
          name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={24} 
          color={Colors.neutral.medium} 
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          {/* Invite by email section */}
          <View style={styles.inviteSection}>
            <Text style={styles.sectionTitle}>Invite by email</Text>
            <View style={styles.inviteInputContainer}>
              <TextInput
                style={styles.inviteInput}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="Enter email address"
                placeholderTextColor={Colors.neutral.medium}
                keyboardType="email-address"
                autoCapitalize="none"
                onSubmitEditing={handleInviteEmail}
              />
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleInviteEmail}
              >
                <MaterialIcons name="send" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Invited emails list */}
          {actualInviteEmails.length > 0 && (
            <View style={styles.invitedSection}>
              <Text style={styles.sectionTitle}>Invited</Text>
              {actualInviteEmails.map((email) => (
                <View key={email} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <View style={[styles.avatar, styles.inviteAvatar]}>
                      <Text style={styles.avatarText}>
                        {email.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{email.split('@')[0]}</Text>
                      <Text style={styles.memberEmail}>{email}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeInviteEmail(email)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="close" size={20} color={Colors.neutral.medium} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Workspace members list */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Workspace Members</Text>
            <ScrollView style={styles.membersList} nestedScrollEnabled>
              {actualMembers.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => toggleMember(member.id)}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {member.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.username}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                  </View>
                  <View style={styles.checkbox}>
                    {actualSelectedMembers.includes(member.id) && (
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
    borderColor: Colors.neutral.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
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
    borderColor: Colors.neutral.light,
    maxHeight: 300,
    zIndex: 1000,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inviteSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  invitedSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
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
