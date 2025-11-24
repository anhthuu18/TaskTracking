import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { useToastContext } from '../context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { otpService } from '../services/otpService';
import { userService } from '../services/userService';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProfileScreenProps {
  navigation: any;
  onLogout?: () => Promise<void> | void;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  dateCreated?: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, onLogout }) => {
  const { showSuccess, showError } = useToastContext();
  
  // User info
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Change password modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation errors
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const response = await userService.getProfile();

      if (response.success && response.data) {
        const profile = response.data as UserInfo;
        setUserInfo(profile);
        await AsyncStorage.setItem('user', JSON.stringify(profile));
      } else {
        // Fallback to stored user if API fails
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserInfo(user);
        } else {
          showError(response.message || 'Failed to load user information');
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      showError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onLogout) {
                await onLogout();
              } else {
                await AsyncStorage.multiRemove(['authToken', 'user', 'lastUsedWorkspaceId']);
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'SignIn' }],
                  })
                );
              }
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const validateCurrentPassword = (value: string) => {
    if (!value.trim()) {
      setCurrentPasswordError('Current password is required');
      return false;
    }
    setCurrentPasswordError('');
    return true;
  };

  const validateNewPassword = (value: string) => {
    if (!value.trim()) {
      setNewPasswordError('New password is required');
      return false;
    }
    
    const error = validatePassword(value);
    if (error) {
      setNewPasswordError(error);
      return false;
    }
    
    if (value === currentPassword) {
      setNewPasswordError('New password must be different from current password');
      return false;
    }
    
    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value.trim()) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };

  const handleChangePassword = async () => {
    // Clear all errors first
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    // Validate all fields
    const isCurrentValid = validateCurrentPassword(currentPassword);
    const isNewValid = validateNewPassword(newPassword);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isCurrentValid || !isNewValid || !isConfirmValid) {
      return;
    }

    try {
      setPasswordLoading(true);
      
      const response = await otpService.changePassword({
        currentPassword,
        newPassword,
      });
      
      if (response.success) {
        // Success - close modal and show toast
        resetPasswordModal();
        showSuccess('Password changed successfully');
      } else {
        // Show error inline in the modal
        const errorMsg = response.message || 'Failed to change password';
        
        // Check if it's a current password error
        if (errorMsg.toLowerCase().includes('current password') || 
            errorMsg.toLowerCase().includes('incorrect') ||
            errorMsg.toLowerCase().includes('wrong')) {
          setCurrentPasswordError(errorMsg);
        } else if (errorMsg.toLowerCase().includes('new password')) {
          setNewPasswordError(errorMsg);
        } else {
          // Generic error - show on current password field as it's most likely
          setCurrentPasswordError(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Network or other errors - show inline
      const errorMsg = error.message || 'Network error. Please try again.';
      setCurrentPasswordError(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPasswordModal = () => {
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  const renderPasswordInput = () => (
    <View style={styles.modalContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.modalLabel}>Current Password *</Text>
        <View style={[
          styles.passwordInputContainer,
          currentPasswordError ? styles.passwordInputError : null
        ]}>
          <TextInput
            style={styles.passwordInput}
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              if (currentPasswordError) {
                validateCurrentPassword(value);
              }
            }}
            onBlur={() => validateCurrentPassword(currentPassword)}
            placeholder="Enter current password"
            placeholderTextColor={Colors.neutral.medium}
            secureTextEntry={!showCurrentPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={showCurrentPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.neutral.medium}
            />
          </TouchableOpacity>
        </View>
        {currentPasswordError ? (
          <Text style={styles.errorText}>{currentPasswordError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.modalLabel}>New Password *</Text>
        <View style={[
          styles.passwordInputContainer,
          newPasswordError ? styles.passwordInputError : null
        ]}>
          <TextInput
            style={styles.passwordInput}
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              if (newPasswordError) {
                validateNewPassword(value);
              }
              // Revalidate confirm password if it's already filled
              if (confirmPassword && confirmPasswordError) {
                validateConfirmPassword(confirmPassword);
              }
            }}
            onBlur={() => validateNewPassword(newPassword)}
            placeholder="Enter new password"
            placeholderTextColor={Colors.neutral.medium}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={showNewPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.neutral.medium}
            />
          </TouchableOpacity>
        </View>
        {newPasswordError ? (
          <Text style={styles.errorText}>{newPasswordError}</Text>
        ) : (
          <Text style={styles.passwordHint}>
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.modalLabel}>Confirm New Password *</Text>
        <View style={[
          styles.passwordInputContainer,
          confirmPasswordError ? styles.passwordInputError : null
        ]}>
          <TextInput
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (confirmPasswordError) {
                validateConfirmPassword(value);
              }
            }}
            onBlur={() => validateConfirmPassword(confirmPassword)}
            placeholder="Confirm new password"
            placeholderTextColor={Colors.neutral.medium}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <MaterialIcons
              name={showConfirmPassword ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.neutral.medium}
            />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? (
          <Text style={styles.errorText}>{confirmPasswordError}</Text>
        ) : null}
      </View>
    </View>
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar backgroundColor={Colors.neutral.white} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="account-circle" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{userInfo?.fullName || userInfo?.username}</Text>
          <Text style={styles.userEmail}>{userInfo?.email}</Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="person" size={20} color={Colors.neutral.medium} />
                <Text style={styles.infoLabel}>Username</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo?.username}</Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="email" size={20} color={Colors.neutral.medium} />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{userInfo?.email}</Text>
            </View>

            {userInfo?.phone && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabelContainer}>
                  <MaterialIcons name="phone" size={20} color={Colors.neutral.medium} />
                  <Text style={styles.infoLabel}>Phone</Text>
                </View>
                <Text style={styles.infoValue}>{userInfo.phone}</Text>
              </View>
            )}

            <View style={[styles.infoItem, styles.lastInfoItem]}>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="calendar-today" size={20} color={Colors.neutral.medium} />
                <Text style={styles.infoLabel}>Member Since</Text>
              </View>
              <Text style={styles.infoValue}>
                {userInfo?.dateCreated
                  ? new Date(userInfo.dateCreated).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowChangePasswordModal(true)}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
                <MaterialIcons name="lock" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Change Password</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.neutral.medium} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color={Colors.semantic.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="fade"
        onRequestClose={resetPasswordModal}
      >
        <View style={styles.modalOverlay}>
           <View style={styles.modal}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Change Password</Text>
               <TouchableOpacity
                 onPress={resetPasswordModal}
                 style={styles.closeButton}
               >
                 <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
               </TouchableOpacity>
             </View>

             {renderPasswordInput()}

             <View style={styles.modalActions}>
               <TouchableOpacity
                 style={styles.modalCancelButton}
                 onPress={resetPasswordModal}
                 disabled={passwordLoading}
               >
                 <Text style={styles.modalCancelText}>Cancel</Text>
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.modalSaveButton, passwordLoading && styles.modalButtonDisabled]}
                 onPress={handleChangePassword}
                 disabled={passwordLoading}
               >
                 {passwordLoading ? (
                   <ActivityIndicator size="small" color={Colors.neutral.white} />
                 ) : (
                   <Text style={styles.modalSaveText}>Change Password</Text>
                 )}
               </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light + '40',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  userInfoCard: {
    backgroundColor: Colors.neutral.white,
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.semantic.error,
    backgroundColor: Colors.semantic.error + '10',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.semantic.error,
  },
  // Modal styles
  modalOverlay: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
    backgroundColor: Colors.neutral.light + '20',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light + '20',
  },
  passwordInputError: {
    borderColor: Colors.semantic.error,
    borderWidth: 2,
    backgroundColor: Colors.semantic.error + '10',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  eyeIcon: {
    padding: 12,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.semantic.error,
    marginTop: 4,
    fontWeight: '500',
  },
  otpInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.white,
  },
});

export default ProfileScreen;

