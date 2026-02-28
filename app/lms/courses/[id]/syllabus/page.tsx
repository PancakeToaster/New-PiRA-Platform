import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseSyllabusPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    const lmsCourse = await prisma.lMSCourse.findUnique({
        where: { id },
        include: {
            instructor: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
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

    if (!lmsCourse) {
        return <div>LMS Course not found</div>;
    }

    // Use lmsCourse for the rest of the component
    const course = lmsCourse;

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
                    <h1 className="text-3xl font-bold">{course.name}</h1>
                    <p className="text-muted-foreground">Course Syllabus</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Course Description</h2>
                        {course.description ? (
                            <div
                                className="text-muted-foreground prose prose-sm sm:prose max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: course.description }}
                            />
                        ) : (
                            <p className="text-muted-foreground italic">No description provided.</p>
                        )}
                    </div>

                    {course.instructor && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Instructor</h2>
                            <p className="text-muted-foreground">
                                {course.instructor.firstName} {course.instructor.lastName}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Marketing fields not available on LMS Course */}
                    </div>

                    {course.modules.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Course Outline</h2>
                            <div className="space-y-4">
                                {course.modules.map((module, idx) => (
                                    <div key={module.id} className="border-l-4 border-sky-500 pl-4">
                                        <h3 className="font-semibold text-lg">
                                            Module {idx + 1}: {module.title}
                                        </h3>
                                        {module.description && (
                                            <p className="text-muted-foreground text-sm mt-1">{module.description}</p>
                                        )}
                                        {module.lessons.length > 0 && (
                                            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                {module.lessons.map((lesson) => (
                                                    <li key={lesson.id}>• {lesson.title}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
