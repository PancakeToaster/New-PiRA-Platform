import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

// GET - List forum threads for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Get threads where user has access
        const threads = await prisma.forumThread.findMany({
            where: {
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
            include: {
                creator: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
            orderBy: [
                { isPinned: 'desc' },
                { updatedAt: 'desc' },
            ],
        });

        return NextResponse.json({ threads });
    } catch (error) {
        console.error('Error fetching forum threads:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new forum thread
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Check if user is enrolled or is the instructor
        const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;
        const isStudent = user.profiles?.student;

        if (!isTeacher && !isStudent) {
            return NextResponse.json({ error: 'Not enrolled in course' }, { status: 403 });
        }

        if (isStudent) {
            const enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    lmsCourseId_studentId: {
                        lmsCourseId: id,
                        studentId: isStudent as string,
                    },
                },
            });

            if (!enrollment) {
                return NextResponse.json({ error: 'Not enrolled in course' }, { status: 403 });
            }
        }

        const body = await request.json();
        const { title, content, isPublic = false } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        // Create thread and initial post in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const thread = await tx.forumThread.create({
                data: {
                    lmsCourseId: id,
                    creatorId: user.id,
                    title,
                    isPublic,
                    studentProfileId: typeof isStudent === 'string' ? isStudent : null,
                },
            });

            // Create initial post
            await tx.forumPost.create({
                data: {
                    threadId: thread.id,
                    authorId: user.id,
                    content,
                },
            });

            // If private and user is a student, automatically add the instructor as a participant
            if (!isPublic && isStudent) {
                await tx.forumThreadParticipant.create({
                    data: {
                        threadId: thread.id,
                        userId: course.instructorId!,
                        addedBy: user.id,
                    },
                });
            }

            return thread;
        });

        return NextResponse.json({ threadId: result.id }, { status: 201 });
    } catch (error) {
        console.error('Error creating forum thread:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
