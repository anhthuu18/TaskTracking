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
  Modal,
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
  description?: string;
  memberCount: number;
  projectCount: number;
  type: 'group' | 'personal';
  color: string;
  createdAt?: Date;
  lastUsedAt?: Date;
}

const WorkspaceSelectionScreen: React.FC<WorkspaceSelectionScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'group' | 'personal' | 'total'>('total');
  // Removed showAllWorkspaces state - no longer needed
  const [workspaces, setWorkspaces] = useState<WorkspaceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [username, setUsername] = useState('User');
  const [lastUsedWorkspaceId, setLastUsedWorkspaceId] = useState<string | null>(null);
  const [showSearchOptionsModal, setShowSearchOptionsModal] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    searchInProjects: false,
    searchInTasks: false,
  });
  const [workspaceProjects, setWorkspaceProjects] = useState<{[workspaceId: string]: any[]}>({});
  const [workspaceTasks, setWorkspaceTasks] = useState<{[workspaceId: string]: any[]}>({});
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Color palette for workspace types
  const getWorkspaceColor = (type: 'group' | 'personal') => {
    return type === 'group' ? Colors.semantic.success : Colors.semantic.info;
  };

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
    loadLastUsedWorkspace();
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

  const loadLastUsedWorkspace = async () => {
    try {
      const lastUsed = await AsyncStorage.getItem('lastUsedWorkspaceId');
      if (lastUsed) {
        setLastUsedWorkspaceId(lastUsed);
      }
    } catch (error) {
      console.error('Error loading last used workspace:', error);
    }
  };

  const saveLastUsedWorkspace = async (workspaceId: string) => {
    try {
      await AsyncStorage.setItem('lastUsedWorkspaceId', workspaceId);
      setLastUsedWorkspaceId(workspaceId);
    } catch (error) {
      console.error('Error saving last used workspace:', error);
    }
  };

  const saveLastUsedTimestamp = async (workspaceId: string, timestamp: Date) => {
    try {
      await AsyncStorage.setItem(`lastUsedTimestamp_${workspaceId}`, timestamp.toISOString());
    } catch (error) {
      console.error('Error saving last used timestamp:', error);
    }
  };

  const loadLastUsedTimestamp = async (workspaceId: string): Promise<Date | undefined> => {
    try {
      const timestamp = await AsyncStorage.getItem(`lastUsedTimestamp_${workspaceId}`);
      return timestamp ? new Date(timestamp) : undefined;
    } catch (error) {
      console.error('Error loading last used timestamp:', error);
      return undefined;
    }
  };

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated before making the request
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        // User is not authenticated, set empty workspaces
        console.log('No auth token found, skipping workspace load');
        setWorkspaces([]);
        return;
      }

      console.log('Loading workspaces...');
      const response = await workspaceService.getAllWorkspaces();
      console.log('Workspace API response:', { success: response.success, dataLength: response.data?.length, message: response.message });
      
      if (response.success) {
        // Check if data exists and is an array
        if (!response.data || !Array.isArray(response.data)) {
          console.warn('Workspace API returned success but data is not an array:', response);
          setWorkspaces([]);
          return;
        }

        if (response.data.length === 0) {
          console.log('No workspaces found in response');
          setWorkspaces([]);
          return;
        }

        // Convert backend workspace data to UI format and load project counts
        const uiWorkspaces: WorkspaceUI[] = await Promise.all(
          response.data.map(async (workspace, index) => {
            const projectCount = await loadProjectCount(workspace.id);
            const lastUsedTimestamp = await loadLastUsedTimestamp(workspace.id.toString());
            const workspaceType = (workspace.workspaceType === WorkspaceType.GROUP ? 'group' : 'personal') as 'group' | 'personal';
            
            return {
              id: workspace.id.toString(),
              name: workspace.workspaceName,
              description: workspace.description || `A ${workspace.workspaceType === WorkspaceType.GROUP ? 'group' : 'personal'} workspace for collaboration and project management`,
              memberCount: workspace.memberCount || 1,
              projectCount: projectCount,
              type: workspaceType,
              color: getWorkspaceColor(workspaceType),
              createdAt: workspace.dateCreated ? new Date(workspace.dateCreated) : undefined,
              lastUsedAt: lastUsedTimestamp,
            };
          })
        );
        
        console.log('Successfully loaded workspaces:', uiWorkspaces.length);
        setWorkspaces(uiWorkspaces);
      } else {
        console.error('Workspace API returned error:', response.message);
        Alert.alert('Error', response.message || 'Failed to load workspaces');
        setWorkspaces([]);
      }
    } catch (error: any) {
      // Handle authentication errors with logging
      const errorMessage = error?.message || '';
      console.error('Error loading workspaces - Full error:', error);
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        // User is not authenticated or token expired
        console.warn('Unauthorized error - token may be expired or invalid');
        
        // Clear invalid token
        try {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        } catch (e) {
          console.error('Error clearing tokens:', e);
        }
        
        setWorkspaces([]);
        
        // Show user-friendly message and navigate to login
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('SignIn');
              },
            },
          ]
        );
      } else {
        // Other errors should be logged and shown to user
        console.error('Error loading workspaces:', error);
        Alert.alert('Error', error.message || 'Failed to load workspaces');
        setWorkspaces([]);
      }
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
      // Check if user is authenticated before making the request
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        // User is not authenticated, skip loading notifications
        setNotificationCount(0);
        return;
      }

      const response = await notificationService.getUserNotifications();
      if (response.success) {
        setNotificationCount(response.data.length);
      }
    } catch (error: any) {
      // Only log error if it's not an authentication issue
      // "Unauthorized" errors are expected when user is not logged in
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        // User is not authenticated or token expired, silently handle
        setNotificationCount(0);
      } else {
        // Other errors should be logged
        console.error('Error loading notification count:', error);
      }
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
  const cardWidth = screenWidth - 40; // 20px padding on each side

  // Function to get search sources for a workspace
  const getSearchSources = (workspace: WorkspaceUI, query: string): string[] => {
    const sources: string[] = [];
    
    // Check if name matches (always enabled)
    if (workspace.name.toLowerCase().includes(query)) {
      sources.push('Name');
    }

    // Search in projects if enabled
    if (searchOptions.searchInProjects && workspaceProjects[workspace.id]) {
      const projectMatches = workspaceProjects[workspace.id].some(project => 
        project.projectName?.toLowerCase().includes(query)
      );
      if (projectMatches) {
        sources.push('Projects');
      }
    }

    // Search in tasks if enabled
    if (searchOptions.searchInTasks && workspaceTasks[workspace.id]) {
      const taskMatches = workspaceTasks[workspace.id].some(task => 
        task.taskName?.toLowerCase().includes(query)
      );
      if (taskMatches) {
        sources.push('Tasks');
      }
    }

    return sources;
  };

  // Function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <Text>
        {parts.map((part, index) => {
          if (part.toLowerCase() === query.toLowerCase()) {
            return (
              <Text key={index} style={styles.highlightedText}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  const filteredWorkspaces = workspaces
    .filter(workspace => {
      if (!searchQuery) {
        const matchesTab = selectedTab === 'total' || workspace.type === selectedTab;
        return matchesTab;
      }

      const query = searchQuery.toLowerCase();
      
      // Get all search sources for this workspace
      const searchSources = getSearchSources(workspace, query);
      
      // Workspace matches if it has any search sources
      const matchesSearch = searchSources.length > 0;
      
      const matchesTab = selectedTab === 'total' || workspace.type === selectedTab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      // First priority: Sort by last used time - most recent first
      if (a.lastUsedAt && b.lastUsedAt) {
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      }
      if (a.lastUsedAt && !b.lastUsedAt) return -1;
      if (!a.lastUsedAt && b.lastUsedAt) return 1;
      
      // Second priority: Last used workspace ID
      if (lastUsedWorkspaceId) {
        if (a.id === lastUsedWorkspaceId && b.id !== lastUsedWorkspaceId) return -1;
        if (b.id === lastUsedWorkspaceId && a.id !== lastUsedWorkspaceId) return 1;
      }
      
      // Third priority: Sort by creation date - most recent first
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Fallback to id comparison if createdAt is not available (higher id = more recent)
      return parseInt(b.id) - parseInt(a.id);
    });

  // Always show all workspaces with scroll if more than 4
  const hasMoreWorkspaces = filteredWorkspaces.length > 4;

  const handleWorkspaceSelect = async (workspace: WorkspaceUI) => {
    try {
      // Clear any existing last used workspace first
      await AsyncStorage.removeItem('lastUsedWorkspaceId');
      
      // Save as last used workspace with timestamp
      const now = new Date();
      await saveLastUsedWorkspace(workspace.id);
      await saveLastUsedTimestamp(workspace.id, now);
      
      // Navigate to Main with selected workspace
      navigation.navigate('Main', { 
        workspace: {
          id: parseInt(workspace.id), // Convert to number for backend
          workspaceName: workspace.name,
          memberCount: workspace.memberCount,
          workspaceType: workspace.type === 'group' ? 'GROUP' : 'PERSONAL',
          description: workspace.description,
          dateCreated: workspace.createdAt,
          dateModified: new Date(),
          userId: 1, // Mock user ID
          userRole: 'OWNER' as any,
        }
      });
    } catch (error) {
      console.error('Error selecting workspace:', error);
      // Still navigate even if saving fails
      navigation.navigate('Main', { 
        workspace: {
          id: parseInt(workspace.id),
          workspaceName: workspace.name,
          memberCount: workspace.memberCount,
          workspaceType: workspace.type === 'group' ? 'GROUP' : 'PERSONAL',
          description: workspace.description,
          dateCreated: workspace.createdAt,
          dateModified: new Date(),
          userId: 1, // Mock user ID
          userRole: 'OWNER' as any,
        }
      });
    }
  };

  // Function to get workspace details for navigation
  const getWorkspaceDetails = async (workspaceId: string) => {
    try {
      const response = await workspaceService.getAllWorkspaces();
      if (response.success) {
        const workspace = response.data.find(w => w.id.toString() === workspaceId);
        if (workspace) {
          return {
            id: workspace.id,
            name: workspace.workspaceName,
            memberCount: workspace.memberCount || 1,
            type: workspace.workspaceType === 'GROUP' ? 'group' : 'personal'
          };
        }
      }
    } catch (error) {
      console.error('Error fetching workspace details:', error);
    }
    return null;
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

  const handleSearchOptionChange = (option: keyof typeof searchOptions) => {
    setSearchOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleApplySearchOptions = async () => {
    setShowSearchOptionsModal(false);
    
    // Load project and task data if search options are enabled
    if (searchOptions.searchInProjects || searchOptions.searchInTasks) {
      await loadWorkspaceData();
    }
    
    // Trigger search with new options
    // The search will be automatically triggered by the searchQuery state change
  };

  // Load workspace data when search query changes and options are enabled
  useEffect(() => {
    if (searchQuery && (searchOptions.searchInProjects || searchOptions.searchInTasks)) {
      loadWorkspaceData();
    }
  }, [searchQuery, searchOptions.searchInProjects, searchOptions.searchInTasks]);

  const loadWorkspaceData = async () => {
    try {
      const projectsData: {[workspaceId: string]: any[]} = {};
      const tasksData: {[workspaceId: string]: any[]} = {};

      for (const workspace of workspaces) {
        const workspaceId = workspace.id;
        
        // Load projects if search in projects is enabled
        if (searchOptions.searchInProjects) {
          try {
            const projectsResponse = await projectService.getProjectsByWorkspace(parseInt(workspaceId));
            if (projectsResponse.success) {
              projectsData[workspaceId] = projectsResponse.data;
            }
          } catch (error) {
            console.error(`Error loading projects for workspace ${workspaceId}:`, error);
          }
        }

        // Load tasks if search in tasks is enabled
        if (searchOptions.searchInTasks) {
          try {
            // Note: You'll need to implement a task service method to get tasks by workspace
            // For now, we'll use an empty array
            tasksData[workspaceId] = [];
          } catch (error) {
            console.error(`Error loading tasks for workspace ${workspaceId}:`, error);
          }
        }
      }

      setWorkspaceProjects(projectsData);
      setWorkspaceTasks(tasksData);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    }
  };

  const handleResetSearchOptions = () => {
    setSearchOptions({
      searchInProjects: false,
      searchInTasks: false,
    });
  };

  const renderSearchOptionsModal = () => {
    return (
      <Modal
        visible={showSearchOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSearchOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchOptionsModal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name="tune" size={24} color={Colors.primary} />
                <Text style={styles.modalTitle}>Advanced Search</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSearchOptionsModal(false)}
              >
                <MaterialIcons name="close" size={24} color={Colors.neutral.medium} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalDescription}>
                Choose additional search options (Name search is always enabled):
              </Text>

              {/* Search Options */}
              <View style={styles.searchOptionsList}>
                <TouchableOpacity
                  style={styles.searchOptionItem}
                  onPress={() => handleSearchOptionChange('searchInProjects')}
                >
                  <View style={styles.searchOptionLeft}>
                    <MaterialIcons name="folder" size={20} color={Colors.primary} />
                    <Text style={styles.searchOptionTitle}>Projects</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    searchOptions.searchInProjects && styles.checkboxChecked
                  ]}>
                    {searchOptions.searchInProjects && (
                      <MaterialIcons name="check" size={16} color={Colors.neutral.white} />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.searchOptionItem}
                  onPress={() => handleSearchOptionChange('searchInTasks')}
                >
                  <View style={styles.searchOptionLeft}>
                    <MaterialIcons name="assignment" size={20} color={Colors.primary} />
                    <Text style={styles.searchOptionTitle}>Tasks</Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    searchOptions.searchInTasks && styles.checkboxChecked
                  ]}>
                    {searchOptions.searchInTasks && (
                      <MaterialIcons name="check" size={16} color={Colors.neutral.white} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={handleResetSearchOptions}
              >
                <Text style={styles.modalButtonSecondaryText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleApplySearchOptions}
              >
                <Text style={styles.modalButtonPrimaryText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderWorkspaceCard = (workspace: WorkspaceUI, index: number) => {
    return (
      <TouchableOpacity
        key={workspace.id}
        style={[
          styles.workspaceCard,
          { 
            width: cardWidth,
            backgroundColor: Colors.neutral.white,
            borderColor: workspace.color + '20',
            borderLeftColor: workspace.color,
            borderLeftWidth: 4,
          }
        ]}
        onPress={() => handleWorkspaceSelect(workspace)}
        activeOpacity={0.7}
      >
        {/* Header with Name and Type Chip */}
        <View style={styles.cardHeader}>
          <View style={styles.workspaceNameContainer}>
            {searchQuery ? (
              <Text style={styles.workspaceName} numberOfLines={1}>
                {highlightText(workspace.name, searchQuery)}
              </Text>
            ) : (
              <Text style={styles.workspaceName} numberOfLines={1}>
                {workspace.name}
              </Text>
            )}
            {/* Search source indicator for name */}
            {searchQuery && workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
              <View style={styles.searchSourceBadge}>
                <MaterialIcons name="label" size={12} color={Colors.primary} />
                <Text style={styles.searchSourceBadgeText}>Name</Text>
              </View>
            )}
          </View>
          <View style={[styles.workspaceTypeBadge, { backgroundColor: workspace.color + '15' }]}>
            <Text style={[styles.workspaceTypeText, { color: workspace.color }]}>
              {workspace.type === 'group' ? 'Group' : 'Personal'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.cardDescription}>
          {searchQuery ? (
            <Text style={styles.workspaceDescription} numberOfLines={2}>
              {highlightText(workspace.description || '', searchQuery)}
            </Text>
          ) : (
            <Text style={styles.workspaceDescription} numberOfLines={2}>
              {workspace.description}
            </Text>
          )}
        </View>

        {/* Search Sources Section */}
        {searchQuery && (() => {
          const sources = getSearchSources(workspace, searchQuery);
          return sources.length > 0 ? (
            <View style={styles.searchSourcesSection}>
              <View style={styles.searchSourcesHeader}>
                <MaterialIcons name="search" size={16} color={Colors.primary} />
                <Text style={styles.searchSourcesTitle}>Found in:</Text>
              </View>
              <View style={styles.searchSourcesList}>
                {sources.map((source, index) => (
                  <View key={index} style={styles.searchSourceItem}>
                    <MaterialIcons 
                      name={source === 'Name' ? 'label' : source === 'Projects' ? 'folder' : 'assignment'} 
                      size={14} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.searchSourceItemText}>{source}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null;
        })()}

        {/* Stats Section */}
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="people" size={16} color={Colors.neutral.medium} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{workspace.memberCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <MaterialIcons name="folder" size={16} color={Colors.neutral.medium} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{workspace.projectCount}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
          </View>
        </View>
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

        {/* Search Button */}
        {!showSearchBar && (
          <View style={styles.searchButtonContainer}>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => setShowSearchBar(true)}
            >
              <MaterialIcons name="search" size={20} color={Colors.neutral.medium} />
              <Text style={styles.searchButtonText}>Search workspaces...</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.searchOptionsToggleButton}
              onPress={() => setShowSearchOptionsModal(true)}
            >
              <MaterialIcons name="tune" size={20} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar */}
        {showSearchBar && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBarRow}>
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
                right={
                  <TouchableOpacity 
                    style={styles.searchCloseButton}
                    onPress={() => {
                      setShowSearchBar(false);
                      setSearchQuery('');
                    }}
                  >
                    <MaterialIcons name="close" size={20} color={Colors.neutral.medium} />
                  </TouchableOpacity>
                }
              />
              <TouchableOpacity 
                style={[
                  styles.searchOptionsToggleButton,
                  (searchOptions.searchInProjects || searchOptions.searchInTasks) && styles.searchOptionsToggleButtonActive
                ]}
                onPress={() => setShowSearchOptionsModal(true)}
              >
                <MaterialIcons 
                  name="tune" 
                  size={20} 
                  color={(searchOptions.searchInProjects || searchOptions.searchInTasks) ? Colors.primary : Colors.neutral.medium} 
                />
                {(searchOptions.searchInProjects || searchOptions.searchInTasks) && (
                  <View style={styles.searchOptionsIndicator}>
                    <MaterialIcons name="filter-list" size={8} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {(searchOptions.searchInProjects || searchOptions.searchInTasks) && (
              <Text style={styles.searchOptionsHint}>
                Search includes: Name (default), {searchOptions.searchInProjects && 'Projects'} {searchOptions.searchInProjects && searchOptions.searchInTasks && ', '} {searchOptions.searchInTasks && 'Tasks'}
              </Text>
            )}
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'total' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('total')}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'total' && styles.activeTabText
            ]}>
              Total
            </Text>
            {selectedTab === 'total' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
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
          ) : filteredWorkspaces.length === 0 && searchQuery ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                No workspaces match "{searchQuery}". Try different keywords or check your search options.
              </Text>
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchButtonText}>Clear search</Text>
              </TouchableOpacity>
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
                  {filteredWorkspaces.map((workspace, index) => renderWorkspaceCard(workspace, index))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Create Workspace Button - Hidden when searching */}
      {!searchQuery && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateWorkspace}
          >
            <Text style={styles.createButtonText}>Create workspace</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification Modal */}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onAcceptInvitation={handleAcceptInvitation}
        onDeclineInvitation={handleDeclineInvitation}
      />

      {/* Search Options Modal */}
      {renderSearchOptionsModal()}
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
    paddingBottom: 8,
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
  searchButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    minWidth: '100%',
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.neutral.light + '50',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  searchButtonText: {
    fontSize: 16,
    color: Colors.neutral.medium,
    marginLeft: 12,
  },
  searchOptionsToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.neutral.light + '50',
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  searchOptionsToggleButtonActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  searchContainer: {
    marginBottom: 30,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  searchRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchOptionsButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchCloseButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  searchOptionsButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  searchOptionsIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchOptionsHint: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 8,
    marginLeft: 4,
  },
  searchInput: {
    backgroundColor: Colors.background,
    fontSize: 16,
    flex: 1,
  },
  searchOutline: {
    borderRadius: 12,
    borderWidth: 1,
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
    flexDirection: 'column',
    paddingBottom: 20,
  },
  workspaceCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Colors.neutral.white,
    borderColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDescription: {
    marginBottom: 12,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },
  workspaceTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  workspaceTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workspaceDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
  },
  highlightedText: {
    backgroundColor: Colors.primary + '20',
    color: Colors.primary,
    fontWeight: '600',
  },
  searchSourcesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
  },
  searchSourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchSourcesTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchSourcesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  searchSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary + '10',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  searchSourceItemText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.neutral.medium,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.neutral.light,
    marginHorizontal: 16,
  },
  workspaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspaceNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  workspaceName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 24,
  },
  searchSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: Colors.primary + '15',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  searchSourceBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  // Removed viewMore and viewLess styles - no longer needed
  footer: {
    paddingHorizontal: ScreenLayout.contentHorizontalPadding,
    paddingBottom: ScreenLayout.footerBottomSpacing,
    paddingTop: 10,
  },
  createButton: {
    borderColor: Colors.neutral.light,
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
    flex: 1,
    flexDirection: 'column',
  },
  workspacesScrollContainer: {
    flex: 1,
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
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignSelf: 'center',
  },
  clearSearchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  // Search Options Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchOptionsModal: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: Colors.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchExample: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  searchExampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  searchExampleText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
  },
  searchOptionsList: {
    gap: 12,
  },
  searchOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.neutral.light + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  searchOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  searchOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.neutral.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.medium,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.medium,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
});

export default WorkspaceSelectionScreen;
