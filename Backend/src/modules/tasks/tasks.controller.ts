import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, CreateTaskStatusDto, CreateTaskPriorityDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Create a new task
   * POST /tasks
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.createTask(createTaskDto, req.user.userId);
  }

  /**
   * Get tasks by project
   * GET /tasks/project/:projectId
   */
  @Get('project/:projectId')
  async getTasksByProject(@Param('projectId', ParseIntPipe) projectId: number, @Request() req) {
    return this.tasksService.getTasksByProject(projectId, req.user.userId);
  }

  /**
   * Get tasks by workspace
   * GET /tasks/workspace/:workspaceId
   */
  @Get('workspace/:workspaceId')
  async getTasksByWorkspace(@Param('workspaceId', ParseIntPipe) workspaceId: number, @Request() req) {
    return this.tasksService.getTasksByWorkspace(workspaceId, req.user.userId);
  }

  /**
   * Get available assignees for a project
   * GET /tasks/project/:projectId/assignees
   */
  @Get('project/:projectId/assignees')
  async getAvailableAssignees(@Param('projectId', ParseIntPipe) projectId: number, @Request() req) {
    return this.tasksService.getAvailableAssignees(projectId, req.user.userId);
  }

  /**
   * Get all tasks for current user
   * GET /tasks
   */
  @Get()
  async getUserTasks(@Request() req) {
    return this.tasksService.getUserTasks(req.user.userId);
  }

  /**
   * Get task by ID
   * GET /tasks/:id
   */
  @Get(':id')
  async getTaskById(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.getTaskById(id, req.user.userId);
  }

  /**
   * Update task
   * PUT /tasks/:id
   */
  @Put(':id')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req
  ) {
    return this.tasksService.updateTask(id, updateTaskDto, req.user.userId);
  }

  /**
   * Delete task
   * DELETE /tasks/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTask(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.deleteTask(id, req.user.userId);
  }

  /**
   * Create default task statuses for a project
   * POST /tasks/project/:projectId/statuses/default
   */
  @Post('project/:projectId/statuses/default')
  @HttpCode(HttpStatus.CREATED)
  async createDefaultTaskStatuses(@Param('projectId', ParseIntPipe) projectId: number, @Request() req) {
    return this.tasksService.createDefaultTaskStatuses(projectId, req.user.userId);
  }

  /**
   * Create custom task status for a project
   * POST /tasks/project/:projectId/statuses
   */
  @Post('project/:projectId/statuses')
  @HttpCode(HttpStatus.CREATED)
  async createTaskStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createStatusDto: CreateTaskStatusDto,
    @Request() req
  ) {
    return this.tasksService.createTaskStatus(projectId, createStatusDto, req.user.userId);
  }

  /**
   * Get task statuses for a project
   * GET /tasks/project/:projectId/statuses
   */
  @Get('project/:projectId/statuses')
  async getTaskStatuses(@Param('projectId', ParseIntPipe) projectId: number, @Request() req) {
    return this.tasksService.getTaskStatuses(projectId, req.user.userId);
  }

  /**
   * Update task status
   * PUT /tasks/statuses/:statusId
   */
  @Put('statuses/:statusId')
  async updateTaskStatus(
    @Param('statusId', ParseIntPipe) statusId: number,
    @Body() updateData: Partial<CreateTaskStatusDto>,
    @Request() req
  ) {
    return this.tasksService.updateTaskStatus(statusId, updateData, req.user.userId);
  }

  /**
   * Delete task status
   * DELETE /tasks/statuses/:statusId
   */
  @Delete('statuses/:statusId')
  @HttpCode(HttpStatus.OK)
  async deleteTaskStatus(@Param('statusId', ParseIntPipe) statusId: number, @Request() req) {
    return this.tasksService.deleteTaskStatus(statusId, req.user.userId);
  }

  /**
   * Create default task priorities for a project
   * POST /tasks/project/:projectId/priorities/default
   */
  @Post('project/:projectId/priorities/default')
  @HttpCode(HttpStatus.CREATED)
  async createDefaultTaskPriorities(@Param('projectId', ParseIntPipe) projectId: number, @Request() req) {
    return this.tasksService.createDefaultTaskPriorities(projectId, req.user.userId);
  }

  /**
   * Create custom task priority for a project
   * POST /tasks/project/:projectId/priorities
   */
  @Post('project/:projectId/priorities')
  @HttpCode(HttpStatus.CREATED)
  async createTaskPriority(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createPriorityDto: CreateTaskPriorityDto,
    @Request() req
  ) {
    return this.tasksService.createTaskPriority(projectId, createPriorityDto, req.user.userId);
  }

  /**
   * Get task priorities for a project
   * GET /tasks/project/:projectId/priorities
   */
  @Get('project/:projectId/priorities')
  async getTaskPriorities(@Param('projectId', ParseIntPipe) projectId: number, @Request() req) {
    return this.tasksService.getTaskPriorities(projectId, req.user.userId);
  }

  /**
   * Update task priority
   * PUT /tasks/priorities/:priorityId
   */
  @Put('priorities/:priorityId')
  async updateTaskPriority(
    @Param('priorityId', ParseIntPipe) priorityId: number,
    @Body() updateData: Partial<CreateTaskPriorityDto>,
    @Request() req
  ) {
    return this.tasksService.updateTaskPriority(priorityId, updateData, req.user.userId);
  }

  /**
   * Delete task priority
   * DELETE /tasks/priorities/:priorityId
   */
  @Delete('priorities/:priorityId')
  @HttpCode(HttpStatus.OK)
  async deleteTaskPriority(@Param('priorityId', ParseIntPipe) priorityId: number, @Request() req) {
    return this.tasksService.deleteTaskPriority(priorityId, req.user.userId);
  }
}

