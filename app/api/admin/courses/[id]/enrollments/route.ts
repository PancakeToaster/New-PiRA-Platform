import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/courses/[id]/enrollments - Get course enrollments
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const isUserAdmin = await isAdmin();

        if (!user || !isUserAdmin) {
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
        console.error('[ENROLLMENTS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/courses/[id]/enrollments - Add student to course
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const isUserAdmin = await isAdmin();

        if (!user || !isUserAdmin) {
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
        console.error('[ENROLLMENTS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE /api/admin/courses/[id]/enrollments - Remove student from course
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        const isUserAdmin = await isAdmin();

        if (!user || !isUserAdmin) {
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
        console.error('[ENROLLMENTS_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
