'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Upload, FileText, X, File } from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    content: string | null;
    contentType: string;
    videoUrl: string | null;
    attachmentUrl: string | null;
    attachmentName: string | null;
    attachmentType: string | null;
    wikiPageId: string | null;
    order: number;
    isPublished: boolean;
    module: {
        id: string;
        title: string;
        lmsCourse: {
            id: string;
            name: string;
            code: string;
        };
    };
}

interface WikiNode {
    id: string;
    title: string;
}

export default function LessonEditorPage() {
    const params = useParams();
    const courseId = params?.id as string;
    const moduleId = params?.moduleId as string;
    const lessonId = params?.lessonId as string;
    const router = useRouter();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [wikiPages, setWikiPages] = useState<WikiNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        contentType: 'text',
        videoUrl: '',
        attachmentUrl: '',
        attachmentName: '',
        attachmentType: '',
        wikiPageId: '',
        isPublished: false,
    });

    useEffect(() => {
        if (courseId && moduleId && lessonId) {
            fetchLesson();
            fetchWikiPages();
        }
    }, [courseId, moduleId, lessonId]);

    async function fetchWikiPages() {
        try {
            const response = await fetch('/api/wiki/nodes');
            if (response.ok) {
                const data = await response.json();
                setWikiPages(data.nodes || []);
            }
        } catch (error) {
            console.error('Failed to fetch wiki pages:', error);
        }
    }

    async function fetchLesson() {
        try {
            const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
            if (response.ok) {
                const { lesson } = await response.json();
                setLesson(lesson);
                setFormData({
                    title: lesson.title || '',
                    content: lesson.content || '',
                    contentType: lesson.contentType || 'text',
                    videoUrl: lesson.videoUrl || '',
                    attachmentUrl: lesson.attachmentUrl || '',
                    attachmentName: lesson.attachmentName || '',
                    attachmentType: lesson.attachmentType || '',
                    wikiPageId: lesson.wikiPageId || '',
                    isPublished: lesson.isPublished || false,
                });
            }
        } catch (error) {
            console.error('Failed to fetch lesson:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const file = files[0];

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    attachmentUrl: data.url,
                    attachmentName: file.name,
                    attachmentType: file.type,
                    contentType: 'document',
                }));
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to upload file');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const removeAttachment = () => {
        setFormData(prev => ({
            ...prev,
            attachmentUrl: '',
            attachmentName: '',
            attachmentType: '',
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push(`/admin/courses/${courseId}/modules/${moduleId}`);
            } else {
                alert('Failed to save lesson');
            }
        } catch (error) {
            console.error('Failed to save lesson:', error);
            alert('Failed to save lesson');
        } finally {
            setIsSaving(false);
        }
    };

    const getDocumentViewerUrl = (url: string, type: string) => {
        // For Office documents, use Office Online Viewer
        if (type?.includes('word') || type?.includes('powerpoint') || type?.includes('excel') ||
            type?.includes('spreadsheet') || type?.includes('presentation')) {
            return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        }
        // For PDFs, return the URL directly (will use iframe)
        return url;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/admin/courses/${courseId}/modules/${moduleId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Module
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Edit Lesson</h1>
                        {lesson && (
                            <p className="text-muted-foreground mt-1">
                                {lesson.module.lmsCourse.name} → {lesson.module.title}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Form */}
            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>Lesson Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Lesson Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    placeholder="Variables and Data Types"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Content Type
                                </label>
                                <select
                                    value={formData.contentType}
                                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                >
                                    <option value="text">Text/Markdown</option>
                                    <option value="video">Video</option>
                                    <option value="code">Code Example</option>
                                    <option value="document">Document/File</option>
                                </select>
                            </div>
                        </div>

                        {formData.contentType === 'video' && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Video URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.videoUrl}
                                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Supports YouTube, Vimeo, and direct video URLs
                                </p>
                            </div>
                        )}

                        {formData.contentType === 'document' && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Upload Document
                                </label>
                                <div className="space-y-3">
                                    {formData.attachmentUrl ? (
                                        <div className="flex items-center gap-3 p-4 bg-muted/50 border border-input rounded-lg">
                                            <File className="w-8 h-8 text-primary" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">{formData.attachmentName}</p>
                                                <p className="text-xs text-muted-foreground">{formData.attachmentType}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={removeAttachment}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40">
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">Click to upload document</p>
                                                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, XLSX supported</p>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Documents will be viewable directly in the browser for students
                                </p>
                            </div>
                        )}

                        {/* Wiki Page Link */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Link to Wiki Page (Optional)
                            </label>
                            <select
                                value={formData.wikiPageId}
                                onChange={(e) => setFormData({ ...formData, wikiPageId: e.target.value })}
                                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            >
                                <option value="">No wiki page linked</option>
                                {wikiPages.map((page) => (
                                    <option key={page.id} value={page.id}>
                                        {page.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-muted-foreground mt-1">
                                Students can access the linked wiki page from this lesson
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Lesson Content {formData.contentType === 'document' && '(Optional)'}
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground font-mono text-sm"
                                rows={20}
                                placeholder="Write your lesson content here. Supports Markdown formatting..."
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Supports Markdown: **bold**, *italic*, `code`, # headings, - lists, etc.
                            </p>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPublished"
                                checked={formData.isPublished}
                                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                            />
                            <label htmlFor="isPublished" className="ml-2 text-sm text-foreground">
                                Published (visible to students)
                            </label>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t">
                            <Link href={`/admin/courses/${courseId}/modules/${moduleId}`}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Lesson
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Preview Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold text-foreground mb-4">{formData.title || 'Untitled Lesson'}</h2>

                        {formData.videoUrl && formData.contentType === 'video' && (
                            <div className="mb-4 bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Video: {formData.videoUrl}</p>
                            </div>
                        )}

                        {formData.attachmentUrl && formData.contentType === 'document' && (
                            <div className="mb-4">
                                <div className="bg-muted p-4 rounded-lg mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <span className="text-sm font-medium text-foreground">{formData.attachmentName}</span>
                                    </div>
                                </div>
                                {formData.attachmentType?.includes('pdf') ? (
                                    <iframe
                                        src={formData.attachmentUrl}
                                        className="w-full h-[600px] border border-input rounded-lg"
                                        title="Document Preview"
                                    />
                                ) : (formData.attachmentType?.includes('word') ||
                                    formData.attachmentType?.includes('powerpoint') ||
                                    formData.attachmentType?.includes('excel') ||
                                    formData.attachmentType?.includes('spreadsheet') ||
                                    formData.attachmentType?.includes('presentation')) ? (
                                    <iframe
                                        src={getDocumentViewerUrl(formData.attachmentUrl, formData.attachmentType)}
                                        className="w-full h-[600px] border border-input rounded-lg"
                                        title="Document Preview"
                                    />
                                ) : (
                                    <div className="p-4 bg-muted/50 border border-input rounded-lg text-center">
                                        <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                                        <a
                                            href={formData.attachmentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:text-primary/80 text-sm mt-2 inline-block"
                                        >
                                            Download to view
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="whitespace-pre-wrap text-foreground">
                            {formData.content || 'No content yet...'}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
