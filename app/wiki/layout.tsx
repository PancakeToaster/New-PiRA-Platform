import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import WikiAppShell from '@/components/wiki/WikiAppShell';

export default async function WikiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login?callbackUrl=/wiki');
    }

    const userIsAdmin = await isAdmin();
    const whereClause = userIsAdmin ? {} : { isPublished: true };

    // Fetch ALL folders flat
    const allFolders = await prisma.folder.findMany({
        orderBy: { order: 'asc' },
    });

    // Fetch ALL nodes flat (filtered by permissions)
    const allNodes = await prisma.knowledgeNode.findMany({
        where: whereClause,
        select: { id: true, title: true, nodeType: true, isPublished: true, folderId: true, order: true },
        orderBy: { order: 'asc' },
    });

    // Fetch content for search (can reuse allNodes if we select content, but let's keep separate optimized queries or merge)
    // Actually, for search we need content. for sidebar we don't.
    // Let's fetch search nodes separately or just add content to allNodes?
    // Adding content to allNodes might be heavy if used only for sidebar.
    // Let's keep allNodes for sidebar (lightweight) and searchNodes for search (heavy).

    const searchNodes = await prisma.knowledgeNode.findMany({
        where: whereClause,
        select: { id: true, title: true, content: true, nodeType: true, isPublished: true },
    });

    return (
        <WikiAppShell folders={allFolders} nodes={allNodes} searchNodes={searchNodes} isAdmin={userIsAdmin}>
            {children}
        </WikiAppShell>
    );
}
