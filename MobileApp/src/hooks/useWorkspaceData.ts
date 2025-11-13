import { useState, useEffect, useCallback } from 'react';
import { projectService, taskService, workspaceService } from '../services';

export interface WorkspaceStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  teamMembers: number;
  productivity: number;
}

export interface ProjectSummary { 
  createdAt?: Date;
  numericId?: number;
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  dueDate?: Date;
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  color: string;
  lastOpened?: Date;
  isStarred?: boolean;
}

export interface TaskSummary {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  projectId: string;
  projectName: string;
  assigneeId?: string;
  assigneeName?: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface WorkspaceData {
  workspace: {
    id: string;
    name: string;
    description: string;
    type: 'personal' | 'group';
    memberCount: number;
    createdAt: Date;
    lastActiveAt: Date;
  };
  stats: WorkspaceStats;
  projects: ProjectSummary[];
  recentTasks: TaskSummary[];
  upcomingDeadlines: TaskSummary[];
  teamActivity: any[];
  allTasks: TaskSummary[];
}

export const useWorkspaceData = (workspaceId: string) => {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load workspace details
      let workspaceResponse;
      try {
        workspaceResponse = await workspaceService.getWorkspaceDetails(parseInt(workspaceId));
        if (!workspaceResponse.success) {
          throw new Error(workspaceResponse.message || 'Failed to load workspace');
        }
      } catch (err: any) {
        // If unauthorized, show user-friendly message but don't crash
        if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
          console.warn('Unauthorized access - user may need to login again');
          setError('Please login again to access workspace data');
          setLoading(false);
          return;
        }
        throw err;
      }

      // Load projects
      let projectsResponse;
      try {
        projectsResponse = await projectService.getProjectsByWorkspace(parseInt(workspaceId));
        if (!projectsResponse.success) {
          throw new Error('Failed to load projects');
        }
      } catch (err: any) {
        if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
          console.warn('Unauthorized access when loading projects');
          setError('Please login again to access workspace data');
          setLoading(false);
          return;
        }
        throw err;
      }

      // Load tasks
      let tasksResponse;
      try {
        tasksResponse = await taskService.getTasksByWorkspace(workspaceId);
      } catch (err: any) {
        if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
          console.warn('Unauthorized access when loading tasks');
          // Continue with empty tasks array instead of failing completely
        } else {
          throw err;
        }
      }
      const tasks = tasksResponse?.success ? tasksResponse.data || [] : [];
      
      // Calculate stats
      const projects = projectsResponse.data || [];
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      
      // Calculate task stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const overdueTasks = tasks.filter(t => 
        t.dueDate && t.dueDate < today && t.status !== 'done'
      ).length;
      
      const dueTodayTasks = tasks.filter(t => 
        t.dueDate && t.dueDate >= today && t.dueDate < tomorrow && t.status !== 'done'
      ).length;
      
      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const stats: WorkspaceStats = {
        totalProjects: projects.length,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        dueTodayTasks,
        teamMembers: workspaceResponse.data.memberCount || 1,
        productivity,
      };

      // Transform projects to ProjectSummary
      const projectSummaries: ProjectSummary[] = projects.map(project => {
        const projectTasks = tasks.filter(t => t.project === project.projectName);
        const completedProjectTasks = projectTasks.filter(t => t.status === 'done').length;
        const progress = projectTasks.length > 0 ? Math.round((completedProjectTasks / projectTasks.length) * 100) : 0;
        
        // Convert ProjectStatus enum to string literal type
        let status: 'active' | 'completed' | 'paused' = 'active';
        if (project.status) {
          if (project.status === 'completed' || project.status === 'paused') {
            status = project.status;
          }
        }
        
        const createdAt: Date | undefined = project.dateCreated ? new Date(project.dateCreated) : undefined;
        
        return {
          id: project.id.toString(),
          numericId: Number(project.id),
          name: project.projectName,
          description: project.description || '',
          status: status,
          progress,
          dueDate: undefined, // Project doesn't have endDate in the type
          memberCount: (project as any)?._count?.members ?? project.memberCount ?? 0,
          taskCount: projectTasks.length,
          completedTaskCount: completedProjectTasks,
          priority: 'medium',
          color: getProjectColor(project.id),
          createdAt,
          lastOpened: project.lastOpened ? new Date(project.lastOpened) : (project.dateModified ? new Date(project.dateModified) : undefined),
          isStarred: project.isStarred || false,
        };
      });

      const projectNameToIdMap = new Map<string, string>();
      projectSummaries.forEach(p => {
        projectNameToIdMap.set(p.name, p.id);
      });

      // Transform tasks to TaskSummary
      const taskSummaries: TaskSummary[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status === 'done' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'todo',
        priority: task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'high' : task.priority === 'medium' ? 'medium' : 'low',
        dueDate: task.dueDate,
        projectId: projectNameToIdMap.get(task.project) || '', // Find projectId from name
        projectName: task.project || 'No Project',
        assigneeId: undefined,
        assigneeName: task.assignee,
        tags: task.tags || [],
        estimatedHours: undefined,
        actualHours: undefined,
      }));

      // Get recent tasks (last 10)
      const recentTasks = taskSummaries.slice(0, 10);

      // Get upcoming deadlines (next 7 days)
      const upcomingDeadlines = taskSummaries
        .filter(task => {
          if (!task.dueDate) return false;
          const daysDiff = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff >= 0 && daysDiff <= 7 && task.status !== 'completed';
        })
        .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0));

      const workspaceData: WorkspaceData = {
        workspace: {
          id: workspaceResponse.data.id.toString(),
          name: workspaceResponse.data.workspaceName,
          description: workspaceResponse.data.description || '',
          type: workspaceResponse.data.workspaceType === 'GROUP' ? 'group' : 'personal',
          memberCount: workspaceResponse.data.memberCount || 1,
          createdAt: workspaceResponse.data.dateCreated ? new Date(workspaceResponse.data.dateCreated) : new Date(),
          lastActiveAt: new Date(),
        },
        stats,
        projects: projectSummaries,
        recentTasks,
        upcomingDeadlines,
        teamActivity: [], // TODO: Implement team activity
        allTasks: taskSummaries,
      };

      setData(workspaceData);
    } catch (err: any) {
      console.error('Error loading workspace data:', err);
      // Check if it's an unauthorized error
      const errorMessage = err?.message || 'Failed to load workspace data';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        setError('Please login again to access workspace data');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkspaceData();
    setRefreshing(false);
  }, [loadWorkspaceData]);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId, loadWorkspaceData]);

  const toggleStar = useCallback(async (projectId: number) => {
    if (!data) return;

    // Optimistically update UI
    const updatedProjects = data.projects.map(p => 
      p.numericId === projectId ? { ...p, isStarred: !p.isStarred } : p
    );
    setData({ ...data, projects: updatedProjects });

    try {
      await projectService.toggleStarProject(projectId);
      // No need to refresh, UI is already updated
    } catch (error) {
      console.error('Failed to toggle star status:', error);
      // Revert UI on error
      setError('Failed to update star status. Please try again.');
      const revertedProjects = data.projects.map(p =>
        p.numericId === projectId ? { ...p, isStarred: !p.isStarred } : p
      );
      setData({ ...data, projects: revertedProjects });
    }
  }, [data]);

  const updateLastOpened = useCallback(async (projectId: number) => {
    if (!data) return;

    const now = new Date();
    // Optimistically update UI
    const updatedProjects = data.projects.map(p =>
      p.numericId === projectId ? { ...p, lastOpened: now } : p
    );
    setData({ ...data, projects: updatedProjects });

    try {
      await projectService.updateProjectLastOpened(projectId);
    } catch (error) {
      console.error('Failed to update last opened timestamp:', error);
      // Don't revert, as it's a background task and not critical for UI state
    }
  }, [data]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    toggleStar,
    updateLastOpened,
  };
};

// Helper function to generate consistent colors for projects
const getProjectColor = (projectId: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[projectId % colors.length];
};
