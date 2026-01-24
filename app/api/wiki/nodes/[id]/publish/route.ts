import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin, hasPermission } from '@/lib/permissions';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function PATCH(request: NextRequest, { params }: any) {
    const { id } = await params;
    const user = await getCurrentUser();
    const canEdit = await hasPermission('knowledge', 'edit');

    if (!user || !canEdit) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
