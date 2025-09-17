import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default permissions
  const permissions = [
    {
      permissionName: 'CREATE_PROJECT',
      description: 'Create new projects'
    },
    {
      permissionName: 'UPDATE_PROJECT',
      description: 'Update project details'
    },
    {
      permissionName: 'DELETE_PROJECT',
      description: 'Delete projects'
    },
    {
      permissionName: 'ADD_MEMBER',
      description: 'Add members to project'
    },
    {
      permissionName: 'REMOVE_MEMBER',
      description: 'Remove members from project'
    },
    {
      permissionName: 'MANAGE_ROLES',
      description: 'Create and manage project roles'
    },
    {
      permissionName: 'VIEW_PROJECT',
      description: 'View project details'
    },
    {
      permissionName: 'CREATE_TASK',
      description: 'Create tasks in project'
    },
    {
      permissionName: 'UPDATE_TASK',
      description: 'Update tasks in project'
    },
    {
      permissionName: 'DELETE_TASK',
      description: 'Delete tasks in project'
    },
    {
      permissionName: 'ASSIGN_TASK',
      description: 'Assign tasks to members'
    },
    {
      permissionName: 'VIEW_REPORTS',
      description: 'View project reports and analytics'
    }
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { permissionName: permission.permissionName },
      update: {},
      create: permission
    });
  }

  console.log('Permissions seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
