import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// POST /api/student/quizzes/[id]/start - Start a quiz attempt
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
        // Fetch student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId: currentUser.id },
        });

        if (!studentProfile) {
            return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
        }

        // Fetch quiz
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                attempts: {
                    where: { studentId: studentProfile.id },
                },
            },
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Check attempt limits
        if (quiz.maxAttempts && quiz.attempts.length >= quiz.maxAttempts) {
            return NextResponse.json(
                { error: 'Maximum attempts reached' },
                { status: 403 }
            );
        }

        // Check for existing unfinished attempt
        const unfinishedAttempt = quiz.attempts.find(a => !a.submittedAt);
        if (unfinishedAttempt) {
            return NextResponse.json({ attempt: unfinishedAttempt, resumed: true });
        }

        // Start new attempt
        const newAttempt = await prisma.quizAttempt.create({
            data: {
                quizId: id,
                studentId: studentProfile.id,
                startedAt: new Date(),
            },
        });

        return NextResponse.json({ attempt: newAttempt, resumed: false });
    } catch (error) {
        console.error('Failed to start quiz:', error);
        return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
    }
}
