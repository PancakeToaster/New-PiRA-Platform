import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/certificates - Fetch all certificates
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const certificates = await prisma.certificate.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                course: { select: { id: true, name: true } },
                _count: {
                    select: { awards: true },
                },
            },
        });

        return NextResponse.json({ certificates });
    } catch (error) {
        console.error('Failed to fetch certificates:', error);
        return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
    }
}

// POST /api/admin/certificates - Create new certificate
export async function POST(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, description, imageUrl, courseId, isActive } = body;

        const certificate = await prisma.certificate.create({
            data: {
                title,
                description,
                imageUrl,
                courseId: courseId || null,
                isActive: isActive ?? true,
            },
        });

        return NextResponse.json({ certificate });
    } catch (error) {
        console.error('Failed to create certificate:', error);
        return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
    }
}
