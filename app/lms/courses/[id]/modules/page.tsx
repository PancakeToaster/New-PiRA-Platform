import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { getStudentModuleProgress } from '@/lib/progress';
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

    type ModuleWithProgress = typeof course.modules[0] & { progress?: number };
    let modulesWithProgress: ModuleWithProgress[] = course.modules;

    if (user.roles.includes('Student') && user.profiles?.student) {
        const studentId = user.profiles.student;
        modulesWithProgress = await Promise.all(course.modules.map(async (m) => {
            const progress = await getStudentModuleProgress(studentId, m.id);
            return { ...m, progress };
        }));
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
                    <p className="text-muted-foreground">Course content and lessons</p>
                </div>
            </div>

            {course.modules.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No modules available yet.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {modulesWithProgress.map((module, idx) => (
                        <Card key={module.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-sky-600" />
                                    Module {idx + 1}: {module.title}
                                </CardTitle>
                                {typeof module.progress === 'number' && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-600 dark:bg-green-500 rounded-full"
                                                style={{ width: `${module.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground font-medium">{module.progress}%</span>
                                    </div>
                                )}
                                {module.description && (
                                    <p className="text-sm text-muted-foreground mt-2">{module.description}</p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {module.lessons.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No lessons in this module yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {module.lessons.map((lesson, lessonIdx) => (
                                            <Link
                                                key={lesson.id}
                                                href={`/lms/courses/${id}/lessons/${lesson.id}`}
                                                className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-foreground">
                                                            Lesson {lessonIdx + 1}: {lesson.title}
                                                        </h4>
                                                        {lesson.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {lesson.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {lesson.duration && (
                                                        <span className="text-sm text-muted-foreground">
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
