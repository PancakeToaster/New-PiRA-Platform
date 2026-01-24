import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  const user = await getCurrentUser();
  const { teamSlug, projectSlug } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find team by slug or id
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { slug: teamSlug },
          { id: teamSlug }
        ]
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is a member
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Find project
    const project = await prisma.project.findUnique({
      where: {
        teamId_slug: {
          teamId: team.id,
          slug: projectSlug,
        },
      },
      include: {
        team: {
          select: {
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            startDate: true,
            dueDate: true,
            dependencies: true,
            checklistItems: {
              orderBy: {
                order: 'asc',
              },
            },
            assignees: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        milestones: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      project,
      userRole: membership.role,
    });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  const user = await getCurrentUser();
  const { teamSlug, projectSlug } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { slug: teamSlug },
          { id: teamSlug }
        ]
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id,
        },
      },
    });

    if (!membership || !['owner', 'captain', 'mentor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, status, priority, color, startDate, endDate } = body;

    const project = await prisma.project.update({
      where: {
        teamId_slug: {
          teamId: team.id,
          slug: projectSlug,
        },
      },
      data: {
        name,
        description,
        status,
        priority,
        color,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
