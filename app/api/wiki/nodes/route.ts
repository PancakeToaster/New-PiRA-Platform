import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/wiki/nodes - Get all wiki nodes (for dropdowns, etc.)
export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all published knowledge nodes
        const nodes = await prisma.knowledgeNode.findMany({
            where: {
                isPublished: true,
            },
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                title: 'asc',
            },
        });

        return NextResponse.json({ nodes });
    } catch (error) {
        console.error('[WIKI_NODES_GET]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
