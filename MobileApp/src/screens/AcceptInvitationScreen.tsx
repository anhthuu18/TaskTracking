import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { workspaceService } from '../services';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useToastContext } from '../context/ToastContext';

type AcceptInvitationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AcceptInvitation'
>;

type AcceptInvitationScreenRouteProp = RouteProp<
  RootStackParamList,
  'AcceptInvitation'
>;

interface Props {
  navigation: AcceptInvitationScreenNavigationProp;
  route: AcceptInvitationScreenRouteProp;
}

const AcceptInvitationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token } = route.params;
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToastContext();

  useEffect(() => {
    acceptInvitation();
  }, []);

  const acceptInvitation = async () => {
    try {
      setLoading(true);
      const response = await workspaceService.acceptInvitation(token);
      
      if (response.success) {
        setSuccess(true);
        showSuccess('Đã chấp nhận lời mời thành công!');
        // Navigate to workspace after 2 seconds
        setTimeout(() => {
          navigation.navigate('WorkspaceSelection');
        }, 2000);
      } else {
        setError(response.message || 'Không thể chấp nhận lời mời');
        showError(response.message || 'Không thể chấp nhận lời mời');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      const errorMessage = err.message || 'Có lỗi xảy ra khi chấp nhận lời mời';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    acceptInvitation();
  };

  const handleGoBack = () => {
    navigation.navigate('WorkspaceSelection');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.title}>Đang xử lý lời mời...</Text>
            <Text style={styles.subtitle}>Vui lòng đợi trong giây lát</Text>
          </>
        ) : success ? (
          <>
            <MaterialIcons 
              name="check-circle" 
              size={64} 
              color={Colors.semantic.success} 
            />
            <Text style={styles.title}>Thành công!</Text>
            <Text style={styles.subtitle}>
              Bạn đã được thêm vào workspace. Đang chuyển hướng...
            </Text>
          </>
        ) : error ? (
          <>
            <MaterialIcons 
              name="error" 
              size={64} 
              color={Colors.semantic.error} 
            />
            <Text style={styles.title}>Có lỗi xảy ra</Text>
            <Text style={styles.subtitle}>{error}</Text>
            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <MaterialIcons name="refresh" size={16} color={Colors.surface} />
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Text style={styles.backButtonText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    marginTop: 32,
    gap: 12,
    width: '100%',
    maxWidth: 200,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: Colors.neutral.light,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.neutral.dark,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AcceptInvitationScreen;
