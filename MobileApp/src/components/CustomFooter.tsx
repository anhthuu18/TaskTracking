import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

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
  const { colors } = useTheme();

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
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer,
          isActive && styles.activeIconContainer,
        ]}>
          <MaterialIcons 
            name={tab.icon as any} 
            size={22} 
            color={isActive ? '#FFFFFF' : '#9CA3AF'} 
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabsContainer}>
        {tabs.map(renderTab)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 25,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 0, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
});

export default CustomFooter;
