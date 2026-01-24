import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasRole, hasPermission } from '@/lib/permissions';
import { logActivity } from '@/lib/logging';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only users with edit permission can update content
        const canEdit = await hasPermission('knowledge', 'edit');
        if (!canEdit) {
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

        await logActivity({
            userId: user.id,
            action: 'wiki.content.updated',
            entityType: 'KnowledgeNode',
            entityId: id,
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined,
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
