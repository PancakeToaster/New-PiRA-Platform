'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe, Lock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface WikiPageControlsProps {
    nodeId: string;
    isPublished: boolean;
    isAdmin: boolean;
}

export default function WikiPageControls({ nodeId, isPublished: initialPublished, isAdmin }: WikiPageControlsProps) {
    const [isPublished, setIsPublished] = useState(initialPublished);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    if (!isAdmin) return null;

    const togglePublish = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}/publish`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !isPublished }),
            });

            if (!res.ok) throw new Error('Failed to update status');

            setIsPublished(!isPublished);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to update publish status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/wiki/nodes/${nodeId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete node');

            router.push('/wiki');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to delete page');
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <Button
                variant={isPublished ? "outline" : undefined}
                size="sm"
                onClick={togglePublish}
                disabled={isLoading || isDeleting}
                className={cn(
                    "flex items-center gap-2",
                    !isPublished && "bg-green-600 hover:bg-green-700 text-white border-green-600"
                )}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPublished ? (
                    <>
                        <Lock className="w-4 h-4" />
                        Unpublish
                    </>
                ) : (
                    <>
                        <Globe className="w-4 h-4" />
                        Publish
                    </>
                )}
            </Button>

            <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading || isDeleting}
                title="Delete Page"
            >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
        </div>
    );
}
