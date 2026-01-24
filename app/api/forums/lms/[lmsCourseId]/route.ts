import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/forums/lms/[lmsCourseId] - Get all threads for an LMS course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lmsCourseId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lmsCourseId } = await params;
        const isStudent = user.roles?.includes('Student');
        const isTeacher = user.roles?.includes('Teacher');
        const isAdmin = user.roles?.includes('Admin');

        // Check if user has access to this LMS course
        const lmsCourse = await prisma.lMSCourse.findUnique({
            where: { id: lmsCourseId },
            include: {
                enrollments: {
                    where: { studentId: user.profiles?.student || '' },
                },
            },
        });

        if (!lmsCourse) {
            return NextResponse.json({ error: 'LMS Course not found' }, { status: 404 });
        }

        const isInstructor = lmsCourse.instructorId === user.id;
        const isEnrolled = lmsCourse.enrollments.length > 0;

        if (!isAdmin && !isInstructor && !isEnrolled) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Build query based on role
        let whereClause: any = { lmsCourseId };

        if (isStudent && user.profiles?.student) {
            // Students see: their private threads + public threads
            whereClause = {
                lmsCourseId,
                OR: [
                    { studentProfileId: user.profiles.student },
                    { isPublic: true },
                ],
            };
        } else if (isTeacher || isAdmin || isInstructor) {
            // Teachers/Admins see all threads
            whereClause = { lmsCourseId };
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
        console.error('Error fetching LMS forum threads:', error);
        return NextResponse.json(
            { error: 'Failed to fetch threads' },
            { status: 500 }
        );
    }
}

// POST /api/forums/lms/[lmsCourseId] - Create a new thread in an LMS course
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ lmsCourseId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lmsCourseId } = await params;
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

        // Check LMS course access
        const lmsCourse = await prisma.lMSCourse.findUnique({
            where: { id: lmsCourseId },
            include: {
                enrollments: {
                    where: { studentId: user.profiles?.student || '' },
                },
            },
        });

        if (!lmsCourse) {
            return NextResponse.json({ error: 'LMS Course not found' }, { status: 404 });
        }

        const isInstructor = lmsCourse.instructorId === user.id;
        const isEnrolled = lmsCourse.enrollments.length > 0;

        if (!isAdmin && !isInstructor && !isEnrolled) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Create thread
        const thread = await prisma.forumThread.create({
            data: {
                creatorId: user.id,
                lmsCourseId,
                title,
                studentProfileId: isStudent ? user.profiles?.student : null,
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
        console.error('Error creating LMS forum thread:', error);
        return NextResponse.json(
            { error: 'Failed to create thread' },
            { status: 500 }
        );
    }
}
