import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/certificates/[id] - Fetch single certificate
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
        const certificate = await prisma.certificate.findUnique({
            where: { id },
            include: {
                lmsCourse: { select: { id: true, name: true } },
                _count: {
                    select: { awards: true },
                },
            },
        });

        if (!certificate) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        return NextResponse.json({ certificate });
    } catch (error) {
        console.error('Failed to fetch certificate:', error);
        return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 });
    }
}

// PUT /api/admin/certificates/[id] - Update certificate
export async function PUT(
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
        const { title, description, imageUrl, courseId, isActive } = body;

        const certificate = await prisma.certificate.update({
            where: { id },
            data: {
                title,
                description,
                imageUrl,
                lmsCourseId: courseId || null, // Allow unlinking
                isActive,
            },
        });

        return NextResponse.json({ certificate });
    } catch (error) {
        console.error('Failed to update certificate:', error);
        return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
    }
}

// DELETE /api/admin/certificates/[id] - Delete certificate
export async function DELETE(
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
        await prisma.certificate.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete certificate:', error);
        return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
    }
}
