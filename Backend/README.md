# Task Tracking Backend - Schema Setup

Backend cơ bản cho ứng dụng quản lý task với NestJS, Prisma và PostgreSQL.
**Chỉ bao gồm schema và CRUD cơ bản cho Users, Roles, Permissions.**

## Cấu trúc thư mục

```
Backend/src/
├── config/              # Cấu hình ứng dụng
├── controllers/         # Controllers xử lý HTTP requests
├── services/           # Business logic services
├── dto/                # Data Transfer Objects
├── database/           # Prisma service
└── main.ts
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/task_tracking?schema=public"
PORT=3000
NODE_ENV="development"
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Chạy migration để tạo database:
```bash
npm run prisma:migrate
```

5. Seed dữ liệu mẫu:
```bash
npm run prisma:seed
```

## Chạy ứng dụng

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Users
- `GET /users` - Lấy danh sách users
- `GET /users/:id` - Lấy thông tin user theo ID
- `POST /users` - Tạo user mới
- `PUT /users/:id` - Cập nhật user
- `DELETE /users/:id` - Xóa user (soft delete)

### Roles
- `GET /roles` - Lấy danh sách roles
- `GET /roles/:id` - Lấy thông tin role theo ID
- `POST /roles` - Tạo role mới
- `PUT /roles/:id` - Cập nhật role
- `DELETE /roles/:id` - Xóa role

### Permissions
- `GET /permissions` - Lấy danh sách permissions
- `GET /permissions/:id` - Lấy thông tin permission theo ID
- `POST /permissions` - Tạo permission mới
- `PUT /permissions/:id` - Cập nhật permission
- `DELETE /permissions/:id` - Xóa permission

## Database Schema

### Các bảng chính:
- **Users**: Thông tin người dùng (UserID, username, email, password)
- **Roles**: Các vai trò (RoleID, roleName, description)
- **Permissions**: Các quyền hạn cụ thể (PermissionID, permissionName, description)
- **ProjectRoles**: Gán role cho user trong project (liên kết Users, Roles)
- **ProjectRolePermissions**: Gán quyền cho role (liên kết ProjectRoles, Permissions)

## Technology Stack

- **NestJS**: Framework Node.js
- **Prisma**: ORM for PostgreSQL
- **PostgreSQL**: Database
- **class-validator**: Validation
- **TypeScript**: Language
