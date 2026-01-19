import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const teamSlug = searchParams.get('team');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  try {
    // Get user's team IDs
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });
    const teamIds = userTeams.map((t) => t.teamId);

    // Build where clause
    const where: Record<string, unknown> = {
      OR: [
        { createdById: user.id }, // User's own events
        { teamId: { in: teamIds } }, // Team events
        { isPublic: true }, // Public events
      ],
    };

    // Filter by specific team if provided
    if (teamSlug) {
      const team = await prisma.team.findUnique({
        where: { slug: teamSlug },
      });
      if (team && teamIds.includes(team.id)) {
        where.teamId = team.id;
      }
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        team: {
          select: {
            name: true,
            slug: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      eventType,
      startTime,
      endTime,
      allDay,
      location,
      color,
      teamId,
      isPublic,
    } = body;

    if (!title || !startTime) {
      return NextResponse.json(
        { error: 'Title and start time are required' },
        { status: 400 }
      );
    }

    // If team is specified, check membership
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        eventType: eventType || 'other',
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        allDay: allDay || false,
        location,
        color,
        teamId: teamId || null,
        createdById: user.id,
        isPublic: isPublic || false,
      },
      include: {
        team: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
