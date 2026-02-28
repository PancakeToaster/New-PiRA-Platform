import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/admin/lms-courses/[id]/modules/[moduleId] - Get a specific module
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

        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: {
                lmsCourse: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
        });

        if (!module) {
            return new NextResponse('Module not found', { status: 404 });
        }

        return NextResponse.json({ module });
    } catch (error) {
        console.error('[MODULE_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// PATCH /api/admin/lms-courses/[id]/modules/[moduleId] - Update a module
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id, moduleId } = await params;
        const body = await req.json();

        const module = await prisma.module.update({
            where: { id: moduleId },
            data: body,
            include: {
                _count: {
                    select: {
                        lessons: true,
                    },
                },
            },
        });

        return NextResponse.json({ module });
    } catch (error) {
        console.error('[MODULE_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// DELETE /api/admin/lms-courses/[id]/modules/[moduleId] - Delete a module
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.roles?.includes('Admin')) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id, moduleId } = await params;

        await prisma.module.delete({
            where: { id: moduleId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[MODULE_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
