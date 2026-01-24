import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/forums/threads/[threadId] - Get thread with all posts
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId } = await params;

        const thread = await prisma.forumThread.findUnique({
            where: { id: threadId },
            include: {
                lmsCourse: true,
                studentProfile: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                posts: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        // Check access
        const isStudent = user.roles?.includes('Student');
        const isTeacher = user.roles?.includes('Teacher');
        const isAdmin = user.roles?.includes('Admin');
        const isInstructor = thread.lmsCourse.instructorId === user.id;

        // Check enrollment
        const enrollment = await prisma.courseEnrollment.findFirst({
            where: {
                lmsCourseId: thread.lmsCourseId,
                studentId: user.profiles?.student || '',
            },
        });

        const isEnrolled = !!enrollment;

        // Private thread access check
        if (!thread.isPublic && thread.studentProfileId) {
            const isThreadOwner = thread.studentProfileId === user.profiles?.student;
            if (!isThreadOwner && !isInstructor && !isAdmin) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        // General course access check
        if (!isAdmin && !isInstructor && !isEnrolled) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ thread });
    } catch (error) {
        console.error('Error fetching thread:', error);
        return NextResponse.json(
            { error: 'Failed to fetch thread' },
            { status: 500 }
        );
    }
}

// POST /api/forums/threads/[threadId] - Add a post to thread
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId } = await params;
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        const thread = await prisma.forumThread.findUnique({
            where: { id: threadId },
            include: { lmsCourse: true },
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        if (thread.isLocked) {
            return NextResponse.json(
                { error: 'Thread is locked' },
                { status: 403 }
            );
        }

        // Check access (same as GET)
        const isInstructor = thread.lmsCourse.instructorId === user.id;
        const isAdmin = user.roles?.includes('Admin');

        const enrollment = await prisma.courseEnrollment.findFirst({
            where: {
                lmsCourseId: thread.lmsCourseId,
                studentId: user.profiles?.student || '',
            },
        });

        const isEnrolled = !!enrollment;

        if (!thread.isPublic && thread.studentProfileId) {
            const isThreadOwner = thread.studentProfileId === user.profiles?.student;
            if (!isThreadOwner && !isInstructor && !isAdmin) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }
        }

        if (!isAdmin && !isInstructor && !isEnrolled) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Create post
        const post = await prisma.forumPost.create({
            data: {
                threadId,
                authorId: user.id,
                content,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Update thread's updatedAt
        await prisma.forumThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json(
            { error: 'Failed to create post' },
            { status: 500 }
        );
    }
}

// PATCH /api/forums/threads/[threadId] - Update thread (pin, lock, make public)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { threadId } = await params;
        const { isPinned, isLocked, isPublic } = await request.json();

        const thread = await prisma.forumThread.findUnique({
            where: { id: threadId },
            include: { lmsCourse: true },
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        // Only instructors and admins can modify thread settings
        const isInstructor = thread.lmsCourse.instructorId === user.id;
        const isAdmin = user.roles?.includes('Admin');

        if (!isInstructor && !isAdmin) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const updatedThread = await prisma.forumThread.update({
            where: { id: threadId },
            data: {
                ...(typeof isPinned === 'boolean' && { isPinned }),
                ...(typeof isLocked === 'boolean' && { isLocked }),
                ...(typeof isPublic === 'boolean' && { isPublic }),
            },
        });

        return NextResponse.json({ thread: updatedThread });
    } catch (error) {
        console.error('Error updating thread:', error);
        return NextResponse.json(
            { error: 'Failed to update thread' },
            { status: 500 }
        );
    }
}
