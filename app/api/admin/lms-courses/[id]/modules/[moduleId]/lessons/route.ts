import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/lms-courses/[id]/modules/[moduleId]/lessons - Get all lessons for a module
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id, moduleId } = await params;

        const lessons = await prisma.lesson.findMany({
            where: { moduleId },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({ lessons });
    } catch (error) {
        console.error('[LESSONS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/lms-courses/[id]/modules/[moduleId]/lessons - Create a new lesson
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id, moduleId } = await params;
        const { title, content, contentType, videoUrl, attachmentUrl, attachmentName, attachmentType, wikiPageId } = await req.json();

        if (!title) {
            return new NextResponse('Title is required', { status: 400 });
        }

        // Get the highest order number
        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { order: 'desc' },
        });

        const lesson = await prisma.lesson.create({
            data: {
                moduleId,
                lmsCourseId: id,
                title,
                content: content || null,
                contentType: contentType || 'text',
                videoUrl: videoUrl || null,
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null,
                attachmentType: attachmentType || null,
                wikiPageId: wikiPageId || null,
                order: (lastLesson?.order || 0) + 1,
                isPublished: false,
            },
        });

        return NextResponse.json({ lesson }, { status: 201 });
    } catch (error) {
        console.error('[LESSONS_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
