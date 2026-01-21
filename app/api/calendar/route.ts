import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  // If no user, only allow fetching public events (Public Calendar View)
  if (!user) {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    const where: Record<string, unknown> = {
      isPublic: true
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    try {
      const events = await prisma.calendarEvent.findMany({
        where,
        include: {
          team: { select: { name: true, slug: true } },
        },
        orderBy: { startTime: 'asc' }
      });
      return NextResponse.json({ events });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch public events' }, { status: 500 });
    }
  }

  if (!user) {
    // ... (existing public block)
  }

  const searchParams = request.nextUrl.searchParams;
  const publicOnly = searchParams.get('publicOnly') === 'true';

  // If publicOnly requested, fetch only public events regardless of user
  if (publicOnly) {
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const where: Record<string, unknown> = { isPublic: true };
    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    try {
      const events = await prisma.calendarEvent.findMany({
        where,
        include: { team: { select: { name: true, slug: true } } },
        orderBy: { startTime: 'asc' }
      });
      return NextResponse.json({ events });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch public events' }, { status: 500 });
    }
  }

  const teamSlug = searchParams.get('team');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  try {
    // Get user's team IDs
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });
    let teamIds = userTeams.map((t) => t.teamId);
    let studentUserIds: string[] = [];

    // If Parent, get linked students and their teams
    if (user.roles.includes('Parent') && user.profiles?.parent) {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { id: user.profiles.parent },
        include: {
          students: {
            include: {
              student: {
                include: { user: true }
              }
            }
          }
        }
      });

      if (parentProfile) {
        const linkedStudentIds = parentProfile.students.map(s => s.student.userId);
        studentUserIds.push(...linkedStudentIds);

        // Get teams for these students
        const studentTeams = await prisma.teamMember.findMany({
          where: { userId: { in: linkedStudentIds } },
          select: { teamId: true }
        });

        const studentTeamIds = studentTeams.map(t => t.teamId);
        // Add unique student team IDs to the list
        studentTeamIds.forEach(id => {
          if (!teamIds.includes(id)) teamIds.push(id);
        });
      }
    }

    // Build where clause
    const where: Record<string, unknown> = {
      OR: [
        { createdById: user.id }, // User's own events
        { teamId: { in: teamIds } }, // Team events (including students' teams if parent)
        { isPublic: true }, // Public events
        // If parent, include events where students are attendees
        ...(studentUserIds.length > 0 ? [{ attendees: { some: { userId: { in: studentUserIds } } } }] : [])
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
        attendees: true, // Useful for frontend to show who is attending
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
