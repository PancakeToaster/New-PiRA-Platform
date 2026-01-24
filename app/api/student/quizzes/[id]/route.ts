import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/student/quizzes/[id] - Fetch quiz details for student
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

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                lmsCourse: { select: { name: true } },
                lesson: { select: { title: true } },
                questions: {
                    select: {
                        id: true,
                        questionType: true,
                        question: true,
                        points: true,
                        order: true,
                        options: true, // Students need options for MC
                        // Do NOT include correctAnswer or explanation here for security
                    },
                    orderBy: { order: 'asc' },
                },
                attempts: {
                    where: { studentId: studentProfile.id },
                    orderBy: { startedAt: 'desc' },
                    include: {
                        answers: true
                    }
                }
            },
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Security: Only show sensitive data (correct answers, explanations) if:
        // 1. The quiz allows showing results
        // 2. The student has completed an attempt (and we are viewing that context)
        // Actually, this endpoint is for STARTING/VIEWING the quiz.
        // The "Review" endpoint should probably be separate or conditionally returning data.
        // For now, let's strip correct answers out entirely from this view.

        // If implementing shuffling, we would shuffle here.

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Failed to fetch quiz:', error);
        return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
    }
}
