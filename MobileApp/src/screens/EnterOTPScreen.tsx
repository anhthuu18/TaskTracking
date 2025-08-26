import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput as RNTextInput,
} from 'react-native';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Strings } from '../constants/Strings';
import Toast from '../components/Toast';
import { useToast } from '../hooks';

interface EnterOTPScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
    };
  };
}

const EnterOTPScreen: React.FC<EnterOTPScreenProps> = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  
  const inputRefs = useRef<RNTextInput[]>([]);

  // Timer for resend OTP
  useEffect(() => {
    let interval: number;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      // TODO: Call API to resend OTP
      // const response = await authService.resendOTP(phoneNumber);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Mã OTP mới đã được gửi');
      setResendTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '']);
      
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      showError('Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 4) {
      showError('Vui lòng nhập đầy đủ 4 chữ số OTP');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to verify OTP
      // const response = await authService.verifyOTP(phoneNumber, otpString);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      showSuccess('Xác thực OTP thành công');
      
      // Navigate to reset password screen
      setTimeout(() => {
        navigation.navigate('ResetPassword', { phoneNumber, otp: otpString });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      showError('Mã OTP không đúng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

      {/* Content */}
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/images/enter-otp-illustration.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Nhập OTP</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Nhập mã OTP chúng tôi vừa gửi đến số điện thoại của bạn để bắt đầu đặt lại mật khẩu mới.
          </Text>
        </View>

        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <RNTextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
              placeholder=""
            />
          ))}
        </View>

        {/* Resend OTP Timer */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={isLoading}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Gửi lại OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timerText}>
              Gửi lại OTP trong {formatTime(resendTimer)}s
            </Text>
          )}
        </View>

        {/* Next Button */}
        <TouchableOpacity 
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]} 
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={20} color={Colors.neutral.white} />
              <Text style={[styles.nextButtonText, {marginLeft: 8}]}>Đang xác thực...</Text>
            </View>
          ) : (
            <View style={styles.nextButtonContent}>
              <Text style={styles.nextButtonText}>Tiếp theo</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.neutral.white} />
            </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 40,
  },
  instructions: {
    fontSize: 16,
    color: Colors.neutral.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 30,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.background,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  timerText: {
    color: Colors.neutral.medium,
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.neutral.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EnterOTPScreen;
