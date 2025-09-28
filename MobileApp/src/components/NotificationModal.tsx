import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { notificationService } from '../services/notificationService';

interface Notification {
  id: number;
  workspaceId: number;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onAcceptInvitation: (notificationId: number) => void;
  onDeclineInvitation: (notificationId: number) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onAcceptInvitation,
  onDeclineInvitation,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for testing
  const mockNotifications: Notification[] = [
    {
      id: 1,
      workspaceId: 2,
      workspaceName: 'Team Project Alpha',
      inviterName: 'John Doe',
      inviterEmail: 'john@example.com',
      message: 'Welcome to our team! We\'d love to have you join our project.',
      createdAt: new Date('2024-01-20'),
      expiresAt: new Date('2024-01-27'),
      status: 'PENDING',
    },
    {
      id: 2,
      workspaceId: 3,
      workspaceName: 'Design Team',
      inviterName: 'Jane Smith',
      inviterEmail: 'jane@example.com',
      message: 'We need your design expertise for our new project.',
      createdAt: new Date('2024-01-22'),
      expiresAt: new Date('2024-01-29'),
      status: 'PENDING',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications();
      
      if (response.success) {
        // Transform API data to match our interface
        const transformedNotifications: Notification[] = response.data.map(notification => ({
          id: notification.id,
          workspaceId: notification.workspaceId,
          workspaceName: notification.workspace.workspaceName,
          inviterName: notification.inviter.username,
          inviterEmail: notification.inviter.email,
          message: notification.message,
          createdAt: new Date(notification.createdAt),
          expiresAt: new Date(notification.expiresAt),
          status: notification.status,
        }));
        setNotifications(transformedNotifications);
      } else {
        console.error('Failed to load notifications:', response.message);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (notificationId: number) => {
    try {
      const response = await notificationService.acceptInvitation(notificationId);
      if (response.success) {
        onAcceptInvitation(notificationId);
        // Remove from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        console.error('Failed to accept invitation:', response.message);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDecline = async (notificationId: number) => {
    try {
      const response = await notificationService.declineInvitation(notificationId);
      if (response.success) {
        onDeclineInvitation(notificationId);
        // Remove from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      } else {
        console.error('Failed to decline invitation:', response.message);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.semantic.warning;
      case 'ACCEPTED':
        return Colors.semantic.success;
      case 'REJECTED':
        return Colors.semantic.error;
      case 'EXPIRED':
        return Colors.neutral.medium;
      default:
        return Colors.neutral.medium;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="notifications-none" size={48} color={Colors.neutral.medium} />
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySubtitle}>You're all caught up!</Text>
              </View>
            ) : (
              <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
                {notifications.map((notification) => (
                  <View key={notification.id} style={styles.notificationCard}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.workspaceInfo}>
                        <View style={styles.workspaceIcon}>
                          <MaterialIcons name="groups" size={20} color={Colors.neutral.white} />
                        </View>
                        <View style={styles.workspaceDetails}>
                          <Text style={styles.workspaceName}>{notification.workspaceName}</Text>
                          <Text style={styles.inviterText}>
                            Invited by {notification.inviterName}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(notification.status) }]}>
                        <Text style={styles.statusText}>{notification.status}</Text>
                      </View>
                    </View>

                    {notification.message && (
                      <Text style={styles.messageText}>{notification.message}</Text>
                    )}

                    <View style={styles.notificationFooter}>
                      <Text style={styles.expiryText}>
                        {formatDate(notification.expiresAt)}
                      </Text>
                      
                      {notification.status === 'PENDING' && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.declineButton]}
                            onPress={() => handleDecline(notification.id)}
                          >
                            <Text style={styles.declineButtonText}>Decline</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAccept(notification.id)}
                          >
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
  notificationsList: {
    flex: 1,
    padding: 20,
  },
  notificationCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workspaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workspaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workspaceDetails: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  inviterText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  messageText: {
    fontSize: 14,
    color: Colors.neutral.dark,
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: Colors.neutral.light,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.white,
  },
});

export default NotificationModal;
