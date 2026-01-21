'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CreatePageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentId?: string | null;
}

export default function CreatePageDialog({ isOpen, onClose, parentId }: CreatePageDialogProps) {
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/knowledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: JSON.stringify({
                        type: 'doc',
                        content: [
                            {
                                type: 'paragraph',
                                content: [
                                    {
                                        type: 'text',
                                        text: 'Start writing...',
                                    },
                                ],
                            },
                        ],
                    }),
                    nodeType: 'markdown',
                    isPublished: false,
                    folderId: parentId || null, // Pass folderId if provided
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create page');
            }

            const { node } = await response.json();

            // Close modal and redirect to new page
            onClose();
            setTitle('');
            // Use window.location.href to force a hard reload and avoid Next.js parallel route errors
            window.location.href = `/wiki/${node.id}`;
        } catch (err) {
            console.error('Create error:', err);
            setError('Failed to create page. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 rounded-lg">
                            <FileText className="w-6 h-6 text-sky-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Create New Page</h2>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            setTitle('');
                            setError('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="page-title" className="block text-sm font-medium text-gray-700 mb-1">
                            Page Title
                        </label>
                        <input
                            id="page-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isLoading) {
                                    handleCreate();
                                }
                            }}
                            placeholder="Enter page title..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-900"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={() => {
                                onClose();
                                setTitle('');
                                setError('');
                            }}
                            variant="ghost"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Page'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
