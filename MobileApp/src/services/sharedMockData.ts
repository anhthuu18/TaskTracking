import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { Task, TaskStatus, TaskPriority } from '../types/Task';
import { WorkspaceType, MemberRole, WorkspaceMember } from '../types/Workspace';
import { Event } from '../types/Event';

// Shared Mock Data for both Dashboard and Project Detail

// Mock Events Data
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team sync meeting',
    startDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    startTime: '10:00',
    endTime: '11:00',
    includeTime: true,
    location: 'Conference Room A',
    assignedMembers: ['1', '2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Project Review',
    description: 'Review project progress and milestones',
    startDate: new Date(new Date().setDate(new Date().getDate() + 2)), // In 2 days
    endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    startTime: '14:30',
    endTime: '16:00',
    includeTime: true,
    location: 'Virtual Meeting',
    assignedMembers: ['1', '2', '3'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
    {
    id: '4',
    title: 'Client Presentation',
    description: 'Present project status to client',
    startDate: new Date(), // Today
    endDate: new Date(),
    startTime: '15:00',
    endTime: '16:30',
    includeTime: true,
    location: 'Client Office',
    assignedMembers: ['1', '2'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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
    role: ProjectMemberRole.MEMBER,
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

// Mock Workspace Members
export const mockWorkspaceMembers: WorkspaceMember[] = [
    {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: MemberRole.OWNER,
        joinedAt: new Date('2024-01-01'),
        user: {
            id: 1,
            username: 'john_doe',
            email: 'john@example.com',
            name: 'John Doe',
            avatar: 'https://i.pravatar.cc/150?img=1',
        },
    },
    {
        id: 2,
        workspaceId: 1,
        userId: 2,
        role: MemberRole.MEMBER,
        joinedAt: new Date('2024-01-15'),
        user: {
            id: 2,
            username: 'jane_smith',
            email: 'jane@example.com',
            name: 'Jane Smith',
            avatar: 'https://i.pravatar.cc/150?img=2',
        },
    },
    {
        id: 3,
        workspaceId: 1,
        userId: 3,
        role: MemberRole.MEMBER,
        joinedAt: new Date('2024-02-01'),
        user: {
            id: 3,
            username: 'bob_wilson',
            email: 'bob@example.com',
            name: 'Bob Wilson',
            avatar: 'https://i.pravatar.cc/150?img=3',
        },
    },
];

// Mock Tasks Data - Same format as dashboard
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'API Integration Testing',
    description: 'Implement and test API endpoints for user authentication and data management. Ensure proper error handling and response formatting.',
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
    description: 'Create modern and intuitive UI designs for mobile application screens. Focus on user experience and accessibility standards.',
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
    description: 'Optimize database queries and indexes to improve application performance. Analyze slow queries and implement caching strategies.',
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
    description: 'Implement secure user authentication system with JWT tokens, password hashing, and session management.',
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
    description: 'Update and maintain component library with new reusable UI components. Document usage and examples.',
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
    description: 'Conduct comprehensive performance testing including load testing, stress testing, and performance profiling.',
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