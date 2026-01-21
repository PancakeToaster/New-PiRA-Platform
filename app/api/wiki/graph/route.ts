import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all folders and knowledge nodes
        const [folders, nodes] = await Promise.all([
            prisma.folder.findMany({
                select: {
                    id: true,
                    name: true,
                    parentId: true,
                },
            }),
            prisma.knowledgeNode.findMany({
                select: {
                    id: true,
                    title: true,
                    folderId: true,
                    nodeType: true,
                    slug: true,
                },
            }),
        ]);

        // Transform into React Flow format
        const graphNodes = [
            // Folders
            ...folders.map(folder => ({
                id: folder.id,
                type: 'folder',
                data: {
                    label: folder.name,
                    type: 'folder',
                    parentId: folder.parentId
                },
                position: { x: 0, y: 0 }, // Position will be calculated by layout engine
            })),
            // Knowledge Nodes
            ...nodes.map(node => ({
                id: node.id,
                type: 'file',
                data: {
                    label: node.title,
                    type: node.nodeType,
                    slug: node.slug,
                    folderId: node.folderId
                },
                position: { x: 0, y: 0 },
            })),
        ];

        const graphEdges = [
            // Folder hierarchy
            ...folders
                .filter(folder => folder.parentId)
                .map(folder => ({
                    id: `e-${folder.parentId}-${folder.id}`,
                    source: folder.parentId!,
                    target: folder.id,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#cbd5e1' },
                })),
            // Node hierarchy (files in folders)
            ...nodes
                .filter(node => node.folderId)
                .map(node => ({
                    id: `e-${node.folderId}-${node.id}`,
                    source: node.folderId!,
                    target: node.id,
                    type: 'smoothstep',
                    style: { stroke: '#94a3b8' },
                })),
        ];

        return NextResponse.json({
            nodes: graphNodes,
            edges: graphEdges,
        });

    } catch (error) {
        console.error('Graph data fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch graph data' },
            { status: 500 }
        );
    }
}
