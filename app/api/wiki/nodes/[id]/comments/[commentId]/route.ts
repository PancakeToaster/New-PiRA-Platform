import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/wiki/nodes/[id]/comments/[commentId]
// Resolve/Unresolve comment
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string; commentId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await req.json();
        const { isResolved } = body;

        const comment = await prisma.knowledgeComment.findUnique({
            where: { id: params.commentId },
            include: { user: true },
        });

        if (!comment) {
            return new NextResponse('Comment not found', { status: 404 });
        }

        // Only Admin or the comment author can resolve/unresolve
        const isAdmin = (session.user as any).roles?.includes('Admin');
        const isAuthor = comment.userId === session.user.id;

        if (!isAdmin && !isAuthor) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const updatedComment = await prisma.knowledgeComment.update({
            where: { id: params.commentId },
            data: { isResolved },
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error('[WIKI_COMMENT_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE /api/wiki/nodes/[id]/comments/[commentId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; commentId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const comment = await prisma.knowledgeComment.findUnique({
            where: { id: params.commentId },
        });

        if (!comment) {
            return new NextResponse('Comment not found', { status: 404 });
        }

        // Only Admin or the comment author can delete
        const isAdmin = (session.user as any).roles?.includes('Admin');
        const isAuthor = comment.userId === session.user.id;

        if (!isAdmin && !isAuthor) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        await prisma.knowledgeComment.delete({
            where: { id: params.commentId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[WIKI_COMMENT_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
