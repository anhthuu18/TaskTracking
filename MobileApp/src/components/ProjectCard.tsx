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
      style={cardStyles.projectCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cardStyles.projectHeader}>
        <Text style={cardStyles.projectName} numberOfLines={1}>
          {project.projectName}
        </Text>
        <Text style={cardStyles.memberCount}>
          Members: {project.memberCount || 1}
        </Text>
      </View>
      
      {/* Project Description and Creation Date Row */}
      <View style={cardStyles.projectInfoRow}>
        <View style={cardStyles.projectDescriptionContainer}>
          <Text style={cardStyles.projectDescription} numberOfLines={1}>
            {project.description || 'No description'}
          </Text>
        </View>
        
        <View style={cardStyles.projectDateContainer}>
          <MaterialIcons name="schedule" size={14} color={Colors.neutral.medium} />
          <Text style={cardStyles.projectDateText}>
            {formatDate(project.dateCreated)}
          </Text>
        </View>
      </View>
      
      {showProgress && (
        <View style={cardStyles.projectProgress}>
          <View style={cardStyles.progressBar}>
            <View 
              style={[
                cardStyles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={cardStyles.tasksText}>
            {completedTasks}/{totalTasks} tasks
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ProjectCard;
