import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function DELETE(request: NextRequest, { params }: any) {
    const { id } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check if node exists and has children/is used?
        // For now, cascade delete is configured in schema or we just delete.
        // Schema says: 
        // nodes    KnowledgeNode[] (in Folder) - not relevant
        // But check relations.

        await prisma.knowledgeNode.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete node:', error);
        return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
    }
}
