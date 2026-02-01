import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'] as const;

// GET /api/admin/courses/[id]/attendance - List sessions for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await prisma.classSession.findMany({
      where: { lmsCourseId: id },
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
      orderBy: { date: 'desc' },
    });

    // Also get enrolled students for the attendance form
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { lmsCourseId: id, status: 'active' },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      sessions,
      students: enrollments.map((e) => e.student),
    });
  } catch (error) {
    console.error('[ATTENDANCE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST /api/admin/courses/[id]/attendance - Create new session with attendance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, topic, notes, records } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate attendance statuses
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
    }

    const session = await prisma.classSession.create({
      data: {
        lmsCourseId: id,
        date: new Date(date),
        topic: topic || null,
        notes: notes || null,
        attendance: {
          create: Array.isArray(records)
            ? records.map((r: { studentId: string; status: string; note?: string }) => ({
                studentId: r.studentId,
                status: r.status || 'present',
                note: r.note || null,
              }))
            : [],
        },
      },
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

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('[ATTENDANCE_POST]', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
