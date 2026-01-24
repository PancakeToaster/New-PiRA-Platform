import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/student/assignments/[id] - Fetch assignment details and student's submission
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                lmsCourse: {
                    select: {
                        name: true,
                    },
                },
                lesson: {
                    select: {
                        title: true,
                    },
                },
                submissions: {
                    where: {
                        studentId: studentProfile.id,
                    },
                },
            },
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        return NextResponse.json({
            assignment,
            submission: assignment.submissions[0] || null,
        });
    } catch (error) {
        console.error('Failed to fetch assignment:', error);
        return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
    }
}

// POST /api/student/assignments/[id] - Submit assignment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const body = await request.json();
        const { content, attachments, status } = body;

        // Check if submission already exists
        const existingSubmission = await prisma.assignmentSubmission.findUnique({
            where: {
                assignmentId_studentId: {
                    assignmentId: id,
                    studentId: studentProfile.id,
                },
            },
        });

        let submission;
        if (existingSubmission) {
            // Update existing submission
            submission = await prisma.assignmentSubmission.update({
                where: { id: existingSubmission.id },
                data: {
                    content,
                    attachments: attachments || [],
                    status: status || 'submitted',
                    submittedAt: status === 'submitted' ? new Date() : existingSubmission.submittedAt,
                },
            });
        } else {
            // Create new submission
            submission = await prisma.assignmentSubmission.create({
                data: {
                    assignmentId: id,
                    studentId: studentProfile.id,
                    content,
                    attachments: attachments || [],
                    status: status || 'submitted',
                    submittedAt: status === 'submitted' ? new Date() : null,
                },
            });
        }

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Failed to submit assignment:', error);
        return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
    }
}

// PUT /api/student/assignments/[id] - Update submission (before final submit)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        const body = await request.json();
        const { content, attachments } = body;

        const submission = await prisma.assignmentSubmission.updateMany({
            where: {
                assignmentId: id,
                studentId: studentProfile.id,
                status: 'draft', // Only allow updates to draft submissions
            },
            data: {
                content,
                attachments: attachments || [],
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update submission:', error);
        return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }
}
