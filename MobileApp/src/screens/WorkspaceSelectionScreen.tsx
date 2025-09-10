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
      name: 'Design Changes',
      memberCount: 2,
      type: 'group',
      color: '#6366F1'
    },
    {
      id: '2',
      name: 'Marketing Campaign',
      memberCount: 5,
      type: 'group',
      color: '#8B5CF6'
    },
    {
      id: '3',
      name: 'Development Team',
      memberCount: 8,
      type: 'group',
      color: '#06B6D4'
    },
    {
      id: '4',
      name: 'Product Design',
      memberCount: 3,
      type: 'group',
      color: '#EF4444'
    },
    {
      id: '5',
      name: 'Sales Team',
      memberCount: 6,
      type: 'group',
      color: '#F97316'
    },
    {
      id: '6',
      name: 'HR Department',
      memberCount: 4,
      type: 'group',
      color: '#84CC16'
    },
    {
      id: '7',
      name: 'Personal Tasks',
      memberCount: 1,
      type: 'personal',
      color: '#10B981'
    },
    {
      id: '8',
      name: 'My Projects',
      memberCount: 1,
      type: 'personal',
      color: '#F59E0B'
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

  const handleViewLess = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllWorkspaces(false);
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
        <Text style={styles.memberCount}>
          {workspace.memberCount} {workspace.memberCount === 1 ? 'người' : 'người'}
        </Text>
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
            <>
              <ScrollView 
                style={styles.workspacesScrollContainerExpanded}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContentContainer}
              >
                <View style={styles.workspacesContainer}>
                  {filteredWorkspaces.map((workspace, index) => renderWorkspaceBlock(workspace, index))}
                </View>
              </ScrollView>
              
              {/* View Less Button - Outside scroll */}
              <View style={styles.viewMoreContainer}>
                <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewLess}>
                  <Text style={styles.viewMoreText}>View less</Text>
                </TouchableOpacity>
              </View>
            </>
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
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  workspaceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  memberCount: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 60,
    paddingTop: 30,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 120,
  },
  createButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  workspaceSection: {
    flex: 1,
  },
  workspacesScrollContainer: {
    maxHeight: 280, // Fixed height for 4 workspaces (2 rows)
  },
  workspacesScrollContainerExpanded: {
    maxHeight: 280, // Same height as collapsed view to maintain consistent spacing
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  viewLessButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  viewLessText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default WorkspaceSelectionScreen;
