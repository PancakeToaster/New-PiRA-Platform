import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin, hasPermission } from '@/lib/permissions';
import { slugify } from '@/lib/utils';
import { createKnowledgeNodeSchema } from '@/lib/validations/system';

export async function GET() {
  const user = await getCurrentUser();
  const canView = await hasPermission('knowledge', 'view');

  if (!user || !canView) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const nodes = await prisma.knowledgeNode.findMany({
      orderBy: { updatedAt: 'desc' },
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
      // If user can manage knowledge, show all. Otherwise only show published
      where: await hasPermission('knowledge', 'edit') ? {} : { isPublished: true },
    });
    // ...


    // Calculate stats
    const published = nodes.filter(n => n.isPublished).length;
    const byType: Record<string, number> = {};
    nodes.forEach(node => {
      byType[node.nodeType] = (byType[node.nodeType] || 0) + 1;
    });

    return NextResponse.json({
      nodes,
      stats: {
        total: nodes.length,
        published,
        byType,
      },
    });
  } catch (error) {
    console.error('Failed to fetch knowledge nodes:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge nodes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const canCreate = await hasPermission('knowledge', 'create');

  if (!currentUser || !canCreate) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createKnowledgeNodeSchema.safeParse({
      ...body,
      slug: body.slug || slugify(body.title || '') + '-' + Date.now().toString().slice(-6),
      authorId: currentUser.id
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, slug, content, nodeType, folderId, isPublished } = parsed.data;
    const { tags } = body;

    const node = await prisma.knowledgeNode.create({
      data: {
        title,
        slug,
        content: content || '',
        nodeType: nodeType as any,
        authorId: currentUser.id,
        folderId: folderId || null,
        tags: tags || [],
        isPublished: isPublished ?? false,
      },
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

    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error('Failed to create knowledge node:', error);
    return NextResponse.json({ error: 'Failed to create knowledge node' }, { status: 500 });
  }
}
