import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { workspaceService } from '../services/workspaceService';
import { useToastContext } from '../context/ToastContext';

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: number;
  onInviteSent?: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  onClose,
  workspaceId,
  onInviteSent,
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToastContext();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async () => {
    // Trim email before validation
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      showError('Please enter an email address');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      showError('Please enter a valid email address');
      return;
    }

    // Check if message is too long
    if (message.trim().length > 500) {
      showError('Message must not exceed 500 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await workspaceService.inviteMember(
        workspaceId, 
        trimmedEmail, 
        'member', 
        message.trim() || undefined
      );
      
      if (response.success) {
        showSuccess(`Invitation sent to ${trimmedEmail}`);
        setEmail('');
        setMessage('');
        onInviteSent?.();
        onClose();
      } else {
        showError(response.message || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      const errorMsg = error?.message || 'Failed to send invitation. Please try again.';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
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
            <Text style={styles.title}>Mời thành viên</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Nhập email của thành viên"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tin nhắn (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                value={message}
                onChangeText={setMessage}
                placeholder="Thêm tin nhắn cá nhân..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {message.length}/500 characters
              </Text>
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Lời mời sẽ được gửi qua email và có hiệu lực trong 7 ngày.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
              onPress={handleInvite}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.neutral.white} />
              ) : (
                <>
                  <MaterialIcons name="send" size={16} color={Colors.neutral.white} />
                  <Text style={styles.inviteButtonText}>Gửi lời mời</Text>
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
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.neutral.light + '20',
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 8,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inviteButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.white,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default InviteMemberModal;
