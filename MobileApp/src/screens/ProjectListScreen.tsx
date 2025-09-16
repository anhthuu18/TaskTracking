import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface ProjectListScreenProps {
  navigation: any;
  route?: {
    params?: {
      workspace?: {
        id: number;
        name: string;
      };
    };
  };
}

const ProjectListScreen: React.FC<ProjectListScreenProps> = ({ navigation, route }) => {
  const [selectedTab, setSelectedTab] = React.useState<'projects' | 'completed'>('projects');
  const [longPressedProject, setLongPressedProject] = React.useState<number | null>(null);
  const [currentUser] = React.useState({ id: 1, role: 'admin' }); // Mock current user
  
  // Get workspace from navigation params
  const selectedWorkspace = route?.params?.workspace;

  // Mock projects data - in real app, this would be filtered by workspace ID
  const mockProjects = [
    {
      id: 1,
      title: 'Mane UiKit',
      startDate: '01/01/2021',
      endDate: '01/02/2021',
      progress: 50,
      completedTasks: 24,
      totalTasks: 48,
      workspaceId: selectedWorkspace?.id || 1,
      createdBy: 1, // Current user created this project
      teamMembers: [
        { id: 1, name: 'A', color: Colors.primary },
        { id: 2, name: 'B', color: Colors.accent },
        { id: 3, name: 'C', color: Colors.warning },
        { id: 4, name: 'D', color: Colors.success },
      ],
      additionalMembers: 4,
    },
    {
      id: 2,
      title: 'Mobile App Design',
      startDate: '15/01/2021',
      endDate: '28/02/2021',
      progress: 75,
      completedTasks: 36,
      totalTasks: 48,
      workspaceId: selectedWorkspace?.id || 1,
      createdBy: 2, // Different user created this
      teamMembers: [
        { id: 1, name: 'E', color: Colors.error },
        { id: 2, name: 'F', color: Colors.success },
        { id: 3, name: 'G', color: Colors.primary },
      ],
      additionalMembers: 2,
    },
    {
      id: 3,
      title: 'Website Redesign',
      startDate: '10/02/2021',
      endDate: '15/03/2021',
      progress: 30,
      completedTasks: 12,
      totalTasks: 40,
      workspaceId: selectedWorkspace?.id || 1,
      createdBy: 1, // Current user created this
      teamMembers: [
        { id: 1, name: 'H', color: Colors.accent },
        { id: 2, name: 'I', color: Colors.warning },
      ],
      additionalMembers: 3,
    },
  ];

  const completedProjects = [
    {
      id: 4,
      title: 'E-commerce Platform',
      startDate: '01/12/2020',
      endDate: '31/12/2020',
      progress: 100,
      completedTasks: 60,
      totalTasks: 60,
      workspaceId: selectedWorkspace?.id || 1,
      createdBy: 1,
      teamMembers: [
        { id: 1, name: 'J', color: Colors.primary },
        { id: 2, name: 'K', color: Colors.success },
      ],
      additionalMembers: 5,
    },
  ];

  const canDeleteProject = (project: any) => {
    return currentUser.role === 'admin' || project.createdBy === currentUser.id;
  };

  const handleDeleteProject = (projectId: number) => {
    console.log('Delete project:', projectId);
    setLongPressedProject(null);
    // TODO: Implement actual delete functionality
  };

  const renderProjectCard = (project: any) => (
    <TouchableOpacity 
      key={project.id} 
      style={[
        styles.projectCard,
        longPressedProject === project.id && styles.projectCardPressed
      ]}
      onLongPress={() => {
        if (canDeleteProject(project)) {
          setLongPressedProject(project.id);
        }
      }}
      onPress={() => {
        if (longPressedProject === project.id) {
          setLongPressedProject(null);
        }
      }}
      delayLongPress={500}
    >
      {/* Delete Overlay */}
      {longPressedProject === project.id && (
        <View style={styles.deleteOverlay}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setLongPressedProject(null)}
          >
            <MaterialIcons name="close" size={20} color={Colors.surface} />
          </TouchableOpacity>
          <View style={styles.deleteContent}>
            <MaterialIcons name="delete" size={24} color={Colors.surface} />
            <Text style={styles.deleteText}>Delete</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteProject(project.id)}
          >
            <MaterialIcons name="delete" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.projectCardHeader}>
        <Text style={styles.projectTitle}>{project.title}</Text>
        <View style={styles.teamSection}>
          <View style={styles.teamAvatars}>
            {project.teamMembers.slice(0, 3).map((member: any, index: number) => (
              <View
                key={member.id}
                style={[
                  styles.avatar,
                  { backgroundColor: member.color, marginLeft: index > 0 ? -8 : 0 }
                ]}
              >
                <Text style={styles.avatarText}>{member.name}</Text>
              </View>
            ))}
            {project.additionalMembers > 0 && (
              <View style={[styles.avatar, styles.additionalAvatar, { marginLeft: -8 }]}>
                <Text style={styles.additionalText}>+{project.additionalMembers}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.projectDates}>
        <View style={styles.dateItem}>
          <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
          <Text style={styles.dateText}>{project.startDate}</Text>
        </View>
        <View style={styles.dateSeparator}>
          <View style={styles.separatorLine} />
          <MaterialIcons name="arrow-forward" size={16} color={Colors.neutral.medium} />
        </View>
        <View style={styles.dateItem}>
          <MaterialIcons name="event" size={16} color={Colors.primary} />
          <Text style={styles.dateText}>{project.endDate}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressText}>{project.progress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${project.progress}%` }]} />
        </View>
        <Text style={styles.taskCount}>{project.completedTasks}/{project.totalTasks} tasks</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="chevron-left" size={24} color={Colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedWorkspace ? selectedWorkspace.name : 'Project'}
        </Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.neutral.medium} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.neutral.medium}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabSection}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'projects' && styles.activeTabButton]}
          onPress={() => setSelectedTab('projects')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'projects' && styles.activeTabButtonText]}>
            Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'completed' && styles.activeTabButton]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'completed' && styles.activeTabButtonText]}>
            Completed
          </Text>
        </TouchableOpacity>

      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.projectList}>
          {selectedTab === 'projects' 
            ? mockProjects.map(renderProjectCard)
            : completedProjects.map(renderProjectCard)
          }
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.dark,
  },
  tabSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    gap: 16,
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.neutral.light,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.medium,
  },
  activeTabButtonText: {
    color: Colors.surface,
  },
  scrollContent: {
    flex: 1,
  },
  projectList: {
    padding: 20,
    gap: 20,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  additionalAvatar: {
    backgroundColor: Colors.warning,
  },
  additionalText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: '600',
  },
  projectDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  taskCount: {
    fontSize: 14,
    color: Colors.neutral.medium,
    minWidth: 80,
    textAlign: 'right',
  },
  projectCardPressed: {
    opacity: 0.8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(108, 99, 255, 0.9)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProjectListScreen;
