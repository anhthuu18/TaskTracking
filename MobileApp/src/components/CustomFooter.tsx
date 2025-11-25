import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
  onPress: () => void;
}

interface CustomFooterProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const CustomFooter: React.FC<CustomFooterProps> = ({ activeTab, onTabPress }) => {

  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      onPress: () => onTabPress('home'),
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'calendar-today',
      onPress: () => onTabPress('calendar'),
    },
    {
      id: 'create',
      label: 'Create',
      icon: 'add',
      onPress: () => onTabPress('create'),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: 'assignment',
      onPress: () => onTabPress('tasks'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      onPress: () => onTabPress('settings'),
    },
  ];

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.id;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tabContainer}
        onPress={tab.onPress}
        activeOpacity={0.8}
      >
        <View style={[
          styles.iconContainer,
          isActive && styles.activeIconContainer,
        ]}>
          <MaterialIcons 
            name={tab.icon as any} 
            size={20} 
            color={isActive ? Colors.neutral.white : Colors.neutral.medium} 
          />
        </View>
        <Text style={[
          styles.label,
          isActive && styles.activeLabel,
        ]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
        {tabs.map(renderTab)}
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
    height: 80,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: Colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light + '70',
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
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

export default CustomFooter;
