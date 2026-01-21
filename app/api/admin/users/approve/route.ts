import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { clientHasRole } from '@/lib/permissions-client';

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();

    // Basic security check - though simplified permissions check might need role string directly
    // 'clientHasRole' is for client-side, here we check server-side roles
    const isAdmin = user?.roles.includes('Admin');

    if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { userId, approve } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        if (approve) {
            // Approve user
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { isApproved: true },
            });
            return NextResponse.json({ user: updatedUser });
        } else {
            // Reject (Delete) user? Or just leave unapproved?
            // "I don't want people to make account and access anything without approval"
            // Deleting rejected accounts keeps the DB clean.
            await prisma.user.delete({
                where: { id: userId },
            });
            return NextResponse.json({ message: 'User rejected and deleted' });
        }

    } catch (error) {
        console.error('Failed to process approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
