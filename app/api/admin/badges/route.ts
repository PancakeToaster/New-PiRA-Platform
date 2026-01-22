import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/badges - Fetch all badges
export async function GET(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const badges = await prisma.badge.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { awards: true },
                },
            },
        });

        return NextResponse.json({ badges });
    } catch (error) {
        console.error('Failed to fetch badges:', error);
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }
}

// POST /api/admin/badges - Create new badge
export async function POST(request: NextRequest) {
    const currentUser = await getCurrentUser();
    const userIsAdmin = await isAdmin();

    if (!currentUser || !userIsAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, description, icon, color, slug } = body;

        // Validate slug uniqueness
        const existing = await prisma.badge.findUnique({
            where: { slug },
        });

        if (existing) {
            return NextResponse.json({ error: 'Badge with this slug already exists' }, { status: 400 });
        }

        const badge = await prisma.badge.create({
            data: {
                name,
                description,
                icon: icon || 'Award', // Default icon
                color: color || 'blue',
                slug,
            },
        });

        return NextResponse.json({ badge });
    } catch (error) {
        console.error('Failed to create badge:', error);
        return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 });
    }
}
