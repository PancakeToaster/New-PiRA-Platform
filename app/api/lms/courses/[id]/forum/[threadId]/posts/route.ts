import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// POST - Create a new post in a thread
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; threadId: string }> }
) {
    try {
        const { id, threadId } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const course = await prisma.lMSCourse.findUnique({
            where: { id },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;

        // Check if thread exists and user has access
        const thread = await prisma.forumThread.findFirst({
            where: {
                id: threadId,
                lmsCourseId: id,
                OR: [
                    { isPublic: true },
                    { creatorId: user.id },
                    {
                        participants: {
                            some: {
                                userId: user.id,
                            },
                        },
                    },
                    ...(isTeacher ? [{ lmsCourseId: id }] : []),
                ],
            },
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 });
        }

        if (thread.isLocked && !isTeacher) {
            return NextResponse.json({ error: 'Thread is locked' }, { status: 403 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const post = await prisma.forumPost.create({
            data: {
                threadId,
                authorId: user.id,
                content,
            },
        });

        // Update thread's updatedAt timestamp
        await prisma.forumThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('Error creating forum post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
