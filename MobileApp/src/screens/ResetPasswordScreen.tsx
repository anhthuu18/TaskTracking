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
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
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
    // Mark all fields as touched to show validation errors
    setTouched({ newPassword: true, confirmPassword: true });
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Call API to reset password
      const response = await fetch('http://10.0.2.2:3000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          newPassword: newPassword,
          confirmPassword: confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('Đặt lại mật khẩu thành công!');
        
        // Navigate back to sign in screen after a short delay
        setTimeout(() => {
          navigation.navigate('SignIn');
        }, 1000);
      } else {
        showError(data.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
      
    } catch (error) {
      console.error('Reset password error:', error);
      showError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the specific field on blur
    const newErrors: {[key: string]: string} = {};
    
    if (field === 'newPassword' || touched.newPassword) {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.error || '';
      }
    }
    
    if (field === 'confirmPassword' || touched.confirmPassword) {
      const confirmPasswordValidation = validateConfirmPassword(newPassword, confirmPassword);
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.error || '';
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (touched.newPassword || touched.confirmPassword) {
      const newErrors: {[key: string]: string} = {};
      
      // Validate new password
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.error || '';
      } else {
        newErrors.newPassword = '';
      }
      
      // Re-validate confirm password if it's been touched
      if (touched.confirmPassword) {
        const confirmPasswordValidation = validateConfirmPassword(value, confirmPassword);
        if (!confirmPasswordValidation.isValid) {
          newErrors.confirmPassword = confirmPasswordValidation.error || '';
        } else {
          newErrors.confirmPassword = '';
        }
      }
      
      setErrors(prev => ({ ...prev, ...newErrors }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const confirmPasswordValidation = validateConfirmPassword(newPassword, value);
      if (!confirmPasswordValidation.isValid) {
        setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordValidation.error || '' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
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
                onBlur={() => handleFieldBlur('newPassword')}
                secureTextEntry={!showNewPassword}
                style={[
                  styles.textInput,
                  errors.newPassword && touched.newPassword && styles.textInputError
                ]}
                outlineStyle={[
                  styles.inputOutline,
                  errors.newPassword && touched.newPassword && styles.inputOutlineError
                ]}
                theme={{
                  colors: {
                    primary: errors.newPassword && touched.newPassword ? Colors.semantic.error : Colors.primary,
                    outline: errors.newPassword && touched.newPassword ? Colors.semantic.error : Colors.neutral.light,
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
              {errors.newPassword && touched.newPassword && (
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
                onBlur={() => handleFieldBlur('confirmPassword')}
                secureTextEntry={!showConfirmPassword}
                style={[
                  styles.textInput,
                  errors.confirmPassword && touched.confirmPassword && styles.textInputError
                ]}
                outlineStyle={[
                  styles.inputOutline,
                  errors.confirmPassword && touched.confirmPassword && styles.inputOutlineError
                ]}
                theme={{
                  colors: {
                    primary: errors.confirmPassword && touched.confirmPassword ? Colors.semantic.error : Colors.primary,
                    outline: errors.confirmPassword && touched.confirmPassword ? Colors.semantic.error : Colors.neutral.light,
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
              {errors.confirmPassword && touched.confirmPassword && (
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
