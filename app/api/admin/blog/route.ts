import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createBlogSchema } from '@/lib/validations/blog';

export async function GET() {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const posts = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
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
    const parsed = createBlogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { title, excerpt, content, coverImage, isDraft, authorId, categoryId, tagIds: tags } = parsed.data;
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    const post = await prisma.blog.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        isDraft: isDraft ?? true,
        publishedAt: isDraft ? null : new Date(),
        authorId: authorId || currentUser.id,
        categoryId: categoryId || null,
        tags: {
          connect: tags?.map((tagId: string) => ({ id: tagId })) || [],
        },
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        tags: true,
      }
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Failed to create blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
