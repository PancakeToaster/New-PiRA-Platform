'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ForumPostFormProps {
    courseId: string;
    threadId: string;
}

export default function ForumPostForm({ courseId, threadId }: ForumPostFormProps) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/lms/courses/${courseId}/forum/${threadId}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (response.ok) {
                setContent('');
                router.refresh();
            } else {
                alert('Failed to post reply');
            }
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Failed to post reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add a Reply
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            rows={4}
                            placeholder="Write your reply..."
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !content.trim()}>
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Posting...' : 'Post Reply'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
