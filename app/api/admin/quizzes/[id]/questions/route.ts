import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/quizzes/[id]/questions - Fetch all questions for a quiz
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
        const questions = await prisma.quizQuestion.findMany({
            where: { quizId: id },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Failed to fetch questions:', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
}

// POST /api/admin/quizzes/[id]/questions - Create new question
export async function POST(
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
            questionType,
            question,
            points,
            explanation,
            options,
            correctAnswer,
        } = body;

        // Get max order to append to end
        const lastQuestion = await prisma.quizQuestion.findFirst({
            where: { quizId: id },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        const newOrder = lastQuestion ? lastQuestion.order + 1 : 0;

        const newQuestion = await prisma.quizQuestion.create({
            data: {
                quizId: id,
                questionType,
                question,
                points: points ? parseFloat(points) : 1,
                order: newOrder,
                explanation,
                options: options || undefined,
                correctAnswer,
            },
        });

        return NextResponse.json({ question: newQuestion });
    } catch (error) {
        console.error('Failed to create question:', error);
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}
