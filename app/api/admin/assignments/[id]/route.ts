import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { updateAssignmentSchema } from '@/lib/validations/lms';

// GET /api/admin/assignments/[id] - Fetch single assignment with submissions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id },
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
                submissions: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        // grader: {
                        //     select: {
                        //         firstName: true,
                        //         lastName: true,
                        //     },
                        // },
                    },
                    orderBy: {
                        submittedAt: 'desc',
                    },
                },
            },
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        return NextResponse.json({ assignment });
    } catch (error) {
        console.error('Failed to fetch assignment:', error);
        return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
    }
}

// PUT /api/admin/assignments/[id] - Update assignment
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const parsed = updateAssignmentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
                { status: 400 }
            );
        }

        const {
            title,
            description,
            dueDate,
            maxPoints,
            attachments,
            allowTextEntry,
            allowFileUpload,
        } = parsed.data;

        const assignment = await prisma.assignment.update({
            where: { id },
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                maxPoints,
                attachments,
                allowTextEntry,
                allowFileUpload,
            },
        });

        return NextResponse.json({ assignment });
    } catch (error) {
        console.error('Failed to update assignment:', error);
        return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
    }
}

// DELETE /api/admin/assignments/[id] - Delete assignment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.assignment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete assignment:', error);
        return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
    }
}
