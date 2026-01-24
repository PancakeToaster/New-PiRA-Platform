import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

async function getTeamMembership(teamId: string, userId: string) {
  return prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const user = await getCurrentUser();
  const { teamId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Try to find by ID first
    let team = null;
    try {
      team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          projects: {
            include: {
              _count: {
                select: {
                  tasks: true,
                },
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        },
      });
    } catch (e) {
      // Ignore error if ID format is invalid, proceed to slug check
    }

    if (!team) {
      // Try finding by slug
      team = await prisma.team.findUnique({
        where: { slug: teamId },
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
          projects: {
            include: {
              _count: {
                select: {
                  tasks: true,
                },
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
          },
        },
      });
    }

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is a member or admin
    const userIsAdmin = await isAdmin();
    const membership = team.members.find((m) => m.userId === user.id);

    if (!membership && !userIsAdmin) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    return NextResponse.json({ team, userRole: membership?.role });
  } catch (error) {
    console.error('Failed to fetch team:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const user = await getCurrentUser();
  const { teamId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find team by ID or slug
    let team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      team = await prisma.team.findUnique({
        where: { slug: teamId },
      });
    }

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is owner or captain
    const membership = await getTeamMembership(team.id, user.id);
    if (!membership || !['owner', 'captain', 'mentor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, isActive } = body;

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: {
        name: name ?? team.name,
        description: description ?? team.description,
        color: color ?? team.color,
        isActive: isActive ?? team.isActive,
      },
    });

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error('Failed to update team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const user = await getCurrentUser();
  const { teamId } = await params;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find team by ID or slug
    let team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      team = await prisma.team.findUnique({
        where: { slug: teamId },
      });
    }

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only owner can delete
    const membership = await getTeamMembership(team.id, user.id);
    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only team owner can delete the team' }, { status: 403 });
    }

    await prisma.team.delete({
      where: { id: team.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
