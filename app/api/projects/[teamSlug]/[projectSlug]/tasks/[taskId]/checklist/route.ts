import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamSlug: string; projectSlug: string; taskId: string }> }
) {
    const user = await getCurrentUser();
    const { taskId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Get max order
        const maxOrder = await prisma.taskChecklistItem.findFirst({
            where: { taskId },
            orderBy: { order: 'desc' }
        });

        const newItem = await prisma.taskChecklistItem.create({
            data: {
                taskId,
                content,
                order: (maxOrder?.order ?? -1) + 1,
            }
        });

        return NextResponse.json({ item: newItem }, { status: 201 });
    } catch (error) {
        console.error('Failed to create checklist item:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
