import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/utils/permissions';

// POST /api/wiki/nodes/[id]/suggestions/[suggestionId]
// Approve or Reject suggestion
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; suggestionId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only Admin can review suggestions
    const isAdmin = await hasRole(session.user, 'Admin');
    if (!isAdmin) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    try {
        const body = await req.json();
        const { action } = body; // 'approve' | 'reject'

        if (!action || !['approve', 'reject'].includes(action)) {
            return new NextResponse('Invalid action', { status: 400 });
        }

        const suggestion = await prisma.knowledgeSuggestion.findUnique({
            where: { id: params.suggestionId },
        });

        if (!suggestion) {
            return new NextResponse('Suggestion not found', { status: 404 });
        }

        if (suggestion.status !== 'pending') {
            return new NextResponse('Suggestion already processed', { status: 400 });
        }

        if (action === 'approve') {
            // Transaction: Update Node content & Mark Suggestion as approved
            await prisma.$transaction([
                prisma.knowledgeNode.update({
                    where: { id: params.id },
                    data: {
                        content: suggestion.content,
                        updatedAt: new Date(),
                    },
                }),
                prisma.knowledgeSuggestion.update({
                    where: { id: params.suggestionId },
                    data: {
                        status: 'approved',
                        reviewedAt: new Date(),
                        reviewedBy: session.user.id,
                    },
                }),
            ]);
        } else {
            // Just mark as rejected
            await prisma.knowledgeSuggestion.update({
                where: { id: params.suggestionId },
                data: {
                    status: 'rejected',
                    reviewedAt: new Date(),
                    reviewedBy: session.user.id,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[WIKI_SUGGESTION_REVIEW]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
