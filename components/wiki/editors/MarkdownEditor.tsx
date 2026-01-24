'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
    content: string;
    onSave?: (content: string) => Promise<void>;
    onChange?: (content: string) => void;
    nodeId?: string;
}

export default function MarkdownEditor({ content, onSave, onChange, nodeId }: MarkdownEditorProps) {
    const [markdown, setMarkdown] = useState(content);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Debounced auto-save
    const handleAutoSave = useCallback(
        debounce(async (newContent: string) => {
            if (!onSave) return;
            setSaveStatus('saving');
            try {
                await onSave(newContent);
                setSaveStatus('saved');
                setLastSaved(new Date());
            } catch (error) {
                console.error('Save error:', error);
                setSaveStatus('error');
            }
        }, 2000),
        [onSave]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setMarkdown(newContent);
        if (onChange) onChange(newContent);
        if (onSave) handleAutoSave(newContent);
    };

    // Insert markdown syntax at cursor
    const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = markdown.substring(start, end);
        const textToInsert = selectedText || placeholder;

        const newText =
            markdown.substring(0, start) +
            before + textToInsert + after +
            markdown.substring(end);

        setMarkdown(newText);
        if (onChange) onChange(newText);
        if (onSave) handleAutoSave(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + before.length + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault();
                        insertMarkdown('**', '**', 'bold text');
                        break;
                    case 'i':
                        e.preventDefault();
                        insertMarkdown('*', '*', 'italic text');
                        break;
                    case 'k':
                        e.preventDefault();
                        insertMarkdown('[', '](url)', 'link text');
                        break;
                }
            }
        };

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('keydown', handleKeyDown);
            return () => textarea.removeEventListener('keydown', handleKeyDown);
        }
    }, [markdown]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-white sticky top-0 z-10">
                <ToolbarButton
                    onClick={() => insertMarkdown('**', '**', 'bold text')}
                    icon={<Bold className="w-4 h-4" />}
                    title="Bold (Ctrl+B)"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('*', '*', 'italic text')}
                    icon={<Italic className="w-4 h-4" />}
                    title="Italic (Ctrl+I)"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('~~', '~~', 'strikethrough')}
                    icon={<Strikethrough className="w-4 h-4" />}
                    title="Strikethrough"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('`', '`', 'code')}
                    icon={<Code className="w-4 h-4" />}
                    title="Inline Code"
                />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => insertMarkdown('# ', '', 'Heading 1')}
                    icon={<Heading1 className="w-4 h-4" />}
                    title="Heading 1"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('## ', '', 'Heading 2')}
                    icon={<Heading2 className="w-4 h-4" />}
                    title="Heading 2"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('### ', '', 'Heading 3')}
                    icon={<Heading3 className="w-4 h-4" />}
                    title="Heading 3"
                />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => insertMarkdown('- ', '', 'List item')}
                    icon={<List className="w-4 h-4" />}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('1. ', '', 'List item')}
                    icon={<ListOrdered className="w-4 h-4" />}
                    title="Numbered List"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('> ', '', 'Quote')}
                    icon={<Quote className="w-4 h-4" />}
                    title="Quote"
                />

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => insertMarkdown('[', '](url)', 'link text')}
                    icon={<LinkIcon className="w-4 h-4" />}
                    title="Link (Ctrl+K)"
                />
                <ToolbarButton
                    onClick={() => insertMarkdown('![alt text](', ')', 'image-url.jpg')}
                    icon={<ImageIcon className="w-4 h-4" />}
                    title="Image"
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

            {/* Editor Area: Full-width textarea */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-[600px]">
                <textarea
                    ref={textareaRef}
                    value={markdown}
                    onChange={handleChange}
                    className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none border-0 min-h-full"
                    placeholder="Write your markdown here..."
                    spellCheck={false}
                />
            </div>
        </div>
    );
}

// Toolbar Button Component
function ToolbarButton({
    onClick,
    icon,
    title,
}: {
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-700"
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
