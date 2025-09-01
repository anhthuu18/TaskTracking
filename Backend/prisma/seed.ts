import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seeding dữ liệu mẫu...');

  // Tạo roles cơ bản
  await prisma.roles.upsert({
    where: { roleID: 1 },
    update: {},
    create: {
      roleName: 'Admin',
      description: 'Quản trị viên có toàn quyền truy cập',
    },
  });

  await prisma.roles.upsert({
    where: { roleID: 2 },
    update: {},
    create: {
      roleName: 'Member',
      description: 'Thành viên có quyền hạn chế',
    },
  });

  // Tạo permissions cơ bản
  const permissions = [
    { name: 'CREATE_TASK', description: 'Tạo task mới' },
    { name: 'UPDATE_TASK', description: 'Cập nhật task' },
    { name: 'DELETE_TASK', description: 'Xóa task' },
    { name: 'VIEW_TASK', description: 'Xem task' },
    { name: 'MANAGE_PROJECT', description: 'Quản lý project' },
    { name: 'MANAGE_MEMBERS', description: 'Quản lý thành viên' },
  ];

  for (let i = 0; i < permissions.length; i++) {
    const permission = permissions[i];
    await prisma.permissions.upsert({
      where: { permissionID: i + 1 },
      update: {},
      create: {
        permissionName: permission.name,
        description: permission.description,
      },
    });
  }

  console.log('Seeding hoàn thành!');
  console.log(`Đã tạo ${permissions.length} permissions và 2 roles cơ bản`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
