import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId] - Fetch single lesson
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    const { lessonId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('Failed to fetch lesson:', error);
        return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
    }
}

// PUT /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId] - Update lesson
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    const { lessonId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, content, lessonType, videoUrl, duration, order, isPublished, isFree } = body;

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title,
                description,
                content,
                lessonType,
                videoUrl,
                duration,
                order,
                isPublished,
                isFree,
            },
        });

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('Failed to update lesson:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
}

// DELETE /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId] - Delete lesson
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    const { lessonId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.lesson.delete({
            where: { id: lessonId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete lesson:', error);
        return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
    }
}

// PATCH /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId] - Update lesson (partial)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    const { lessonId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Handle reordering if newOrder is present
        if (typeof body.newOrder === 'number') {
            const { newOrder } = body;
            const { moduleId } = await params;

            const lesson = await prisma.lesson.update({
                where: { id: lessonId },
                data: { order: newOrder },
            });

            // Reorder other lessons
            const lessons = await prisma.lesson.findMany({
                where: { moduleId },
                orderBy: { order: 'asc' },
            });

            // Update order for all lessons to ensure consistency
            // This is a simplified reordering strategy; for production, might need more robust logic
            // But for now it matches the existing logic
            for (let i = 0; i < lessons.length; i++) {
                if (lessons[i].id !== lessonId) {
                    await prisma.lesson.update({
                        where: { id: lessons[i].id },
                        data: { order: i >= newOrder ? i + 1 : i },
                    });
                }
            }
            return NextResponse.json({ lesson });
        }

        // Handle content update
        if (body.content !== undefined) {
            const lesson = await prisma.lesson.update({
                where: { id: lessonId },
                data: { content: body.content },
            });
            return NextResponse.json({ lesson });
        }

        return NextResponse.json({ error: 'Invalid patch operation' }, { status: 400 });

    } catch (error) {
        console.error('Failed to patch lesson:', error);
        return NextResponse.json({ error: 'Failed to patch lesson' }, { status: 500 });
    }
}
