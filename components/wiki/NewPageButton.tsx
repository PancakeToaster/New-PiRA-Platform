'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NewPageButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

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
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create page');
            }

            const { node } = await response.json();

            // Close modal and redirect to new page
            setIsOpen(false);
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
        <>
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className="w-full justify-start text-sm font-normal"
            >
                <Plus className="w-4 h-4 mr-2" />
                New Page
            </Button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground">Create New Page</h2>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setTitle('');
                                    setError('');
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="page-title" className="block text-sm font-medium text-foreground mb-1">
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
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-background text-foreground"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCreate}
                                    disabled={isLoading}
                                    className="flex-1"
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
                                <Button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setTitle('');
                                        setError('');
                                    }}
                                    variant="outline"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
