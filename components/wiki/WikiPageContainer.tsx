'use client';

import { useState } from 'react';
import { Edit2, Eye, LayoutTemplate, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import WikiTitleEditor from '@/components/wiki/WikiTitleEditor';
import WikiContentClient from '@/components/wiki/WikiContentClient';
import WikiPageControls from '@/components/wiki/WikiPageControls';
import MindmapView from '@/components/wiki/visualizations/MindmapView';
import { Calendar, Tag, User as UserIcon, Eye as EyeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WikiPageContainerProps {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    node: any; // Using any for simplicity with complex Prisma types + stale client
    isAdmin: boolean;
    isTeacherOrMentor: boolean;
    currentUserId: string;
}

export default function WikiPageContainer({ node, isAdmin, isTeacherOrMentor, currentUserId }: WikiPageContainerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'mindmap'>('content');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="border-b border-gray-100 bg-gray-50 px-8 py-6">

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

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                        {/* View Toggles */}
                        <div className="flex bg-gray-200/50 rounded-lg p-1 mr-2">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'content'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutTemplate className="w-4 h-4" />
                                Content
                            </button>
                            <button
                                onClick={() => setActiveTab('mindmap')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'mindmap'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Workflow className="w-4 h-4" />
                                Mindmap
                            </button>
                        </div>

                        {!node.isPublished && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
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

                                <div className="pl-2 border-l border-gray-300">
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
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-8 py-8 flex-1 relative">
                {activeTab === 'content' && (
                    <WikiContentClient
                        nodeId={node.id}
                        content={node.content}
                        nodeType={node.nodeType}
                        isAdmin={isEditing} // Only allow editing if in Edit Mode
                        isTeacherOrMentor={isTeacherOrMentor}
                        graphData={node.graphData}
                        mindmapData={node.mindmapData}
                        canvasData={node.canvasData}
                        currentUserId={currentUserId}
                    />
                )}
                {activeTab === 'mindmap' && (
                    <MindmapView currentId={node.id} />
                )}
            </div>
        </div>
    );
}
