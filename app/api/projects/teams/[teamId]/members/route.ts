import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

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
        const members = await prisma.teamMember.findMany({
            where: { teamId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        roles: {
                            include: {
                                role: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                joinedAt: 'asc',
            },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Failed to fetch team members:', error);
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userIsAdmin = await isAdmin();
    let hasPermission = userIsAdmin;

    if (!hasPermission) {
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });
        // Owners, Captains, and Mentors can add members
        if (membership && ['owner', 'captain', 'mentor'].includes(membership.role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
        return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { userId, role } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Check if user is already a member
        const existingMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: 'User is already a member of this team' },
                { status: 400 }
            );
        }

        const member = await prisma.teamMember.create({
            data: {
                teamId,
                userId,
                role: role || 'member',
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

        return NextResponse.json({ member }, { status: 201 });
    } catch (error) {
        console.error('Failed to add team member:', error);
        return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId } = await params;

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const userIsAdmin = await isAdmin();
    let hasPermission = userIsAdmin;

    if (!hasPermission) {
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });
        // Only Owners and Captains can update roles
        if (membership && ['owner', 'captain'].includes(membership.role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
        return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'User ID and Role are required' },
                { status: 400 }
            );
        }

        // Update member role
        const member = await prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
            data: {
                role,
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

        return NextResponse.json({ member });
    } catch (error) {
        console.error('Failed to update team member:', error);
        return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
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

    // Check permissions
    const userIsAdmin = await isAdmin();
    let hasPermission = userIsAdmin;

    if (!hasPermission) {
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });
        // Owners and Captains can remove members
        if (membership && ['owner', 'captain'].includes(membership.role)) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
        return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Remove user from team
        await prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to remove team member:', error);
        return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
    }
}
