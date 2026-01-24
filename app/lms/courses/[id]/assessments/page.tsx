import { getCurrentUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default async function CourseAssessmentsPage({
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
            quizzes: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!course) {
        return <div>Course not found</div>;
    }

    const isTeacher = user.roles?.includes('Teacher') && course.instructorId === user.id;

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
                    <h1 className="text-3xl font-bold">{course.name} - Assessments</h1>
                    <p className="text-gray-600">Quizzes and assessments for this course</p>
                </div>
            </div>

            {course.quizzes.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-gray-600">
                        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>No assessments available yet.</p>
                        {isTeacher && (
                            <p className="mt-2 text-sm">
                                Create assessments from the admin panel.
                            </p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {course.quizzes.map((quiz) => (
                        <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{quiz.title}</span>
                                    {quiz.timeLimit && (
                                        <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {quiz.timeLimit} min
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {quiz.description && (
                                    <p className="text-gray-600 mb-4">{quiz.description}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                                    </div>
                                    <Link href={`/student/quizzes/${quiz.id}/take`}>
                                        <Button size="sm">
                                            {isTeacher ? 'Preview' : 'Take Quiz'}
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
