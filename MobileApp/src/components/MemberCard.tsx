import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WorkspaceMember, MemberRole } from '../types/Workspace';
import { Colors } from '../constants/Colors';
import { cardStyles, getRoleColor } from '../styles/cardStyles';

interface MemberCardProps {
  member: WorkspaceMember;
  onPress?: () => void;
  onRemove?: () => void;
  onEditRole?: () => void;
  showActions?: boolean;
  currentUserRole?: MemberRole;
}

const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  onPress,
  onRemove,
  onEditRole,
  showActions = true,
  currentUserRole
}) => {
  const formatJoinedDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const canEditRole = currentUserRole === MemberRole.OWNER || currentUserRole === MemberRole.ADMIN;
  const canRemove = currentUserRole === MemberRole.OWNER || 
    (currentUserRole === MemberRole.ADMIN && member.role !== MemberRole.OWNER);

  return (
    <TouchableOpacity 
      style={cardStyles.memberCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={cardStyles.memberInfo}>
        <View style={cardStyles.avatar}>
          {member.user.avatar ? (
            <Image 
              source={{ uri: member.user.avatar }} 
              style={cardStyles.avatarImage}
            />
          ) : (
            <View style={cardStyles.avatarPlaceholder}>
              <Text style={cardStyles.avatarText}>
                {getInitials(member.user.name || member.user.username)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={cardStyles.memberDetails}>
          <Text style={cardStyles.memberName} numberOfLines={1}>
            {member.user.name || member.user.username}
          </Text>
          <Text style={cardStyles.memberEmail} numberOfLines={1}>
            {member.user.email}
          </Text>
          <Text style={cardStyles.joinedDate}>
            Joined {formatJoinedDate(member.joinedAt)}
          </Text>
        </View>
      </View>
      
      <View style={cardStyles.memberActions}>
        <View style={[
          cardStyles.roleContainer,
          { backgroundColor: getRoleColor(member.role) }
        ]}>
          <Text style={cardStyles.roleText}>
            {member.role}
          </Text>
        </View>
        
        {showActions && (canEditRole || canRemove) && (
          <TouchableOpacity onPress={onEditRole} style={styles.actionButton}>
            <MaterialIcons name="more-vert" size={20} color={Colors.neutral.medium} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default MemberCard;
