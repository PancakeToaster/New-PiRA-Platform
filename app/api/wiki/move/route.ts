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
        const updateOrders = async (targetFolderId: string | null, targetParentId: string | null) => {
            // Get all sibling nodes in the destination context
            const whereClause: any = { id: { not: id } };

            if (targetParentId) {
                whereClause.parentId = targetParentId;
                whereClause.folderId = null; // Subpages shouldn't have folderId usually, but explicit check safe
            } else if (targetFolderId) {
                whereClause.folderId = targetFolderId;
                whereClause.parentId = null;
            } else {
                // Root
                whereClause.folderId = null;
                whereClause.parentId = null;
            }

            const siblingNodes = await prisma.knowledgeNode.findMany({
                where: whereClause,
                select: { id: true, order: true }
            });

            // Sort existing siblings by current order
            const siblings = siblingNodes
                .map(n => ({ id: n.id, order: n.order ?? 0 }))
                .sort((a, b) => a.order - b.order);

            // Insert item at the desired index
            // Clamp to valid range [0, siblings.length]
            let targetIndex = (typeof destinationIndex === 'number') ? destinationIndex : siblings.length;
            targetIndex = Math.max(0, Math.min(targetIndex, siblings.length));

            const newItem = { id, order: targetIndex };

            siblings.splice(targetIndex, 0, newItem);

            // Update all items with new order
            for (let i = 0; i < siblings.length; i++) {
                const item = siblings[i];
                // @ts-ignore
                await prisma.knowledgeNode.update({ where: { id: item.id }, data: { order: i } });
            }
        };

        // Folders cannot be moved INTO other folders (flat structure)
        if (type === 'folder') {
            // Folders are always at root, so destinationFolderId must be null for them.
            // If user tries to drop folder into folder, we treat it as reordering at root or reject.
            // Let's assume reordering at root.

            // Note: We ignore destinationFolderId for folders as they are always root.
            // Just update order among other folders.

            const siblingFolders = await prisma.folder.findMany({
                select: { id: true, order: true }
            });

            // Sort existing siblings by current order
            const siblings = siblingFolders
                .filter(f => f.id !== id)
                .map(f => ({ id: f.id, order: f.order ?? 0 }))
                .sort((a, b) => a.order - b.order);

            // Insert item at the desired index
            // Clamp to valid range [0, siblings.length]
            let targetIndex = (typeof destinationIndex === 'number') ? destinationIndex : siblings.length;
            targetIndex = Math.max(0, Math.min(targetIndex, siblings.length));

            const newItem = { id, order: targetIndex };

            siblings.splice(targetIndex, 0, newItem);

            // Update all items with new order
            console.log('Updating folder orders:', siblings.map(s => ({ id: s.id, newOrder: siblings.indexOf(s) })));
            for (let i = 0; i < siblings.length; i++) {
                const item = siblings[i];
                await prisma.folder.update({ where: { id: item.id }, data: { order: i } });
            }
            console.log('Folder reorder complete');

        } else if (type === 'node') {
            // Priority:
            // 1. Moving to a Parent Node (Subpage) -> parentId is set (not null)
            // 2. Moving to a Folder -> destinationFolderId is set (not null)
            // 3. Moving to Root -> Both are null

            console.log('Node move - parentId:', parentId, 'destinationFolderId:', destinationFolderId);

            if (parentId) {
                // Move to be a subpage
                console.log('Moving node to be subpage of:', parentId);
                await prisma.knowledgeNode.update({
                    where: { id },
                    data: {
                        parentId: parentId,
                        folderId: null,
                    },
                });
            } else if (destinationFolderId) {
                // Move to a folder
                console.log('Moving node to folder:', destinationFolderId);
                await prisma.knowledgeNode.update({
                    where: { id },
                    data: {
                        folderId: destinationFolderId,
                        parentId: null,
                    },
                });
            } else {
                // Move to Root
                console.log('Moving node to root');
                await prisma.knowledgeNode.update({
                    where: { id },
                    data: {
                        folderId: null,
                        parentId: null,
                    },
                });
            }

            // Always update order in the destination context
            console.log('Updating node orders with folderId:', destinationFolderId, 'parentId:', parentId);
            await updateOrders(destinationFolderId || null, parentId || null);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to move item:', error);
        return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
    }
}
