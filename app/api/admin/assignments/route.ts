import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createAssignmentSchema } from '@/lib/validations/lms';

// GET /api/admin/assignments - Fetch all assignments
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        const where: any = {};
        if (courseId) {
            where.lmsCourseId = courseId;
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                lmsCourse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                lesson: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
            orderBy: {
                dueDate: 'desc',
            },
        });

        return NextResponse.json({ assignments });
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// POST /api/admin/assignments - Create new assignment
export async function POST(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const parsed = createAssignmentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const {
            lessonId,
            courseId,
            title,
            description,
            dueDate,
            maxPoints,
            attachments,
            allowTextEntry,
            allowFileUpload,
            studentId,
        } = parsed.data;

        const assignment = await prisma.assignment.create({
            data: {
                lessonId: lessonId || null,
                lmsCourseId: courseId || null,
                title,
                description,
                dueDate: new Date(dueDate),
                maxPoints: maxPoints || 100,
                attachments: attachments || [],
                allowTextEntry: allowTextEntry ?? true,
                allowFileUpload: allowFileUpload ?? true,
                teacherId: currentUser.id,
                studentId: studentId || null,
            },
            include: {
                teacher: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                lmsCourse: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ assignment });
    } catch (error) {
        console.error('Failed to create assignment:', error);
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }
}
