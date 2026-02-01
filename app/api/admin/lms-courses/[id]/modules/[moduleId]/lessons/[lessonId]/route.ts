import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/lms-courses/[id]/modules/[moduleId]/lessons/[lessonId] - Get a specific lesson
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { lessonId } = await params;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    select: {
                        id: true,
                        title: true,
                        lmsCourse: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
            },
        });

        if (!lesson) {
            return new NextResponse('Lesson not found', { status: 404 });
        }

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('[LESSON_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PATCH /api/admin/lms-courses/[id]/modules/[moduleId]/lessons/[lessonId] - Update a lesson
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { lessonId } = await params;
        const body = await req.json();

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: body,
        });

        return NextResponse.json({ lesson });
    } catch (error) {
        console.error('[LESSON_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE /api/admin/lms-courses/[id]/modules/[moduleId]/lessons/[lessonId] - Delete a lesson
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { lessonId } = await params;

        await prisma.lesson.delete({
            where: { id: lessonId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LESSON_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
