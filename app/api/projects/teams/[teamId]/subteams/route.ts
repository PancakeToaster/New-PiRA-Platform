import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: { teamId: string } }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { teamId } = params;

        // Check if user is a member of the team
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: user.id,
                },
            },
        });

        const userIsAdmin = await isAdmin();

        if (!teamMember && !userIsAdmin) {
            return NextResponse.json(
                { error: 'You must be a team member to view subteams' },
                { status: 403 }
            );
        }

        const subTeams = await prisma.subTeam.findMany({
            where: { teamId },
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                },
                members: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({ subTeams });
    } catch (error) {
        console.error('Failed to fetch subteams:', error);
        return NextResponse.json({ error: 'Failed to fetch subteams' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { teamId } = await params;
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Check permissions: Admin OR (Team member with role mentor/captain)
        const userIsAdmin = await isAdmin();
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: user.id,
                },
            },
        });

        const canCreateSubteam =
            userIsAdmin ||
            (teamMember && (teamMember.role === 'mentor' || teamMember.role === 'captain'));

        if (!canCreateSubteam) {
            return NextResponse.json(
                { error: 'Only Admins, Mentors, and Team Captains can create subteams' },
                { status: 403 }
            );
        }

        const subTeam = await prisma.subTeam.create({
            data: {
                teamId,
                name,
                description,
            },
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        return NextResponse.json({ subTeam }, { status: 201 });
    } catch (error) {
        console.error('Failed to create subteam:', error);
        return NextResponse.json({ error: 'Failed to create subteam' }, { status: 500 });
    }
}
