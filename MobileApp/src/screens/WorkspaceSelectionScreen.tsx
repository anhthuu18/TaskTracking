import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native-paper';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ScreenLayout, ButtonStyles, Typography } from '../constants/Dimensions';
import { workspaceService, projectService } from '../services';
import { Workspace, WorkspaceType } from '../types';
import NotificationModal from '../components/NotificationModal';
import { notificationService } from '../services/notificationService';

interface WorkspaceSelectionScreenProps {
  navigation: any;
  route?: any;
}

interface WorkspaceUI {
  id: string;
  name: string;
  memberCount: number;
  projectCount: number;
  type: 'group' | 'personal';
  color: string;
  createdAt?: Date;
}

const WorkspaceSelectionScreen: React.FC<WorkspaceSelectionScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'group' | 'personal'>('group');
  // Removed showAllWorkspaces state - no longer needed
  const [workspaces, setWorkspaces] = useState<WorkspaceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [username, setUsername] = useState('User');

  // Color palette for workspace icons
  const workspaceColors = [
    Colors.primary,
    Colors.overlay.pink,
    Colors.overlay.purple,
    Colors.accent,
    Colors.semantic.success,
    Colors.overlay.coral,
    Colors.priority.low,
    Colors.priority.medium,
    Colors.warning,
    Colors.semantic.info,
  ];

  // Enable LayoutAnimation on Android (only for old architecture)
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Check if we're using the old architecture before calling this
      try {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
          UIManager.setLayoutAnimationEnabledExperimental(true);
        }
      } catch (error) {
        // Silently ignore in New Architecture
        console.log('LayoutAnimation not available in New Architecture');
      }
    }
  }, []);

  // Load workspaces on component mount
  useEffect(() => {
    loadUsername();
    loadWorkspaces();
    loadNotificationCount();
  }, []);

  // Refresh workspaces when returning from CreateWorkspaceScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we need to refresh (e.g., from CreateWorkspaceScreen)
      if (navigation.getState()?.routes) {
        const currentRoute = navigation.getState().routes[navigation.getState().index];
        if (currentRoute.name === 'WorkspaceSelection') {
          loadWorkspaces();
        }
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadUsername = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUsername(user.username || user.email || 'User');
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await workspaceService.getAllWorkspaces();
      
      if (response.success) {
        // Convert backend workspace data to UI format and load project counts
        const uiWorkspaces: WorkspaceUI[] = await Promise.all(
          response.data.map(async (workspace, index) => {
            const projectCount = await loadProjectCount(workspace.id);
            
            return {
              id: workspace.id.toString(),
              name: workspace.workspaceName,
              memberCount: workspace.memberCount || 1,
              projectCount: projectCount,
              type: (workspace.workspaceType === WorkspaceType.GROUP ? 'group' : 'personal') as 'group' | 'personal',
              color: workspaceColors[index % workspaceColors.length],
              createdAt: workspace.dateCreated ? new Date(workspace.dateCreated) : undefined,
            };
          })
        );
        
        setWorkspaces(uiWorkspaces);
      } else {
        Alert.alert('Error', response.message || 'Failed to load workspaces');
      }
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      Alert.alert('Error', error.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const refreshWorkspaces = async () => {
    try {
      setRefreshing(true);
      await loadWorkspaces();
      await loadNotificationCount();
    } finally {
      setRefreshing(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      if (response.success) {
        setNotificationCount(response.data.length);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const loadProjectCount = async (workspaceId: number): Promise<number> => {
    try {
      const response = await projectService.getProjectsByWorkspace(workspaceId);
      return response.success ? response.data.length : 0;
    } catch (error) {
      console.error(`Error loading project count for workspace ${workspaceId}:`, error);
      return 0;
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const blockWidth = (screenWidth - 60) / 2; // 20px padding on each side + 20px gap between blocks

  const filteredWorkspaces = workspaces
    .filter(workspace => {
      const matchesSearch = workspace.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = workspace.type === selectedTab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      // Sort by creation date - most recent first
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Fallback to id comparison if createdAt is not available (higher id = more recent)
      return parseInt(b.id) - parseInt(a.id);
    });

  // Always show all workspaces with scroll if more than 4
  const hasMoreWorkspaces = filteredWorkspaces.length > 4;

  const handleWorkspaceSelect = (workspace: WorkspaceUI) => {
    // Navigate to WorkspaceDashboard with selected workspace
    
    navigation.navigate('WorkspaceDashboard', { 
      workspace: {
        id: parseInt(workspace.id), // Convert to number for backend
        name: workspace.name,
        memberCount: workspace.memberCount,
        type: workspace.type
      }
    });
  };

  const handleCreateWorkspace = () => {
    navigation.navigate('CreateWorkspace');
  };

  // Removed handleViewMore and handleViewLess - no longer needed

  const handleAcceptInvitation = (notificationId: number) => {
    // Refresh workspace list and notification count
    loadWorkspaces();
    loadNotificationCount();
  };

  const handleDeclineInvitation = (notificationId: number) => {
    // Refresh notification count
    loadNotificationCount();
  };


  const renderWorkspaceBlock = (workspace: WorkspaceUI, index: number) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        key={workspace.id}
        style={[
          styles.workspaceBlock,
          { 
            width: blockWidth,
            marginRight: isEven ? 20 : 0,
            backgroundColor: workspace.color + '15', // Add transparency
            borderColor: workspace.color + '30',
          }
        ]}
        onPress={() => handleWorkspaceSelect(workspace)}
        activeOpacity={0.7}
      >
        <View style={[styles.workspaceIcon, { backgroundColor: workspace.color }]}>
          <MaterialIcons 
            name={workspace.type === 'group' ? 'groups' : 'person'} 
            size={24} 
            color={Colors.neutral.white} 
          />
        </View>
        <Text style={styles.workspaceName} numberOfLines={2}>
          {workspace.name}
        </Text>
        
        <View style={styles.workspaceStats}>
          {workspace.type === 'group' && (
            <Text style={styles.statText}>
              Members: {workspace.memberCount}
            </Text>
          )}
          <Text style={styles.statText}>
            Projects: {workspace.projectCount}
          </Text>
        </View>
        
        {workspace.type === 'personal' && (
          <Text style={styles.personalInfo}>
            Personal workspace
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>Hi, {username}!</Text>
              <Text style={styles.subtitleText}>Choose your workspace</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => setShowNotificationModal(true)}
            >
              <MaterialIcons name="notifications" size={24} color={Colors.neutral.dark} />
              {/* Notification badge */}
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            mode="outlined"
            placeholder="Search workspace..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            outlineStyle={styles.searchOutline}
            theme={{
              colors: {
                primary: Colors.primary,
                outline: Colors.neutral.light,
                onSurface: Colors.text,
              },
            }}
            left={
              <TextInput.Icon 
                icon={() => <MaterialIcons name="search" size={20} color={Colors.neutral.medium} />}
              />
            }
          />
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="tune" size={24} color={Colors.neutral.white} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'group' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('group')}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'group' && styles.activeTabText
            ]}>
              Group
            </Text>
            {selectedTab === 'group' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'personal' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('personal')}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'personal' && styles.activeTabText
            ]}>
              Personal
            </Text>
            {selectedTab === 'personal' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Workspace Blocks Container */}
        <View style={styles.workspaceSection}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading workspaces...</Text>
            </View>
          ) : workspaces.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="folder-open" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No workspaces found</Text>
              <Text style={styles.emptySubtitle}>Create your first workspace to get started</Text>
            </View>
          ) : (
            <View style={styles.workspaceContainerFixed}>
              <ScrollView 
                style={styles.workspacesScrollContainer}
                showsVerticalScrollIndicator={hasMoreWorkspaces}
                contentContainerStyle={styles.scrollContentContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refreshWorkspaces}
                    colors={[Colors.primary]}
                  />
                }
              >
                <View style={styles.workspacesContainer}>
                  {filteredWorkspaces.map((workspace, index) => renderWorkspaceBlock(workspace, index))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Create Workspace Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateWorkspace}
        >
          <Text style={styles.createButtonText}>Create workspace</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
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
    paddingTop: 20,
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
    paddingTop: ScreenLayout.headerTopSpacing,
    paddingBottom: ScreenLayout.contentBottomSpacing,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    paddingTop: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.neutral.medium,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    marginTop: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationBadgeText: {
    color: Colors.neutral.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background,
    fontSize: 16,
  },
  searchOutline: {
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // No background color for active tab
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  workspacesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 20,
    minHeight: 280, // Minimum height for 4 workspaces (2 rows)
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  workspaceBlock: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 140, // Back to minHeight to allow content to fit
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderColor: Colors.neutral.light,
  },
  workspaceIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    fontWeight: '500',
  },
  workspaceStats: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 2,
  },
  personalInfo: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Removed viewMore and viewLess styles - no longer needed
  footer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
    paddingTop: 20,
  },
  createButton: {
    backgroundColor: Colors.primary,
    ...ButtonStyles.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: Colors.primary,
  },
  createButtonText: {
    ...Typography.buttonText,
    color: Colors.neutral.white,
  },
  workspaceSection: {
    flex: 1,
  },
  workspaceContainerFixed: {
    height: 400, // Fixed height to always show 4 workspaces (2 rows)
    flexDirection: 'column',
  },
  workspacesScrollContainer: {
    flex: 1, // Take full available space in fixed container
    maxHeight: 400, // Limit height to show 4 workspaces
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
});

export default WorkspaceSelectionScreen;
