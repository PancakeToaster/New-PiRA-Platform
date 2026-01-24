import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/quizzes/[id] - Fetch single quiz with questions
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
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
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
                questions: {
                    orderBy: {
                        order: 'asc',
                    },
                },
                _count: {
                    select: {
                        attempts: true,
                    },
                },
            },
        });

        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Failed to fetch quiz:', error);
        return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
    }
}

// PUT /api/admin/quizzes/[id] - Update quiz
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
        const {
            title,
            description,
            instructions,
            timeLimit,
            passingScore,
            maxAttempts,
            shuffleQuestions,
            shuffleAnswers,
            showResults,
            isPublished,
        } = body;

        const quiz = await prisma.quiz.update({
            where: { id },
            data: {
                title,
                description,
                instructions,
                timeLimit: timeLimit !== undefined ? (timeLimit ? parseInt(timeLimit) : null) : undefined,
                passingScore: passingScore !== undefined ? parseFloat(passingScore) : undefined,
                maxAttempts: maxAttempts !== undefined ? (maxAttempts ? parseInt(maxAttempts) : null) : undefined,
                shuffleQuestions,
                shuffleAnswers,
                showResults,
                isPublished,
            },
        });

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Failed to update quiz:', error);
        return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
    }
}

// DELETE /api/admin/quizzes/[id] - Delete quiz
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
        await prisma.quiz.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete quiz:', error);
        return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
    }
}
