import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// PUT /api/admin/assignments/[id]/submissions/[submissionId] - Grade submission
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
    const { submissionId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { grade, feedback } = body;

        const submission = await prisma.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                grade: grade !== undefined ? parseFloat(grade) : null,
                feedback,
                status: 'graded',
                gradedAt: new Date(),
                gradedBy: currentUser.id,
            },
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
                assignment: {
                    select: {
                        title: true,
                        maxPoints: true,
                    },
                },
            },
        });

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Failed to grade submission:', error);
        return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
    }
}
