# Tasks Module

## Overview
Complete task management system with auto-assign logic, custom statuses, and priorities per project.

## Features
- ✅ Task CRUD operations
- ✅ Auto-assign based on workspace type
- ✅ Custom status per project (4 defaults)
- ✅ Custom priority per project (5 defaults)
- ✅ Permission-based access control
- ✅ Full validation & error handling

## Structure
```
tasks/
├── dto/
│   ├── create-task.dto.ts
│   ├── update-task.dto.ts
│   ├── create-task-status.dto.ts
│   ├── create-task-priority.dto.ts
│   └── index.ts
├── tasks.controller.ts    (18 endpoints)
├── tasks.service.ts       (850+ lines of business logic)
├── tasks.module.ts
└── README.md
```

## Quick Start

### 1. Import Module
```typescript
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [TasksModule],
})
export class AppModule {}
```

### 2. Use Service
```typescript
import { TasksService } from './modules/tasks/tasks.service';

@Injectable()
export class MyService {
  constructor(private tasksService: TasksService) {}

  async createTask() {
    return this.tasksService.createTask({
      taskName: 'My Task',
      projectId: 1
    }, userId);
  }
}
```

## API Endpoints

### Task CRUD
- `POST /tasks` - Create task
- `GET /tasks` - Get all user tasks
- `GET /tasks/:id` - Get task by ID
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Queries
- `GET /tasks/project/:projectId` - Get tasks by project
- `GET /tasks/workspace/:workspaceId` - Get tasks by workspace
- `GET /tasks/project/:projectId/assignees` - Get available assignees

### Status Management
- `POST /tasks/project/:projectId/statuses/default` - Create defaults
- `POST /tasks/project/:projectId/statuses` - Create custom
- `GET /tasks/project/:projectId/statuses` - Get all
- `PUT /tasks/statuses/:statusId` - Update
- `DELETE /tasks/statuses/:statusId` - Delete

### Priority Management
- `POST /tasks/project/:projectId/priorities/default` - Create defaults
- `POST /tasks/project/:projectId/priorities` - Create custom
- `GET /tasks/project/:projectId/priorities` - Get all
- `PUT /tasks/priorities/:priorityId` - Update
- `DELETE /tasks/priorities/:priorityId` - Delete

## Business Logic

### Auto-Assign Logic
```typescript
if (workspace.type === PERSONAL) {
  // Auto-assign to current user
  assignedTo = currentUser;
} else if (workspace.type === GROUP) {
  if (workspace.members.length === 0) {
    // No members: auto-assign to owner
    assignedTo = currentUser;
  } else {
    // Has members: validate assignee
    validateAssignee(assignedTo, workspace.members);
  }
}
```

### Default Values
- **Status**: "todo" (on creation)
- **Priority**: 3 (on creation)
- **Type**: "basic" (on creation)

### Default Statuses (4)
1. To Do (sortOrder: 1)
2. In Progress (sortOrder: 2)
3. Review (sortOrder: 3)
4. Done (sortOrder: 4)

### Default Priorities (5)
1. Lowest (level: 1)
2. Low (level: 2)
3. Medium (level: 3)
4. High (level: 4)
5. Highest (level: 5)

## Permissions

| Action | Required Permission |
|--------|-------------------|
| Create Task | Project member |
| Read Task | Creator, assignee, or project member |
| Update Task | Creator, assignee, or project member |
| Delete Task | Creator or Project Admin |
| Manage Status/Priority | Project Admin only |

## Validation

### Task Creation
- ✅ projectId must exist
- ✅ User must have project access
- ✅ assignedTo must be workspace member (if specified)
- ✅ status must exist in project (if specified)
- ✅ priority must be 1-5

### Task Update
- ✅ assignedTo must be workspace member
- ✅ status must exist in project
- ✅ priority must be 1-5

### Delete Status/Priority
- ✅ Cannot delete if in use by tasks
- ✅ Only Project Admin can delete

## Error Handling

```typescript
// 404 Not Found
throw new NotFoundException('Task not found or access denied');

// 403 Forbidden
throw new ForbiddenException('Admin permission required');

// 400 Bad Request
throw new BadRequestException('Assigned user must be a member of the workspace');
```

## Testing

See `Backend/TASK_API_EXAMPLES.http` for complete test scenarios.

### Example: Create Task
```http
POST http://localhost:3000/tasks
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "taskName": "Implement feature",
  "projectId": 1,
  "priority": 4
}
```

## Documentation

- **TASK_API_DOCUMENTATION.md** - Complete API docs
- **TASK_IMPLEMENTATION_GUIDE.md** - Setup & testing guide
- **TASK_API_EXAMPLES.http** - Example requests
- **QUICK_START.md** - Quick start guide

## Dependencies

- `@nestjs/common` - NestJS core
- `@prisma/client` - Database ORM
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## Database Models

- `Task` - Main task table
- `ProjectTaskStatus` - Custom statuses per project
- `ProjectTaskPriority` - Custom priorities per project

## Notes

- All endpoints require JWT authentication
- Prisma Client must be generated before use
- TypeScript server may need restart after Prisma generate

## Support

For issues or questions, check:
1. `FIX_TYPESCRIPT_ERRORS.md` - TypeScript troubleshooting
2. `TASK_IMPLEMENTATION_GUIDE.md` - Complete guide
3. Project documentation files


