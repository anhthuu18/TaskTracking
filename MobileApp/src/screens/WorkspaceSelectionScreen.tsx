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
} from 'react-native';
import { TextInput } from 'react-native-paper';
// @ts-ignore
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ScreenLayout, ButtonStyles, Typography } from '../constants/Dimensions';

interface WorkspaceSelectionScreenProps {
  navigation: any;
  route?: any;
}

interface Workspace {
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

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'WSP name',
      memberCount: 2,
      type: 'group',
      color: Colors.primary
    },
    {
      id: '2',
      name: 'WSP name',
      memberCount: 2,
      type: 'group',
      color: Colors.overlay.pink
    },
    {
      id: '3',
      name: 'WSP name',
      memberCount: 2,
      type: 'group',
      color: Colors.overlay.purple
    },
    {
      id: '4',
      name: 'WSP name',
      memberCount: 2,
      type: 'group',
      color: Colors.accent
    },
    {
      id: '5',
      name: 'WSP name',
      memberCount: 2,
      type: 'group',
      color: Colors.semantic.success
    },
    {
      id: '6',
      name: 'WSP name',
      memberCount: 2,
      type: 'group',
      color: Colors.overlay.coral
    },
    {
      id: '7',
      name: 'Personal Tasks',
      memberCount: 1,
      type: 'personal',
      color: Colors.priority.low
    },
    {
      id: '8',
      name: 'My Projects',
      memberCount: 1,
      type: 'personal',
      color: Colors.priority.medium
    }
  ]);

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

  const handleWorkspaceSelect = (workspace: Workspace) => {
    // Navigate to TaskList with selected workspace
    navigation.navigate('TaskList', { workspace });
  };

  const handleCreateWorkspace = () => {
    navigation.navigate('CreateWorkspace');
  };

  const handleViewMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllWorkspaces(true);
  };


  const renderWorkspaceBlock = (workspace: Workspace, index: number) => {
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
          <Text style={styles.welcomeText}>Hi, Anhthuu18!</Text>
          <Text style={styles.subtitleText}>Choose your workspace</Text>
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
          {showAllWorkspaces ? (
            <ScrollView 
              style={styles.workspacesScrollContainerExpanded}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContentContainer}
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
});

export default WorkspaceSelectionScreen;
