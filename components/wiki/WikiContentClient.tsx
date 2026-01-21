'use client';

import { useState } from 'react';
import MarkdownEditor from '@/components/wiki/editors/MarkdownEditor';
import MarkdownRenderer from '@/components/wiki/editors/MarkdownRenderer';
import WikiComments from '@/components/wiki/WikiComments';
import WikiSuggestionModal from '@/components/wiki/WikiSuggestionModal';
import WikiSuggestionReview from '@/components/wiki/WikiSuggestionReview';
import { Lightbulb, MessageSquare } from 'lucide-react';

interface WikiContentClientProps {
    nodeId: string;
    content: string;
    nodeType: string;
    isAdmin: boolean;
    isTeacherOrMentor: boolean;
    graphData: string | null;
    mindmapData: string | null;
    canvasData: string | null;
    currentUserId: string;
}

export default function WikiContentClient({
    nodeId,
    content,
    nodeType,
    isAdmin,
    isTeacherOrMentor,
    graphData,
    mindmapData,
    canvasData,
    currentUserId,
}: WikiContentClientProps) {
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

    // Determine if content is Tiptap JSON or plain Markdown
    const isTiptapJSON = (str: string) => {
        if (!str) return false;

        try {
            const parsed = JSON.parse(str);
            const isValid = parsed && typeof parsed === 'object' && parsed.type === 'doc';
            return isValid;
        } catch (e) {
            return false;
        }
    };

    // Extract plain text from Tiptap JSON structure
    const extractTextFromTiptap = (node: any): string => {
        if (!node) return '';

        if (node.type === 'text') {
            return node.text || '';
        }

        if (node.content && Array.isArray(node.content)) {
            return node.content.map((child: any) => {
                const text = extractTextFromTiptap(child);
                // Add line breaks for block elements
                if (node.type === 'paragraph' || node.type === 'heading') {
                    return text + '\n\n';
                }
                return text;
            }).join('');
        }

        return '';
    };

    const isJson = isTiptapJSON(content);

    // If it's Tiptap JSON, extract the text to check for markdown syntax
    let markdownContent = content;
    if (isJson) {
        try {
            const parsed = JSON.parse(content);
            markdownContent = extractTextFromTiptap(parsed);
        } catch (e) {
            console.error('[WikiContentClient] Failed to extract text:', e);
        }
    }

    const handleSave = async (newContent: string) => {
        try {
            const response = await fetch(`/api/wiki/nodes/${nodeId}/content`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newContent }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`Failed to save: ${response.status} ${errorData.error || response.statusText}`);
            }

            setSaveError(null);
        } catch (error) {
            console.error('[WikiContentClient] Save error:', error);
            setSaveError('Failed to save changes');
            throw error;
        }
    };

    // Render based on node type
    if (nodeType === 'markdown') {
        return (
            <div>
                {saveError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {saveError}
                    </div>
                )}

                {/* Admin Suggestion Review Panel */}
                {isAdmin && (
                    <WikiSuggestionReview
                        nodeId={nodeId}
                        currentContent={markdownContent}
                    />
                )}

                {isAdmin ? (
                    <MarkdownEditor
                        content={markdownContent}
                        onSave={handleSave}
                        nodeId={nodeId}
                    />
                ) : (
                    <MarkdownRenderer content={markdownContent} />
                )}

                {/* Teacher/Mentor Buttons */}
                {(isTeacherOrMentor) && (
                    <div className="mt-8 flex gap-3 border-t border-gray-100 pt-6">
                        <button
                            onClick={() => setIsSuggestionModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                            <Lightbulb className="w-4 h-4" />
                            Suggest Edit
                        </button>
                    </div>
                )}

                {/* Comments Section */}
                <WikiComments
                    nodeId={nodeId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                />

                {/* Suggestion Modal */}
                <WikiSuggestionModal
                    nodeId={nodeId}
                    initialContent={markdownContent}
                    isOpen={isSuggestionModalOpen}
                    onClose={() => setIsSuggestionModalOpen(false)}
                />
            </div>
        );
    }

    // Placeholder for other node types
    return (
        <div className="p-8 bg-gray-50 rounded-lg text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-500">
                Visualization for <strong>{nodeType}</strong> is coming soon.
            </p>
            {graphData && <p className="text-xs text-gray-400 mt-2">Graph data available</p>}
            {mindmapData && <p className="text-xs text-gray-400 mt-2">Mindmap data available</p>}
            {canvasData && <p className="text-xs text-gray-400 mt-2">Canvas data available</p>}

            {/* Comments for non-markdown types too */}
            <div className="text-left">
                <WikiComments
                    nodeId={nodeId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    );
}
