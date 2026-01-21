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

        // Only Admins can edit content directly
        if (!hasRole(user, 'Admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        // Content validation removed to support Markdown (plain text)
        // previously: Validate that content is valid JSON

        // Update the node content
        const updatedNode = await prisma.knowledgeNode.update({
            where: { id },
            data: {
                content,
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
        console.error('Content update error:', error);
        return NextResponse.json(
            { error: 'Failed to update content' },
            { status: 500 }
        );
    }
}
