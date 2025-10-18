import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';
import { WorkspaceStats } from '../hooks/useWorkspaceData';

interface WorkspaceStatsCardProps {
  stats: WorkspaceStats;
  onPress?: () => void;
}

const WorkspaceStatsCard: React.FC<WorkspaceStatsCardProps> = ({ stats, onPress }) => {
  const statItems = [
    {
      title: 'Projects',
      value: stats.totalProjects,
      subtitle: `${stats.activeProjects} active`,
      color: Colors.primary,
    },
    {
      title: 'Tasks',
      value: stats.totalTasks,
      subtitle: `${stats.completedTasks} done`,
      color: Colors.success,
    },
    {
      title: 'Team',
      value: stats.teamMembers,
      subtitle: 'members',
      color: Colors.accent,
    },
    {
      title: 'Progress',
      value: `${stats.productivity}%`,
      subtitle: 'completed',
      color: Colors.warning,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Overview</Text>
        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="chevron-right" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statTitle}>{item.title}</Text>
            <Text style={styles.statSubtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginRight: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: Colors.neutral.medium,
    textAlign: 'center',
  },
});

export default WorkspaceStatsCard;
