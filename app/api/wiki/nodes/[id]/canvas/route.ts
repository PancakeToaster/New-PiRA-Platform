import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import { hasRole } from '@/lib/permissions';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admins can edit canvas data
        if (!await hasRole('Admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { canvasData } = body;

        // Update the node canvas data
        const updatedNode = await prisma.knowledgeNode.update({
            where: { id },
            data: {
                canvasData,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            updatedAt: updatedNode.updatedAt,
        });
    } catch (error) {
        console.error('Canvas update error:', error);
        return NextResponse.json(
            { error: 'Failed to update canvas data' },
            { status: 500 }
        );
    }
}
