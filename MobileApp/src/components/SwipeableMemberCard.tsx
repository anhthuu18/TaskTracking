import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WorkspaceMember, MemberRole } from '../types/Workspace';
import { Colors } from '../constants/Colors';
import { cardStyles, getRoleColor } from '../styles/cardStyles';

interface SwipeableMemberCardProps {
  member: WorkspaceMember;
  onPress?: () => void;
  onRemove?: () => void;
  onEditRole?: () => void;
  showActions?: boolean;
  currentUserRole?: MemberRole;
}

const SwipeableMemberCard: React.FC<SwipeableMemberCardProps> = ({ 
  member, 
  onPress,
  onRemove,
  onEditRole,
  showActions = true,
  currentUserRole
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const [showDeleteAction, setShowDeleteAction] = useState(false);

  const formatJoinedDate = (date: Date | string | undefined | null) => {
    if (!date) {
      return 'Recently';
    }
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Recently';
    }
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -100) {
        // Swipe left - show delete option
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -120,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(deleteOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setShowDeleteAction(true));
      } else {
        // Reset position
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(deleteOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setShowDeleteAction(false));
      }
    }
  };

  const handleOpenEditRole = () => {
    // Ensure any swipe-to-delete UI is reset before opening the edit role modal
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onEditRole?.();
    });
  };

  const handleDelete = () => {
    // Reset position first
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDeleteAction(false);
      onRemove?.();
    });
  };

  const renderRightActions = () => (
    showDeleteAction ? (
      <Animated.View style={[styles.rightActions, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialIcons name="delete" size={24} color={Colors.error} />
        </TouchableOpacity>
      </Animated.View>
    ) : null
  );

  const roleLabel = member.role ? member.role.toString().toUpperCase() : 'MEMBER';

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={[styles.cardContainer, { transform: [{ translateX }] }]}>
          <TouchableOpacity 
            style={cardStyles.memberCard} 
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={cardStyles.memberInfo}>
              <View style={cardStyles.avatar}>
                <View style={cardStyles.avatarPlaceholder}>
                  <Text style={cardStyles.avatarText}>
                    {member.user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={cardStyles.memberDetails}>
                <Text style={cardStyles.memberName}>{member.user.username}</Text>
                <Text style={cardStyles.memberEmail}>{member.user.email}</Text>
                <Text style={cardStyles.joinedDate}>
                  Joined {formatJoinedDate(member.joinedAt)}
                </Text>
              </View>
            </View>
            
            {showActions && (
              <View style={cardStyles.memberActions}>
                <View style={[cardStyles.roleContainer, { backgroundColor: getRoleColor(roleLabel) }]}>
                  <Text style={cardStyles.roleText}>
                    {roleLabel}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={handleOpenEditRole}
                >
                  <MaterialIcons name="more-vert" size={20} color={Colors.neutral.medium} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
      
      {renderRightActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardContainer: {
    backgroundColor: 'transparent',
  },
  rightActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SwipeableMemberCard;

