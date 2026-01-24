import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/lms-courses/[id]/enrollments - Get LMS course enrollments
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { lmsCourseId: id },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { enrolledAt: 'desc' },
        });

        return NextResponse.json({ enrollments });
    } catch (error) {
        console.error('[LMS_ENROLLMENTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/lms-courses/[id]/enrollments - Add student to LMS course
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const { studentId } = await req.json();

        if (!studentId) {
            return new NextResponse('Student ID required', { status: 400 });
        }

        // Check if already enrolled
        const existing = await prisma.courseEnrollment.findUnique({
            where: {
                lmsCourseId_studentId: {
                    lmsCourseId: id,
                    studentId,
                },
            },
        });

        if (existing) {
            return new NextResponse('Student already enrolled', { status: 400 });
        }

        const enrollment = await prisma.courseEnrollment.create({
            data: {
                lmsCourseId: id,
                studentId,
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(enrollment);
    } catch (error) {
        console.error('[LMS_ENROLLMENTS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE /api/admin/lms-courses/[id]/enrollments - Remove student from LMS course
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return new NextResponse('Student ID required', { status: 400 });
        }

        await prisma.courseEnrollment.delete({
            where: {
                lmsCourseId_studentId: {
                    lmsCourseId: id,
                    studentId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LMS_ENROLLMENTS_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
