'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Play,
    FileText,
    Video,
    CheckSquare,
    HelpCircle,
    Loader2,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';

interface LessonProgress {
    id: string;
    status: string;
    completedAt: string | null;
}

interface Lesson {
    id: string;
    title: string;
    description?: string;
    content: string;
    lessonType: string;
    videoUrl?: string;
    duration?: number;
    isFree: boolean;
    studentProgress: LessonProgress[];
}

interface Module {
    id: string;
    title: string;
    description?: string;
    lessons: Lesson[];
}

interface Course {
    id: string;
    name: string;
    description: string;
    slug: string;
}

interface Progress {
    total: number;
    completed: number;
    percentage: number;
}

export default function StudentCoursePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [progress, setProgress] = useState<Progress>({ total: 0, completed: 0, percentage: 0 });
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [markingComplete, setMarkingComplete] = useState(false);

    useEffect(() => {
        fetchCourseData();
    }, [params.id]);

    async function fetchCourseData() {
        try {
            // Fetch course details
            const courseRes = await fetch(`/api/admin/courses/${params.id}`);
            if (courseRes.ok) {
                const courseData = await courseRes.json();
                setCourse(courseData.course);
            }

            // Fetch progress and modules
            const progressRes = await fetch(`/api/student/courses/${params.id}/progress`);
            if (progressRes.ok) {
                const data = await progressRes.json();
                setModules(data.modules);
                setProgress(data.progress);

                // Expand all modules by default
                setExpandedModules(new Set(data.modules.map((m: Module) => m.id)));

                // Select first incomplete lesson or first lesson
                const firstIncompleteLesson = data.modules
                    .flatMap((m: Module) => m.lessons)
                    .find((l: Lesson) => l.studentProgress[0]?.status !== 'completed');

                if (firstIncompleteLesson) {
                    setSelectedLesson(firstIncompleteLesson);
                } else if (data.modules[0]?.lessons[0]) {
                    setSelectedLesson(data.modules[0].lessons[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch course data:', error);
        } finally {
            setLoading(false);
        }
    }

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const handleMarkComplete = async () => {
        if (!selectedLesson) return;

        setMarkingComplete(true);
        try {
            const res = await fetch(`/api/student/courses/${params.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: selectedLesson.id,
                    status: 'completed',
                }),
            });

            if (res.ok) {
                // Refresh data
                await fetchCourseData();

                // Move to next lesson
                const allLessons = modules.flatMap(m => m.lessons);
                const currentIndex = allLessons.findIndex(l => l.id === selectedLesson.id);
                if (currentIndex < allLessons.length - 1) {
                    setSelectedLesson(allLessons[currentIndex + 1]);
                }
            }
        } catch (error) {
            console.error('Failed to mark lesson complete:', error);
        } finally {
            setMarkingComplete(false);
        }
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'video':
                return <Video className="w-4 h-4" />;
            case 'assignment':
                return <CheckSquare className="w-4 h-4" />;
            case 'quiz':
                return <HelpCircle className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const isLessonCompleted = (lesson: Lesson) => {
        return lesson.studentProgress[0]?.status === 'completed';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/student/courses">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    My Courses
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{course?.name}</h1>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all"
                                                style={{ width: `${progress.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {progress.completed}/{progress.total} lessons
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar - Course Navigation */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardContent className="p-4">
                                <h2 className="font-semibold text-gray-900 mb-4">Course Content</h2>
                                <div className="space-y-2">
                                    {modules.map((module, moduleIndex) => (
                                        <div key={module.id}>
                                            <button
                                                onClick={() => toggleModule(module.id)}
                                                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {expandedModules.has(module.id) ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {moduleIndex + 1}. {module.title}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {module.lessons.filter(isLessonCompleted).length}/{module.lessons.length}
                                                </span>
                                            </button>

                                            {expandedModules.has(module.id) && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {module.lessons.map((lesson, lessonIndex) => {
                                                        const completed = isLessonCompleted(lesson);
                                                        const isActive = selectedLesson?.id === lesson.id;

                                                        return (
                                                            <button
                                                                key={lesson.id}
                                                                onClick={() => setSelectedLesson(lesson)}
                                                                className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm ${isActive
                                                                        ? 'bg-sky-50 text-sky-700'
                                                                        : 'hover:bg-gray-50 text-gray-700'
                                                                    }`}
                                                            >
                                                                {completed ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                                )}
                                                                <div className="text-gray-500 flex-shrink-0">
                                                                    {getLessonIcon(lesson.lessonType)}
                                                                </div>
                                                                <span className="truncate">{lesson.title}</span>
                                                                {lesson.duration && (
                                                                    <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                                                        {lesson.duration}m
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {selectedLesson ? (
                            <Card>
                                <CardContent className="p-6">
                                    {/* Lesson Header */}
                                    <div className="mb-6">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sky-600">
                                                    {getLessonIcon(selectedLesson.lessonType)}
                                                </div>
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedLesson.title}</h2>
                                            </div>
                                            {isLessonCompleted(selectedLesson) && (
                                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                        {selectedLesson.description && (
                                            <p className="text-gray-600">{selectedLesson.description}</p>
                                        )}
                                    </div>

                                    {/* Video Player */}
                                    {selectedLesson.lessonType === 'video' && selectedLesson.videoUrl && (
                                        <div className="mb-6">
                                            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                                                <iframe
                                                    src={selectedLesson.videoUrl}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    title={selectedLesson.title}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Lesson Content */}
                                    <div className="prose max-w-none mb-6">
                                        <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-6 border-t">
                                        <div className="flex items-center gap-2">
                                            {selectedLesson.duration && (
                                                <span className="text-sm text-gray-500">
                                                    Duration: {selectedLesson.duration} minutes
                                                </span>
                                            )}
                                        </div>
                                        {!isLessonCompleted(selectedLesson) && (
                                            <Button onClick={handleMarkComplete} disabled={markingComplete}>
                                                {markingComplete ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Marking Complete...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Mark as Complete
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <p className="text-gray-500">Select a lesson to begin</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
