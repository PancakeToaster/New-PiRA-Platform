import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';
import icalGenerator from 'ical-generator';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const teamSlug = searchParams.get('team');

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
        { createdById: user.id },
        { teamId: { in: teamIds } },
        { isPublic: true },
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

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Create iCal calendar
    const calendar = icalGenerator({
      name: teamSlug ? `${teamSlug} Calendar` : 'Robotics Academy Calendar',
      timezone: 'UTC',
    });

    // Add events to calendar
    for (const event of events) {
      calendar.createEvent({
        id: event.id,
        start: event.startTime,
        end: event.endTime || event.startTime,
        allDay: event.allDay,
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        categories: [{ name: event.eventType }],
      });
    }

    // Return iCal file
    const icalString = calendar.toString();

    return new NextResponse(icalString, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${teamSlug || 'calendar'}.ics"`,
      },
    });
  } catch (error) {
    console.error('Failed to export calendar:', error);
    return NextResponse.json({ error: 'Failed to export calendar' }, { status: 500 });
  }
}
