import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { clientHasRole } from '@/lib/permissions-client';
import { logActivity } from '@/lib/logging';

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();

    // Basic security check - though simplified permissions check might need role string directly
    // 'clientHasRole' is for client-side, here we check server-side roles
    const isAdmin = user?.roles.includes('Admin');

    if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, approve, action } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        if (approve) {
            // Approve user
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { isApproved: true },
            });

            await logActivity({
                userId: user.id,
                action: 'user.approved',
                entityType: 'User',
                entityId: userId,
                ipAddress: request.headers.get('x-forwarded-for') || undefined,
                userAgent: request.headers.get('user-agent') || undefined,
            });

            return NextResponse.json({ user: updatedUser });
        } else {
            // Check explicit action
            if (action === 'reject') {
                // Permanently delete (Reject)
                await prisma.user.delete({
                    where: { id: userId },
                });

                await logActivity({
                    userId: user.id,
                    action: 'user.rejected',
                    entityType: 'User',
                    entityId: userId,
                    ipAddress: request.headers.get('x-forwarded-for') || undefined,
                    userAgent: request.headers.get('user-agent') || undefined,
                });

                return NextResponse.json({ message: 'User rejected and deleted' });
            } else {
                // Just suspend/deactivate
                const updatedUser = await prisma.user.update({
                    where: { id: userId },
                    data: { isApproved: false },
                });

                await logActivity({
                    userId: user.id,
                    action: 'user.deactivated',
                    entityType: 'User',
                    entityId: userId,
                    ipAddress: request.headers.get('x-forwarded-for') || undefined,
                    userAgent: request.headers.get('user-agent') || undefined,
                });

                return NextResponse.json({ user: updatedUser, message: 'User deactivated' });
            }
        }

    } catch (error) {
        console.error('Failed to process approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
