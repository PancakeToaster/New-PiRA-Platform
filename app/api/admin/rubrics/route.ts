import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createRubricSchema } from '@/lib/validations/lms';

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
    const parsed = createRubricSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, description, criteria } = parsed.data;

    const rubric = await prisma.rubric.create({
      data: {
        title: title.trim(),
        description: description || null,
        createdById: user.id,
        criteria: {
          create: criteria.map(
            (c: { title: string; description?: string | null; maxPoints: number }, index: number) => ({
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
