import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SubteamsClient from './SubteamsClient';

export default async function SubteamsPage({ params }: { params: { teamSlug: string } }) {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const team = await prisma.team.findUnique({
        where: { slug: params.teamSlug },
    });

    if (!team) redirect('/projects/teams');

    // Verify membership or admin
    const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: team.id, userId: user.id } },
    });
    const isAdmin = user.roles.some((role: string) => role === 'Admin' || role === 'Teacher');

    if (!membership && !isAdmin) {
        redirect(`/projects/teams/${params.teamSlug}`);
    }

    const canManage = isAdmin || (membership && ['owner', 'captain', 'mentor'].includes(membership.role));

    // Fetch subteams
    const subteams = await prisma.subTeam.findMany({
        where: { teamId: team.id },
        include: {
            members: {
                include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } }
            },
            _count: { select: { members: true } }
        },
        orderBy: { name: 'asc' }
    });

    // Fetch team members list for assignments
    const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: team.id },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { user: { firstName: 'asc' } }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                        <Link href={`/projects/teams/${team.slug}`} className="hover:text-foreground">
                            {team.name}
                        </Link>
                        <span>/</span>
                        <span>Subteams</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Subteams</h1>
                    <p className="text-muted-foreground mt-1">Manage subteams and assign members to them.</p>
                </div>
            </div>

            <SubteamsClient
                teamId={team.id}
                initialSubteams={subteams}
                teamMembers={teamMembers}
                canManage={!!canManage}
            />
        </div>
    );
}
