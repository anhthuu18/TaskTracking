import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project, ProjectFlow, FlowStatus } from '../types/Project';
import { CreateActionDropdown, CreateTaskModal, CreateEventModal, CreateProjectModal, MoreActionsDropdown, MemberSortDropdown, StatusSortDropdown } from '../components';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      project: Project;
    };
  };
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({ navigation, route }) => {
  const { project } = route.params;
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showMemberSort, setShowMemberSort] = useState(false);
  const [showStatusSort, setShowStatusSort] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FlowStatus | null>(null);

  // Mock users data for dropdown
  const mockUsers = [
    { id: '1', name: 'John Doe', username: 'johndoe' },
    { id: '2', name: 'Jane Smith', username: 'janesmith' },
    { id: '3', name: 'Mike Johnson', username: 'mikejohnson' },
  ];

  // Mock project flows data
  const projectFlows: ProjectFlow[] = [
    {
      id: '1',
      name: 'Design System',
      projectId: project.id,
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-02-01'),
      members: project.members.slice(0, 2),
      status: FlowStatus.COMPLETED,
      progress: 100,
    },
    {
      id: '2',
      name: 'User Research',
      projectId: project.id,
      startDate: new Date('2021-01-05'),
      endDate: new Date('2021-02-05'),
      members: project.members.slice(1, 3),
      status: FlowStatus.IN_PROGRESS,
      progress: 60,
    },
    {
      id: '3',
      name: 'Wireframing',
      projectId: project.id,
      startDate: new Date('2021-01-10'),
      endDate: new Date('2021-02-10'),
      members: project.members.slice(0, 3),
      status: FlowStatus.NOT_STARTED,
      progress: 0,
    },
    {
      id: '4',
      name: 'Prototyping',
      projectId: project.id,
      startDate: new Date('2021-01-15'),
      endDate: new Date('2021-02-15'),
      members: project.members.slice(2, 4),
      status: FlowStatus.BLOCKED,
      progress: 25,
    },
    {
      id: '5',
      name: 'Testing',
      projectId: project.id,
      startDate: new Date('2021-01-20'),
      endDate: new Date('2021-02-20'),
      members: project.members.slice(0, 4),
      status: FlowStatus.IN_PROGRESS,
      progress: 80,
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleMoreAction = (action: string) => {
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
          { text: 'Delete', style: 'destructive' }
        ]);
        break;
    }
  };

  const renderFlowCard = (flow: ProjectFlow) => (
    <View key={flow.id} style={styles.flowCard}>
      <View style={styles.flowHeader}>
        <Text style={styles.flowTitle}>{flow.name}</Text>
        <View style={styles.flowMembers}>
          {flow.members.slice(0, 3).map((member, index) => (
            <View
              key={member.id}
              style={[
                styles.memberAvatar,
                { 
                  backgroundColor: Colors.primary,
                  marginLeft: index > 0 ? -8 : 0,
                  zIndex: 3 - index,
                }
              ]}
            >
              <Text style={styles.memberAvatarText}>
                {member.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {flow.members.length > 3 && (
            <View style={[styles.memberAvatar, styles.additionalMemberAvatar, { marginLeft: -8 }]}>
              <Text style={styles.memberAvatarText}>+{flow.members.length - 3}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.flowDates}>
        <View style={styles.flowDateItem}>
          <MaterialIcons name="schedule" size={14} color={Colors.neutral.medium} />
          <Text style={styles.flowDateText}>{formatDate(flow.startDate)}</Text>
        </View>
        <View style={styles.flowDateSeparator}>
          <View style={styles.flowDateLine} />
          <MaterialIcons name="arrow-forward" size={14} color={Colors.neutral.medium} />
        </View>
        <View style={styles.flowDateItem}>
          <MaterialIcons name="event" size={14} color={Colors.primary} />
          <Text style={styles.flowDateText}>{formatDate(flow.endDate)}</Text>
        </View>
      </View>
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
            <Text style={styles.projectTitle}>{project.name}</Text>
            <TouchableOpacity 
              style={styles.moreActionsButton}
              onPress={() => setShowMoreActions(true)}
            >
              <MaterialIcons name="more-vert" size={24} color={Colors.neutral.dark} />
            </TouchableOpacity>
          </View>
          
          {/* Sort Options */}
          <View style={styles.sortOptions}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setShowMemberSort(true)}
            >
              <MaterialIcons name="person" size={16} color={Colors.neutral.medium} />
              <Text style={styles.sortLabel}>
                {selectedMember ? mockUsers.find(m => m.id === selectedMember)?.name : 'All Members'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.neutral.medium} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setShowStatusSort(true)}
            >
              <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
              <Text style={styles.sortLabel}>
                {selectedStatus ? selectedStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'All Status'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.neutral.medium} />
            </TouchableOpacity>
          </View>

          {/* Project Members */}
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Userflow</Text>
            <View style={styles.membersRow}>
              {project.members.slice(0, 4).map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberAvatar,
                    { 
                      backgroundColor: Colors.primary,
                      marginLeft: index > 0 ? -8 : 0,
                      zIndex: 4 - index,
                    }
                  ]}
                >
                  <Text style={styles.memberAvatarText}>
                    {member.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ))}
              {project.members.length > 4 && (
                <View style={[styles.memberAvatar, styles.additionalMemberAvatar, { marginLeft: -8 }]}>
                  <Text style={styles.memberAvatarText}>+{project.members.length - 4}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Project Dates */}
          <View style={styles.datesSection}>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.neutral.medium} />
                <Text style={styles.dateText}>{formatDate(project.startDate)}</Text>
              </View>
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <MaterialIcons name="arrow-forward" size={16} color={Colors.neutral.medium} />
              </View>
              <View style={styles.dateItem}>
                <MaterialIcons name="event" size={16} color={Colors.primary} />
                <Text style={styles.dateText}>{formatDate(project.endDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Flows */}
        <View style={styles.flowsSection}>
          {projectFlows
            .filter(flow => {
              const memberMatch = selectedMember ? mockUsers.some(user => user.id === selectedMember && flow.members.some(m => m.username === user.username)) : true;
              const statusMatch = selectedStatus ? flow.status === selectedStatus : true;
              return memberMatch && statusMatch;
            })
            .map(renderFlowCard)}
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
        projectId={project.id}
        projectName={project.name}
        projectMembers={project.members}
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
        members={mockUsers}
        selectedMember={selectedMember}
      />

      {/* Status Sort Dropdown */}
      <StatusSortDropdown
        visible={showStatusSort}
        onClose={() => setShowStatusSort(false)}
        onSelect={setSelectedStatus}
        selectedStatus={selectedStatus}
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
  flowsSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  flowCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  flowMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flowDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowDateText: {
    fontSize: 12,
    color: Colors.neutral.medium,
  },
  flowDateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  flowDateLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral.light,
  },


});

export default ProjectDetailScreen;
