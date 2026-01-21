import { BookOpen, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BasicCard from '@/components/ui/BasicCard';

export default async function WikiPage() {
    const recentNodes = await prisma.knowledgeNode.findMany({
        where: { isPublished: true },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { id: true, title: true, updatedAt: true, nodeType: true }
    });

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-12">
                <div className="bg-sky-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 text-sky-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Wiki & Knowledge Base</h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Welcome to the Robotics Academy knowledge hub. Select a topic from the sidebar to start exploring documentation, guides, and resources.
                </p>
            </div>

            {recentNodes.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <div className="bg-sky-500 rounded-full p-1 mr-3">
                            <FolderOpen className="w-4 h-4 text-white" />
                        </div>
                        Recently Updated
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentNodes.map(node => (
                            <Link key={node.id} href={`/wiki/${node.id}`}>
                                <BasicCard
                                    title={node.title}
                                    description={`Updated on ${new Date(node.updatedAt).toLocaleDateString()}`}
                                    hoverEffect={true}
                                    className="h-full border border-gray-100 shadow-sm"
                                >
                                    <div className="mt-2 text-xs font-semibold text-sky-600 bg-sky-50 inline-block px-2 py-1 rounded">
                                        {node.nodeType.toUpperCase()}
                                    </div>
                                </BasicCard>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
