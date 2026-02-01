import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

// GET /api/announcements/unread-count - Get unread announcement count
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Count announcements visible to this user that haven't been read
    const userRoles = user.roles || [];
    const isStudent = userRoles.includes('Student');
    const isParent = userRoles.includes('Parent');
    const isTeacher = userRoles.includes('Teacher');

    const totalAnnouncements = await prisma.announcement.count({
      where: {
        OR: [
          { sendToAll: true },
          ...(isStudent ? [{ sendToStudents: true }] : []),
          ...(isParent ? [{ sendToParents: true }] : []),
          ...(isTeacher ? [{ sendToTeachers: true }] : []),
        ],
      },
    });

    const readCount = await prisma.announcementRead.count({
      where: {
        userId: user.id,
        announcement: {
          OR: [
            { sendToAll: true },
            ...(isStudent ? [{ sendToStudents: true }] : []),
            ...(isParent ? [{ sendToParents: true }] : []),
            ...(isTeacher ? [{ sendToTeachers: true }] : []),
          ],
        },
      },
    });

    return NextResponse.json({ unreadCount: totalAnnouncements - readCount });
  } catch (error) {
    console.error('[UNREAD_COUNT]', error);
    return NextResponse.json({ error: 'Failed to get unread count' }, { status: 500 });
  }
}
