import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { updateRubricSchema } from '@/lib/validations/lms';

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
    const parsed = updateRubricSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, criteria } = parsed.data;

    // Update rubric
    await prisma.rubric.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    if (Array.isArray(criteria)) {
      await prisma.rubricCriterion.deleteMany({ where: { rubricId: id } });
      await prisma.rubricCriterion.createMany({
        data: criteria.map(
          (c: { title: string; description?: string | null; maxPoints: number }, index: number) => ({
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
