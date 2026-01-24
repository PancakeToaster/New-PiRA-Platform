import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/quizzes - Fetch all quizzes
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

        const quizzes = await prisma.quiz.findMany({
            where,
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
                _count: {
                    select: {
                        questions: true,
                        attempts: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json({ quizzes });
    } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }
}

// POST /api/admin/quizzes - Create new quiz
export async function POST(request: NextRequest) {
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
            lessonId,
            courseId,
            timeLimit,
            passingScore,
            maxAttempts,
            shuffleQuestions,
            shuffleAnswers,
            showResults,
            isPublished,
        } = body;

        const quiz = await prisma.quiz.create({
            data: {
                title,
                description,
                instructions,
                lessonId: lessonId || null,
                lmsCourseId: courseId || null,
                timeLimit: timeLimit ? parseInt(timeLimit) : null,
                passingScore: passingScore ? parseFloat(passingScore) : 70,
                maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
                shuffleQuestions: shuffleQuestions ?? false,
                shuffleAnswers: shuffleAnswers ?? false,
                showResults: showResults ?? true,
                isPublished: isPublished ?? false,
            },
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
            },
        });

        return NextResponse.json({ quiz });
    } catch (error) {
        console.error('Failed to create quiz:', error);
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }
}
