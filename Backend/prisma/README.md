# Prisma Schema Structure

Schema đơn giản cho setup ban đầu với 5 tables cơ bản.

## 📁 Cấu trúc thư mục

```
prisma/
├── schema.prisma              # Main schema file
├── seed.ts                    # Seed data
└── README.md                  # This file
```

## 🗂️ Schema Breakdown

### 🔐 **Core Authentication & Authorization**
- **Users** - Thông tin người dùng
- **Roles** - Vai trò hệ thống  
- **Permissions** - Quyền hạn
- **ProjectRoles** - Gán role cho user trong project
- **ProjectRolePermissions** - Gán quyền cho role

## 🔗 Relations

```
Users (1) ←→ (N) ProjectRoles (N) ←→ (1) Roles
ProjectRoles (1) ←→ (N) ProjectRolePermissions (N) ←→ (1) Permissions
```

## 🚀 Lợi ích của schema đơn giản

### ✅ **Ưu điểm:**
1. **Dễ hiểu** - Tất cả trong 1 file
2. **Quick setup** - Nhanh chóng triển khai
3. **Maintainability** - Dễ debug và sửa lỗi
4. **Performance** - Ít complexity

### 📈 **Khi nào nên tách schema:**
- Schema > 10 tables
- Nhiều domains khác biệt
- Team > 2 developers
- Dự án lớn, phức tạp

## 🔧 Cách sử dụng

### Generate Prisma Client:
```bash
npm run prisma:generate
```

### Migration:
```bash
npm run prisma:migrate
```

### Seed data:
```bash
npm run prisma:seed
```

## 📝 Quy tắc đặt tên

1. **Model names**: PascalCase (Users, ProjectRoles)
2. **Field names**: camelCase (userID, projectName)
3. **Table names**: PascalCase với @@map (Users, ProjectRoles)

## 🔄 Workflow phát triển

1. **Thêm model mới**: Thêm vào schema.prisma
2. **Migration**: Chạy sau khi thay đổi schema
3. **Update seed**: Cập nhật dữ liệu mẫu nếu cần
4. **Tách schema**: Khi dự án phát triển lớn hơn
