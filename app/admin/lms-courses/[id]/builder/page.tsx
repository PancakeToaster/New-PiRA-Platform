'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Plus, Loader2, BookOpen, FileText, CheckSquare, GripVertical, Pencil, Trash2 } from 'lucide-react';

interface Module {
    id: string;
    title: string;
    description: string | null;
    order: number;
    isPublished: boolean;
    _count?: {
        lessons: number;
    };
}

interface LMSCourse {
    id: string;
    name: string;
    code: string;
    _count?: {
        modules: number;
        lessons: number;
        assignments: number;
    };
}

export default function LMSCourseBuilderPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const [course, setCourse] = useState<LMSCourse | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [moduleForm, setModuleForm] = useState({
        title: '',
        description: '',
    });

    useEffect(() => {
        if (id) {
            fetchCourse();
            fetchModules();
        }
    }, [id]);

    async function fetchCourse() {
        try {
            const response = await fetch(`/api/admin/lms-courses/${id}`);
            if (response.ok) {
                const { course } = await response.json();
                setCourse(course);
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        }
    }

    async function fetchModules() {
        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/modules`);
            if (response.ok) {
                const { modules } = await response.json();
                setModules(modules);
            }
        } catch (error) {
            console.error('Failed to fetch modules:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(moduleForm),
            });

            if (response.ok) {
                setIsCreateModuleOpen(false);
                setModuleForm({ title: '', description: '' });
                fetchModules();
                fetchCourse();
            } else {
                alert('Failed to create module');
            }
        } catch (error) {
            console.error('Failed to create module:', error);
            alert('Failed to create module');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Are you sure you want to delete this module? This will also delete all lessons within it.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/modules/${moduleId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchModules();
                fetchCourse();
            } else {
                alert('Failed to delete module');
            }
        } catch (error) {
            console.error('Failed to delete module:', error);
            alert('Failed to delete module');
        }
    };

    const togglePublish = async (moduleId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/lms-courses/${id}/modules/${moduleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !currentStatus }),
            });

            if (response.ok) {
                fetchModules();
            } else {
                alert('Failed to update module');
            }
        } catch (error) {
            console.error('Failed to update module:', error);
            alert('Failed to update module');
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
                    <Link href="/admin/lms-courses">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Course Content Builder</h1>
                        {course && (
                            <p className="text-muted-foreground mt-1">
                                {course.name} ({course.code})
                            </p>
                        )}
                    </div>
                </div>
                <Button onClick={() => setIsCreateModuleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                </Button>
            </div>

            {/* Stats */}
            {course && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-foreground">{course._count?.modules || 0}</p>
                                <p className="text-sm text-muted-foreground">Modules</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{course._count?.lessons || 0}</p>
                                <p className="text-sm text-muted-foreground">Lessons</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{course._count?.assignments || 0}</p>
                                <p className="text-sm text-muted-foreground">Assignments</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modules List */}
            <div className="space-y-4">
                {modules.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No modules yet. Create your first module to start building course content.
                        </CardContent>
                    </Card>
                ) : (
                    modules.map((module) => (
                        <Card key={module.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-move" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-foreground">
                                                    {module.title}
                                                </h3>
                                                <span className={`px-2 py-1 text-xs rounded-full ${module.isPublished
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {module.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            {module.description && (
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {module.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span>{module._count?.lessons || 0} lessons</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => togglePublish(module.id, module.isPublished)}
                                        >
                                            {module.isPublished ? 'Unpublish' : 'Publish'}
                                        </Button>
                                        <Link href={`/admin/lms-courses/${id}/modules/${module.id}`}>
                                            <Button size="sm">
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit Content
                                            </Button>
                                        </Link>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteModule(module.id)}
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

            {/* Create Module Modal */}
            <Modal
                isOpen={isCreateModuleOpen}
                onClose={() => setIsCreateModuleOpen(false)}
                title="Create Module"
            >
                <form onSubmit={handleCreateModule} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Module Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={moduleForm.title}
                            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            placeholder="e.g., Introduction to Programming"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Description
                        </label>
                        <textarea
                            value={moduleForm.description}
                            onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            rows={3}
                            placeholder="Module description..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateModuleOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Module'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
