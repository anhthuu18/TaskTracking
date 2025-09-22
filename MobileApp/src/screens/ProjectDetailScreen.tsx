import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project, ProjectMember } from '../types/Project';
import { CreateActionDropdown, CreateTaskModal, CreateEventModal, CreateProjectModal, MoreActionsDropdown, MemberSortDropdown } from '../components';
import { projectService } from '../services';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  const { project: initialProject } = route.params;
  const [project, setProject] = useState<Project>(initialProject);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showMemberSort, setShowMemberSort] = useState(false);

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Load project details and members on component mount
  useEffect(() => {
    loadProjectDetails();
    loadProjectMembers();
  }, [project.id]);

  const loadProjectDetails = async () => {
    try {
      const response = await projectService.getProjectDetails(Number(project.id));
      
      if (response.success) {
        setProject(response.data);
      } else {
        console.error('Failed to load project details:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading project details:', error);
    }
  };

  const loadProjectMembers = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectMembers(Number(project.id));
      
      if (response.success) {
        setProjectMembers(response.data);
      } else {
        console.error('Failed to load project members:', response.message);
      }
    } catch (error: any) {
      console.error('Error loading project members:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleMoreAction = async (action: string) => {
    setShowMoreActions(false);
    switch (action) {
      case 'check_done':
        Alert.alert('Mark Complete', 'Mark this project as completed?');
        break;
      case 'share':
        Alert.alert('Share Project', 'Share this project with others');
        break;
      case 'delete':
        Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await projectService.deleteProject(Number(project.id));
                if (response.success) {
                  Alert.alert('Success', 'Project deleted successfully');
                  navigation.goBack();
                } else {
                  Alert.alert('Error', response.message || 'Failed to delete project');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete project');
              }
            }
          }
        ]);
        break;
    }
  };

  const renderMemberCard = (member: ProjectMember) => (
    <View key={member.id} style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={[styles.memberAvatar, { backgroundColor: Colors.primary }]}>
          <Text style={styles.memberAvatarText}>
            {member.user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.user.username}</Text>
          <Text style={styles.memberEmail}>{member.user.email}</Text>
        </View>
        <View style={styles.memberRole}>
          <Text style={styles.memberRoleText}>{member.role}</Text>
        </View>
      </View>
      <Text style={styles.memberJoinDate}>
        Joined: {new Date(member.joinedAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </Text>
    </View>
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
        <Text style={styles.headerTitle}>Project detail</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowDropdown(true)}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>{project.projectName}</Text>
            <TouchableOpacity 
              style={styles.moreActionsButton}
              onPress={() => setShowMoreActions(true)}
            >
              <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>

          {/* Project Description */}
          {project.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.projectDescription}>{project.description}</Text>
            </View>
          )}

          {/* Project Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <MaterialIcons name="person" size={20} color={Colors.primary} />
              <Text style={styles.infoCardLabel}>Created by</Text>
              <Text style={styles.infoCardValue}>{project.user?.username || 'Unknown'}</Text>
            </View>
            <View style={styles.infoCard}>
              <MaterialIcons name="group" size={20} color={Colors.accent} />
              <Text style={styles.infoCardLabel}>Members</Text>
              <Text style={styles.infoCardValue}>{project.memberCount || 1}</Text>
            </View>
            <View style={styles.infoCard}>
              <MaterialIcons name="folder" size={20} color={Colors.warning} />
              <Text style={styles.infoCardLabel}>Workspace</Text>
              <Text style={styles.infoCardValue}>{project.workspace?.workspaceName || 'Unknown'}</Text>
            </View>
          </View>

          {/* Project Dates */}
          <View style={styles.datesSection}>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
                <Text style={styles.dateText}>
                  Created: {formatDate(new Date(project.dateCreated))}
                </Text>
              </View>
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <MaterialIcons name="arrow-forward" size={16} color={Colors.neutral.medium} />
              </View>
              <View style={styles.dateItem}>
                <MaterialIcons name="event" size={16} color={Colors.primary} />
                <Text style={styles.dateText}>
                  Modified: {formatDate(new Date(project.dateModified))}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Project Members</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : projectMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="group" size={32} color={Colors.neutral.medium} />
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptySubtitle}>Invite members to collaborate on this project</Text>
            </View>
          ) : (
            <View style={styles.membersGrid}>
              {projectMembers.map(renderMemberCard)}
            </View>
          )}
        </View>


      </ScrollView>

      {/* Create Action Dropdown */}
      <CreateActionDropdown
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onCreateProject={() => setShowCreateProjectModal(true)}
        onCreateTask={() => setShowCreateTaskModal(true)}
        onCreateEvent={() => setShowCreateEventModal(true)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={(project: any) => {
          setShowCreateProjectModal(false);
          console.log('Project created:', project);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={(taskData: any) => {
          setShowCreateTaskModal(false);
          console.log('Task created:', taskData);
        }}
        projectId={Number(project.id)}
        projectName={project.projectName}
        projectMembers={projectMembers}
        isPersonalWorkspace={false}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        visible={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onCreateEvent={(eventData: any) => {
          setShowCreateEventModal(false);
          console.log('Event created:', eventData);
        }}
      />

      {/* More Actions Dropdown */}
      <MoreActionsDropdown
        visible={showMoreActions}
        onClose={() => setShowMoreActions(false)}
        onAction={handleMoreAction}
      />

      {/* Member Sort Dropdown */}
      <MemberSortDropdown
        visible={showMemberSort}
        onClose={() => setShowMemberSort(false)}
        onSelect={setSelectedMember}
        members={projectMembers.map(m => ({ 
          id: m.id.toString(), 
          name: m.user.username, 
          username: m.user.username 
        }))}
        selectedMember={selectedMember}
      />

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
    paddingTop: 60,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  projectInfo: {
    padding: 20,
    backgroundColor: Colors.surface,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.dark,
    marginBottom: 20,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moreActionsButton: {
    padding: 4,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 16,
    gap: 6,
    flex: 1,
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
    flex: 1,
  },
  membersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  memberAvatarText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  additionalMemberAvatar: {
    backgroundColor: Colors.warning,
  },
  datesSection: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  projectDescription: {
    fontSize: 16,
    color: Colors.neutral.medium,
    lineHeight: 24,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.neutral.light + '40',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  infoCardLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  infoCardValue: {
    fontSize: 14,
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  membersGrid: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  memberEmail: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  memberRole: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  memberJoinDate: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.neutral.medium,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },


});

export default ProjectDetailScreen;
