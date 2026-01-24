'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    Save,
    Edit,
    X
} from 'lucide-react';

interface AdminContentEditorProps {
    initialContent: string;
    id: string;
    apiEndpoint: string;
    onSave?: () => void;
}

export default function AdminContentEditor({
    initialContent,
    id,
    apiEndpoint,
    onSave,
}: AdminContentEditorProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-sky-500 hover:text-sky-600 underline',
                },
            }),
        ],
        content: initialContent,
        editable: isEditMode,
        immediatelyRender: false,
    });

    const handleSave = async () => {
        if (!editor) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const content = editor.getHTML();
            const response = await fetch(`${apiEndpoint}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error('Failed to save content');
            }

            setSaveStatus('success');
            setIsEditMode(false);
            onSave?.();

            // Clear success message after 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving content:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (editor) {
            editor.commands.setContent(initialContent);
            setIsEditMode(false);
            setSaveStatus('idle');
        }
    };

    const toggleEditMode = () => {
        if (editor) {
            const newEditMode = !isEditMode;
            setIsEditMode(newEditMode);
            editor.setEditable(newEditMode);
        }
    };

    if (!editor) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="relative">
            {/* Admin Controls */}
            <div className="sticky top-20 z-10 bg-white border-b border-gray-200 shadow-sm mb-4">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isEditMode ? (
                            <Button
                                onClick={toggleEditMode}
                                variant="primary"
                                size="sm"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Content
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleSave}
                                    variant="primary"
                                    size="sm"
                                    disabled={isSaving}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="secondary"
                                    size="sm"
                                    disabled={isSaving}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>

                    {saveStatus === 'success' && (
                        <span className="text-sm text-green-600 font-medium">
                            ✓ Saved successfully
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-sm text-red-600 font-medium">
                            ✗ Failed to save
                        </span>
                    )}
                </div>

                {/* Toolbar - Only visible in edit mode */}
                {isEditMode && (
                    <div className="max-w-4xl mx-auto px-4 pb-3">
                        <div className="flex flex-wrap gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <button
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''
                                    }`}
                                title="Bold"
                            >
                                <Bold className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''
                                    }`}
                                title="Italic"
                            >
                                <Italic className="w-4 h-4" />
                            </button>

                            <div className="w-px bg-gray-300 mx-1" />

                            <button
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                                    }`}
                                title="Heading 1"
                            >
                                <Heading1 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                                    }`}
                                title="Heading 2"
                            >
                                <Heading2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
                                    }`}
                                title="Heading 3"
                            >
                                <Heading3 className="w-4 h-4" />
                            </button>

                            <div className="w-px bg-gray-300 mx-1" />

                            <button
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''
                                    }`}
                                title="Bullet List"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''
                                    }`}
                                title="Numbered List"
                            >
                                <ListOrdered className="w-4 h-4" />
                            </button>

                            <div className="w-px bg-gray-300 mx-1" />

                            <button
                                onClick={() => {
                                    const url = window.prompt('Enter URL:');
                                    if (url) {
                                        editor.chain().focus().setLink({ href: url }).run();
                                    }
                                }}
                                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''
                                    }`}
                                title="Add Link"
                            >
                                <LinkIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const url = window.prompt('Enter image URL:');
                                    if (url) {
                                        editor.chain().focus().setImage({ src: url }).run();
                                    }
                                }}
                                className="p-2 rounded hover:bg-gray-200"
                                title="Add Image"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Editor Content */}
            <div className={`prose prose-lg max-w-none ${isEditMode ? 'border-2 border-sky-200 rounded-lg p-4' : ''}`}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
