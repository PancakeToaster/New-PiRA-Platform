import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

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
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Failed to fetch course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

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
    const { name, slug, description, level, duration, ageRange, price, topics, image, isActive } = body;

    // Check if slug is taken by another course
    if (slug) {
      const existingCourse = await prisma.course.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingCourse) {
        return NextResponse.json(
          { error: 'This slug is already in use' },
          { status: 400 }
        );
      }
    }

    const currentCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!currentCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        level,
        duration,
        ageRange,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        topics: topics || [],
        image,
        isActive,
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Failed to update course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

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
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
