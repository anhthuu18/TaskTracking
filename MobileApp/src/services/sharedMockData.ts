import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { Task, TaskStatus, TaskPriority } from '../types/Task';
import { WorkspaceType, MemberRole } from '../types/Workspace';

// Shared Mock Data for both Dashboard and Project Detail

// Mock Project Data
export const mockProject: Project = {
  id: 1,
  projectName: 'Mane UiKit',
  description: 'A comprehensive UI kit for modern mobile applications with beautiful components and smooth animations.',
  workspaceId: 1,
  userId: 1,
  status: 'active',
  dateCreated: new Date('2024-01-01'),
  dateModified: new Date('2024-01-15'),
  user: {
    id: 1,
    username: 'john_doe',
    email: 'john.doe@example.com',
  },
  workspace: {
    id: 1,
    workspaceName: 'Design Team',
  },
  memberCount: 5,
  userRole: ProjectMemberRole.ADMIN,
};

// Mock Project Members
export const mockProjectMembers: ProjectMember[] = [
  {
    id: 1,
    projectId: 1,
    userId: 1,
    role: ProjectMemberRole.ADMIN,
    joinedAt: new Date('2024-01-01'),
    user: {
      id: 1,
      username: 'john_doe',
      email: 'john.doe@example.com',
    },
  },
  {
    id: 2,
    projectId: 1,
    userId: 2,
    role: ProjectMemberRole.ADMIN,
    joinedAt: new Date('2024-01-02'),
    user: {
      id: 2,
      username: 'jane_smith',
      email: 'jane.smith@example.com',
    },
  },
  {
    id: 3,
    projectId: 1,
    userId: 3,
    role: ProjectMemberRole.MEMBER,
    joinedAt: new Date('2024-01-03'),
    user: {
      id: 3,
      username: 'mike_johnson',
      email: 'mike.johnson@example.com',
    },
  },
  {
    id: 4,
    projectId: 1,
    userId: 4,
    role: ProjectMemberRole.MEMBER,
    joinedAt: new Date('2024-01-05'),
    user: {
      id: 4,
      username: 'sarah_wilson',
      email: 'sarah.wilson@example.com',
    },
  },
  {
    id: 5,
    projectId: 1,
    userId: 5,
    role: ProjectMemberRole.MEMBER,
    joinedAt: new Date('2024-01-08'),
    user: {
      id: 5,
      username: 'alex_brown',
      email: 'alex.brown@example.com',
    },
  },
];

// Mock Tasks Data - Same format as dashboard
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'API Integration Testing',
    project: 'Mane UiKit',
    projectId: 'mane-uikit',
    dueDate: new Date('2025-01-15'),
    priority: 'urgent',
    icon: 'assignment',
    color: '#FF5252',
    status: TaskStatus.IN_PROGRESS,
    assignee: 'jane_smith',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
    tags: ['backend', 'api', 'testing'],
  },
  {
    id: '2',
    title: 'Mobile App UI Design',
    project: 'Mane UiKit',
    projectId: 'mane-uikit',
    dueDate: new Date('2025-01-16'),
    priority: 'high',
    icon: 'assignment',
    color: '#FF9800',
    status: TaskStatus.TODO,
    assignee: 'mike_johnson',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    tags: ['design', 'ui', 'mobile'],
  },
  {
    id: '3',
    title: 'Database Optimization',
    project: 'Mane UiKit',
    projectId: 'mane-uikit',
    dueDate: new Date('2025-01-17'),
    priority: 'medium',
    icon: 'storage',
    color: '#2196F3',
    status: TaskStatus.TODO,
    assignee: 'sarah_wilson',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    tags: ['database', 'optimization', 'performance'],
  },
  {
    id: '4',
    title: 'User Authentication',
    project: 'Mane UiKit',
    projectId: 'mane-uikit',
    dueDate: new Date('2025-01-18'),
    priority: 'high',
    icon: 'security',
    color: '#FF9800',
    status: TaskStatus.IN_PROGRESS,
    assignee: 'alex_brown',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-12'),
    tags: ['auth', 'security', 'backend'],
  },
  {
    id: '5',
    title: 'Component Library Update',
    project: 'Mane UiKit',
    projectId: 'mane-uikit',
    dueDate: new Date('2025-01-19'),
    priority: 'medium',
    icon: 'widgets',
    color: '#2196F3',
    status: TaskStatus.DONE,
    assignee: 'john_doe',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-14'),
    tags: ['components', 'ui', 'library'],
  },
  {
    id: '6',
    title: 'Performance Testing',
    project: 'Mane UiKit',
    projectId: 'mane-uikit',
    dueDate: new Date('2025-01-20'),
    priority: 'low',
    icon: 'speed',
    color: '#9C27B0',
    status: TaskStatus.TODO,
    assignee: 'jane_smith',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
    tags: ['testing', 'performance', 'optimization'],
  },
];

// Mock Workspace Data
export const mockWorkspace = {
  id: 1,
  workspaceName: 'Design Team',
  description: 'A collaborative workspace for our design and development team',
  workspaceType: 'GROUP' as const,
  memberCount: 8,
  projectCount: 3,
};

// Helper functions
export const getTasksByStatus = (status: TaskStatus): Task[] => {
  return mockTasks.filter(task => task.status === status);
};

export const getTasksByAssignee = (assignee: string): Task[] => {
  return mockTasks.filter(task => task.assignee === assignee);
};

export const getMembersByRole = (role: ProjectMemberRole): ProjectMember[] => {
  return mockProjectMembers.filter(member => member.role === role);
};

export const getProjectStats = () => {
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(task => task.status === TaskStatus.DONE).length;
  const inProgressTasks = mockTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
  const todoTasks = mockTasks.filter(task => task.status === TaskStatus.TODO).length;
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionRate: Math.round((completedTasks / totalTasks) * 100),
  };
};
