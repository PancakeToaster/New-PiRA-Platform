import { redirect } from 'next/navigation';
import { getCurrentUser, isAdmin, hasPermission } from '@/lib/permissions';
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

    const canManage = await hasPermission('knowledge', 'create'); // or edit
    const userIsAdmin = await isAdmin(); // Keep for passing to child components

    // Students/Teachers/Everyone else sees only published
    // Users with manage permissions see everything
    const whereClause = canManage ? {} : { isPublished: true };

    // Fetch ALL folders flat
    const allFolders = await prisma.folder.findMany({
        orderBy: { order: 'asc' },
    });

    // Fetch ALL nodes flat (filtered by permissions)
    const allNodes = await prisma.knowledgeNode.findMany({
        where: whereClause,
        select: { id: true, title: true, nodeType: true, isPublished: true, folderId: true, parentId: true, order: true },
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

    console.log(`[WikiLayout] Found ${allFolders.length} folders, ${allNodes.length} sidebar nodes, ${searchNodes.length} search nodes`);
    if (allNodes.length === 0 && !userIsAdmin) {
        console.log('[WikiLayout] DEBUG: Student view has 0 nodes. Checking count of ALL published nodes in DB...');
        const debugCount = await prisma.knowledgeNode.count({ where: { isPublished: true } });
        console.log(`[WikiLayout] DEBUG: Exact DB count of published nodes: ${debugCount}`);
    }

    return (
        <WikiAppShell folders={allFolders} nodes={allNodes} searchNodes={searchNodes} isAdmin={userIsAdmin} user={user}>
            {children}
        </WikiAppShell>
    );
}
