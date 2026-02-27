'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import TiptapEditor from '@/components/editor/TiptapEditor';

interface Lesson {
    id: string;
    title: string;
    content: string | null;
}

export default function LessonContentEditorPage({
    params
}: {
    params: { courseId: string; moduleId: string; lessonId: string }
}) {
    const router = useRouter();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                // We can reuse the existing lesson API or create a specific one
                // For now, let's assume we can GET the specific lesson
                // We might need to adjust the API route to support getting a single lesson if not already
                // Or fetch from the module list. 
                // Let's try fetching the specific lesson from the text editor endpoint we'll create or the existing structure

                // Construct URL based on existing patterns
                const res = await fetch(`/api/admin/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}`);

                if (res.ok) {
                    const data = await res.json();
                    setLesson(data.lesson);
                    setContent(data.lesson.content || '');
                } else {
                    console.error('Failed to fetch lesson');
                }
            } catch (error) {
                console.error('Error fetching lesson:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [params.courseId, params.moduleId, params.lessonId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/courses/${params.courseId}/modules/${params.moduleId}/lessons/${params.lessonId}`, {
                method: 'PATCH', // or PUT depending on API
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (res.ok) {
                setIsDirty(false);
                // Optional: Show success toast
            } else {
                alert('Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error saving content');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">Lesson not found.</p>
                <Link href={`/admin/courses/${params.courseId}/builder`}>
                    <Button variant="outline" className="mt-4">Back to Builder</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/admin/courses/${params.courseId}/builder`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground truncate max-w-md">
                                {lesson.title}
                            </h1>
                            <p className="text-xs text-muted-foreground">Content Editor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground mr-2">
                            {isDirty ? 'Unsaved changes' : 'All changes saved'}
                        </span>
                        <Button onClick={handleSave} disabled={saving || !isDirty}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Content
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Editor Area */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                <div className="bg-card rounded-lg border border-border shadow-sm min-h-[calc(100vh-8rem)]">
                    <TiptapEditor
                        content={content}
                        onChange={(newContent) => {
                            setContent(newContent);
                            setIsDirty(true);
                        }}
                        placeholder="Start writing your lesson content here... Type / for commands, or use the toolbar."
                    />
                </div>
            </main>
        </div>
    );
}
