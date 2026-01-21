import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/wiki/nodes/[id]/suggestions
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const suggestions = await prisma.knowledgeSuggestion.findMany({
            where: {
                nodeId: params.id,
                status: 'pending', // Usually we only care about pending initially
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
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
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
                userId: session.user.id,
                status: 'pending',
            },
        });

        return NextResponse.json(suggestion);
    } catch (error) {
        console.error('[WIKI_SUGGESTIONS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
