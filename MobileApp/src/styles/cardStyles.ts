import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/Dimensions';

// ============================================================================
// BASE CARD STYLES - Chuẩn hóa từ WorkspaceDashboardScreen
// ============================================================================

// Base card container với shadow và border radius chuẩn
const baseCardStyle = {
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.lg, // 16px
  shadowColor: Colors.neutral.dark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
  borderWidth: 1,
  borderColor: Colors.neutral.light + '40',
};

// ============================================================================
// PROJECT CARD STYLES - Chuẩn từ WorkspaceDashboardScreen
// ============================================================================

const projectCardStyle = {
  ...baseCardStyle,
  padding: Spacing.md, // 16px
  marginBottom: Spacing.md, // 16px
};

// ============================================================================
// TASK CARD STYLES - Chuẩn từ WorkspaceDashboardScreen  
// ============================================================================

const taskCardStyle = {
  ...baseCardStyle,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingVertical: Spacing.md, // 16px
  paddingHorizontal: Spacing.md, // 16px
  marginBottom: Spacing.sm, // 8px
};

// ============================================================================
// MEMBER CARD STYLES - Chuẩn từ WorkspaceMembersTab
// ============================================================================

const memberCardStyle = {
  ...baseCardStyle,
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  padding: Spacing.sm, // 8px
  marginBottom: Spacing.sm, // 8px
};

// ============================================================================
// SHARED CARD STYLES - Tổng hợp tất cả styles
// ============================================================================

export const cardStyles = StyleSheet.create({
  // Common container styles
  cardContainer: {
    marginHorizontal: Spacing.md, // 16px
    marginVertical: Spacing.sm, // 8px
  },
  
  // ============================================================================
  // PROJECT CARD STYLES - Chuẩn hóa từ WorkspaceDashboardScreen
  // ============================================================================
  projectCard: {
    ...projectCardStyle,
  },
  projectHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: Spacing.sm, // 12px
  },
  projectName: {
    fontSize: FontSize.lg, // 18px
    fontWeight: FontWeight.bold,
    color: Colors.neutral.dark,
    flex: 1,
  },
  memberCount: {
    fontSize: FontSize.body, // 14px
    color: Colors.neutral.medium,
    fontWeight: FontWeight.medium,
  },
  projectInfoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm, // 12px
  },
  projectDescriptionContainer: {
    flex: 1,
    marginRight: Spacing.sm, // 12px
  },
  projectDescription: {
    fontSize: FontSize.caption, // 12px
    color: Colors.neutral.medium,
    fontStyle: 'italic' as const,
  },
  projectDateContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  projectDateText: {
    fontSize: 11,
    color: Colors.neutral.medium,
    marginLeft: 4,
    fontWeight: FontWeight.medium,
  },
  projectProgress: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.neutral.light,
    borderRadius: 4,
    marginRight: Spacing.sm, // 12px
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    width: '50%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  tasksText: {
    fontSize: FontSize.caption, // 12px
    color: Colors.neutral.medium,
    fontWeight: FontWeight.medium,
  },

  // ============================================================================
  // TASK CARD STYLES - Chuẩn hóa từ WorkspaceDashboardScreen
  // ============================================================================
  taskCard: {
    ...taskCardStyle,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md, // 12px
    backgroundColor: Colors.primary + '10',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.sm, // 12px
  },
  taskContent: {
    flex: 1,
    marginRight: Spacing.sm, // 12px
  },
  taskTitle: {
    fontSize: FontSize.md, // 16px
    fontWeight: FontWeight.semibold,
    color: Colors.neutral.dark,
    marginBottom: 4,
  },
  taskProject: {
    fontSize: FontSize.caption, // 12px
    color: Colors.neutral.medium,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  taskDeadline: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  deadlineText: {
    fontSize: FontSize.caption, // 12px
    marginLeft: 4,
    fontWeight: FontWeight.medium,
  },
  // Deadline Styles (matching dashboard)
  upcoming: {
    color: Colors.neutral.medium,
  },
  dueSoon: {
    color: Colors.warning,
  },
  overdue: {
    color: Colors.error,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.neutral.dark,
  },
  // Priority Badge Styles (matching dashboard exactly)
  urgentBadge: {
    backgroundColor: Colors.priority.urgent + '20',
  },
  highBadge: {
    backgroundColor: Colors.priority.high + '20',
  },
  mediumBadge: {
    backgroundColor: Colors.priority.medium + '20',
  },
  lowBadge: {
    backgroundColor: Colors.priority.low + '20',
  },

  // ============================================================================
  // MEMBER CARD STYLES - Chuẩn hóa từ WorkspaceMembersTab
  // ============================================================================
  memberCard: {
    ...memberCardStyle,
  },
  memberInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  avatar: {
    marginRight: Spacing.sm, // 12px
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatarText: {
    color: Colors.surface,
    fontSize: FontSize.body, // 14px
    fontWeight: FontWeight.semibold,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.md, // 16px
    fontWeight: FontWeight.semibold,
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: FontSize.caption, // 12px
    color: Colors.neutral.medium,
  },
  joinedDate: {
    fontSize: FontSize.caption, // 12px
    color: Colors.neutral.medium,
  },
  memberActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  roleContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: FontSize.caption, // 12px
    fontWeight: FontWeight.semibold,
    color: Colors.surface,
  },


  // Common touchable styles
  touchableCard: {
    // activeOpacity is handled by TouchableOpacity component, not StyleSheet
  },
});

// Helper functions for colors
export const getPriorityBadgeStyle = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return cardStyles.urgentBadge;
    case 'high':
      return cardStyles.highBadge;
    case 'medium':
      return cardStyles.mediumBadge;
    case 'low':
      return cardStyles.lowBadge;
    case 'lowest':
      return cardStyles.lowBadge;
    default:
      return cardStyles.mediumBadge;
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return Colors.error + '20';
    case 'high':
      return Colors.warning + '20';
    case 'medium':
      return Colors.primary + '20';
    case 'low':
      return Colors.accent + '20';
    case 'lowest':
      return Colors.neutral.light;
    default:
      return Colors.primary + '20';
  }
};

export const getRoleColor = (role: string): string => {
  const normalizedRole = role ? role.toString().toUpperCase() : '';
  switch (normalizedRole) {
    case 'OWNER':
      return Colors.error;
    case 'ADMIN':
      return Colors.primary;
    case 'MEMBER':
      return Colors.accent;
    default:
      return Colors.neutral.medium;
  }
};

// Helper function for deadline styles (matching dashboard)
export const getDeadlineStyle = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return cardStyles.overdue;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return cardStyles.dueSoon;
  } else {
    return cardStyles.upcoming;
  }
};

