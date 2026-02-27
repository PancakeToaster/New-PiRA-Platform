import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { createCalendarEventSchema } from '@/lib/validations/system';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const teamId = searchParams.get('teamId');
  const eventType = searchParams.get('eventType');

  try {
    const where: Record<string, unknown> = {};

    if (teamId) {
      where.teamId = teamId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            attendees: true,
          },
        },
      },
    });

    const stats = {
      total: events.length,
      upcoming: events.filter((e) => new Date(e.startTime) > new Date()).length,
      past: events.filter((e) => new Date(e.startTime) <= new Date()).length,
      byType: {
        competition: events.filter((e) => e.eventType === 'competition').length,
        meeting: events.filter((e) => e.eventType === 'meeting').length,
        deadline: events.filter((e) => e.eventType === 'deadline').length,
        class: events.filter((e) => e.eventType === 'class').length,
        practice: events.filter((e) => e.eventType === 'practice').length,
        other: events.filter((e) => e.eventType === 'other').length,
      },
    };

    return NextResponse.json({ events, stats });
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const userIsAdmin = await isAdmin();

  if (!user || !userIsAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createCalendarEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      allDay,
      location,
      color,
      isPublic,
      teamId,
    } = parsed.data;

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        eventType,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        allDay: allDay ?? false,
        location,
        color,
        isPublic: isPublic ?? false,
        createdById: user.id,
        teamId: teamId || null,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
