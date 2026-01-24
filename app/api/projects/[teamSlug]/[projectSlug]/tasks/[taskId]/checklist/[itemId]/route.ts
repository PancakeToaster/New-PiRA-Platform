import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string; itemId: string }> }
) {
    const user = await getCurrentUser();
    const { itemId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { isCompleted, content, order } = body;

        const updatedItem = await prisma.taskChecklistItem.update({
            where: { id: itemId },
            data: {
                isCompleted,
                content,
                order,
            }
        });

        return NextResponse.json({ item: updatedItem });
    } catch (error) {
        console.error('Failed to update checklist item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string; itemId: string }> }
) {
    const user = await getCurrentUser();
    const { itemId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.taskChecklistItem.delete({
            where: { id: itemId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete checklist item:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
