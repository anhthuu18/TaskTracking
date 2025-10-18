import { Task, TaskStatus, TaskPriority } from '../types/Task';
import { generateId } from '../utils/helpers';

/**
 * Service for managing tasks
 */
class TaskService {
  private tasks: Task[] = [];

  constructor() {
    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    this.tasks = [
      {
        id: '1',
        title: 'Phát triển giao diện đăng nhập',
        description: 'Tạo màn hình đăng nhập với xác thực JWT và validation form',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assignee: 'Nguyễn Văn A',
        dueDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10'),
        tags: ['Frontend', 'Authentication', 'UI/UX'],
      },
      {
        id: '2',
        title: 'Thiết kế database schema',
        description: 'Thiết kế cấu trúc cơ sở dữ liệu cho hệ thống quản lý task',
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        assignee: 'Trần Thị B',
        dueDate: new Date('2024-01-12'),
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        tags: ['Database', 'Backend'],
      },
      {
        id: '3',
        title: 'Viết API endpoints',
        description: 'Phát triển các API REST cho CRUD operations của tasks',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        assignee: 'Lê Văn C',
        dueDate: new Date('2024-01-08'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08'),
        tags: ['Backend', 'API'],
      },
      {
        id: '4',
        title: 'Thiết lập CI/CD pipeline',
        description: 'Cấu hình GitHub Actions cho auto deployment',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        assignee: 'Phạm Văn D',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
        tags: ['DevOps', 'Automation'],
      },
    ];
  }

  /**
   * Get all tasks
   */
  public async getAllTasks(): Promise<Task[]> {
    // Simulate API delay
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return [...this.tasks];
  }

  /**
   * Get task by ID
   */
  public async getTaskById(id: string): Promise<Task | null> {
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    return this.tasks.find(task => task.id === id) || null;
  }

  /**
   * Create new task
   */
  public async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.push(newTask);
    return newTask;
  }

  /**
   * Update task
   */
  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return this.tasks[taskIndex];
  }

  /**
   * Delete task
   */
  public async deleteTask(id: string): Promise<boolean> {
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return false;

    this.tasks.splice(taskIndex, 1);
    return true;
  }

  /**
   * Update task status
   */
  public async updateTaskStatus(id: string, status: TaskStatus): Promise<Task | null> {
    return this.updateTask(id, { status });
  }

  /**
   * Search tasks
   */
  public async searchTasks(query: string): Promise<Task[]> {
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    
    const lowercaseQuery = query.toLowerCase();
    return this.tasks.filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.assignee?.toLowerCase().includes(lowercaseQuery) ||
      task.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Filter tasks by status
   */
  public async filterTasksByStatus(status: TaskStatus): Promise<Task[]> {
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    return this.tasks.filter(task => task.status === status);
  }

  /**
   * Get tasks by workspace ID (for compatibility with new dashboard)
   */
  public async getTasksByWorkspace(workspaceId: string): Promise<{ success: boolean; data?: Task[]; message?: string }> {
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        data: [...this.tasks],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch tasks',
      };
    }
  }

  /**
   * Get upcoming tasks (for compatibility with new dashboard)
   */
  public async getUpcomingTasks(workspaceId: string, days: number = 7): Promise<{ success: boolean; data?: Task[]; message?: string }> {
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);
      
      const upcomingTasks = this.tasks.filter(task => {
        if (!task.dueDate) return false;
        return task.dueDate >= now && task.dueDate <= futureDate && task.status !== TaskStatus.DONE;
      });
      
      return {
        success: true,
        data: upcomingTasks,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch upcoming tasks',
      };
    }
  }
}

export const taskService = new TaskService();