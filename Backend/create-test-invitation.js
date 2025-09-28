const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestInvitation() {
    try {
        console.log('🔍 Finding workspace and inviter...');

        // Find a workspace (use the first one)
        const workspace = await prisma.workspace.findFirst({
            where: {
                workspaceType: 'GROUP',
            },
        });

        if (!workspace) {
            console.log('❌ No workspace found');
            return;
        }

        // Find anhthuu18 user by email
        const inviter = await prisma.user.findUnique({
            where: {
                email: 'truongthianhthu2011@gmail.com', // anhthuu18's email
            },
        });

        if (!inviter) {
            console.log('❌ anhthuu18 user not found');
            return;
        }

        console.log(`✅ Found workspace: ${workspace.workspaceName} (ID: ${workspace.id})`);
        console.log(`✅ Found inviter: ${inviter.email} (ID: ${inviter.id})`);

        // Create invitation for Anhthutest
        const invitation = await prisma.workspaceInvitation.create({
            data: {
                workspaceId: workspace.id,
                email: 'Anhthu@2011', // Anhthutest's email
                invitedBy: inviter.id,
                inviteType: 'EMAIL',
                status: 'PENDING',
                token: 'test-token-' + Date.now(),
                message: 'Test invitation for Anhthutest',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
        });

        console.log(`✅ Created invitation for Anhthutest (ID: ${invitation.id})`);

        // Also create invitation for anhthuu18 to test
        const invitation2 = await prisma.workspaceInvitation.create({
            data: {
                workspaceId: workspace.id,
                email: inviter.email, // anhthuu18's email
                invitedBy: inviter.id,
                inviteType: 'EMAIL',
                status: 'PENDING',
                token: 'test-token-2-' + Date.now(),
                message: 'Test invitation for anhthuu18',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
        });

        console.log(`✅ Created invitation for anhthuu18 (ID: ${invitation2.id})`);

        console.log('\n🔍 Checking invitations after creation...');

        // Check invitations for Anhthutest
        const anhthutestInvitations = await prisma.workspaceInvitation.findMany({
            where: {
                email: 'Anhthu@2011',
                status: 'PENDING',
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
                        email: true,
                    },
                },
            },
        });

        console.log(`📊 PENDING invitations for Anhthutest: ${anhthutestInvitations.length}`);
        anhthutestInvitations.forEach((inv, index) => {
            console.log(`   ${index + 1}. Workspace: ${inv.workspace.workspaceName}, Inviter: ${inv.inviter.email}`);
        });

        // Check invitations for anhthuu18
        const anhthuu18Invitations = await prisma.workspaceInvitation.findMany({
            where: {
                email: inviter.email,
                status: 'PENDING',
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
                        email: true,
                    },
                },
            },
        });

        console.log(`📊 PENDING invitations for anhthuu18: ${anhthuu18Invitations.length}`);
        anhthuu18Invitations.forEach((inv, index) => {
            console.log(`   ${index + 1}. Workspace: ${inv.workspace.workspaceName}, Inviter: ${inv.inviter.email}`);
        });

    } catch (error) {
        console.error('❌ Error creating test invitation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestInvitation();
