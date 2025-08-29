import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { TextInput } from 'react-native-paper';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Strings } from '../constants/Strings';
import { validateSignUpForm, FormErrors } from '../utils/validation';
import { authService } from '../services';
import { SignUpCredentials, AuthResponse } from '../types/Auth';
import Toast from '../components/Toast';
import { useToast } from '../hooks';

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Helper function to safely require Google image only
  const getGoogleImage = () => {
    try {
      return require('../assets/images/google-logo.png');
         } catch (error) {
       return null;
     }
  };

  const handleSignUp = async () => {
    // Validate form before submission
    const validation = validateSignUpForm(username, password, confirmPassword);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ username: true, password: true, confirmPassword: true });
      return;
    }

    // Clear errors if validation passes
    setErrors({});
    setIsLoading(true);
    
    try {
      // Call authentication API
      const signUpData: SignUpCredentials = { 
        username, 
        password, 
        confirmPassword,
        email: `${username}@example.com`, // Auto-generate email for demo
        fullName: username // Use username as fullName for demo
      };
      const response: AuthResponse = await authService.signUp(signUpData);
      
      if (response.success && response.data) {
        // Success - show success message and navigate to signin

        
        // Show success toast
        showSuccess(`Tài khoản ${response.data.user.username} đã được tạo thành công!`);
        
        // Navigate to SignIn after a short delay for toast to show
        setTimeout(() => {
          navigation.navigate('SignIn');
        }, 1500);
      } else {
        // API returned error

        showError(response.message);
      }
    } catch (error) {
      console.error('❌ Sign up error:', error);
      showError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the specific field on blur
    const validation = validateSignUpForm(username, password, confirmPassword);
    setErrors(validation.errors);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      const validation = validateSignUpForm(value, password, confirmPassword);
      setErrors(prev => ({ ...prev, username: validation.errors.username }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password || touched.confirmPassword) {
      const validation = validateSignUpForm(username, value, confirmPassword);
      setErrors(prev => ({ 
        ...prev, 
        password: validation.errors.password,
        confirmPassword: validation.errors.confirmPassword 
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const validation = validateSignUpForm(username, password, value);
      setErrors(prev => ({ ...prev, confirmPassword: validation.errors.confirmPassword }));
    }
  };

  const handleSocialLogin = (platform: string) => {
    // Handle social login
    
  };

  const navigateToSignIn = () => {
    navigation.navigate('SignIn');
  };

  const handleBack = () => {
    // Navigate back to SignIn screen
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{Strings.signUp}</Text>
            <View style={styles.orangeDot} />
          </View>
        </View>
        {/* Username Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder={Strings.username}
            value={username}
            onChangeText={handleUsernameChange}
            onBlur={() => handleFieldBlur('username')}
            style={[
              styles.textInput,
              errors.username && touched.username && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.username && touched.username && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.username && touched.username ? Colors.semantic.error : Colors.primary,
                outline: errors.username && touched.username ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="person" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          {errors.username && touched.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder={Strings.password}
            value={password}
            onChangeText={handlePasswordChange}
            onBlur={() => handleFieldBlur('password')}
            secureTextEntry={!showPassword}
            style={[
              styles.textInput,
              errors.password && touched.password && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.password && touched.password && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.password && touched.password ? Colors.semantic.error : Colors.primary,
                outline: errors.password && touched.password ? Colors.semantic.error : Colors.neutral.light,
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
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={20} 
                    color={Colors.neutral.medium} 
                  />
                )}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />
          {errors.password && touched.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder={Strings.confirmPassword}
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

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]} 
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={20} color={Colors.neutral.white} />
              <Text style={[styles.signUpButtonText, {marginLeft: 8}]}>Đang đăng ký...</Text>
            </View>
          ) : (
            <Text style={styles.signUpButtonText}>{Strings.signUp}</Text>
          )}
        </TouchableOpacity>

        {/* Social Login */}
        <Text style={styles.orText}>{Strings.orSignUpWith}</Text>
        
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('facebook')}
          >
            <MaterialIcons name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleSocialLogin('google')}
          >
            {getGoogleImage() ? (
              <Image 
                source={getGoogleImage()} 
                style={styles.googleImage}
                resizeMode="contain"
              />
            ) : (
              <MaterialIcons name="search" size={24} color="#4285F4" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {Strings.alreadyHaveAccount}{' '}
          <Text style={styles.linkText} onPress={navigateToSignIn}>
            {Strings.signIn}
          </Text>
        </Text>
      </View>

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  titleSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: Colors.background,
    fontSize: 16,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  signUpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  signUpButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orText: {
    textAlign: 'center',
    color: Colors.neutral.medium,
    fontSize: 14,
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleImage: {
    width: 21,
    height: 21,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
  },

  footerText: {
    color: Colors.neutral.medium,
    fontSize: 14,
  },
  linkText: {
    color: Colors.accent,
    fontWeight: '600',
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
});

export default SignUpScreen;
