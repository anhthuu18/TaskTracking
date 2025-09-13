import React, { useState, useEffect } from 'react';
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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Colors } from '../constants/Colors';
import { ScreenLayout } from '../constants/Dimensions';
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
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      // Web client ID - phải khớp với google-services.json
      webClientId: '17409044459-ubrnlg83ueqhhcnq7a7bfv8fp2g9jjcq.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true, // Force hiển thị account picker
    });
  }, []);

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
    const validation = validateSignUpForm(username, password, confirmPassword, email, phone);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ username: true, password: true, confirmPassword: true, email: true, phone: true });
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
        email,
        phone,
      };
      const response: AuthResponse = await authService.signUp(signUpData);
      
      if (response.success && response.data) {
        // Success - show success message and navigate to signin

        
          // Show success toast with short duration
          showSuccess(`Tài khoản ${response.data.user.username} đã được tạo thành công!`);
          
          // Navigate to main screen (TaskList) after very short delay
          setTimeout(() => {
            navigation.navigate('TaskList');
          }, 800);
      } else {
        // API returned error

        showError(response.message);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      showError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate the specific field on blur
    const validation = validateSignUpForm(username, password, confirmPassword, email, phone);
    setErrors(validation.errors);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      const validation = validateSignUpForm(value, password, confirmPassword, email, phone);
      setErrors(prev => ({ ...prev, username: validation.errors.username }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password || touched.confirmPassword) {
      const validation = validateSignUpForm(username, value, confirmPassword, email, phone);
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
      const validation = validateSignUpForm(username, password, value, email, phone);
      setErrors(prev => ({ ...prev, confirmPassword: validation.errors.confirmPassword }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      const validation = validateSignUpForm(username, password, confirmPassword, value, phone);
      setErrors(prev => ({ ...prev, email: validation.errors.email }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (touched.phone) {
      const validation = validateSignUpForm(username, password, confirmPassword, email, value);
      setErrors(prev => ({ ...prev, phone: validation.errors.phone }));
    }
  };

  const handleSocialLogin = async (platform: string) => {
    if (platform === 'google') {
      await handleGoogleSignUp();
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign out first to clear cached account and show account picker
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore sign out errors (user might not be signed in)
      }
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      
      
      if (idToken) {
        // Call your backend API with the ID token
        const response: AuthResponse = await authService.signInWithGoogle(idToken);
        
        if (response.success && response.data) {
          // Success - save user data and navigate
          // TODO: Save token to AsyncStorage for persistence
          // await AsyncStorage.setItem('authToken', response.data.token);
          // await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Navigate directly to main screen (TaskList)
          navigation.navigate('TaskList');
        } else {
          showError(response.message || 'Đăng ký Google thất bại');
        }
      }
    } catch (error: any) {
      console.error('Google Sign-Up error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        console.log('User cancelled Google Sign-Up');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        console.log('Google Sign-Up in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        showError('Google Play Services không khả dụng');
      } else {
        // Some other error happened
        showError('Đã xảy ra lỗi khi đăng ký Google. Vui lòng thử lại.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
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

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder={Strings.email}
            value={email}
            onChangeText={handleEmailChange}
            onBlur={() => handleFieldBlur('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[
              styles.textInput,
              errors.email && touched.email && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.email && touched.email && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.email && touched.email ? Colors.semantic.error : Colors.primary,
                outline: errors.email && touched.email ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="email" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          {errors.email && touched.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder={Strings.phone}
            value={phone}
            onChangeText={handlePhoneChange}
            onBlur={() => handleFieldBlur('phone')}
            keyboardType="phone-pad"
            style={[
              styles.textInput,
              errors.phone && touched.phone && styles.textInputError
            ]}
            outlineStyle={[
              styles.inputOutline,
              errors.phone && touched.phone && styles.inputOutlineError
            ]}
            theme={{
              colors: {
                primary: errors.phone && touched.phone ? Colors.semantic.error : Colors.primary,
                outline: errors.phone && touched.phone ? Colors.semantic.error : Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="phone" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          {errors.phone && touched.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
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
            style={[styles.socialButton, isGoogleLoading && styles.socialButtonDisabled]}
            onPress={() => handleSocialLogin('google')}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <MaterialIcons name="hourglass-empty" size={20} color="#4285F4" />
            ) : getGoogleImage() ? (
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
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.safeAreaTopPadding,
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
  socialButtonDisabled: {
    opacity: 0.6,
  },
  googleImage: {
    width: 21,
    height: 21,
  },
  footer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
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
