import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string, subTeamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId, subTeamId } = await params;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });

        const isManager = membership && ['owner', 'captain', 'mentor'].includes(membership.role);
        const isAdmin = user.roles.some((r: any) => r.role?.name === 'Admin' || r.role?.name === 'Teacher');

        if (!isManager && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.subTeam.delete({
            where: { id: subTeamId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete subteam:', error);
        return NextResponse.json({ error: 'Failed to delete subteam' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ teamId: string, subTeamId: string }> }
) {
    const user = await getCurrentUser();
    const { teamId, subTeamId } = await params;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const membership = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId, userId: user.id } },
        });

        const isManager = membership && ['owner', 'captain', 'mentor'].includes(membership.role);
        const isAdmin = user.roles.some((r: any) => r.role?.name === 'Admin' || r.role?.name === 'Teacher');

        if (!isManager && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, memberIds } = body;

        // If updating basic info
        if (name !== undefined) {
            const updated = await prisma.subTeam.update({
                where: { id: subTeamId },
                data: { name, description },
                include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } }, _count: { select: { members: true } } }
            });
            return NextResponse.json({ subteam: updated });
        }

        // If updating members (sync memberList)
        if (memberIds && Array.isArray(memberIds)) {
            // Transaction to wipe and re-add for simplicity of syncing
            await prisma.$transaction(async (tx) => {
                await tx.subTeamMember.deleteMany({ where: { subTeamId } });

                if (memberIds.length > 0) {
                    await tx.subTeamMember.createMany({
                        data: memberIds.map(id => ({
                            subTeamId,
                            userId: id,
                            assignedBy: user.id
                        }))
                    });
                }
            });

            const updated = await prisma.subTeam.findUnique({
                where: { id: subTeamId },
                include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } }, _count: { select: { members: true } } }
            });
            return NextResponse.json({ subteam: updated });
        }

        return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    } catch (error) {
        console.error('Failed to update subteam:', error);
        return NextResponse.json({ error: 'Failed to update subteam' }, { status: 500 });
    }
}
