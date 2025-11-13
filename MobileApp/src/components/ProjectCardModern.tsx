import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ProjectSummary } from '../hooks/useWorkspaceData';

interface ProjectCardModernProps {
  project: ProjectSummary;
  onPress?: () => void;
  isStarred?: boolean;
  onToggleStar?: () => void;
  hasUrgentTasks?: boolean;
}

const formatTimeAgo = (date: Date | undefined): string => {
  if (!date) {
    return 'never';
  }
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const ProjectCardModern: React.FC<ProjectCardModernProps> = ({ 
  project, 
  onPress, 
  isStarred = false,
  onToggleStar,
  hasUrgentTasks = false,
}) => {
  // Assuming you might want to get completed tasks count from somewhere
  // For now, let's calculate it based on progress and total task count
  const completedTasks = Math.round((project.progress / 100) * project.taskCount);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
          {hasUrgentTasks && <View style={styles.urgentIndicator} />}
        </View>
        <TouchableOpacity onPress={onToggleStar} style={styles.starButton}>
          <MaterialIcons 
            name={isStarred ? "star" : "star-border"} 
            size={24} 
            color={isStarred ? Colors.semantic.warning : Colors.neutral.medium} 
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {project.description || 'No description available'}
      </Text>

      <View style={styles.footer}>
          <View style={styles.footerItem}>
            <MaterialIcons name="people-outline" size={16} color={Colors.neutral.medium} />
            <Text style={styles.metaText}>{project.memberCount} members</Text>
          </View>
          <View style={styles.footerItem}>
            <MaterialIcons name="access-time" size={16} color={Colors.neutral.medium} />
            <Text style={styles.metaText}>Opened {formatTimeAgo(project.lastOpened)}</Text>
          </View>
        </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <View style={styles.progressStats}>
            <Text style={styles.progressValue}>{project.progress}%</Text>
            <Text style={styles.taskCountText}>({completedTasks}/{project.taskCount})</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${project.progress}%` }
            ]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white, // Light purple/lavender background
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: Colors.neutral.dark + '30', 
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  urgentIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.error,
    marginLeft: 8,
  },
  starButton: {
    padding: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.neutral.medium,
    marginLeft: 6,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: Colors.neutral.medium,
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: Colors.neutral.light,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressValue: {
    fontSize: 12,
    color: Colors.neutral.dark,
    fontWeight: '600',
  },
  taskCountText: {
    fontSize: 11,
    color: Colors.neutral.medium,
    fontWeight: '500',
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
    backgroundColor: Colors.primary, // Using a consistent color for progress
  },
});

export default ProjectCardModern;
