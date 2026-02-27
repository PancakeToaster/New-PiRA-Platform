import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { updateBlogSchema } from '@/lib/validations/blog';

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
    const post = await prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        category: true,
        tags: true,
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Failed to fetch blog post:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
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
    const parsed = updateBlogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, excerpt, content, coverImage, isDraft, authorId, categoryId, tagIds: tags } = parsed.data;
    const { slug, builderData, editorType } = body;

    // Check if slug is taken by another post
    if (slug) {
      const existingPost = await prisma.blog.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingPost) {
        return NextResponse.json(
          { error: 'This slug is already in use' },
          { status: 400 }
        );
      }
    }

    const currentPost = await prisma.blog.findUnique({
      where: { id },
    });

    if (!currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Set publishedAt if publishing for the first time
    let publishedAt = currentPost.publishedAt;
    if (isDraft === false && currentPost.isDraft === true) {
      publishedAt = new Date();
    }

    const post = await prisma.blog.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        builderData,
        editorType,
        isDraft,
        publishedAt,
        authorId: authorId || undefined, // undefined avoids changing if not provided
        categoryId: categoryId || null,
        tags: tags ? {
          set: [], // Clear existing relations
          connect: tags.map((tagId: string) => ({ id: tagId }))
        } : undefined,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        tags: true,
      }
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Failed to update blog post:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
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
    await prisma.blog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
