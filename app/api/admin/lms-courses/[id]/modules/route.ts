import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/lms-courses/[id]/modules - Get all modules for a course
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.roles?.includes('Admin') && !user.roles?.includes('Teacher'))) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;

        const modules = await prisma.module.findMany({
            where: { lmsCourseId: id },
            include: {
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({ modules });
    } catch (error) {
        console.error('[MODULES_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/admin/lms-courses/[id]/modules - Create a new module
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id } = await params;
        const { title, description } = await req.json();

        if (!title) {
            return new NextResponse('Title is required', { status: 400 });
        }

        // Get the highest order number
        const lastModule = await prisma.module.findFirst({
            where: { lmsCourseId: id },
            orderBy: { order: 'desc' },
        });

        const module = await prisma.module.create({
            data: {
                lmsCourseId: id,
                title,
                description: description || null,
                order: (lastModule?.order || 0) + 1,
                isPublished: false,
            },
            include: {
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
        });

        return NextResponse.json({ module }, { status: 201 });
    } catch (error) {
        console.error('[MODULES_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
