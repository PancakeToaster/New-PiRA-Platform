import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { slugify } from '@/lib/utils';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function PATCH(request: NextRequest, { params }: any) {
    const { id } = await params;
    const user = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!user || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title } = await request.json();

        if (!title || title.trim().length === 0) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Optional: Update slug when title changes? 
        // Usually better to keep slug stable to avoid broken links, unless explicitly requested.
        // For now, we update title only.

        const node = await prisma.knowledgeNode.update({
            where: { id },
            data: { title },
        });

        return NextResponse.json({ node });
    } catch (error) {
        console.error('Failed to update title:', error);
        return NextResponse.json({ error: 'Failed to update title' }, { status: 500 });
    }
}
