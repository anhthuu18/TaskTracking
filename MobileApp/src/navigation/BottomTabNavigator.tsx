import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

type ActiveRoute = 'dashboard' | 'workspaces' | 'create' | 'profile';

interface BottomTabNavigatorProps {
  navigation: any;
  activeRoute: ActiveRoute;
  onCreateTask?: () => void;
}

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ navigation, activeRoute, onCreateTask }) => {
  const tabs = [
    { id: 'dashboard' as ActiveRoute, label: 'Dashboard', icon: 'home', action: () => navigation.navigate('PersonalDashboard') },
    { id: 'workspaces' as ActiveRoute, label: 'Workspace', icon: 'folder-open', action: () => navigation.navigate('WorkspaceSelection') },
    { id: 'create' as ActiveRoute, label: 'Create Task', icon: 'add', action: () => {
        if (onCreateTask) {
          onCreateTask();
        } else {
          navigation.navigate('WorkspaceSelection');
        }
      } },
    { id: 'profile' as ActiveRoute, label: 'Profile', icon: 'person', action: () => navigation.navigate('Settings') },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeRoute === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={tab.action}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
              <MaterialIcons
                name={tab.icon as any}
                size={22}
                color={isActive ? Colors.neutral.white : Colors.neutral.medium}
              />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 20,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 11,
    color: Colors.neutral.medium,
    fontWeight: '500',
  },
  activeLabel: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default BottomTabNavigator;

