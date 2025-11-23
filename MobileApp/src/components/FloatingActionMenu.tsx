import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../constants/Colors';

interface FloatingActionMenuProps {
  visible?: boolean;
  onClose?: () => void;
  onActionPress?: (action: string) => void;
  position?: 'bottom' | 'top';
  // Legacy props for backward compatibility
  onCreateTask?: () => void;
  onCreateProject?: () => void;
  onCreateTeam?: () => void;
  onCreateMeeting?: () => void;
}

const { width, height } = Dimensions.get('window');

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  visible,
  onClose,
  onActionPress,
  position = 'bottom',
  // Legacy props
  onCreateTask,
  onCreateProject,
  onCreateTeam,
  onCreateMeeting,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // Handle controlled visibility
  React.useEffect(() => {
    if (visible !== undefined) {
      const toValue = visible ? 1 : 0;
      
      Animated.parallel([
        Animated.spring(animation, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(rotation, {
          toValue,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      
      setIsOpen(visible);
    }
  }, [visible]);

  const toggleMenu = () => {
    if (visible !== undefined && onClose) {
      onClose();
      return;
    }
    
    const toValue = isOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(rotation, {
        toValue,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
    
    setIsOpen(!isOpen);
  };

  const handleMenuItemPress = (action: () => void, actionKey?: string) => {
    if (onActionPress && actionKey) {
      onActionPress(actionKey);
    } else {
      action();
    }
    toggleMenu();
  };

  const menuItems = [
    {
      icon: 'task-alt',
      label: 'Create task',
      onPress: () => handleMenuItemPress(onCreateTask || (() => {}), 'create_task'),
      color: Colors.success,
    },
    {
      icon: 'folder',
      label: 'Create project',
      onPress: () => handleMenuItemPress(onCreateProject || (() => {}), 'create_project'),
      color: Colors.primary,
    },
    {
      icon: 'group',
      label: 'Create team',
      onPress: () => handleMenuItemPress(onCreateTeam || (() => {}), 'create_team'),
      color: Colors.accent,
    },
    {
      icon: 'event',
      label: 'Create meeting',
      onPress: () => handleMenuItemPress(onCreateMeeting || (() => {}), 'create_meeting'),
      color: Colors.info,
    },
  ];

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Menu Items */}
      {menuItems.map((item, index) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(60 * (index + 1))],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        const opacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        return (
          <Animated.View
            key={item.label}
            style={[
              styles.menuItem,
              {
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItemButton}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuItemIcon, { backgroundColor: item.color }]}>
                  <MaterialIcons name={item.icon} size={20} color={Colors.surface} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.fab, isOpen && styles.fabOpen]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
          }}
        >
          <MaterialIcons name="add" size={24} color={Colors.surface} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: -height,
    left: -width,
    width: width * 2,
    height: height * 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabOpen: {
    backgroundColor: Colors.primary,
  },
  menuItem: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  menuItemButton: {
    marginBottom: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    shadowColor: Colors.neutral.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.dark,
    marginRight: 12,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default FloatingActionMenu;
