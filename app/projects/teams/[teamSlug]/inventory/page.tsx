import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { FolderKanban, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import TeamInventoryClient from './TeamInventoryClient';

export default async function TeamInventoryPage({ params }: { params: { teamSlug: string } }) {
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

    // Fetch team's current checkouts
    const checkouts = await prisma.inventoryCheckout.findMany({
        where: { teamId: team.id },
        include: {
            item: true,
            user: { select: { firstName: true, lastName: true } },
            project: { select: { name: true } }
        },
        orderBy: { checkoutDate: 'desc' }
    });

    // Fetch available global inventory to select from
    const availableInventory = await prisma.inventoryItem.findMany({
        where: { quantity: { gt: 0 } },
        orderBy: { name: 'asc' }
    });

    // Fetch team's projects for optional association
    const teamProjects = await prisma.project.findMany({
        where: { teamId: team.id },
        select: { id: true, name: true }
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
                        <span>Inventory</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Inventory Checkouts</h1>
                </div>
            </div>

            <TeamInventoryClient
                teamId={team.id}
                initialCheckouts={checkouts}
                availableInventory={availableInventory}
                teamProjects={teamProjects}
                userId={user.id}
            />
        </div>
    );
}
