'use client';

import { useState } from 'react';
import { Edit2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import WikiTitleEditor from '@/components/wiki/WikiTitleEditor';
import WikiContentClient from '@/components/wiki/WikiContentClient';
import WikiPageControls from '@/components/wiki/WikiPageControls';
import { Calendar, Tag, User as UserIcon, Eye as EyeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WikiPageContainerProps {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    node: any; // Using any for simplicity with complex Prisma types + stale client
    isAdmin: boolean;
    isTeacherOrMentor: boolean;
    canComment: boolean;
    currentUserId: string;
}

export default function WikiPageContainer({ node, isAdmin, isTeacherOrMentor, canComment, currentUserId }: WikiPageContainerProps) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden flex flex-col min-h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="border-b border-border bg-muted/30 px-8 py-6">

                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                        {/* Title Section */}
                        <WikiTitleEditor
                            nodeId={node.id}
                            initialTitle={node.title}
                            isEditing={isEditing}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1.5" />
                        {node.author.firstName} {node.author.lastName}
                    </div>
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        {new Date(node.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1.5" />
                        {node._count.views + 1} views
                    </div>

                    <div className="ml-auto flex gap-2 items-center">
                        {!node.isPublished && (
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium">
                                📝 Draft
                            </span>
                        )}

                        {isAdmin && (
                            <>
                                <Button
                                    variant={isEditing ? "secondary" : "primary"}
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="gap-2"
                                >
                                    {isEditing ? (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            Preview Mode
                                        </>
                                    ) : (
                                        <>
                                            <Edit2 className="w-4 h-4" />
                                            Edit Mode
                                        </>
                                    )}
                                </Button>

                                <div className="pl-2 border-l border-border">
                                    <WikiPageControls
                                        nodeId={node.id}
                                        isPublished={node.isPublished}
                                        isAdmin={isAdmin}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {node.tags && node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {node.tags.map((tag: string) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-700 dark:text-sky-400">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-8 py-8 flex-1 relative">
                <WikiContentClient
                    nodeId={node.id}
                    content={node.content}
                    nodeType={node.nodeType}
                    isAdmin={isEditing} // Only allow editing if in Edit Mode
                    isTeacherOrMentor={isTeacherOrMentor}
                    canComment={canComment}
                    graphData={node.graphData}
                    mindmapData={node.mindmapData}
                    canvasData={node.canvasData}
                    currentUserId={currentUserId}
                />
            </div>
        </div>
    );
}
