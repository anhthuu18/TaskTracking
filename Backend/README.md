# Task Tracking Backend

Backend API cho ứng dụng quản lý công việc sử dụng NestJS, Prisma và PostgreSQL.

## Công nghệ sử dụng

- **NestJS** - Framework Node.js
- **Prisma** - ORM cho database
- **PostgreSQL** - Database

## Cấu trúc dự án

```
src/
├── common/           # Shared utilities
├── modules/          # Feature modules
│   └── users/        # Users management
│       ├── controllers/
│       ├── dtos/
│       ├── enum/
│       ├── model/
│       ├── services/
│       └── user.module.ts
├── prisma/           # Database configuration
└── main.ts          # Application entry point
```

## Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment

Copy file `env.example` thành `.env` và cập nhật các thông tin:

```bash
cp env.example .env
```

### 3. Cấu hình database

Cập nhật `DATABASE_URL` trong file `.env`:

```
DATABASE_URL="postgresql://postgres:123456@localhost:5432/Task_Tracking"
```

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Chạy migration

```bash
npm run prisma:migrate
```

### 6. Chạy ứng dụng

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## Scripts có sẵn

- `npm run start:dev` - Chạy development mode với hot reload
- `npm run build` - Build ứng dụng
- `npm run start:prod` - Chạy production mode
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Chạy database migration
- `npm run prisma:studio` - Mở Prisma Studio để quản lý database
