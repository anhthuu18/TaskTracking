const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNotifications() {
    try {
        console.log('🔍 Checking all workspace invitations...');

        const allInvitations = await prisma.workspaceInvitation.findMany({
            include: {
                workspace: {
                    select: {
                        id: true,
                        workspaceName: true,
                        workspaceType: true,
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log(`📊 Total invitations: ${allInvitations.length}`);

        allInvitations.forEach((invitation, index) => {
            console.log(`\n${index + 1}. Invitation ID: ${invitation.id}`);
            console.log(`   Email: ${invitation.email}`);
            console.log(`   Status: ${invitation.status}`);
            console.log(`   Workspace: ${invitation.workspace.workspaceName}`);
            console.log(`   Inviter: ${invitation.inviter.username} (${invitation.inviter.email})`);
            console.log(`   Created: ${invitation.createdAt}`);
            console.log(`   Expires: ${invitation.expiresAt}`);
        });

        // Check for specific users
        console.log('\n🔍 Checking invitations for anhthuu18...');
        const anhthuu18Invitations = await prisma.workspaceInvitation.findMany({
            where: {
                email: 'anhthuu18@gmail.com', // Assuming this is the email
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        workspaceName: true,
                        workspaceType: true,
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        console.log(`📊 Invitations for anhthuu18: ${anhthuu18Invitations.length}`);

        console.log('\n🔍 Checking invitations for Anhthutest...');
        const anhthutestInvitations = await prisma.workspaceInvitation.findMany({
            where: {
                email: 'Anhthu@2011', // Assuming this is the email
            },
            include: {
                workspace: {
                    select: {
                        id: true,
                        workspaceName: true,
                        workspaceType: true,
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        console.log(`📊 Invitations for Anhthutest: ${anhthutestInvitations.length}`);

    } catch (error) {
        console.error('❌ Error checking notifications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotifications();
