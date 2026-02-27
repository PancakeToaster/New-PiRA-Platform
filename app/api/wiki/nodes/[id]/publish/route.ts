import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/permissions';

// PATCH /api/wiki/nodes/[id]/publish
// Only Admins can publish or unpublish wiki pages
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function PATCH(request: NextRequest, { params }: any) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Publishing requires the dedicated 'publish' permission — Admin-only
    const canPublish = await hasPermission('knowledge', 'publish');
    if (!canPublish) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { isPublished } = await request.json();

        const node = await prisma.knowledgeNode.update({
            where: { id },
            data: { isPublished },
        });

        return NextResponse.json({ node });
    } catch (error) {
        console.error('Failed to update publish status:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
