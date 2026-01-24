import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/wiki/nodes/[id]/comments
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    const canComment = await hasPermission('knowledge', 'comment');

    if (!session || !canComment) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const comments = await prisma.knowledgeComment.findMany({
            where: {
                nodeId: params.id,
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
                createdAt: 'asc',
            },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error('[WIKI_COMMENTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/wiki/nodes/[id]/comments
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    const canComment = await hasPermission('knowledge', 'comment');

    if (!session || !canComment) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { content } = body;

        if (!content) {
            return new NextResponse('Content is required', { status: 400 });
        }

        const comment = await prisma.knowledgeComment.create({
            data: {
                content,
                nodeId: params.id,
                userId: session.user.id,
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
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error('[WIKI_COMMENTS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
