import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/student/portfolio/[id] - Get single portfolio item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentProfileId = currentUser.profiles?.student;
  if (!studentProfileId) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
  }

  try {
    const item = await prisma.portfolioItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    if (item.studentId !== studentProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to fetch portfolio item:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio item' }, { status: 500 });
  }
}

// PUT /api/student/portfolio/[id] - Update portfolio item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentProfileId = currentUser.profiles?.student;
  if (!studentProfileId) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
  }

  try {
    const existing = await prisma.portfolioItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    if (existing.studentId !== studentProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, content, media, tags, isPublic, projectUrl } = body;

    const item = await prisma.portfolioItem.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        content: content !== undefined ? content : undefined,
        media: media !== undefined ? (Array.isArray(media) ? media : []) : undefined,
        tags: tags !== undefined ? (Array.isArray(tags) ? tags : []) : undefined,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
        projectUrl: projectUrl !== undefined ? projectUrl : undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to update portfolio item:', error);
    return NextResponse.json({ error: 'Failed to update portfolio item' }, { status: 500 });
  }
}

// DELETE /api/student/portfolio/[id] - Delete portfolio item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentProfileId = currentUser.profiles?.student;
  if (!studentProfileId) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
  }

  try {
    const existing = await prisma.portfolioItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    if (existing.studentId !== studentProfileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.portfolioItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete portfolio item:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio item' }, { status: 500 });
  }
}
