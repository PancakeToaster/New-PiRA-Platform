import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// DELETE /api/admin/announcements/[id]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const isUserAdmin = await isAdmin();

        if (!isUserAdmin) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        await prisma.announcement.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ANNOUNCEMENT_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PATCH /api/admin/announcements/[id] - Toggle active status
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const isUserAdmin = await isAdmin();

        if (!isUserAdmin) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const { isActive } = await req.json();

        const announcement = await prisma.announcement.update({
            where: { id },
            data: { isActive },
        });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error('[ANNOUNCEMENT_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
