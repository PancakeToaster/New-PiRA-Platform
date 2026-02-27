import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId } = await params;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const subteams = await prisma.subTeam.findMany({
            where: { teamId },
            include: {
                members: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
                },
                _count: { select: { members: true } }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ subteams });
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
    const { teamId } = await params;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });

        // Only owners, captains, mentors, or global admins can create subteams
        const isManager = membership && ['owner', 'captain', 'mentor'].includes(membership.role);
        const isAdmin = user.roles.some((r: any) => r.role?.name === 'Admin' || r.role?.name === 'Teacher');

        if (!isManager && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const subteam = await prisma.subTeam.create({
            data: {
                teamId,
                name,
                description
            },
            include: {
                members: true,
                _count: { select: { members: true } }
            }
        });

        return NextResponse.json({ subteam }, { status: 201 });
    } catch (error) {
        console.error('Failed to create subteam:', error);
        return NextResponse.json({ error: 'Failed to create subteam' }, { status: 500 });
    }
}
