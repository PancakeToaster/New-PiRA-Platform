import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// POST /api/announcements/[id]/read - Mark announcement as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify the announcement exists and is visible to this user
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: { sendToAll: true, sendToStudents: true, sendToParents: true, sendToTeachers: true },
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check visibility based on user roles
    const userRoles = (user.roles || []).map((r: string) => r.toLowerCase());
    const canSee =
      announcement.sendToAll ||
      (userRoles.includes('student') && announcement.sendToStudents) ||
      (userRoles.includes('parent') && announcement.sendToParents) ||
      (userRoles.includes('teacher') && announcement.sendToTeachers) ||
      userRoles.includes('admin');

    if (!canSee) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: user.id,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        announcementId: id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ANNOUNCEMENT_READ]', error);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
