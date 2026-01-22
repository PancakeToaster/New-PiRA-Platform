import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/courses/[id]/modules/[moduleId]/lessons - Fetch all lessons in a module
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    const { moduleId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const lessons = await prisma.lesson.findMany({
            where: { moduleId },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({ lessons });
    } catch (error) {
        console.error('Failed to fetch lessons:', error);
        return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
    }
}

// POST /api/admin/courses/[id]/modules/[moduleId]/lessons - Create a new lesson
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    const { id, moduleId } = await params;
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, content, lessonType, videoUrl, duration, order, isPublished, isFree } = body;

        // Get the highest order number if order not provided
        let lessonOrder = order;
        if (lessonOrder === undefined) {
            const lastLesson = await prisma.lesson.findFirst({
                where: { moduleId },
                orderBy: { order: 'desc' },
            });
            lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
        }

        const lesson = await prisma.lesson.create({
            data: {
                courseId: id,
                moduleId,
                title,
                description,
                content: content || '',
                lessonType: lessonType || 'reading',
                videoUrl,
                duration,
                order: lessonOrder,
                isPublished: isPublished ?? false,
                isFree: isFree ?? false,
            },
        });

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('Failed to create lesson:', error);
        return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
    }
}
