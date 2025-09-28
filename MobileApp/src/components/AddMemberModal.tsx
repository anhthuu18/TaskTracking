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
import { useToastContext } from '../context/ToastContext';

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
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToastContext();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInviteMember = async () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    try {
      setLoading(true);
      
      const inviteData: InviteMemberRequest = {
        email: email.trim(),
        inviteType: 'EMAIL',
        message: message.trim() || undefined,
      };

      const response = await workspaceService.inviteMemberToWorkspace(workspaceId, inviteData);
      
      if (response.success) {
        setEmail('');
        setMessage('');
        onMemberAdded?.();
        // Close modal first, then show success toast
        onClose();
        setTimeout(() => {
          showSuccess(`Đã gửi lời mời đến ${email}`);
        }, 100);
      } else {
        onClose();
        setTimeout(() => {
          showError(response.message || 'Không thể gửi lời mời');
        }, 100);
      }
    } catch (error: any) {
      // Close modal first to ensure toast is visible
      onClose();
      
      // Show appropriate toast message
      setTimeout(() => {
        if (error.message && error.message.includes('active invitation')) {
          showWarning('Email này đã có lời mời đang chờ xử lý. Vui lòng đợi lời mời hết hạn trước khi gửi lại.');
        } else {
          showError(error.message || 'Có lỗi xảy ra khi gửi lời mời');
        }
      }, 100);
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
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email của thành viên"
              placeholderTextColor={Colors.neutral.medium}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            
            <Text style={styles.label}>Tin nhắn (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Thêm tin nhắn cá nhân..."
              placeholderTextColor={Colors.neutral.medium}
              value={message}
              onChangeText={setMessage}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <Text style={styles.hint}>
              Lời mời sẽ được gửi qua email và có hiệu lực trong 7 ngày.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.inviteButton]}
              onPress={handleInviteMember}
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <>
                  <MaterialIcons name="send" size={16} color={Colors.surface} />
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
    marginTop: 12,
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
  messageInput: {
    minHeight: 60,
    textAlignVertical: 'top',
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


