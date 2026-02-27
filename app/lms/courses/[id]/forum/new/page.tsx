'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Globe, Lock, Users } from 'lucide-react';
import Link from 'next/link';

export default function NewForumThreadPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/lms/courses/${params.id}/forum`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, isPublic }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/lms/courses/${params.id}/forum/${data.threadId}`);
            } else {
                alert('Failed to create thread');
            }
        } catch (error) {
            console.error('Error creating thread:', error);
            alert('Failed to create thread');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/lms/courses/${params.id}/forum`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Forum
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">New Discussion Thread</h1>
                    <p className="text-muted-foreground">Start a new conversation</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Thread Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                placeholder="Enter thread title..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Initial Message
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                rows={8}
                                placeholder="Write your message..."
                                required
                            />
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-foreground mb-3">
                                Privacy Settings
                            </label>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(false)}
                                    className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${!isPublic
                                        ? 'border-sky-500 bg-sky-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Lock className={`w-5 h-5 mt-0.5 ${!isPublic ? 'text-sky-600' : 'text-gray-400'}`} />
                                    <div className="text-left flex-1">
                                        <div className="font-medium text-foreground">Private (Default)</div>
                                        <div className="text-sm text-muted-foreground">
                                            Only you and the course instructor can see this thread. You can add specific
                                            participants later.
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsPublic(true)}
                                    className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all ${isPublic
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Globe className={`w-5 h-5 mt-0.5 ${isPublic ? 'text-green-600' : 'text-gray-400'}`} />
                                    <div className="text-left flex-1">
                                        <div className="font-medium text-foreground">Public</div>
                                        <div className="text-sm text-muted-foreground">
                                            All students and instructors in this course can see and participate in this
                                            thread.
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? 'Creating...' : 'Create Thread'}
                            </Button>
                            <Link href={`/lms/courses/${params.id}/forum`}>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
