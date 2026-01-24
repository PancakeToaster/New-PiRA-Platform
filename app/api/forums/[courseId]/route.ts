import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/forums/[courseId] - Get all threads for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = await params;
        const isStudent = user.roles?.includes('Student');
        const isTeacher = user.roles?.includes('Teacher');
        const isAdmin = user.roles?.includes('Admin');

        // Check if user has access to this course
        const course = await prisma.lMSCourse.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    where: { studentId: user.profiles?.student || '' },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const isInstructor = course.instructorId === user.id;
        const isEnrolled = course.enrollments.length > 0;

        if (!isAdmin && !isInstructor && !isEnrolled) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Build query based on role
        let whereClause: any = { courseId };

        if (isStudent && user.profiles?.student) {
            // Students see: their private threads + public threads
            whereClause = {
                courseId,
                OR: [
                    { studentProfileId: user.profiles.student },
                    { isPublic: true },
                ],
            };
        } else if (isTeacher || isAdmin || isInstructor) {
            // Teachers/Admins see all threads
            whereClause = { courseId };
        }

        const threads = await prisma.forumThread.findMany({
            where: whereClause,
            include: {
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
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        author: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { posts: true },
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
        return NextResponse.json(
            { error: 'Failed to fetch threads' },
            { status: 500 }
        );
    }
}

// POST /api/forums/[courseId] - Create a new thread
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId } = await params;
        const { title, content, isPublic } = await request.json();

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const isStudent = user.roles?.includes('Student');
        const isTeacher = user.roles?.includes('Teacher');
        const isAdmin = user.roles?.includes('Admin');

        // Check course access
        const course = await prisma.lMSCourse.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    where: { studentId: user.profiles?.student || '' },
                },
            },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        const isInstructor = course.instructorId === user.id;
        const isEnrolled = course.enrollments.length > 0;

        if (!isAdmin && !isInstructor && !isEnrolled) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Create thread
        const thread = await prisma.forumThread.create({
            data: {
                creatorId: user.id,
                lmsCourseId: courseId,
                title,
                studentProfileId: isStudent && user.profiles?.student ? user.profiles.student : null,
                isPublic: isPublic || false,
            },
        });

        // Create first post
        await prisma.forumPost.create({
            data: {
                threadId: thread.id,
                authorId: user.id,
                content,
            },
        });

        return NextResponse.json({ thread }, { status: 201 });
    } catch (error) {
        console.error('Error creating forum thread:', error);
        return NextResponse.json(
            { error: 'Failed to create thread' },
            { status: 500 }
        );
    }
}
