import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/badges/[id] - Fetch single badge
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
        const badge = await prisma.badge.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { awards: true },
                },
            },
        });

        if (!badge) {
            return NextResponse.json({ error: 'Badge not found' }, { status: 404 });
        }

        return NextResponse.json({ badge });
    } catch (error) {
        console.error('Failed to fetch badge:', error);
        return NextResponse.json({ error: 'Failed to fetch badge' }, { status: 500 });
    }
}

// PUT /api/admin/badges/[id] - Update badge
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
        const { name, description, icon, color, slug } = body;

        // Check slug uniqueness if changed
        if (slug) {
            const existing = await prisma.badge.findFirst({
                where: { slug, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json({ error: 'Badge with this slug already exists' }, { status: 400 });
            }
        }

        const badge = await prisma.badge.update({
            where: { id },
            data: {
                name,
                description,
                icon,
                color,
                slug,
            },
        });

        return NextResponse.json({ badge });
    } catch (error) {
        console.error('Failed to update badge:', error);
        return NextResponse.json({ error: 'Failed to update badge' }, { status: 500 });
    }
}

// DELETE /api/admin/badges/[id] - Delete badge
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
        await prisma.badge.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete badge:', error);
        return NextResponse.json({ error: 'Failed to delete badge' }, { status: 500 });
    }
}
