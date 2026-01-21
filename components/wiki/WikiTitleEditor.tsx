'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WikiTitleEditorProps {
    nodeId: string;
    initialTitle: string;
    isEditing: boolean;
    className?: string;
}

export default function WikiTitleEditor({ nodeId, initialTitle, isEditing, className }: WikiTitleEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Update local state if prop changes (e.g. external refresh)
    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const handleSave = async () => {
        if (title.trim() === initialTitle) return;
        if (title.trim().length === 0) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/title`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
            });

            if (!res.ok) throw new Error('Failed to update title');

            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update title');
            setTitle(initialTitle); // Revert on error
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 text-3xl font-bold text-gray-900 border-b-2 border-sky-500 focus:outline-none bg-transparent px-1 py-0.5"
                    disabled={isSaving}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') setTitle(initialTitle);
                    }}
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving || title === initialTitle}
                    className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                    title="Save Title"
                >
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                </button>
                <button
                    onClick={() => setTitle(initialTitle)}
                    disabled={isSaving}
                    className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Cancel"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        );
    }

    return (
        <h1 className={cn("text-3xl font-bold text-gray-900 mb-4", className)}>
            {title}
        </h1>
    );
}
