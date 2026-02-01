import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/rubrics/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rubric = await prisma.rubric.findUnique({
      where: { id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        criteria: { orderBy: { order: 'asc' } },
        assignments: { select: { id: true, title: true } },
      },
    });

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    return NextResponse.json({ rubric });
  } catch (error) {
    console.error('[RUBRIC_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch rubric' }, { status: 500 });
  }
}

// PUT /api/admin/rubrics/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.rubric.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, criteria } = body;

    // Update rubric
    await prisma.rubric.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    // Replace criteria if provided
    if (Array.isArray(criteria)) {
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

      await prisma.rubricCriterion.deleteMany({ where: { rubricId: id } });
      await prisma.rubricCriterion.createMany({
        data: criteria.map(
          (c: { title: string; description?: string; maxPoints: number }, index: number) => ({
            rubricId: id,
            title: c.title.trim(),
            description: c.description || null,
            maxPoints: Number(c.maxPoints),
            order: index,
          })
        ),
      });
    }

    const updated = await prisma.rubric.findUnique({
      where: { id },
      include: {
        criteria: { orderBy: { order: 'asc' } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ rubric: updated });
  } catch (error) {
    console.error('[RUBRIC_PUT]', error);
    return NextResponse.json({ error: 'Failed to update rubric' }, { status: 500 });
  }
}

// DELETE /api/admin/rubrics/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.rubric.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    await prisma.rubric.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RUBRIC_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete rubric' }, { status: 500 });
  }
}
