import { Project, ProjectMember, ProjectMemberRole } from '../types/Project';
import { Task, TaskStatus, TaskPriority } from '../types/Task';

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

// Mock Tasks Data
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design User Interface',
    description: 'Create wireframes and mockups for the main dashboard with modern design principles and user-friendly navigation.',
    status: 'in_progress',
    priority: 'high',
    assignee: 'jane_smith',
    dueDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-10'),
    tags: ['design', 'ui', 'dashboard'],
  },
  {
    id: '2',
    title: 'Implement Authentication',
    description: 'Set up JWT authentication system with secure login, registration, and password reset functionality.',
    status: 'todo',
    priority: 'urgent',
    assignee: 'mike_johnson',
    dueDate: new Date('2024-01-25'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    tags: ['backend', 'auth', 'security'],
  },
  {
    id: '3',
    title: 'Write Unit Tests',
    description: 'Add comprehensive test coverage for all components including edge cases and error handling.',
    status: 'done',
    priority: 'medium',
    assignee: 'sarah_wilson',
    dueDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-14'),
    tags: ['testing', 'quality', 'coverage'],
  },
  {
    id: '4',
    title: 'Setup CI/CD Pipeline',
    description: 'Configure automated testing, building, and deployment pipeline for continuous integration.',
    status: 'in_progress',
    priority: 'high',
    assignee: 'alex_brown',
    dueDate: new Date('2024-01-22'),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
    tags: ['devops', 'ci-cd', 'automation'],
  },
  {
    id: '5',
    title: 'Database Schema Design',
    description: 'Design and implement database schema with proper relationships and indexing for optimal performance.',
    status: 'todo',
    priority: 'medium',
    assignee: 'john_doe',
    dueDate: new Date('2024-01-18'),
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
    tags: ['database', 'schema', 'performance'],
  },
  {
    id: '6',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation with examples and interactive testing interface.',
    status: 'done',
    priority: 'low',
    assignee: 'jane_smith',
    dueDate: new Date('2024-01-12'),
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-11'),
    tags: ['documentation', 'api', 'swagger'],
  },
  {
    id: '7',
    title: 'Mobile App Optimization',
    description: 'Optimize mobile app performance, reduce bundle size, and improve loading times.',
    status: 'in_progress',
    priority: 'high',
    assignee: 'mike_johnson',
    dueDate: new Date('2024-01-28'),
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-13'),
    tags: ['mobile', 'optimization', 'performance'],
  },
  {
    id: '8',
    title: 'User Feedback System',
    description: 'Implement user feedback collection system with rating and comment functionality.',
    status: 'todo',
    priority: 'low',
    assignee: 'sarah_wilson',
    dueDate: new Date('2024-02-01'),
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
    tags: ['feedback', 'user-experience', 'rating'],
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

// Helper function to get tasks by status
export const getTasksByStatus = (status: TaskStatus): Task[] => {
  return mockTasks.filter(task => task.status === status);
};

// Helper function to get tasks by assignee
export const getTasksByAssignee = (assignee: string): Task[] => {
  return mockTasks.filter(task => task.assignee === assignee);
};

// Helper function to get member by role
export const getMembersByRole = (role: ProjectMemberRole): ProjectMember[] => {
  return mockProjectMembers.filter(member => member.role === role);
};

// Helper function to get project statistics
export const getProjectStats = () => {
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(task => task.status === 'done').length;
  const inProgressTasks = mockTasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = mockTasks.filter(task => task.status === 'todo').length;
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    completionRate: Math.round((completedTasks / totalTasks) * 100),
  };
};