'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
    ArrowLeft,
    Plus,
    GripVertical,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Video,
    FileText,
    CheckSquare,
    HelpCircle,
    Loader2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    lessonType: string;
    duration?: number;
    order: number;
    isPublished: boolean;
    isFree: boolean;
}

interface Module {
    id: string;
    title: string;
    description?: string;
    order: number;
    isPublished: boolean;
    lessons: Lesson[];
}

interface Course {
    id: string;
    name: string;
    slug: string;
}

export default function CourseBuilderPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

    useEffect(() => {
        fetchCourseAndModules();
    }, [params.id]);

    async function fetchCourseAndModules() {
        try {
            // Fetch course details
            const courseRes = await fetch(`/api/admin/courses/${params.id}`);
            if (courseRes.ok) {
                const courseData = await courseRes.json();
                setCourse(courseData.course);
            }

            // Fetch modules
            const modulesRes = await fetch(`/api/admin/courses/${params.id}/modules`);
            if (modulesRes.ok) {
                const modulesData = await modulesRes.json();
                setModules(modulesData.modules);
                // Expand all modules by default
                setExpandedModules(new Set(modulesData.modules.map((m: Module) => m.id)));
            }
        } catch (error) {
            console.error('Failed to fetch course data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === 'module') {
            // Reorder modules
            const newModules = Array.from(modules);
            const [removed] = newModules.splice(source.index, 1);
            newModules.splice(destination.index, 0, removed);

            // Update order property
            const updatedModules = newModules.map((mod, idx) => ({ ...mod, order: idx }));
            setModules(updatedModules);

            // Update on server
            try {
                await fetch(`/api/admin/courses/${params.id}/modules/${removed.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newOrder: destination.index }),
                });
            } catch (error) {
                console.error('Failed to reorder module:', error);
                fetchCourseAndModules(); // Revert on error
            }
        } else if (type === 'lesson') {
            // Reorder lessons within a module
            const moduleId = source.droppableId.replace('lessons-', '');
            const moduleIndex = modules.findIndex(m => m.id === moduleId);
            if (moduleIndex === -1) return;

            const newModules = [...modules];
            const lessons = Array.from(newModules[moduleIndex].lessons);
            const [removed] = lessons.splice(source.index, 1);
            lessons.splice(destination.index, 0, removed);

            // Update order property
            const updatedLessons = lessons.map((lesson, idx) => ({ ...lesson, order: idx }));
            newModules[moduleIndex].lessons = updatedLessons;
            setModules(newModules);

            // Update on server
            try {
                await fetch(`/api/admin/courses/${params.id}/modules/${moduleId}/lessons/${removed.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newOrder: destination.index }),
                });
            } catch (error) {
                console.error('Failed to reorder lesson:', error);
                fetchCourseAndModules(); // Revert on error
            }
        }
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const handleCreateModule = () => {
        setEditingModule(null);
        setShowModuleModal(true);
    };

    const handleEditModule = (module: Module) => {
        setEditingModule(module);
        setShowModuleModal(true);
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Are you sure? This will delete all lessons in this module.')) return;

        try {
            const res = await fetch(`/api/admin/courses/${params.id}/modules/${moduleId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCourseAndModules();
            }
        } catch (error) {
            console.error('Failed to delete module:', error);
        }
    };

    const handleCreateLesson = (moduleId: string) => {
        setSelectedModule(moduleId);
        setEditingLesson(null);
        setShowLessonModal(true);
    };

    const handleEditLesson = (lesson: Lesson, moduleId: string) => {
        setSelectedModule(moduleId);
        setEditingLesson(lesson);
        setShowLessonModal(true);
    };

    const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;

        try {
            const res = await fetch(`/api/admin/courses/${params.id}/modules/${moduleId}/lessons/${lessonId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCourseAndModules();
            }
        } catch (error) {
            console.error('Failed to delete lesson:', error);
        }
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="w-4 h-4" />;
            case 'assignment': return <CheckSquare className="w-4 h-4" />;
            case 'quiz': return <HelpCircle className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/courses">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Courses
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{course?.name}</h1>
                        <p className="text-sm text-gray-500">Course Builder</p>
                    </div>
                </div>
                <Button onClick={handleCreateModule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                </Button>
            </div>

            {/* Course Structure */}
            <Card>
                <CardContent className="p-6">
                    {modules.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">No modules yet. Create your first module to get started.</p>
                            <Button onClick={handleCreateModule}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Module
                            </Button>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="modules" type="module">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                        {modules.map((module, index) => (
                                            <Draggable key={module.id} draggableId={module.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`border rounded-lg ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                    >
                                                        {/* Module Header */}
                                                        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b">
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                                <GripVertical className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <button
                                                                onClick={() => toggleModule(module.id)}
                                                                className="flex-1 text-left"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-semibold text-gray-900">
                                                                        Module {index + 1}: {module.title}
                                                                    </h3>
                                                                    {!module.isPublished && (
                                                                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                                                            Draft
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {module.description && (
                                                                    <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                                                )}
                                                            </button>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-500">
                                                                    {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditModule(module)}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteModule(module.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Lessons */}
                                                        {expandedModules.has(module.id) && (
                                                            <div className="p-4">
                                                                <Droppable droppableId={`lessons-${module.id}`} type="lesson">
                                                                    {(provided) => (
                                                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                                                            {module.lessons.map((lesson, lessonIndex) => (
                                                                                <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                                                                    {(provided, snapshot) => (
                                                                                        <div
                                                                                            ref={provided.innerRef}
                                                                                            {...provided.draggableProps}
                                                                                            className={`flex items-center gap-3 p-3 bg-white border rounded ${snapshot.isDragging ? 'shadow-md' : ''
                                                                                                }`}
                                                                                        >
                                                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                                                                <GripVertical className="w-4 h-4 text-gray-400" />
                                                                                            </div>
                                                                                            <div className="text-gray-500">
                                                                                                {getLessonIcon(lesson.lessonType)}
                                                                                            </div>
                                                                                            <div className="flex-1">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="font-medium text-gray-900">{lesson.title}</span>
                                                                                                    {lesson.isFree && (
                                                                                                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                                                                                            Free Preview
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {!lesson.isPublished && (
                                                                                                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                                                                                                            Draft
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                {lesson.duration && (
                                                                                                    <span className="text-xs text-gray-500">{lesson.duration} min</span>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex items-center gap-1">
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => handleEditLesson(lesson, module.id)}
                                                                                                >
                                                                                                    <Edit2 className="w-4 h-4" />
                                                                                                </Button>
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={() => handleDeleteLesson(lesson.id, module.id)}
                                                                                                >
                                                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </Draggable>
                                                                            ))}
                                                                            {provided.placeholder}
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleCreateLesson(module.id)}
                                                                                className="w-full mt-2"
                                                                            >
                                                                                <Plus className="w-4 h-4 mr-2" />
                                                                                Add Lesson
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </Droppable>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </CardContent>
            </Card>

            {/* Module Modal */}
            {showModuleModal && (
                <ModuleModal
                    courseId={params.id}
                    module={editingModule}
                    onClose={() => setShowModuleModal(false)}
                    onSuccess={() => {
                        setShowModuleModal(false);
                        fetchCourseAndModules();
                    }}
                />
            )}

            {/* Lesson Modal */}
            {showLessonModal && selectedModule && (
                <LessonModal
                    courseId={params.id}
                    moduleId={selectedModule}
                    lesson={editingLesson}
                    onClose={() => setShowLessonModal(false)}
                    onSuccess={() => {
                        setShowLessonModal(false);
                        fetchCourseAndModules();
                    }}
                />
            )}
        </div>
    );
}

// Module Modal Component
function ModuleModal({
    courseId,
    module,
    onClose,
    onSuccess,
}: {
    courseId: string;
    module: Module | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        title: module?.title || '',
        description: module?.description || '',
        isPublished: module?.isPublished ?? false,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = module
                ? `/api/admin/courses/${courseId}/modules/${module.id}`
                : `/api/admin/courses/${courseId}/modules`;

            const res = await fetch(url, {
                method: module ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to save module:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">{module ? 'Edit Module' : 'Create Module'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="modulePublished"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        />
                        <label htmlFor="modulePublished" className="text-sm">Published</label>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Lesson Modal Component
function LessonModal({
    courseId,
    moduleId,
    lesson,
    onClose,
    onSuccess,
}: {
    courseId: string;
    moduleId: string;
    lesson: Lesson | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        title: lesson?.title || '',
        description: lesson?.description || '',
        lessonType: lesson?.lessonType || 'reading',
        videoUrl: lesson?.videoUrl || '',
        duration: lesson?.duration || '',
        isPublished: lesson?.isPublished ?? false,
        isFree: lesson?.isFree ?? false,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = lesson
                ? `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`
                : `/api/admin/courses/${courseId}/modules/${moduleId}/lessons`;

            const res = await fetch(url, {
                method: lesson ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    duration: formData.duration ? parseInt(formData.duration as any) : null,
                }),
            });

            if (res.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to save lesson:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{lesson ? 'Edit Lesson' : 'Create Lesson'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            rows={2}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Lesson Type</label>
                        <select
                            value={formData.lessonType}
                            onChange={(e) => setFormData({ ...formData, lessonType: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                        >
                            <option value="reading">Reading</option>
                            <option value="video">Video</option>
                            <option value="assignment">Assignment</option>
                            <option value="quiz">Quiz</option>
                        </select>
                    </div>
                    {formData.lessonType === 'video' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Video URL</label>
                            <input
                                type="url"
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="https://..."
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            min="0"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="lessonPublished"
                            checked={formData.isPublished}
                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        />
                        <label htmlFor="lessonPublished" className="text-sm">Published</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="lessonFree"
                            checked={formData.isFree}
                            onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                        />
                        <label htmlFor="lessonFree" className="text-sm">Free Preview</label>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
