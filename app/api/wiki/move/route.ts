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
        const { type, id, destinationFolderId, destinationIndex, parentId } = body;

        if (!type || !id) {
            console.error('Invalid parameters:', { type, id, destinationFolderId });
            return NextResponse.json({
                error: 'Invalid parameters',
                received: { type, id, destinationFolderId }
            }, { status: 400 });
        }

        console.log('Move request:', { type, id, destinationFolderId, destinationIndex, parentId });

        // Helper to update orders
        const updateOrders = async (targetFolderId: string | null) => {
            // Get all sibling nodes in the destination folder (folders are now flat)
            const siblingNodes = await prisma.knowledgeNode.findMany({
                where: { folderId: targetFolderId, id: { not: id } },
                select: { id: true, order: true }
            });

            // Sort existing siblings by current order
            const siblings = siblingNodes
                .map(n => ({ id: n.id, order: n.order ?? 0 }))
                .sort((a, b) => a.order - b.order);

            // Insert item at the desired index
            const currentIndex = (typeof destinationIndex === 'number') ? destinationIndex : siblings.length;
            const newItem = { id, order: currentIndex };

            siblings.splice(currentIndex, 0, newItem);

            // Update all items with new order
            for (let i = 0; i < siblings.length; i++) {
                const item = siblings[i];
                // @ts-ignore
                await prisma.knowledgeNode.update({ where: { id: item.id }, data: { order: i } });
            }
        };

        // Folders cannot be moved (flat structure now)
        if (type === 'folder') {
            return NextResponse.json({ error: 'Folders cannot be moved (flat structure)' }, { status: 400 });
        } else if (type === 'node') {
            // If parentId is provided, set it (making this a subpage)
            if (parentId !== undefined) {
                await prisma.knowledgeNode.update({
                    where: { id },
                    data: {
                        parentId: parentId || null,
                        folderId: null, // Clear folder when setting parent
                    },
                });
            } else {
                // Otherwise, move to folder
                await prisma.knowledgeNode.update({
                    where: { id },
                    data: {
                        folderId: destinationFolderId || null,
                        parentId: null, // Clear parent when moving to folder
                    },
                });
                await updateOrders(destinationFolderId || null);
            }
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to move item:', error);
        return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
    }
}
