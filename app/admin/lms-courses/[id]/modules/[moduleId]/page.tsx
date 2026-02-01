'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
    ArrowLeft, Plus, Loader2, BookOpen, FileText, CheckSquare,
    GripVertical, Pencil, Trash2, Eye, EyeOff, Video, FileCode, Upload, File, X, Link as LinkIcon
} from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    content: string | null;
    contentType: string;
    videoUrl: string | null;
    attachmentUrl: string | null;
    attachmentName: string | null;
    wikiPageId: string | null;
    order: number;
    isPublished: boolean;
}

interface Module {
    id: string;
    title: string;
    description: string | null;
    isPublished: boolean;
    lmsCourse: {
        id: string;
        name: string;
        code: string;
    };
}

interface WikiNode {
    id: string;
    title: string;
}

export default function ModuleEditorPage() {
    const params = useParams();
    const courseId = params?.id as string;
    const moduleId = params?.moduleId as string;
    const router = useRouter();

    const [module, setModule] = useState<Module | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [wikiPages, setWikiPages] = useState<WikiNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        content: '',
        contentType: 'text',
        videoUrl: '',
        attachmentUrl: '',
        attachmentName: '',
        attachmentType: '',
        wikiPageId: '',
    });

    useEffect(() => {
        if (courseId && moduleId) {
            fetchModule();
            fetchLessons();
            fetchWikiPages();
        }
    }, [courseId, moduleId]);

    async function fetchModule() {
        try {
            const response = await fetch(`/api/admin/lms-courses/${courseId}/modules/${moduleId}`);
            if (response.ok) {
                const { module } = await response.json();
                setModule(module);
            }
        } catch (error) {
            console.error('Failed to fetch module:', error);
        }
    }

    async function fetchLessons() {
        try {
            const response = await fetch(`/api/admin/lms-courses/${courseId}/modules/${moduleId}/lessons`);
            if (response.ok) {
                const { lessons } = await response.json();
                setLessons(lessons);
            }
        } catch (error) {
            console.error('Failed to fetch lessons:', error);
        } finally {
            setLoading(false);
        }
    }

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

                // Check if it's a video file
                const isVideo = file.type.startsWith('video/');

                setLessonForm(prev => ({
                    ...prev,
                    ...(isVideo ? {
                        videoUrl: data.url,
                        contentType: 'video',
                    } : {
                        attachmentUrl: data.url,
                        attachmentName: file.name,
                        attachmentType: file.type,
                        contentType: 'document',
                    }),
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
        setLessonForm(prev => ({
            ...prev,
            attachmentUrl: '',
            attachmentName: '',
            attachmentType: '',
            videoUrl: '',
        }));
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch(`/api/admin/lms-courses/${courseId}/modules/${moduleId}/lessons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonForm),
            });

            if (response.ok) {
                setIsCreateLessonOpen(false);
                setLessonForm({
                    title: '',
                    content: '',
                    contentType: 'text',
                    videoUrl: '',
                    attachmentUrl: '',
                    attachmentName: '',
                    attachmentType: '',
                    wikiPageId: '',
                });
                fetchLessons();
            } else {
                alert('Failed to create lesson');
            }
        } catch (error) {
            console.error('Failed to create lesson:', error);
            alert('Failed to create lesson');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/lms-courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchLessons();
            } else {
                alert('Failed to delete lesson');
            }
        } catch (error) {
            console.error('Failed to delete lesson:', error);
            alert('Failed to delete lesson');
        }
    };

    const togglePublish = async (lessonId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/lms-courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !currentStatus }),
            });

            if (response.ok) {
                fetchLessons();
            } else {
                alert('Failed to update lesson');
            }
        } catch (error) {
            console.error('Failed to update lesson:', error);
            alert('Failed to update lesson');
        }
    };

    const getContentIcon = (contentType: string) => {
        switch (contentType) {
            case 'video':
                return <Video className="w-5 h-5" />;
            case 'code':
                return <FileCode className="w-5 h-5" />;
            case 'document':
                return <File className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
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
                    <Link href={`/admin/lms-courses/${courseId}/builder`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Course
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {module?.title || 'Module Editor'}
                        </h1>
                        {module && (
                            <p className="text-muted-foreground mt-1">
                                {module.lmsCourse.name} ({module.lmsCourse.code})
                            </p>
                        )}
                    </div>
                </div>
                <Button onClick={() => setIsCreateLessonOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                </Button>
            </div>

            {/* Module Info */}
            {module && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">Module Information</h3>
                                {module.description && (
                                    <p className="text-muted-foreground">{module.description}</p>
                                )}
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full ${module.isPublished
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                {module.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lessons List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Lessons</h2>
                {lessons.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No lessons yet. Create your first lesson to start building this module.
                        </CardContent>
                    </Card>
                ) : (
                    lessons.map((lesson, index) => (
                        <Card key={lesson.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-move" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    Lesson {index + 1}
                                                </span>
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    {lesson.title}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs rounded-full ${lesson.isPublished
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {lesson.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {getContentIcon(lesson.contentType)}
                                                <span className="capitalize">{lesson.contentType} Content</span>
                                                {lesson.videoUrl && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Video included</span>
                                                    </>
                                                )}
                                                {lesson.attachmentUrl && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{lesson.attachmentName}</span>
                                                    </>
                                                )}
                                                {lesson.wikiPageId && (
                                                    <>
                                                        <span>•</span>
                                                        <LinkIcon className="w-4 h-4" />
                                                        <span>Wiki linked</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => togglePublish(lesson.id, lesson.isPublished)}
                                        >
                                            {lesson.isPublished ? (
                                                <>
                                                    <EyeOff className="w-4 h-4 mr-2" />
                                                    Unpublish
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Publish
                                                </>
                                            )}
                                        </Button>
                                        <Link href={`/admin/lms-courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                                            <Button size="sm">
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Lesson Modal */}
            <Modal
                isOpen={isCreateLessonOpen}
                onClose={() => setIsCreateLessonOpen(false)}
                title="Create Lesson"
            >
                <form onSubmit={handleCreateLesson} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Lesson Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            placeholder="e.g., Variables and Data Types"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Content Type
                        </label>
                        <select
                            value={lessonForm.contentType}
                            onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        >
                            <option value="text">Text/Markdown</option>
                            <option value="video">Video</option>
                            <option value="code">Code Example</option>
                            <option value="document">Document/File</option>
                        </select>
                    </div>

                    {/* File Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Upload File (Optional)
                        </label>
                        {(lessonForm.attachmentUrl || lessonForm.videoUrl) ? (
                            <div className="flex items-center gap-3 p-4 bg-muted/50 border border-input rounded-lg">
                                {lessonForm.contentType === 'video' ? (
                                    <Video className="w-8 h-8 text-primary" />
                                ) : (
                                    <File className="w-8 h-8 text-primary" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {lessonForm.attachmentName || 'Video file'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{lessonForm.attachmentType || 'video'}</p>
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
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-input border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40">
                                {isUploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                        <p className="text-xs text-muted-foreground">Upload video or document</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX, PPTX, XLSX, MP4, etc.</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    {/* Video URL (if not uploaded) */}
                    {lessonForm.contentType === 'video' && !lessonForm.videoUrl && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Or paste Video URL
                            </label>
                            <input
                                type="url"
                                value={lessonForm.videoUrl}
                                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>
                    )}

                    {/* Wiki Page Link */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Link to Wiki Page (Optional)
                        </label>
                        <select
                            value={lessonForm.wikiPageId}
                            onChange={(e) => setLessonForm({ ...lessonForm, wikiPageId: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                        >
                            <option value="">No wiki page linked</option>
                            {wikiPages.map((page) => (
                                <option key={page.id} value={page.id}>
                                    {page.title}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Students can access the linked wiki page from this lesson
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Content (Optional)
                        </label>
                        <textarea
                            value={lessonForm.content}
                            onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            rows={4}
                            placeholder="Lesson content (supports Markdown)..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateLessonOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || isUploading}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Lesson'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
