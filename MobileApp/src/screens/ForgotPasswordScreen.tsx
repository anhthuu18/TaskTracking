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
import { ScreenLayout } from '../constants/Dimensions';
import { Strings } from '../constants/Strings';
import { validatePhoneNumber } from '../utils/validation';
import Toast from '../components/Toast';
import { useToast } from '../hooks';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleSendOTP = async () => {
    // Validate phone number
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Call API to send OTP
      const response = await fetch('http://10.0.2.2:3000/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess('OTP đã được gửi đến số điện thoại của bạn!');
        
        // Navigate to OTP screen after a short delay
        setTimeout(() => {
          navigation.navigate('EnterOTP', { phoneNumber });
        }, 1000);
      } else {
        showError(data.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
      }
      
    } catch (error) {
      console.error('Send OTP error:', error);
      showError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    if (error) {
      setError('');
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
                source={require('../assets/images/forgot-password.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{Strings.forgotPasswordTitle}</Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructions}>
                {Strings.forgotPasswordInstructions}
              </Text>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                placeholder={Strings.enterPhoneNumber}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                style={[
                  styles.textInput,
                  error && styles.textInputError
                ]}
                outlineStyle={[
                  styles.inputOutline,
                  error && styles.inputOutlineError
                ]}
                theme={{
                  colors: {
                    primary: error ? Colors.semantic.error : Colors.primary,
                    outline: error ? Colors.semantic.error : Colors.neutral.light,
                    onSurface: Colors.text,
                  },
                }}
                left={
                  <TextInput.Icon 
                    icon={() => <MaterialIcons name="phone" size={20} color={Colors.neutral.medium} />}
                  />
                }
              />
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity 
              style={[styles.sendOTPButton, isLoading && styles.sendOTPButtonDisabled]} 
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <MaterialIcons name="hourglass-empty" size={20} color={Colors.neutral.white} />
                  <Text style={[styles.sendOTPButtonText, {marginLeft: 8}]}>{Strings.sendingOTP}</Text>
                </View>
              ) : (
                <Text style={styles.sendOTPButtonText}>{Strings.sendOTP}</Text>
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
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingTop: ScreenLayout.headerTopSpacing,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
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
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructions: {
    fontSize: 16,
    color: Colors.neutral.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
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
  sendOTPButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendOTPButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sendOTPButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ForgotPasswordScreen;



