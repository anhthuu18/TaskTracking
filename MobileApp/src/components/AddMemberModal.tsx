import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { workspaceService } from '../services';
import { InviteMemberRequest } from '../types/Workspace';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: number;
  onMemberAdded?: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  visible,
  onClose,
  workspaceId,
  onMemberAdded,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInviteMember = async () => {
    if (!emailOrUsername.trim()) {
      Alert.alert('Error', 'Please enter an email or username');
      return;
    }

    try {
      setLoading(true);
      
      // Determine if input is email or username
      const isEmail = emailOrUsername.includes('@');
      const inviteData: InviteMemberRequest = isEmail 
        ? { email: emailOrUsername.trim() }
        : { username: emailOrUsername.trim() };

      const response = await workspaceService.inviteMemberToWorkspace(workspaceId, inviteData);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          `Invitation sent successfully! ${isEmail ? 'Email' : 'App notification'} has been sent to ${emailOrUsername}`
        );
        setEmailOrUsername('');
        onMemberAdded?.();
        onClose();
      } else {
        Alert.alert('Error', response.message || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error inviting member:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmailOrUsername('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Member</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.label}>Email or Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email or username"
              placeholderTextColor={Colors.neutral.medium}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={styles.hint}>
              Enter an email address to send email invitation, or username for app notification
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.inviteButton]}
              onPress={handleInviteMember}
              disabled={loading || !emailOrUsername.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <>
                  <MaterialIcons name="send" size={16} color={Colors.surface} />
                  <Text style={styles.inviteButtonText}>Send Invite</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 2,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.neutral.medium + '60',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.neutral.dark,
    backgroundColor: Colors.surface,
  },
  hint: {
    fontSize: 11,
    color: Colors.neutral.medium,
    marginTop: 6,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: Colors.neutral.light,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  inviteButton: {
    backgroundColor: Colors.primary,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.surface,
  },
});

export default AddMemberModal;


