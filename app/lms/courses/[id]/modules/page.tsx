import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseModulesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const course = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            modules: {
                include: {
                    lessons: {
                        orderBy: { order: 'asc' },
                    },
                },
                orderBy: { order: 'asc' },
            },
        },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/lms/courses">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Courses
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{course.name} - Modules</h1>
                    <p className="text-gray-600">Course content and lessons</p>
                </div>
            </div>

            {course.modules.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-600">
                        No modules available yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {course.modules.map((module, idx) => (
                        <Card key={module.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-sky-600" />
                                    Module {idx + 1}: {module.title}
                                </CardTitle>
                                {module.description && (
                                    <p className="text-sm text-gray-600 mt-2">{module.description}</p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {module.lessons.length === 0 ? (
                                    <p className="text-gray-600 text-sm">No lessons in this module yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {module.lessons.map((lesson, lessonIdx) => (
                                            <Link
                                                key={lesson.id}
                                                href={`/lms/courses/${id}/lessons/${lesson.id}`}
                                                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            Lesson {lessonIdx + 1}: {lesson.title}
                                                        </h4>
                                                        {lesson.description && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {lesson.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {lesson.duration && (
                                                        <span className="text-sm text-gray-500">
                                                            {lesson.duration} min
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
