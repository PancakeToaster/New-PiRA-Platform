import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/quizzes/[id]/questions/[questionId] - Fetch single question
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const { questionId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const question = await prisma.quizQuestion.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json({ question });
    } catch (error) {
        console.error('Failed to fetch question:', error);
        return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
    }
}

// PUT /api/admin/quizzes/[id]/questions/[questionId] - Update question
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const { questionId } = await params;
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

        const updatedQuestion = await prisma.quizQuestion.update({
            where: { id: questionId },
            data: {
                questionType,
                question,
                points: points !== undefined ? parseFloat(points) : undefined,
                explanation,
                options: options ?? undefined, // Only update if provided
                correctAnswer,
            },
        });

        return NextResponse.json({ question: updatedQuestion });
    } catch (error) {
        console.error('Failed to update question:', error);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

// DELETE /api/admin/quizzes/[id]/questions/[questionId] - Delete question
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const { questionId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.quizQuestion.delete({
            where: { id: questionId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete question:', error);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}

// PATCH /api/admin/quizzes/[id]/questions/[questionId] - Reorder question
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const { id, questionId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { newOrder } = body;

        if (typeof newOrder !== 'number') {
            return NextResponse.json({ error: 'Invalid order' }, { status: 400 });
        }

        const questionToMove = await prisma.quizQuestion.findUnique({
            where: { id: questionId },
        });

        if (!questionToMove) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        const oldOrder = questionToMove.order;

        // Transaction to update orders
        await prisma.$transaction(async (tx) => {
            if (newOrder > oldOrder) {
                // Moving down: decrement items between old and new
                await tx.quizQuestion.updateMany({
                    where: {
                        quizId: id,
                        order: { gt: oldOrder, lte: newOrder },
                    },
                    data: { order: { decrement: 1 } },
                });
            } else if (newOrder < oldOrder) {
                // Moving up: increment items between new and old
                await tx.quizQuestion.updateMany({
                    where: {
                        quizId: id,
                        order: { gte: newOrder, lt: oldOrder },
                    },
                    data: { order: { increment: 1 } },
                });
            }

            // Update the target question
            await tx.quizQuestion.update({
                where: { id: questionId },
                data: { order: newOrder },
            });
        });

        return NextResponse.json({ success: true, newOrder });
    } catch (error) {
        console.error('Failed to reorder question:', error);
        return NextResponse.json({ error: 'Failed to reorder question' }, { status: 500 });
    }
}
