import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../constants/Colors';

interface SplashScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      onFinish();
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <LinearGradient
      colors={[Colors.primary, '#8B5CF6', '#A855F7', Colors.accent]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
        translucent={false}
      />
      
      {/* Logo and app name */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image 
            source={require('../../android/app/src/main/res/drawable/app_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>AI Task Tracking</Text>
        <Text style={styles.appSlogan}>Quản lý công việc thông minh</Text>
      </View>
      
      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color="#FFFFFF" 
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Đang khởi động...</Text>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2024 AI Task Tracking</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  appName: {  
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  appSlogan: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 40,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default SplashScreen;
