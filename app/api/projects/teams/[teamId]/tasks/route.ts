import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/permissions';

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

        // Check membership
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

        // Fetch all tasks for all projects in this team
        const tasks = await prisma.task.findMany({
            where: {
                project: {
                    teamId: team.id,
                },
            },
            include: {
                project: {
                    select: {
                        name: true,
                        slug: true,
                        color: true,
                    },
                },
                assignees: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { project: { name: 'asc' } },
                { status: 'asc' },
                { kanbanOrder: 'asc' },
            ],
        });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error('Failed to fetch team tasks:', error);
        return NextResponse.json({ error: 'Failed to fetch team tasks' }, { status: 500 });
    }
}
