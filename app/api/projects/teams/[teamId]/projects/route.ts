import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

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
        const { name, slug, description, color, startDate, endDate, status, priority } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        // Check permissions
        const userIsAdmin = await isAdmin();
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: user.id,
                },
            },
        });

        const canCreateProject =
            userIsAdmin ||
            (teamMember && (teamMember.role === 'mentor' || teamMember.role === 'captain'));

        if (!canCreateProject) {
            return NextResponse.json(
                { error: 'Only Admins, Mentors, and Team Captains can create projects' },
                { status: 403 }
            );
        }

        // Check if slug is unique within the team
        const existingProject = await prisma.project.findUnique({
            where: {
                teamId_slug: {
                    teamId,
                    slug,
                },
            },
        });

        if (existingProject) {
            return NextResponse.json(
                { error: 'A project with this slug already exists in this team' },
                { status: 400 }
            );
        }

        const project = await prisma.project.create({
            data: {
                teamId,
                name,
                slug,
                description,
                color,
                status: status || 'planning',
                priority: priority || 'medium',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            },
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error('Failed to create project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
