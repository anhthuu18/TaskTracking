import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Project } from '../types/Project';
import { Colors } from '../constants/Colors';
import { cardStyles } from '../styles/cardStyles';

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  showProgress?: boolean;
  progressPercentage?: number;
  completedTasks?: number;
  totalTasks?: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onPress, 
  showProgress = true,
  progressPercentage = 50,
  completedTasks = 24,
  totalTasks = 48
}) => {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cardStyles.projectHeader}>
        <Text style={cardStyles.projectName} numberOfLines={1}>
          {project.projectName}
        </Text>
        <View style={styles.memberInfo}>
          <MaterialIcons name="people-outline" size={16} color={Colors.primary} />
          <Text style={styles.memberCountText}>{project.memberCount || 0}</Text>
        </View>
      </View>
      
      {/* Project Description */}
      <Text style={styles.description} numberOfLines={2}>
        {project.description || 'No description available'}
      </Text>
      
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.progressStats}>
              <Text style={styles.progressValue}>{progressPercentage}%</Text>
              <Text style={styles.taskCountText}>({completedTasks}/{totalTasks})</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  projectCard: {
    backgroundColor: '#F8F7FD', // Light purple/lavender background
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: Colors.primary + '30', // Purple border
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  memberCountText: {
    fontSize: 13,
    color: Colors.primary,
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
    backgroundColor: Colors.primary,
  },
});

export default ProjectCard;
