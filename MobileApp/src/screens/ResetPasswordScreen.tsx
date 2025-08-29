import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { validatePassword, validateConfirmPassword } from '../utils/validation';
import Toast from '../components/Toast';
import { useToast } from '../hooks';

interface ResetPasswordScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
      otp: string;
    };
  };
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const { phoneNumber, otp } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.error || '';
    }

    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmPasswordValidation.isValid) {
      newErrors.confirmPassword = confirmPasswordValidation.error || '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to reset password
      // const response = await authService.resetPassword(phoneNumber, otp, newPassword);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Đặt lại mật khẩu thành công!');
      
      // Navigate back to sign in screen after a short delay
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 1000);
      
    } catch (error) {
      console.error('Reset password error:', error);
      showError('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={require('../assets/images/reset-password.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Đặt lại mật khẩu mới</Text>
            </View>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                secureTextEntry={!showNewPassword}
                style={[
                  styles.textInput,
                  errors.newPassword && styles.textInputError
                ]}
                outlineStyle={[
                  styles.inputOutline,
                  errors.newPassword && styles.inputOutlineError
                ]}
                theme={{
                  colors: {
                    primary: errors.newPassword ? Colors.semantic.error : Colors.primary,
                    outline: errors.newPassword ? Colors.semantic.error : Colors.neutral.light,
                    onSurface: Colors.text,
                  },
                }}
                left={
                  <TextInput.Icon 
                    icon={() => <MaterialIcons name="lock" size={20} color={Colors.neutral.medium} />}
                  />
                }
                right={
                  <TextInput.Icon 
                    icon={() => (
                      <MaterialIcons 
                        name={showNewPassword ? "visibility-off" : "visibility"} 
                        size={20} 
                        color={Colors.neutral.medium} 
                      />
                    )}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  />
                }
              />
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                style={[
                  styles.textInput,
                  errors.confirmPassword && styles.textInputError
                ]}
                outlineStyle={[
                  styles.inputOutline,
                  errors.confirmPassword && styles.inputOutlineError
                ]}
                theme={{
                  colors: {
                    primary: errors.confirmPassword ? Colors.semantic.error : Colors.primary,
                    outline: errors.confirmPassword ? Colors.semantic.error : Colors.neutral.light,
                    onSurface: Colors.text,
                  },
                }}
                left={
                  <TextInput.Icon 
                    icon={() => <MaterialIcons name="lock" size={20} color={Colors.neutral.medium} />}
                  />
                }
                right={
                  <TextInput.Icon 
                    icon={() => (
                      <MaterialIcons 
                        name={showConfirmPassword ? "visibility-off" : "visibility"} 
                        size={20} 
                        color={Colors.neutral.medium} 
                      />
                    )}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Save Changes Button */}
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
              onPress={handleSaveChanges}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <MaterialIcons name="hourglass-empty" size={20} color={Colors.neutral.white} />
                  <Text style={[styles.saveButtonText, {marginLeft: 8}]}>Đang lưu...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toast Notification */}
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={hideToast}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustration: {
    width: 240,
    height: 240,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: Colors.background,
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  textInputError: {
    backgroundColor: Colors.background,
  },
  inputOutlineError: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.semantic.error,
  },
  errorText: {
    color: Colors.semantic.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ResetPasswordScreen;
