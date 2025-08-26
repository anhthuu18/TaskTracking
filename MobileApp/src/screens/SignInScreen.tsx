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
import { validateSignInForm, FormErrors } from '../utils/validation';
import { authService } from '../services';
import { SignInCredentials, AuthResponse } from '../types/Auth';
import Toast from '../components/Toast';
import { useToast } from '../hooks';

interface SignInScreenProps {
  navigation: any;
  route?: any;
  onBackToOnboarding?: () => void;
  onLoginSuccess?: () => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation, onBackToOnboarding, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Helper function to safely require Google image only
  const getGoogleImage = () => {
    try {
      return require('../assets/images/google-logo.png');
    } catch (error) {
      console.warn('❌ Google image not found:', error);
      return null;
    }
  };

  const handleSignIn = async () => {
    // Validate form before submission
    const validation = validateSignInForm(username, password);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ username: true, password: true });
      return;
    }

    // Clear errors if validation passes
    setErrors({});
    setIsLoading(true);
    
    try {
      // Call authentication API
      const credentials: SignInCredentials = { username, password };
      const response: AuthResponse = await authService.signIn(credentials);
      
      if (response.success && response.data) {
        // Success - save user data and navigate
        console.log('✅ Đăng nhập thành công:', response.data.user);
        
        // TODO: Save token to AsyncStorage for persistence
        // await AsyncStorage.setItem('authToken', response.data.token);
        // await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Show success toast
        showSuccess('Đăng nhập thành công!');
        
        // Set authenticated state after a short delay for toast to show
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 1000);
      } else {
        // API returned error
        console.log('❌ Đăng nhập thất bại:', response.message);
        showError(response.message);
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      showError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the specific field on blur
    const validation = validateSignInForm(username, password);
    setErrors(validation.errors);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      const validation = validateSignInForm(value, password);
      setErrors(prev => ({ ...prev, username: validation.errors.username }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      const validation = validateSignInForm(username, value);
      setErrors(prev => ({ ...prev, password: validation.errors.password }));
    }
  };

  const handleSocialLogin = (platform: string) => {
    // Handle social login
    console.log(`Login with ${platform}`);
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    navigation.navigate('ForgotPassword');
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleBack = () => {
    // Navigate back to Onboarding screen (last slide)
    if (onBackToOnboarding) {
      onBackToOnboarding();
    } else {
      // Fallback if callback not provided
      navigation.goBack();
    }
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
            <Text style={styles.title}>{Strings.signIn}</Text>
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

        {/* Forgot Password */}
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>{Strings.forgotPassword}</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity 
          style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={20} color={Colors.neutral.white} />
              <Text style={[styles.signInButtonText, {marginLeft: 8}]}>Đang đăng nhập...</Text>
            </View>
          ) : (
            <Text style={styles.signInButtonText}>{Strings.signIn}</Text>
          )}
        </TouchableOpacity>

        {/* Social Login */}
        <Text style={styles.orText}>{Strings.orSignInWith}</Text>
        
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
          {Strings.dontHaveAccount}{' '}
          <Text style={styles.linkText} onPress={navigateToSignUp}>
            {Strings.signUp}
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
    width: 44,
    height: 44,
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: Colors.neutral.medium,
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  signInButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signInButtonDisabled: {
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

export default SignInScreen;
