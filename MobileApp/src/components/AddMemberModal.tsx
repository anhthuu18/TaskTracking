import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { WorkspaceMember, MemberRole } from '../types/Workspace';
import { ProjectMember, ProjectMemberRole } from '../types/Project';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMember: (memberId: number, role: ProjectMemberRole) => void;
  workspaceMembers: WorkspaceMember[];
  projectMembers: ProjectMember[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  visible,
  onClose,
  onAddMember,
  workspaceMembers,
  projectMembers,
}) => {
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>(ProjectMemberRole.MEMBER);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Helper: check if a workspace member is already in the project
  const isInProject = (userId: number) => projectMembers?.some(pm => pm.userId === userId) || false;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: ProjectMemberRole) => {
    switch (role) {
      case ProjectMemberRole.ADMIN:
        return Colors.primary;
      case ProjectMemberRole.MEMBER:
        return Colors.warning;
      default:
        return Colors.neutral.medium;
    }
  };

  const handleAddMember = () => {
    // Always render the button; enable only when a member is selected
    if (!selectedMember) return;

    onAddMember(selectedMember.userId, selectedRole);
    setSelectedMember(null);
    setSelectedRole(ProjectMemberRole.MEMBER);
    onClose();
  };

  const handleClose = () => {
    setSelectedMember(null);
    setSelectedRole(ProjectMemberRole.MEMBER);
    setShowMemberDropdown(false);
    setShowRoleDropdown(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mời thành viên</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>

          {/* Member Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Thành viên *</Text>
            <TouchableOpacity
              style={styles.memberDropdown}
              onPress={() => setShowMemberDropdown(!showMemberDropdown)}
            >
              <View style={styles.memberDropdownContent}>
                {selectedMember ? (
                  <>
                    <View style={styles.memberAvatar}>
                      {selectedMember.user.avatar ? (
                        <Image 
                          source={{ uri: selectedMember.user.avatar }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {getInitials(selectedMember.user.name || selectedMember.user.username)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {selectedMember.user.name || selectedMember.user.username}
                      </Text>
                      <Text style={styles.memberEmail}>
                        {selectedMember.user.email}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.placeholderText}>Chọn thành viên từ workspace</Text>
                )}
              </View>
              <MaterialIcons 
                name={showMemberDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color={Colors.neutral.medium} 
              />
            </TouchableOpacity>

            {showMemberDropdown && (
              <View style={styles.memberDropdownMenu}>
                <FlatList
                  data={workspaceMembers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => {
                    const disabled = isInProject(item.userId);
                    return (
                      <TouchableOpacity
                        style={[styles.memberItem, disabled && { opacity: 0.5 }]}
                        disabled={disabled}
                        onPress={() => {
                          if (disabled) return;
                          setSelectedMember(item);
                          setShowMemberDropdown(false);
                        }}
                      >
                        <View style={styles.memberAvatar}>
                          {item.user.avatar ? (
                            <Image 
                              source={{ uri: item.user.avatar }} 
                              style={styles.avatarImage}
                            />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarText}>
                                {getInitials(item.user.name || item.user.username)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={[styles.memberName, disabled && { color: Colors.neutral.medium }]} numberOfLines={1} ellipsizeMode="tail">
                            {item.user.name || item.user.username}
                          </Text>
                          <Text style={[styles.memberEmail, disabled && { color: Colors.neutral.medium }]} numberOfLines={1} ellipsizeMode="tail">
                            {item.user.email}
                          </Text>
                        </View>
                        
                      </TouchableOpacity>
                    );
                  }}
                  style={styles.memberList}
                />
              </View>
            )}
          </View>

          {/* Role Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Vai trò *</Text>
            <TouchableOpacity
              style={styles.roleDropdown}
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <View style={styles.roleDropdownContent}>
                <View style={[
                  styles.roleIndicator,
                  { backgroundColor: getRoleColor(selectedRole) }
                ]} />
                <Text style={styles.roleDropdownText}>
                  {selectedRole === ProjectMemberRole.ADMIN ? 'Admin' : 'Member'}
                </Text>
              </View>
              <MaterialIcons 
                name={showRoleDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color={Colors.neutral.medium} 
              />
            </TouchableOpacity>

            {showRoleDropdown && (
              <View style={styles.roleDropdownMenu}>
                <TouchableOpacity
                  style={styles.roleDropdownItem}
                  onPress={() => {
                    setSelectedRole(ProjectMemberRole.ADMIN);
                    setShowRoleDropdown(false);
                  }}
                >
                  <View style={[styles.roleIndicator, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.roleDropdownItemText}>Admin</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.roleDropdownItem}
                  onPress={() => {
                    setSelectedRole(ProjectMemberRole.MEMBER);
                    setShowRoleDropdown(false);
                  }}
                >
                  <View style={[styles.roleIndicator, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.roleDropdownItemText}>Member</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, !selectedMember && styles.sendButtonDisabled]}
              onPress={handleAddMember}
              disabled={!selectedMember}
            >
              <MaterialIcons name="notifications" size={20} color={Colors.surface} />
              <Text style={styles.sendButtonText}>Gửi thông báo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 6,
  },
  memberDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  memberDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 1,
  },
  memberEmail: {
    fontSize: 13,
    color: Colors.neutral.medium,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  memberDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
    maxHeight: 200,
  },
  memberList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  roleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  roleDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleDropdownText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  roleDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  roleDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  roleDropdownItemText: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    color: Colors.neutral.medium,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    gap: 6,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.primary + '80',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.surface,
  },
  sendButtonTextDisabled: {
    color: Colors.neutral.dark,
  },
  addedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.neutral.medium,
    marginLeft: 8,
  },
  addedTagText: {
    color: Colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AddMemberModal;