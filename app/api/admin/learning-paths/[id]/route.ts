import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/learning-paths/[id]
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
    const path = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            lmsCourse: { select: { id: true, name: true, description: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!path) {
      return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error('[LEARNING_PATH_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch learning path' }, { status: 500 });
  }
}

// PUT /api/admin/learning-paths/[id]
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
    const existing = await prisma.learningPath.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, image, isPublished, steps } = body;

    // Update path
    const path = await prisma.learningPath.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        image: image !== undefined ? image : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
      },
    });

    // Replace steps if provided
    if (Array.isArray(steps)) {
      // Validate referenced courses exist
      if (steps.length > 0) {
        const courseIds = steps.map((s: { lmsCourseId: string }) => s.lmsCourseId);
        const existingCourses = await prisma.lMSCourse.findMany({
          where: { id: { in: courseIds } },
          select: { id: true },
        });
        const existingIds = new Set(existingCourses.map((c) => c.id));
        const missing = courseIds.filter((cid: string) => !existingIds.has(cid));
        if (missing.length > 0) {
          return NextResponse.json(
            { error: `Course(s) not found: ${missing.join(', ')}` },
            { status: 400 }
          );
        }
      }

      await prisma.learningPathStep.deleteMany({ where: { learningPathId: id } });
      await prisma.learningPathStep.createMany({
        data: steps.map((step: { lmsCourseId: string; isRequired?: boolean }, index: number) => ({
          learningPathId: id,
          lmsCourseId: step.lmsCourseId,
          order: index,
          isRequired: step.isRequired !== false,
        })),
      });
    }

    const updated = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            lmsCourse: { select: { id: true, name: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ path: updated });
  } catch (error) {
    console.error('[LEARNING_PATH_PUT]', error);
    return NextResponse.json({ error: 'Failed to update learning path' }, { status: 500 });
  }
}

// DELETE /api/admin/learning-paths/[id]
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
    const existing = await prisma.learningPath.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });
    }

    await prisma.learningPath.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LEARNING_PATH_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete learning path' }, { status: 500 });
  }
}
