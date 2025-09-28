import { PrismaClient, WorkspaceType, MemberRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding workspace members...');

  // Find all GROUP workspaces that don't have workspace members
  const groupWorkspaces = await prisma.workspace.findMany({
    where: {
      workspaceType: WorkspaceType.GROUP,
      dateDeleted: null,
    },
    include: {
      workspaceMembers: true,
    },
  });

  for (const workspace of groupWorkspaces) {
    // If workspace has no members, add the creator as OWNER
    if (workspace.workspaceMembers.length === 0) {
      console.log(`Adding owner member for workspace: ${workspace.workspaceName}`);
      
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: workspace.userId,
          role: MemberRole.OWNER,
        },
      });
    }
  }

  console.log('✅ Workspace member seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });