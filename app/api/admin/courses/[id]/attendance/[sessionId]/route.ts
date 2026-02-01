import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'] as const;

// GET /api/admin/courses/[id]/attendance/[sessionId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        attendance: {
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.lmsCourseId !== id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('[ATTENDANCE_SESSION_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id]/attendance/[sessionId] - Update attendance records
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing || existing.lmsCourseId !== id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await request.json();
    const { date, topic, notes, records } = body;

    // Update session fields
    const session = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        date: date ? new Date(date) : undefined,
        topic: topic !== undefined ? topic : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    // Validate and upsert attendance records
    if (Array.isArray(records)) {
      const invalidStatus = records.find(
        (r: { status?: string }) => r.status && !VALID_STATUSES.includes(r.status as typeof VALID_STATUSES[number])
      );
      if (invalidStatus) {
        return NextResponse.json(
          { error: `Invalid status "${invalidStatus.status}". Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }

      for (const record of records) {
        await prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status || 'present',
            note: record.note || null,
          },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status || 'present',
            note: record.note || null,
          },
        });
      }
    }

    // Return updated session
    const updated = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        attendance: {
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error('[ATTENDANCE_SESSION_PUT]', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id]/attendance/[sessionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const { id, sessionId } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!existing || existing.lmsCourseId !== id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.classSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ATTENDANCE_SESSION_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
