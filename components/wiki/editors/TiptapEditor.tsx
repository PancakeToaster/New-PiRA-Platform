'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useState } from 'react';
import {
    Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Undo, Redo, Image as ImageIcon,
    Table as TableIcon
} from 'lucide-react';

interface TiptapEditorProps {
    content: string; // Tiptap JSON as string
    onSave: (content: string) => Promise<void>;
    nodeId: string;
}

export default function TiptapEditor({ content, onSave, nodeId }: TiptapEditorProps) {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Initialize lowlight
    const lowlight = createLowlight(common);

    // Helper to parse content safely
    const parseContent = (str: string) => {
        if (!str) return '';

        try {
            const parsed = JSON.parse(str);
            // If it's valid Tiptap JSON, return it
            if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
                return parsed;
            }
            // If it's a plain string wrapped in JSON, treat as plain text
            if (typeof parsed === 'string') {
                return parsed;
            }
            return parsed;
        } catch (e) {
            // If JSON parsing fails, treat as plain text/markdown
            return str;
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We'll use CodeBlockLowlight instead
            }),
            Image,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: parseContent(content),
        editorProps: {
            attributes: {
                class: 'prose prose-sky max-w-none focus:outline-none min-h-[400px] px-4 py-2',
            },
        },
        onUpdate: ({ editor }) => {
            // Debounced auto-save
            handleAutoSave(editor.getJSON());
        },
        immediatelyRender: false,
    });

    // Debounced auto-save function
    const handleAutoSave = useCallback(
        debounce(async (json: any) => {
            setSaveStatus('saving');
            try {
                await onSave(JSON.stringify(json));
                setSaveStatus('saved');
                setLastSaved(new Date());
            } catch (error) {
                console.error('Save error:', error);
                setSaveStatus('error');
            }
        }, 2000),
        [onSave]
    );

    if (!editor) {
        return <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>;
    }

    return (
        <div className="border border-gray-200 rounded-lg bg-white">
            {/* Toolbar */}
            <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 sticky top-0 bg-white z-10">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={<Bold className="w-4 h-4" />}
                    title="Bold (Cmd+B)"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={<Italic className="w-4 h-4" />}
                    title="Italic (Cmd+I)"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    icon={<Strikethrough className="w-4 h-4" />}
                    title="Strikethrough"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    icon={<Code className="w-4 h-4" />}
                    title="Inline Code"
                />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon={<Heading1 className="w-4 h-4" />}
                    title="Heading 1"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={<Heading2 className="w-4 h-4" />}
                    title="Heading 2"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    icon={<Heading3 className="w-4 h-4" />}
                    title="Heading 3"
                />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={<List className="w-4 h-4" />}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={<ListOrdered className="w-4 h-4" />}
                    title="Numbered List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={<Quote className="w-4 h-4" />}
                    title="Quote"
                />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    icon={<Undo className="w-4 h-4" />}
                    title="Undo (Cmd+Z)"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    icon={<Redo className="w-4 h-4" />}
                    title="Redo (Cmd+Shift+Z)"
                />

                {/* Save Status */}
                <div className="ml-auto flex items-center space-x-2 text-sm">
                    {saveStatus === 'saving' && (
                        <span className="text-gray-500 flex items-center">
                            <span className="animate-spin mr-1">⏳</span> Saving...
                        </span>
                    )}
                    {saveStatus === 'saved' && lastSaved && (
                        <span className="text-green-600 flex items-center">
                            ✓ Saved {formatRelativeTime(lastSaved)}
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-600">⚠ Save failed</span>
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}

// Toolbar Button Component
function ToolbarButton({
    onClick,
    isActive,
    disabled,
    icon,
    title,
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${isActive ? 'bg-sky-100 text-sky-600' : 'text-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {icon}
        </button>
    );
}

// Utility: Debounce function
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Utility: Format relative time
function formatRelativeTime(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}
