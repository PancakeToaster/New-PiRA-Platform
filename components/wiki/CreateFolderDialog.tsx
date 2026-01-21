'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FolderPlus, Loader2 } from 'lucide-react';

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentId?: string | null;
}

export default function CreateFolderDialog({ isOpen, onClose, parentId }: CreateFolderDialogProps) {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/wiki/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parentId }),
            });

            if (!res.ok) throw new Error('Failed to create folder');

            setName('');
            router.refresh();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create folder');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-sky-100 rounded-lg">
                        <FolderPlus className="w-6 h-6 text-sky-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Create New Folder</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
                            Folder Name
                        </label>
                        <input
                            id="folderName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                            placeholder="e.g. Getting Started"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Folder'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
