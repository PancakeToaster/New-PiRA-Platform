import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// PATCH - Update folder (rename)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { name } = await request.json();

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const folder = await prisma.folder.update({
            where: { id },
            data: { name: name.trim() },
        });

        return NextResponse.json({ folder });
    } catch (error) {
        console.error('Failed to update folder:', error);
        return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
    }
}

// DELETE - Delete folder
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Check if folder has any nodes
        const nodeCount = await prisma.knowledgeNode.count({
            where: { folderId: id },
        });

        if (nodeCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete folder with ${nodeCount} page(s). Please move or delete the pages first.` },
                { status: 400 }
            );
        }

        await prisma.folder.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete folder:', error);
        return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
    }
}
