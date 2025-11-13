import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { ProjectSummary } from '../hooks/useWorkspaceData';

interface ProjectCardModernProps {
  project: ProjectSummary;
  onPress?: () => void;
}

const ProjectCardModern: React.FC<ProjectCardModernProps> = ({ 
  project, 
  onPress, 
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
        <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
        <View style={styles.memberInfo}>
          <MaterialIcons name="people-outline" size={16} color={Colors.primary} />
          <Text style={styles.metaText}>{project.memberCount}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {project.description || 'No description available'}
      </Text>

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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
    flex: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  metaText: {
    fontSize: 13,
    color: Colors.primary, // Changed to primary color (purple)
    marginLeft: 4,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: Colors.neutral.medium,
    marginBottom: 12,
    lineHeight: 18,
  },
  progressContainer: {
    // No margin bottom to make card smaller
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
