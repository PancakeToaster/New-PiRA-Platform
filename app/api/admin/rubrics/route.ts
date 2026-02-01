import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/rubrics - List all rubrics
export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rubrics = await prisma.rubric.findMany({
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        criteria: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rubrics });
  } catch (error) {
    console.error('[RUBRICS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch rubrics' }, { status: 500 });
  }
}

// POST /api/admin/rubrics - Create rubric with criteria
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, criteria } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json({ error: 'At least one criterion is required' }, { status: 400 });
    }

    // Validate criteria
    for (const c of criteria) {
      if (!c.title || typeof c.title !== 'string' || c.title.trim().length === 0) {
        return NextResponse.json({ error: 'Each criterion must have a title' }, { status: 400 });
      }
      const points = Number(c.maxPoints);
      if (!Number.isFinite(points) || points <= 0 || points > 1000) {
        return NextResponse.json(
          { error: `maxPoints must be between 1 and 1000 (got "${c.maxPoints}")` },
          { status: 400 }
        );
      }
    }

    const rubric = await prisma.rubric.create({
      data: {
        title: title.trim(),
        description: description || null,
        createdById: user.id,
        criteria: {
          create: criteria.map(
            (c: { title: string; description?: string; maxPoints: number }, index: number) => ({
              title: c.title.trim(),
              description: c.description || null,
              maxPoints: Number(c.maxPoints),
              order: index,
            })
          ),
        },
      },
      include: {
        criteria: { orderBy: { order: 'asc' } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ rubric }, { status: 201 });
  } catch (error) {
    console.error('[RUBRICS_POST]', error);
    return NextResponse.json({ error: 'Failed to create rubric' }, { status: 500 });
  }
}
