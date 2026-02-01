import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// GET /api/student/portfolio - List current student's portfolio items
export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentProfileId = currentUser.profiles?.student;
  if (!studentProfileId) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
  }

  try {
    const items = await prisma.portfolioItem.findMany({
      where: { studentId: studentProfileId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch portfolio items:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio items' }, { status: 500 });
  }
}

// POST /api/student/portfolio - Create new portfolio item
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentProfileId = currentUser.profiles?.student;
  if (!studentProfileId) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, content, media, tags, isPublic, projectUrl } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate projectUrl if provided
    if (projectUrl && !isValidUrl(projectUrl)) {
      return NextResponse.json({ error: 'Invalid project URL. Must be a valid http(s) URL.' }, { status: 400 });
    }

    // Validate media URLs
    const validatedMedia: string[] = [];
    if (Array.isArray(media)) {
      for (const url of media) {
        if (typeof url !== 'string' || !isValidUrl(url)) {
          return NextResponse.json({ error: `Invalid media URL: "${url}"` }, { status: 400 });
        }
        validatedMedia.push(url);
      }
    }

    // Validate tags are strings
    const validatedTags: string[] = [];
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) continue;
        validatedTags.push(tag.trim().slice(0, 50));
      }
    }

    const item = await prisma.portfolioItem.create({
      data: {
        studentId: studentProfileId,
        title: title.trim(),
        description: description || null,
        content: content || null,
        media: validatedMedia,
        tags: validatedTags,
        isPublic: Boolean(isPublic),
        projectUrl: projectUrl || null,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to create portfolio item:', error);
    return NextResponse.json({ error: 'Failed to create portfolio item' }, { status: 500 });
  }
}
