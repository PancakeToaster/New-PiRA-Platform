import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

// GET /api/admin/learning-paths - List all learning paths
export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const paths = await prisma.learningPath.findMany({
      include: {
        steps: {
          include: {
            lmsCourse: {
              select: { id: true, name: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ paths });
  } catch (error) {
    console.error('[LEARNING_PATHS_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch learning paths' }, { status: 500 });
  }
}

// POST /api/admin/learning-paths - Create learning path
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, image, isPublished, steps } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check slug uniqueness
    const existing = await prisma.learningPath.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Validate referenced courses exist
    if (Array.isArray(steps) && steps.length > 0) {
      const courseIds = steps.map((s: { lmsCourseId: string }) => s.lmsCourseId);
      const existingCourses = await prisma.lMSCourse.findMany({
        where: { id: { in: courseIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingCourses.map((c) => c.id));
      const missing = courseIds.filter((id: string) => !existingIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Course(s) not found: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const path = await prisma.learningPath.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description || null,
        image: image || null,
        isPublished: Boolean(isPublished),
        steps: {
          create: Array.isArray(steps)
            ? steps.map((step: { lmsCourseId: string; isRequired?: boolean }, index: number) => ({
              lmsCourseId: step.lmsCourseId,
              order: index,
              isRequired: step.isRequired !== false,
            }))
            : [],
        },
      },
      include: {
        steps: {
          include: {
            lmsCourse: { select: { id: true, name: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ path }, { status: 201 });
  } catch (error) {
    console.error('[LEARNING_PATHS_POST]', error);
    return NextResponse.json({ error: 'Failed to create learning path' }, { status: 500 });
  }
}
