
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { logActivity } from '@/lib/logging';

export async function POST(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { userIds, action, data } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'No users selected' }, { status: 400 });
        }

        if (userIds.includes(currentUser.id) && action === 'delete') {
            return NextResponse.json({ error: 'You cannot delete yourself.' }, { status: 400 });
        }

        let result;

        if (action === 'delete') {
            result = await prisma.$transaction(async (tx) => {
                const deleted = await tx.user.deleteMany({
                    where: { id: { in: userIds } },
                });

                // Log
                for (const uid of userIds) {
                    // Note: logging typically happens after, but we want to capture who did what. 
                    // Since deleteMany doesn't return deleted records, we'd have to find them first if we want detailed logs,
                    // but for bulk delete, a summary log or individual loose logs are okay.
                    // We'll just log a bulk entry below.
                }
                return deleted;
            });

            await logActivity({
                userId: currentUser.id,
                action: 'users.bulk_delete',
                entityType: 'User',
                entityId: 'bulk',
                details: { count: result.count, userIds },
                ipAddress: request.headers.get('x-forwarded-for') || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            });

        } else if (action === 'add_role') {
            const roleName = data?.roleName;
            if (!roleName) return NextResponse.json({ error: 'Role name required' }, { status: 400 });

            const role = await prisma.role.findUnique({ where: { name: roleName } });
            if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

            // Add role to all users (ignore duplicates)
            result = await prisma.$transaction(async (tx) => {
                let count = 0;
                for (const userId of userIds) {
                    // Check if user has role
                    const existing = await tx.userRole.findUnique({
                        where: { userId_roleId: { userId, roleId: role.id } }
                    });
                    if (!existing) {
                        await tx.userRole.create({ data: { userId, roleId: role.id } });
                        count++;
                    }
                }
                return { count };
            });

            await logActivity({
                userId: currentUser.id,
                action: 'users.bulk_add_role',
                entityType: 'User',
                entityId: 'bulk',
                details: { role: roleName, count: result.count },
            });

        } else if (action === 'remove_role') {
            const roleName = data?.roleName;
            if (!roleName) return NextResponse.json({ error: 'Role name required' }, { status: 400 });

            const role = await prisma.role.findUnique({ where: { name: roleName } });
            if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

            result = await prisma.userRole.deleteMany({
                where: {
                    userId: { in: userIds },
                    roleId: role.id
                }
            });

            await logActivity({
                userId: currentUser.id,
                action: 'users.bulk_remove_role',
                entityType: 'User',
                entityId: 'bulk',
                details: { role: roleName, count: result.count },
            });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: result.count });

    } catch (error) {
        console.error('Bulk action error:', error);
        return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
    }
}
