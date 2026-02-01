import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { interests: true },
        },
      },
    });

    // Transform to include interest count at top level
    const coursesWithInterest = courses.map(course => ({
      ...course,
      interestCount: course._count.interests,
      _count: undefined,
    }));

    const stats = {
      total: courses.length,
      active: courses.filter(c => c.isActive && !c.isDevelopment).length,
      inactive: courses.filter(c => !c.isActive).length,
      inDevelopment: courses.filter(c => c.isDevelopment).length,
    };

    return NextResponse.json({ courses: coursesWithInterest, stats });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!currentUser || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, level, duration, ageRange, price, topics, image, isActive, isHidden, hidePrice, isDevelopment } = body;

    if (!name || !slug || !description) {
      return NextResponse.json(
        { error: 'Name, slug, and description are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 400 }
      );
    }

    // Get the highest displayOrder to add new course at the end
    const lastCourse = await prisma.course.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const nextOrder = (lastCourse?.displayOrder ?? -1) + 1;

    const course = await prisma.course.create({
      data: {
        name,
        slug,
        description,
        level,
        duration,
        ageRange,
        price: price ? parseFloat(price) : null,
        topics: topics || [],
        image,
        isActive: isActive ?? true,
        isHidden: isHidden ?? false,
        hidePrice: hidePrice ?? false,
        isDevelopment: isDevelopment ?? false,
        displayOrder: nextOrder,
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Failed to create course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
