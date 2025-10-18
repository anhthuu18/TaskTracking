import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ProjectSummary } from '../hooks/useWorkspaceData';

interface ProjectCardModernProps {
  project: ProjectSummary;
  onPress?: () => void;
  onMenuPress?: () => void;
}

const ProjectCardModern: React.FC<ProjectCardModernProps> = ({ 
  project, 
  onPress, 
  onMenuPress 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return Colors.success;
      case 'completed': return Colors.primary;
      case 'paused': return Colors.warning;
      default: return Colors.neutral.medium;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return Colors.semantic.error;
      case 'high': return Colors.warning;
      case 'medium': return Colors.accent;
      case 'low': return Colors.success;
      default: return Colors.neutral.medium;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: project.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]} />
          <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
        </View>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <MaterialIcons name="more-vert" size={20} color={Colors.neutral.medium} />
        </TouchableOpacity>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {project.description || 'No description available'}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{project.progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${project.progress}%`,
                backgroundColor: project.color 
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <MaterialIcons name="people" size={14} color={Colors.neutral.medium} />
            <Text style={styles.metaText}>{project.memberCount}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="assignment" size={14} color={Colors.neutral.medium} />
            <Text style={styles.metaText}>{project.taskCount}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) + '15' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(project.priority) }]}>
              {project.priority.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {project.dueDate && (
          <Text style={[
            styles.dueDate,
            { color: project.dueDate < new Date() ? Colors.semantic.error : Colors.neutral.medium }
          ]}>
            {formatDate(project.dueDate)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.neutral.light + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.neutral.medium,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 4,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProjectCardModern;
