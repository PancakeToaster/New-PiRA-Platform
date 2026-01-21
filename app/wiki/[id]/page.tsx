import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasRole } from '@/lib/permissions';
import WikiBreadcrumbs from '@/components/wiki/WikiBreadcrumbs';
import WikiTableOfContents from '@/components/wiki/WikiTableOfContents';
import WikiPageContainer from '@/components/wiki/WikiPageContainer';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;

    const node = await prisma.knowledgeNode.findUnique({
        where: { id },
    });

    if (!node) {
        return { title: 'Node Not Found' };
    }

    return {
        title: `${node.title} - Wiki`,
    };
}

export default async function WikiNodePage({ params }: Props) {
    const { id } = await params;
    const user = await getCurrentUser();

    console.log('[WikiNodePage] Accessing id:', id);
    console.log('[WikiNodePage] User:', user?.email, user?.roles);

    if (!user) {
        console.log('[WikiNodePage] No user found, redirecting to login');
        redirect('/login');
    }

    // Check if user is admin
    const isAdminUser = await hasRole('Admin');
    console.log('[WikiNodePage] Is Admin:', isAdminUser);

    // Try finding by ID first
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let node = await prisma.knowledgeNode.findUnique({
        where: { id },
        include: {
            author: {
                select: { firstName: true, lastName: true },
            },
            folder: true,
            _count: {
                select: { views: true }
            }
        },
    }) as any;

    // If not found by ID, try finding by slug
    if (!node) {
        console.log('[WikiNodePage] Node not found by ID, trying slug:', id);
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        node = await prisma.knowledgeNode.findFirst({
            where: { slug: id } as any,
            include: {
                author: {
                    select: { firstName: true, lastName: true },
                },
                folder: true,
                _count: {
                    select: { views: true }
                }
            },
        }) as any;
    }

    console.log('[WikiNodePage] Node found:', node ? node.id : 'null');
    console.log('[WikiNodePage] Node published:', node?.isPublished);

    // Allow admins to view unpublished pages, others only see published
    if (!node || (!node.isPublished && !isAdminUser)) {
        console.log('[WikiNodePage] Access denied or not found. Triggering notFound()');
        notFound();
    }

    // Log View
    await prisma.pageView.create({
        data: {
            path: `/wiki/${node.id}`,
            userId: user.id,
            userRole: 'user',
            knowledgeNodeId: node.id,
        },
    });

    // Determine user role
    const isTeacher = await hasRole('Teacher');
    const isMentor = await hasRole('Mentor');
    const isTeacherOrMentor = isTeacher || isMentor;

    // Build breadcrumbs
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const breadcrumbs: any[] = [];
    if (node.folder) {
        breadcrumbs.push({ label: node.folder.name, href: `/wiki?folder=${node.folder.id}` });
    }
    breadcrumbs.push({ label: node.title });

    return (
        <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <WikiBreadcrumbs breadcrumbs={breadcrumbs} />

                <WikiPageContainer
                    node={node}
                    isAdmin={isAdminUser}
                    isTeacherOrMentor={isTeacherOrMentor}
                    currentUserId={user.id}
                />
            </div>

            {/* Table of Contents */}
            <WikiTableOfContents content={node.content} />
        </div>
    );
}
