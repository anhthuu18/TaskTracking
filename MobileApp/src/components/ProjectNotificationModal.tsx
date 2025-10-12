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

interface ProjectNotification {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'MEMBER_ADDED' | 'DEADLINE_REMINDER' | 'PROJECT_UPDATE';
  createdAt: Date;
  isRead: boolean;
  senderName?: string;
}

interface ProjectNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
}

const ProjectNotificationModal: React.FC<ProjectNotificationModalProps> = ({
  visible,
  onClose,
  projectId,
  projectName,
}) => {
  const [notifications, setNotifications] = useState<ProjectNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [projectId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await notificationService.getProjectNotifications(projectId);
      // setNotifications(response.data);
      
      // Mock data for testing
      const mockNotifications: ProjectNotification[] = [
        {
          id: 1,
          projectId: projectId,
          projectName: projectName,
          title: 'New Task Assigned',
          message: 'You have been assigned to "API Integration Testing" task',
          type: 'TASK_ASSIGNED',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: false,
          senderName: 'John Doe',
        },
        {
          id: 2,
          projectId: projectId,
          projectName: projectName,
          title: 'Deadline Reminder',
          message: 'Task "Mobile App UI Design" is due tomorrow',
          type: 'DEADLINE_REMINDER',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          isRead: false,
        },
        {
          id: 3,
          projectId: projectId,
          projectName: projectName,
          title: 'Member Added',
          message: 'Sarah Wilson has been added to the project',
          type: 'MEMBER_ADDED',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isRead: true,
          senderName: 'Admin',
        },
        {
          id: 4,
          projectId: projectId,
          projectName: projectName,
          title: 'Project Update',
          message: 'Project description has been updated',
          type: 'PROJECT_UPDATE',
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          isRead: true,
          senderName: 'Project Manager',
        },
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // TODO: Replace with actual API call
      // await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'assignment';
      case 'MEMBER_ADDED':
        return 'person-add';
      case 'DEADLINE_REMINDER':
        return 'schedule';
      case 'PROJECT_UPDATE':
        return 'update';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return Colors.primary;
      case 'MEMBER_ADDED':
        return Colors.success;
      case 'DEADLINE_REMINDER':
        return Colors.warning;
      case 'PROJECT_UPDATE':
        return Colors.info;
      default:
        return Colors.neutral.medium;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
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
            <Text style={styles.title}>Project Notifications</Text>
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
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>You'll see project updates here</Text>
              </View>
            ) : (
              <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={styles.notificationCard}
                    onPress={() => markAsRead(notification.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationInfo}>
                        <View style={styles.notificationIcon}>
                          <MaterialIcons 
                            name={getNotificationIcon(notification.type)} 
                            size={20} 
                            color={getNotificationColor(notification.type)} 
                          />
                        </View>
                        <View style={styles.notificationDetails}>
                          <Text style={styles.notificationTitle}>
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationMessage}>
                            {notification.message}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.notificationFooter}>
                      <Text style={styles.timeText}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                      {notification.senderName && (
                        <Text style={styles.senderText}>
                          by {notification.senderName}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
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
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.neutral.dark,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  senderText: {
    fontSize: 11,
    color: Colors.neutral.medium,
    alignSelf: 'flex-end',
  },
});

export default ProjectNotificationModal;

