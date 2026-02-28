import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { updateLMSCourseSchema } from '@/lib/validations/lms';

// GET /api/admin/lms-courses/[id] - Get a specific LMS course
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        const course = await prisma.lMSCourse.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        modules: true,
                        assignments: true,
                        lessons: true,
                    },
                },
            },
        });

        if (!course) {
            return new NextResponse('Course not found', { status: 404 });
        }

        return NextResponse.json({ course });
    } catch (error) {
        console.error('[LMS_COURSE_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PUT /api/admin/lms-courses/[id] - Update an LMS course
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsed = updateLMSCourseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { name, code, description, instructorId, isActive, gradingWeights, gradingScale } = parsed.data;

        // Check if code already exists for another course (only if code is changing)
        if (code) {
            const existing = await prisma.lMSCourse.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });

            if (existing) {
                return new NextResponse('Course code already exists', { status: 400 });
            }
        }

        const course = await prisma.lMSCourse.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(code !== undefined && { code }),
                ...(description !== undefined && { description }),
                ...(instructorId !== undefined && { instructorId }),
                ...(isActive !== undefined && { isActive }),
                ...(gradingWeights !== undefined && { gradingWeights }),
                ...(gradingScale !== undefined && { gradingScale }),
            },
            include: {
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ course });
    } catch (error) {
        console.error('[LMS_COURSE_PUT]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE /api/admin/lms-courses/[id] - Delete an LMS course
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        // Check if course has enrollments
        const course = await prisma.lMSCourse.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });

        if (!course) {
            return new NextResponse('Course not found', { status: 404 });
        }

        if (course._count.enrollments > 0) {
            return new NextResponse(
                'Cannot delete course with active enrollments. Please remove all enrollments first.',
                { status: 400 }
            );
        }

        await prisma.lMSCourse.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LMS_COURSE_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
