import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/courses/[id]/modules - Fetch all modules for a course
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
        const modules = await prisma.module.findMany({
            where: { courseId: id },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({ modules });
    } catch (error) {
        console.error('Failed to fetch modules:', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}

// POST /api/admin/courses/[id]/modules - Create a new module
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
        const { title, description, order, isPublished } = body;

        // Get the highest order number if order not provided
        let moduleOrder = order;
        if (moduleOrder === undefined) {
            const lastModule = await prisma.module.findFirst({
                where: { courseId: id },
                orderBy: { order: 'desc' },
            });
            moduleOrder = lastModule ? lastModule.order + 1 : 0;
        }

        const module = await prisma.module.create({
            data: {
                courseId: id,
                title,
                description,
                order: moduleOrder,
                isPublished: isPublished ?? false,
            },
            include: {
                lessons: true,
            },
        });

        return NextResponse.json({ module });
    } catch (error) {
        console.error('Failed to create module:', error);
        return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
    }
}
