import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // e.g., 'active' or 'returned'

        // Verify membership
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });

        const userIsAdmin = user.roles.some((role: string) => role === 'Admin' || role === 'Teacher');

        if (!membership && !userIsAdmin) {
            return NextResponse.json({ error: 'Unauthorized to view team inventory' }, { status: 403 });
        }

        const whereClause: any = { teamId };
        if (status) {
            whereClause.status = status;
        }

        const checkouts = await prisma.inventoryCheckout.findMany({
            where: whereClause,
            include: {
                item: true,
                user: { select: { firstName: true, lastName: true, avatar: true } },
                project: { select: { name: true, slug: true } }
            },
            orderBy: { checkoutDate: 'desc' },
        });

        return NextResponse.json({ checkouts });
    } catch (error) {
        console.error('Failed to fetch team checkouts:', error);
        return NextResponse.json({ error: 'Failed to fetch checkouts' }, { status: 500 });
    }
}
