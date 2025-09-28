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
import { workspaceService } from '../services';
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
  type: 'group' | 'personal';
  color: string;
}

const WorkspaceSelectionScreen: React.FC<WorkspaceSelectionScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'group' | 'personal'>('group');
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
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
        // Convert backend workspace data to UI format
        const uiWorkspaces: WorkspaceUI[] = response.data.map((workspace, index) => ({
          id: workspace.id.toString(),
          name: workspace.workspaceName,
          memberCount: workspace.memberCount || 1,
          type: workspace.workspaceType === WorkspaceType.GROUP ? 'group' : 'personal',
          color: workspaceColors[index % workspaceColors.length],
        }));
        
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

  const screenWidth = Dimensions.get('window').width;
  const blockWidth = (screenWidth - 60) / 2; // 20px padding on each side + 20px gap between blocks

  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = workspace.type === selectedTab;
    return matchesSearch && matchesTab;
  });

  // Show only first 4 workspaces unless "View more" is clicked
  const displayedWorkspaces = showAllWorkspaces ? filteredWorkspaces : filteredWorkspaces.slice(0, 4);
  const hasMoreWorkspaces = filteredWorkspaces.length > 4;

  const handleWorkspaceSelect = (workspace: WorkspaceUI) => {
    // Navigate to WorkspaceDashboard with selected workspace
    console.log('🔍 Selecting workspace:', workspace);
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

  const handleViewMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllWorkspaces(true);
  };

  const handleAcceptInvitation = (notificationId: number) => {
    console.log('Accepting invitation:', notificationId);
    // Refresh workspace list and notification count
    loadWorkspaces();
    loadNotificationCount();
  };

  const handleDeclineInvitation = (notificationId: number) => {
    console.log('Declining invitation:', notificationId);
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
        {workspace.type === 'group' && (
          <Text style={styles.memberCount}>
            Member: {workspace.memberCount}
          </Text>
        )}
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
          ) : showAllWorkspaces ? (
            <ScrollView 
              style={styles.workspacesScrollContainerExpanded}
              showsVerticalScrollIndicator={true}
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
          ) : (
            <>
              <View style={styles.workspacesContainer}>
                {displayedWorkspaces.map((workspace, index) => renderWorkspaceBlock(workspace, index))}
              </View>
              
              {/* View More */}
              {hasMoreWorkspaces && (
                <View style={styles.viewMoreContainer}>
                  <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewMore}>
                    <Text style={styles.viewMoreText}>View more</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
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
    marginBottom: 20,
  },
  workspaceBlock: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 140,
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
  personalInfo: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  viewMoreContainer: {
    alignItems: 'flex-end',
    paddingVertical: 16,
  },
  viewMoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewMoreText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
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
  workspacesScrollContainer: {
    maxHeight: 280, // Fixed height for 4 workspaces (2 rows)
  },
  workspacesScrollContainerExpanded: {
    maxHeight: 320, // Fixed height equivalent to 4 workspaces (2 rows)
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
