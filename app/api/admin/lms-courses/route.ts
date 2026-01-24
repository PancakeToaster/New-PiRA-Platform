import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/lms-courses - Get all LMS courses
export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const courses = await prisma.lMSCourse.findMany({
            include: {
                instructor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        modules: true,
                        assignments: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ courses });
    } catch (error) {
        console.error('[LMS_COURSES_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/lms-courses - Create a new LMS course
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { name, code, description, instructorId } = await req.json();

        if (!name || !code) {
            return new NextResponse('Name and code are required', { status: 400 });
        }

        // Check if code already exists
        const existing = await prisma.lMSCourse.findUnique({
            where: { code },
        });

        if (existing) {
            return new NextResponse('Course code already exists', { status: 400 });
        }

        const course = await prisma.lMSCourse.create({
            data: {
                name,
                code,
                description: description || '',
                instructorId: instructorId || null, // Optional instructor
            },
            include: {
                instructor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('[LMS_COURSES_POST] Error details:', error);
        console.error('[LMS_COURSES_POST] Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('[LMS_COURSES_POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return new NextResponse(
            error instanceof Error ? error.message : 'Internal Error',
            { status: 500 }
        );
    }
}
