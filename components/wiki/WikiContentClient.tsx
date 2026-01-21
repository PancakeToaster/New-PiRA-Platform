'use client';

import { useState } from 'react';
import MarkdownEditor from '@/components/wiki/editors/MarkdownEditor';
import MarkdownRenderer from '@/components/wiki/editors/MarkdownRenderer';

interface WikiContentClientProps {
    nodeId: string;
    content: string;
    nodeType: string;
    isAdmin: boolean;
    isTeacherOrMentor: boolean;
    graphData: string | null;
    mindmapData: string | null;
    canvasData: string | null;
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
}: WikiContentClientProps) {
    const [saveError, setSaveError] = useState<string | null>(null);

    // Determine if content is Tiptap JSON or plain Markdown
    const isTiptapJSON = (str: string) => {
        if (!str) return false;

        try {
            const parsed = JSON.parse(str);
            const isValid = parsed && typeof parsed === 'object' && parsed.type === 'doc';
            console.log('[WikiContentClient] Content type check:', {
                isValid,
                parsedType: typeof parsed,
                hasDocType: parsed?.type === 'doc',
                contentPreview: str.substring(0, 100)
            });
            return isValid;
        } catch (e) {
            console.log('[WikiContentClient] Not JSON, treating as markdown:', str.substring(0, 100));
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
            console.log('[WikiContentClient] Extracted markdown text:', markdownContent.substring(0, 200));
        } catch (e) {
            console.error('[WikiContentClient] Failed to extract text:', e);
        }
    }

    console.log('[WikiContentClient] Rendering decision:', {
        nodeId,
        isAdmin,
        isJson,
        contentLength: content?.length,
        markdownLength: markdownContent?.length
    });

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
                console.error('[WikiContentClient] Save failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
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

                {isAdmin ? (
                    <MarkdownEditor
                        content={markdownContent}
                        onSave={handleSave}
                        nodeId={nodeId}
                    />
                ) : (
                    <MarkdownRenderer content={markdownContent} />
                )}

                {isTeacherOrMentor && !isAdmin && (
                    <div className="mt-6 flex gap-3">
                        <button className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium">
                            💡 Suggest Edit
                        </button>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                            💬 Add Comment
                        </button>
                    </div>
                )}
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
        </div>
    );
}
