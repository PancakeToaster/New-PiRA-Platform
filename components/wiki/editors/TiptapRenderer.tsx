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

interface TiptapRendererProps {
    content: string; // Tiptap JSON as string
}

export default function TiptapRenderer({ content }: TiptapRendererProps) {
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
            // If it's a plain string, treat as plain text
            if (typeof parsed === 'string') {
                return parsed;
            }
            return parsed;
        } catch (e) {
            // If JSON parsing fails, treat as plain text
            return str;
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Image,
            Table,
            TableRow,
            TableCell,
            TableHeader,
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: parseContent(content),
        editable: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sky max-w-none',
            },
        },
        immediatelyRender: false,
    });

    if (!editor) {
        return <div className="animate-pulse h-96 bg-gray-100 rounded-lg"></div>;
    }

    return (
        <div className="tiptap-renderer">
            <EditorContent editor={editor} />
        </div>
    );
}
