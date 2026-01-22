import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/courses/[id]/modules/[moduleId] - Fetch single module
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
        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!module) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        return NextResponse.json({ module });
    } catch (error) {
        console.error('Failed to fetch module:', error);
        return NextResponse.json({ error: 'Failed to fetch module' }, { status: 500 });
    }
}

// PUT /api/admin/courses/[id]/modules/[moduleId] - Update module
export async function PUT(
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
        const body = await request.json();
        const { title, description, order, isPublished } = body;

        const module = await prisma.module.update({
            where: { id: moduleId },
            data: {
                title,
                description,
                order,
                isPublished,
            },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return NextResponse.json({ module });
    } catch (error) {
        console.error('Failed to update module:', error);
        return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
    }
}

// DELETE /api/admin/courses/[id]/modules/[moduleId] - Delete module
export async function DELETE(
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
        await prisma.module.delete({
            where: { id: moduleId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete module:', error);
        return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
    }
}

// PATCH /api/admin/courses/[id]/modules/[moduleId] - Reorder module
export async function PATCH(
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
        const { newOrder } = body;

        // Update the module's order
        const module = await prisma.module.update({
            where: { id: moduleId },
            data: { order: newOrder },
        });

        // Reorder other modules if needed
        const modules = await prisma.module.findMany({
            where: { courseId: id },
            orderBy: { order: 'asc' },
        });

        // Update order for all modules to ensure consistency
        for (let i = 0; i < modules.length; i++) {
            if (modules[i].id !== moduleId) {
                await prisma.module.update({
                    where: { id: modules[i].id },
                    data: { order: i >= newOrder ? i + 1 : i },
                });
            }
        }

        return NextResponse.json({ module });
    } catch (error) {
        console.error('Failed to reorder module:', error);
        return NextResponse.json({ error: 'Failed to reorder module' }, { status: 500 });
    }
}
