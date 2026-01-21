import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function PATCH(request: NextRequest) {
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.error('SERVER RECEIVED BODY:', JSON.stringify(body));
        const { type, id, destinationFolderId, destinationIndex } = body;

        if (!type || !id) {
            console.error('Invalid parameters:', { type, id, destinationFolderId });
            return NextResponse.json({
                error: 'Invalid parameters',
                received: { type, id, destinationFolderId }
            }, { status: 400 });
        }

        console.log('Move request:', { type, id, destinationFolderId, destinationIndex });

        // Helper to update orders
        const updateOrders = async (targetFolderId: string | null) => {
            // 1. Get all siblings (folders and nodes) in the destination
            const siblingFolders = await prisma.folder.findMany({
                where: { parentId: targetFolderId, id: { not: id } },
                select: { id: true, order: true }
            });
            const siblingNodes = await prisma.knowledgeNode.findMany({
                where: { folderId: targetFolderId, id: { not: id } },
                select: { id: true, order: true }
            });

            // 2. Combine and sort existing siblings by current order
            type SortableItem = { id: string; type: 'folder' | 'node'; order: number };
            const siblings: SortableItem[] = [
                ...siblingFolders.map(f => ({ id: f.id, type: 'folder' as const, order: f.order ?? 0 })),
                ...siblingNodes.map(n => ({ id: n.id, type: 'node' as const, order: n.order ?? 0 }))
            ].sort((a, b) => a.order - b.order);

            // 3. Insert user's item at the desired index
            const currentIndex = (typeof destinationIndex === 'number') ? destinationIndex : siblings.length;
            const newItem: SortableItem = { id, type: type as 'folder' | 'node', order: currentIndex };

            siblings.splice(currentIndex, 0, newItem);

            // 4. Update all items with new order
            // We use a loop for now; in production, use a single raw query or optimized updates
            for (let i = 0; i < siblings.length; i++) {
                const item = siblings[i];
                if (item.type === 'folder') {
                    // Force update order
                    // @ts-ignore: Prisma types might be stale due to lock
                    await prisma.folder.update({ where: { id: item.id }, data: { order: i } });
                } else {
                    // @ts-ignore
                    await prisma.knowledgeNode.update({ where: { id: item.id }, data: { order: i } });
                }
            }
        };

        // Validate type and IDs
        if (type === 'folder') {
            if (id === destinationFolderId) {
                return NextResponse.json({ error: 'Cannot move folder into itself' }, { status: 400 });
            }
            // Update parent first to ensure it's in the right bucket
            await prisma.folder.update({
                where: { id },
                data: { parentId: destinationFolderId || null },
            });
            // Then reorder content of that bucket
            await updateOrders(destinationFolderId || null);

        } else if (type === 'node') {
            await prisma.knowledgeNode.update({
                where: { id },
                data: { folderId: destinationFolderId || null },
            });
            await updateOrders(destinationFolderId || null);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to move item:', error);
        return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
    }
}
