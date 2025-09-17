import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { Project, ProjectFlow, ProjectMember } from '../types/Project';
import { FloatingActionMenu } from '../components';

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
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);

  // Mock project flows data
  const projectFlows: ProjectFlow[] = [
    {
      id: '1',
      name: 'Userflow',
      projectId: project.id,
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-02-01'),
      members: project.members.slice(0, 4),
      status: 'in_progress',
      progress: 75,
    },
    {
      id: '2',
      name: 'Userflow',
      projectId: project.id,
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-02-01'),
      members: project.members.slice(1, 4),
      status: 'in_progress',
      progress: 60,
    },
    {
      id: '3',
      name: 'Userflow',
      projectId: project.id,
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-02-01'),
      members: project.members.slice(0, 3),
      status: 'in_progress',
      progress: 45,
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleFloatingMenuAction = (action: string) => {
    setShowFloatingMenu(false);
    
    switch (action) {
      case 'create_task':
        Alert.alert('Create Task', 'Create a new task for this project');
        break;
      case 'create_project':
        Alert.alert('Create Project', 'Create a new project');
        break;
      case 'create_team':
        Alert.alert('Create Team', 'Create a new team');
        break;
      case 'create_meeting':
        Alert.alert('Create Meeting', 'Schedule a new meeting');
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
          style={styles.floatingMenuButton}
          onPress={() => setShowFloatingMenu(true)}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle}>{project.name}</Text>
          
          {/* Project Categories */}
          <View style={styles.categorySection}>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>BrainStorm</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.neutral.medium} />
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Design</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.neutral.medium} />
            </View>
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
          {projectFlows.map(renderFlowCard)}
        </View>

        {/* Add Group Button */}
        <TouchableOpacity style={styles.addGroupButton}>
          <MaterialIcons name="add" size={16} color={Colors.primary} />
          <Text style={styles.addGroupText}>Add group</Text>
        </TouchableOpacity>
      </ScrollView>

      <FloatingActionMenu
        visible={showFloatingMenu}
        onClose={() => setShowFloatingMenu(false)}
        onActionPress={handleFloatingMenuAction}
        position="top"
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
  floatingMenuButton: {
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
  categorySection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 8,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
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
  addGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addGroupText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },

});

export default ProjectDetailScreen;
