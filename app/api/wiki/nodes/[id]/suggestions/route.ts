import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/permissions';

// GET /api/wiki/nodes/[id]/suggestions
// Only Admin and Teacher can view pending suggestions
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getCurrentUser();
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only users who can review or create suggestions can see them
    const canComment = await hasPermission('knowledge', 'comment');
    if (!canComment) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    try {
        const suggestions = await prisma.knowledgeSuggestion.findMany({
            where: {
                nodeId: params.id,
                status: 'pending',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(suggestions);
    } catch (error) {
        console.error('[WIKI_SUGGESTIONS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/wiki/nodes/[id]/suggestions
// Any user with 'knowledge:suggest' permission can create a suggestion
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = await getCurrentUser();
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const canSuggest = await hasPermission('knowledge', 'suggest');
    if (!canSuggest) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    try {
        const body = await req.json();
        const { content, reason } = body;

        if (!content) {
            return new NextResponse('Content is required', { status: 400 });
        }

        const suggestion = await prisma.knowledgeSuggestion.create({
            data: {
                content,
                reason,
                nodeId: params.id,
                userId: user.id,
                status: 'pending',
            },
        });

        return NextResponse.json(suggestion);
    } catch (error) {
        console.error('[WIKI_SUGGESTIONS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
