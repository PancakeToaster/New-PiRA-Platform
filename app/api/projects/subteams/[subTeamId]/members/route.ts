import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

export async function POST(
    request: NextRequest,
    { params }: { params: { subTeamId: string } }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { subTeamId } = params;
        const body = await request.json();
        const { userId: memberUserId } = body;

        if (!memberUserId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get subteam with team info
        const subTeam = await prisma.subTeam.findUnique({
            where: { id: subTeamId },
            include: { team: true },
        });

        if (!subTeam) {
            return NextResponse.json({ error: 'Subteam not found' }, { status: 404 });
        }

        // Check permissions: Admin OR (Team member with role mentor/captain)
        const userIsAdmin = await isAdmin();
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: subTeam.teamId,
                    userId: user.id,
                },
            },
        });

        const canManageSubteam =
            userIsAdmin ||
            (teamMember && (teamMember.role === 'mentor' || teamMember.role === 'captain'));

        if (!canManageSubteam) {
            return NextResponse.json(
                { error: 'Only Admins, Mentors, and Team Captains can manage subteam members' },
                { status: 403 }
            );
        }

        // Validate that the user being added is a member of the parent team
        const targetTeamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: subTeam.teamId,
                    userId: memberUserId,
                },
            },
        });

        if (!targetTeamMember) {
            return NextResponse.json(
                { error: 'User must be a member of the parent team first' },
                { status: 400 }
            );
        }

        // Add user to subteam
        const subTeamMember = await prisma.subTeamMember.create({
            data: {
                subTeamId,
                userId: memberUserId,
                assignedBy: user.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return NextResponse.json({ subTeamMember }, { status: 201 });
    } catch (error: any) {
        console.error('Failed to add subteam member:', error);

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'User is already a member of this subteam' },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: 'Failed to add subteam member' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { subTeamId: string } }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { subTeamId } = params;
        const { searchParams } = new URL(request.url);
        const memberUserId = searchParams.get('userId');

        if (!memberUserId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get subteam with team info
        const subTeam = await prisma.subTeam.findUnique({
            where: { id: subTeamId },
            include: { team: true },
        });

        if (!subTeam) {
            return NextResponse.json({ error: 'Subteam not found' }, { status: 404 });
        }

        // Check permissions
        const userIsAdmin = await isAdmin();
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: subTeam.teamId,
                    userId: user.id,
                },
            },
        });

        const canManageSubteam =
            userIsAdmin ||
            (teamMember && (teamMember.role === 'mentor' || teamMember.role === 'captain'));

        if (!canManageSubteam) {
            return NextResponse.json(
                { error: 'Only Admins, Mentors, and Team Captains can manage subteam members' },
                { status: 403 }
            );
        }

        // Remove user from subteam
        await prisma.subTeamMember.deleteMany({
            where: {
                subTeamId,
                userId: memberUserId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to remove subteam member:', error);
        return NextResponse.json({ error: 'Failed to remove subteam member' }, { status: 500 });
    }
}
