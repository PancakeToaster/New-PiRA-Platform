import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { updateKnowledgeNodeSchema } from '@/lib/validations/system';

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
    const node = await prisma.knowledgeNode.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Failed to fetch knowledge node:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge node' }, { status: 500 });
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
    const parsed = updateKnowledgeNodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, slug, content, nodeType, folderId, isPublished } = parsed.data;
    const { tags } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (content !== undefined) updateData.content = content;
    if (nodeType !== undefined) updateData.nodeType = nodeType;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const node = await prisma.knowledgeNode.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ node });
  } catch (error) {
    console.error('Failed to update knowledge node:', error);
    return NextResponse.json({ error: 'Failed to update knowledge node' }, { status: 500 });
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
    await prisma.knowledgeNode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete knowledge node:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge node' }, { status: 500 });
  }
}
